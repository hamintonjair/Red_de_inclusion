#!/bin/bash

# Instalar dependencias del sistema
apt-get update
apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    libfreetype6-dev \
    libpng-dev \
    libjpeg-dev \
    zlib1g-dev \
    libffi-dev \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev \
    libjpeg-dev

# Instalar dependencias de Python
pip3 install --no-cache-dir -r requirements.txt
