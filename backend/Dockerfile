FROM python:3.12-slim

WORKDIR /app

# Install deps first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Config comes from environment variables (see config.py / env.example).
# Do NOT bake secrets into the image.
EXPOSE 8000

# Bind to $PORT when the host injects one (Render/Railway); default 8000 locally.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
