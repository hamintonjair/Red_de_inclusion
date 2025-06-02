#!/bin/bash

# Instalar dependencias del sistema
echo "🚀 Instalando dependencias del sistema..."
apt-get update
apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libffi-dev \
    libssl-dev

# Instalar dependencias de Python
echo "🐍 Instalando dependencias de Python..."
python -m pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

# Crear archivo __init__.py si no existe
if [ ! -f "__init__.py" ]; then
    echo "📄 Creando archivo __init__.py..."
    echo "# This file makes Python treat the directory as a package" > __init__.py
fi

echo "✅ Backend construido exitosamente!"
