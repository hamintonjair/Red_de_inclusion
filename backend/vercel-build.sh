#!/bin/bash

# Instalar dependencias del sistema
echo "Instalando dependencias del sistema..."
apt-get update
apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libfreetype6-dev \
    libpng-dev \
    libjpeg-dev \
    zlib1g-dev \
    libffi-dev \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev

# Instalar dependencias de Python
echo "Instalando dependencias de Python..."
python -m pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

echo "Backend construido exitosamente!"
