# backend/api/index.py
import sys
import os

# Asegura que Flask encuentre el módulo app
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app import create_app  # Tu fábrica de app si la usas
app = create_app()

# Necesario para que Vercel lo ejecute como WSGI
def handler(environ, start_response):
    return app.wsgi_app(environ, start_response)
