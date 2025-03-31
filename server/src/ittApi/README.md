# Image Caption API

A FastAPI service that generates descriptive captions for images from URLs using the `nlpconnect/vit-gpt2-image-captioning` model.

## Overview

This API accepts image URLs and returns generated text descriptions of the images' contents. It uses a Vision Transformer (ViT) encoder paired with a GPT-2 decoder to convert visual information into natural language captions.

## Features

- Generate captions for one or multiple image URLs in a single request
- LRU caching system to improve performance for repeated requests
- Configurable via environment variables
- Health check and monitoring endpoints
- Cache management utilities

## Requirements

- Python 3.12+
- FastAPI
- Pydantic
- aiohttp
- transformers
- PyTorch
- Pillow
- cachetools
- Additional dependencies listed in requirements.txt

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/image-caption-api.git
   cd image-caption-api
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Requirements.txt

```
fastapi
uvicorn[standard]
transformers
torch
Pillow
accelerate
aiohttp
cachetools
pydantic
pydantic-settings
python-dotenv
sentencepiece
hf_xet
```

## Configuration

The API can be configured using environment variables or a `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | INFO |
| `MODEL_NAME` | Hugging Face model identifier | nlpconnect/vit-gpt2-image-captioning |
| `CACHE_MAXSIZE` | Maximum number of items in LRU cache | 512 |
| `HTTP_TIMEOUT` | Timeout for HTTP requests in seconds | 3 |
| `DEVICE` | Device to run model on (e.g., "cuda:0", "cpu") | cpu |
| `PORT` | Port to run the service on | 8000 |

Example `.env` file:
```
LOG_LEVEL=INFO
MODEL_NAME=nlpconnect/vit-gpt2-image-captioning
CACHE_MAXSIZE=512
HTTP_TIMEOUT=3
DEVICE=cpu
PORT=8000
```

## Running the API

Start the server with uvicorn:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at http://localhost:8000.

## API Endpoints

### Generate Captions

**POST** `/caption`

Generates captions for a list of image URLs.

Request body:
```json
{
  "image_urls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

Response:
```json
{
  "results": [
    {
      "url": "https://example.com/image1.jpg",
      "caption": "a cat sitting on a window sill",
      "processing_time": 0.456,
      "success": true,
      "cached": false
    },
    {
      "url": "https://example.com/image2.jpg",
      "caption": "a mountain landscape with snow capped peaks",
      "processing_time": 0.321,
      "success": true,
      "cached": false
    }
  ],
  "elapsed_time": 0.789
}
```

### Health Check

**GET** `/health`

Checks if the API is healthy and ready to process requests.

Response (success):
```json
{
  "status": "ok",
  "pipeline_loaded": true,
  "http_client_ready": true
}
```

Response (unhealthy):
```json
{
  "status": "unhealthy",
  "details": {
    "pipeline_loaded": false,
    "http_client_ready": true,
    "reason": "Image pipeline not loaded"
  }
}
```

### Cache Management

**GET** `/cache/info`

Returns information about the current cache state.

Response:
```json
{
  "current_items": 45,
  "max_items": 512
}
```

**GET** `/cache/clear`

Clears the URL cache.

Response:
```json
{
  "message": "Cache cleared.",
  "items_removed": 45
}
```

## Docker Deployment

A multi-stage Dockerfile is provided for optimized containerized deployment:

```dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --upgrade pip
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    LOG_LEVEL=INFO \
    MODEL_NAME=nlpconnect/vit-gpt2-image-captioning \
    CACHE_MAXSIZE=512 \
    HTTP_TIMEOUT=3 \
    DEVICE=cpu \
    PATH="/opt/venv/bin:$PATH" \
    HF_HOME=/app/.cache/huggingface

RUN addgroup --system --gid 1001 nonroot && \
    adduser --system --uid 1001 --gid 1001 nonroot

COPY --from=builder /opt/venv /opt/venv
COPY app.py .

RUN mkdir -p $HF_HOME

RUN chown -R nonroot:nonroot /app /opt/venv

USER nonroot

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s \
  CMD curl --fail http://localhost:8000/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
```

Build and run the Docker container:

```bash
docker build -t image-caption-api .
docker run -p 8000:8000 image-caption-api
```

## Performance Considerations

- The first request will be slower as it needs to load the model
- The multi-stage Docker build reduces image size and optimizes deployment
- The non-root user enhances security
- The LRU cache helps reduce processing time for repeated image URLs
- Adjust `CACHE_MAXSIZE` based on your memory constraints and expected traffic patterns
- The Docker image uses PyTorch CPU optimizations for better performance on CPU-only deployments

## Acknowledgements

This project uses the [nlpconnect/vit-gpt2-image-captioning](https://huggingface.co/nlpconnect/vit-gpt2-image-captioning) model from Hugging Face.
