#!/bin/bash

echo "🚀 Iniciando proceso de construcción..."

# Construir el frontend
echo "🛠️  Construyendo frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Frontend construido exitosamente!"

# Construir el backend
echo "🛠️  Construyendo backend..."
cd backend
bash vercel-build.sh
cd ..

echo "✅ Backend construido exitosamente!"
echo "🚀 Construcción completada exitosamente!"
