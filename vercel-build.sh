#!/bin/bash

# Instalar dependencias del sistema para Python
echo "Instalando dependencias del sistema..."
apt-get update
apt-get install -y python3-dev python3-pip python3-venv

# Configurar entorno virtual para el backend
echo "Configurando entorno virtual para el backend..."
cd backend
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias de Python
echo "Instalando dependencias de Python..."
pip install --upgrade pip
pip install -r requirements-vercel.txt

# Construir el frontend
echo "Construyendo el frontend..."
cd ../frontend
npm install
npm run build

# Volver al directorio raíz
cd ..
