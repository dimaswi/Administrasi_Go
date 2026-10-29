# ============================================================
# Face Service — Python DeepFace + OpenCV Face Recognition Microservice
# ============================================================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for image processing & networking
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

# Buat folder uploads dan folder cache model DeepFace
RUN mkdir -p /app/uploads /root/.deepface/weights

EXPOSE 5000

ENV PYTHONUNBUFFERED=1

CMD ["python", "app.py"]
