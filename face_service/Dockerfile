# ============================================================
# Face Service — Python OpenCV Face Recognition Microservice
# ============================================================
FROM python:3.11-slim

WORKDIR /app

# Install lightweight system dependencies for image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Buat folder uploads untuk mount data sinkron dari backend
RUN mkdir -p /app/uploads

EXPOSE 5000

ENV PYTHONUNBUFFERED=1

CMD ["python", "app.py"]
