import asyncio
import logging
import time
from contextlib import asynccontextmanager
from io import BytesIO
from typing import List, Optional, Tuple

import aiohttp
from cachetools import LRUCache
from fastapi import FastAPI, HTTPException, Request
from PIL import Image, UnidentifiedImageError
from pydantic import AnyHttpUrl, BaseModel, Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from transformers import (
    Pipeline, pipeline,
    AutoTokenizer,
    VisionEncoderDecoderModel,
    ViTImageProcessor
)


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')
    LOG_LEVEL: str = "INFO"
    MODEL_NAME: str = "nlpconnect/vit-gpt2-image-captioning"
    CACHE_MAXSIZE: int = 512
    HTTP_TIMEOUT: int = 3
    DEVICE: Optional[str] = None

    @validator('LOG_LEVEL')
    def log_level_validator(cls, v):
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Invalid log level: {v}")
        return v.upper()


settings = AppSettings()

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

image_pipeline: Optional[Pipeline] = None
url_cache: LRUCache[str, Tuple[Optional[str], bool, float]] = LRUCache(maxsize=settings.CACHE_MAXSIZE)


def load_pipeline() -> None:
    global image_pipeline
    if image_pipeline:
        logger.info("Pipeline already loaded.")
        return

    try:
        device_kwarg = {}
        pipeline_device = None
        if settings.DEVICE:
            device_kwarg["device"] = settings.DEVICE
            logger.info(f"Explicit device setting: {settings.DEVICE}")
            pipeline_device = -1
            if "cuda" in settings.DEVICE.lower():
                try:
                    pipeline_device = int(settings.DEVICE.split(':')[-1])
                except (ValueError, IndexError):
                    pipeline_device = 0
            logger.info(f"Setting pipeline device argument to: {pipeline_device}")
        else:
            logger.info("Device setting: Default (pipeline will attempt to infer)")

        model_name = settings.MODEL_NAME
        logger.info(
            f"Loading components for pipeline '{model_name}' | "
            f"Device preference: {settings.DEVICE or 'Default'}"
        )

        image_processor = ViTImageProcessor.from_pretrained(model_name)
        logger.info("Image processor loaded.")

        tokenizer = AutoTokenizer.from_pretrained(model_name)
        logger.info("Tokenizer loaded.")

        model = VisionEncoderDecoderModel.from_pretrained(model_name)
        logger.info("VisionEncoderDecoderModel loaded.")

        if "device" in device_kwarg:
            model.to(device_kwarg["device"])
            logger.info(f"Model moved to device: {device_kwarg['device']}")

        image_pipeline = pipeline(
            "image-to-text",
            model=model,
            tokenizer=tokenizer,
            image_processor=image_processor,
            device=pipeline_device
        )
        logger.info("Image captioning pipeline created successfully with specified components.")

        try:
            logger.info("Warming up pipeline...")
            dummy_img = Image.new('RGB', (10, 10), color='white')
            if image_pipeline:
                _ = image_pipeline(dummy_img)
                logger.info("Pipeline warmed up successfully.")
            else:
                logger.warning("Skipping warmup, pipeline failed to load.")
        except Exception as warmup_ex:
            logger.warning(f"Pipeline warmup failed (continuing): {warmup_ex}", exc_info=True)

    except ImportError as e:
        logger.error(f"Import error loading pipeline. Ensure transformers and PyTorch/TF are installed. {e}")
        image_pipeline = None
    except Exception as e:
        logger.error(f"Fatal error loading pipeline components: {e}", exc_info=True)
        image_pipeline = None


@asynccontextmanager
async def lifespan(api: FastAPI):
    logger.info("Application startup: Initializing resources.")
    load_pipeline()
    api.state.http_session = aiohttp.ClientSession(
        timeout=aiohttp.ClientTimeout(total=settings.HTTP_TIMEOUT)
    )
    logger.info("HTTP Client Session created.")
    yield
    logger.info("Application shutdown: Closing HTTP Client Session.")
    if hasattr(api.state, 'http_session'):
        session = api.state.http_session
        if session and not session.closed:
            await session.close()
            logger.info("HTTP Client Session closed.")
        elif session and session.closed:
            logger.info("HTTP Client Session was already closed.")
        else:
            logger.warning("api.state.http_session was None during shutdown.")
    else:
        logger.warning("api.state.http_session attribute missing during shutdown.")
    logger.info("Application shutdown complete.")


app = FastAPI(
    title="Image Caption API",
    version="1.0.0",
    description="Generates captions for images from URLs.",
    lifespan=lifespan
)


class CaptionRequest(BaseModel):
    image_urls: List[AnyHttpUrl] = Field(
        ...,
        min_length=1,
        description="List of image URLs (HTTP/HTTPS).",
        json_schema_extra={"examples": [["https://images.unsplash.com/photo-1583337130417-3346a1be7dee"]]}
    )


class ImageResult(BaseModel):
    url: str
    caption: Optional[str] = None
    processing_time: float
    success: bool
    cached: bool = False


class CaptionResponse(BaseModel):
    results: List[ImageResult]
    elapsed_time: float


async def fetch_image(session: aiohttp.ClientSession, url: str) -> Optional[bytes]:
    logger.debug(f"Fetching: {url}")
    try:
        async with session.get(url) as response:
            response.raise_for_status()
            if 'image' not in response.headers.get('Content-Type', '').lower():
                logger.warning(f"Non-image Content-Type for {url}: {response.headers.get('Content-Type')}")
            content = await response.read()
            if not content:
                logger.warning(f"Empty content received from {url}")
                return None
            logger.debug(f"Fetched {len(content)} bytes from {url}")
            return content
    except aiohttp.ClientError as e:
        logger.error(f"Fetch failed for {url}: {type(e).__name__} - {e}")
        return None
    except asyncio.TimeoutError as e:
        logger.error(f"Fetch timed out for {url}: {type(e).__name__} - {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected fetch error for {url}: {e}", exc_info=True)
        return None


async def generate_caption(image_data: bytes) -> Optional[str]:
    if not image_pipeline:
        logger.error("Caption generation skipped: Pipeline not available.")
        return None
    try:
        with BytesIO(image_data) as img_stream:
            img = Image.open(img_stream).convert("RGB")
            img.load()

        results = await asyncio.to_thread(image_pipeline, img, num_workers=1, batch_size=1)

        if isinstance(results, list) and results:
            first_result = results[0]
            if isinstance(first_result, list) and first_result:
                first_result = first_result[0]
            if isinstance(first_result, dict) and 'generated_text' in first_result:
                caption = first_result['generated_text']
                logger.debug(f"Generated caption: '{caption}'")
                return caption
            else:
                logger.warning(f"Unexpected structure in pipeline result item: {first_result}")
        logger.warning(f"Unexpected pipeline result format or empty result: {results}")
        return None
    except UnidentifiedImageError:
        logger.error("Caption generation failed: Invalid or unsupported image format/data")
        return None
    except Exception as e:
        logger.error(f"Caption generation error: {type(e).__name__} - {str(e)}", exc_info=True)
        return None


async def process_url(session: aiohttp.ClientSession, url: AnyHttpUrl) -> ImageResult:
    url_str = str(url)
    start_time = time.time()
    cached_result = url_cache.get(url_str)
    if cached_result:
        caption, success, original_time = cached_result
        logger.info(f"Cache hit for {url_str}. Success: {success}. Original time: {original_time:.3f}s")
        return ImageResult(
            url=url_str,
            caption=caption,
            processing_time=original_time,
            success=success,
            cached=True
        )
    logger.info(f"Cache miss, processing {url_str}")
    image_data = await fetch_image(session, url_str)
    fetch_end_time = time.time()
    if not image_data:
        total_time = fetch_end_time - start_time
        url_cache[url_str] = (None, False, total_time)
        logger.warning(f"Fetch failed for {url_str} after {total_time:.3f}s. Caching failure.")
        return ImageResult(url=url_str, success=False, processing_time=total_time, cached=False)
    caption = await generate_caption(image_data)
    total_time = time.time() - start_time
    success = caption is not None
    url_cache[url_str] = (caption, success, total_time)
    if success:
        logger.info(f"Processed {url_str} successfully in {total_time:.3f}s. Added to cache.")
    else:
        logger.warning(f"Caption generation failed for {url_str}. Total time: {total_time:.3f}s. Failure cached.")
    return ImageResult(
        url=url_str,
        caption=caption,
        processing_time=total_time,
        success=success,
        cached=False
    )


@app.post("/caption",
          response_model=CaptionResponse,
          summary="Generate Captions for Image URLs",
          tags=["Captioning"])
async def generate_captions_endpoint(request: Request, payload: CaptionRequest):
    if not image_pipeline:
        raise HTTPException(status_code=503, detail="Service Unavailable: Model not loaded.")
    if not hasattr(request.app.state, 'http_session'):
        logger.error("HTTP session attribute missing from app state.")
        raise HTTPException(status_code=503, detail="Service Unavailable: HTTP client not ready (missing).")
    session = request.app.state.http_session
    if not session:
        logger.error("HTTP session attribute is None in app state.")
        raise HTTPException(status_code=503, detail="Service Unavailable: HTTP client not ready (None).")
    if session.closed:
        logger.error("HTTP session was found closed during request.")
        raise HTTPException(status_code=503, detail="Service Unavailable: HTTP client session closed.")
    request_start_time = time.time()
    tasks = [process_url(session, url) for url in payload.image_urls]
    results_tuple: Tuple[ImageResult, ...] = await asyncio.gather(*tasks)
    results: List[ImageResult] = list(results_tuple)
    elapsed_time = round(time.time() - request_start_time, 3)
    num_urls = len(payload.image_urls)
    success_count = sum(1 for r in results if r.success)
    cache_hits = sum(1 for r in results if r.cached)
    successful_cache_hits = sum(1 for r in results if r.cached and r.success)
    logger.info(
        f"Request processed. URLs: {num_urls}, Succeeded: {success_count}, "
        f"Total Cache Hits: {cache_hits} (Successful: {successful_cache_hits}), Failed: {num_urls - success_count}. "
        f"Total time: {elapsed_time:.3f}s"
    )
    return CaptionResponse(results=results, elapsed_time=elapsed_time)


@app.get("/cache/clear", status_code=200, summary="Clear Cache", tags=["Cache Management"])
async def clear_cache_endpoint():
    items_removed = url_cache.currsize
    url_cache.clear()
    logger.info(f"Cache cleared via API. Removed {items_removed} items.")
    return {"message": "Cache cleared.", "items_removed": items_removed}


@app.get("/cache/info", status_code=200, summary="Cache Information", tags=["Cache Management"])
async def cache_info_endpoint():
    return {
        "current_items": url_cache.currsize,
        "max_items": url_cache.maxsize,
    }


@app.get("/health", status_code=200, summary="Health Check", tags=["Monitoring"])
async def health_check(request: Request):
    pipeline_ok = image_pipeline is not None
    session_ok = False
    reason_parts = []
    if hasattr(request.app.state, 'http_session'):
        http_session = request.app.state.http_session
        if http_session is None:
            reason_parts.append("HTTP session is None")
        elif http_session.closed:
            reason_parts.append("HTTP session is closed")
        else:
            session_ok = True
    else:
        reason_parts.append("HTTP session attribute missing")
    if not pipeline_ok:
        reason_parts.append("Image pipeline not loaded")

    if pipeline_ok and session_ok:
        return {"status": "ok", "pipeline_loaded": True, "http_client_ready": True}
    else:
        details = {
            "pipeline_loaded": pipeline_ok,
            "http_client_ready": session_ok,
            "reason": "; ".join(reason_parts) if reason_parts else "Unknown"
        }
        logger.warning(f"Health check failed: {details}")
        raise HTTPException(status_code=503, detail={"status": "unhealthy", "details": details})
