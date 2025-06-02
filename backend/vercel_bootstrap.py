from app import create_app
from werkzeug.middleware.dispatcher import DispatcherMiddleware
import os

# Crear la aplicación Flask
app = create_app()

# Configurar el middleware para manejar rutas en producción
app.wsgi_app = DispatcherMiddleware(None, {
    '/api': app.wsgi_app
})

# Este archivo es necesario para el despliegue en Vercel
# La aplicación estará disponible en /api

# Configuración para Vercel
def lambda_handler(event, context):
    from werkzeug.wrappers import Request, Response
    from werkzeug.wsgi import responder
    from werkzeug.test import create_environ
    
    environ = create_environ(
        path=event['path'],
        method=event['httpMethod'],
        headers=dict(event.get('headers', {})),
        query_string=event.get('queryStringParameters', {}),
        input_stream=event.get('body', ''),
    )
    
    @responder
    def application(environ, start_response):
        return app(environ, start_response)
    
    return application(environ, lambda x, y: None)
