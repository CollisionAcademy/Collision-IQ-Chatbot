# Root Dockerfile for the Python app (main.py)
FROM python:3.11-slim

WORKDIR /app

# Copy source
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port used by the app
ENV PORT 8080
EXPOSE 8080

# Run the main Python app
CMD ["python", "main.py"]
