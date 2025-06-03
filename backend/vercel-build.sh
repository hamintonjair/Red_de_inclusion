#!/bin/bash
# Instalar dependencias del sistema necesarias para Python
apt-get update
apt-get install -y python3-dev python3-pip python3-venv

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias de Python
pip install --upgrade pip
pip install -r requirements-vercel.txt
