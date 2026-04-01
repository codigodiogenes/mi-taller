FROM python:3.9-slim

WORKDIR /app

# Instalar dependencias de sistema (Linux) una sola vez
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    pkg-config \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos y quitamos versiones fijas para evitar fallos de matching
COPY requirements.txt .
RUN sed -i 's/==.*//' requirements.txt && pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Variables de entorno para persistencia
ENV DATABASE_PATH=/app/data/workshop.db
ENV DATA_BASE_PATH=/app/data

EXPOSE 8000

# Comando de arranque directo
# Comando de arranque con soporte para cabeceras de proxy (HTTPS)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips='*'"]
