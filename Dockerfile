FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN pip install --no-cache-dir -r backend/requirements.txt

ENV PYTHONPATH=/app
ENV LEROBOT_ANNOTATE_CACHE=/data/cache
ENV LEROBOT_ANNOTATE_EXPORT=/data/exports

EXPOSE 7860

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "7860"]