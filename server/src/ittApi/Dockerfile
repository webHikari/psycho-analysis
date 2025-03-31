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
