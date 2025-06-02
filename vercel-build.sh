#!/bin/bash

# Instalar dependencias del frontend
cd frontend
npm install
npm run build

# Instalar dependencias del backend
cd ../backend
pip install -r requirements.txt

# Volver al directorio raíz
cd ..
