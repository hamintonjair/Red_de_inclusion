from app import create_app
import os
from werkzeug.middleware.dispatcher import DispatcherMiddleware

# Crear la aplicación Flask
app = create_app()

# Configuración para entornos de producción
app.wsgi_app = DispatcherMiddleware(None, {
    '/api': app.wsgi_app
})

# Configuración para Vercel
def handler(event, context):
    from io import BytesIO
    import json
    import base64
    from werkzeug.wsgi import ClosingIterator
    from werkzeug.wrappers import Request, Response

    # Parsear el evento de API Gateway
    if event.get('httpMethod'):
        # Formato de API Gateway
        body = event.get('body', '')
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(body)
        
        # Crear el entorno WSGI
        environ = {
            'REQUEST_METHOD': event['httpMethod'],
            'PATH_INFO': event['path'],
            'QUERY_STRING': '&'.join(
                f"{k}={v}" for k, v in event.get('queryStringParameters', {}).items()
            ) if event.get('queryStringParameters') else '',
            'SERVER_NAME': event.get('headers', {}).get('host', 'localhost'),
            'SERVER_PORT': event.get('headers', {}).get('x-forwarded-port', '80'),
            'SERVER_PROTOCOL': 'HTTP/1.1',
            'wsgi.url_scheme': event.get('headers', {}).get('x-forwarded-proto', 'http'),
            'wsgi.input': BytesIO(body.encode('utf-8') if isinstance(body, str) else body),
            'wsgi.errors': None,
            'wsgi.version': (1, 0),
            'wsgi.run_once': False,
            'wsgi.multithread': False,
            'wsgi.multiprocess': False,
            'wsgi.file_wrapper': None,
        }
        
        # Agregar headers
        for key, value in event.get('headers', {}).items():
            key = key.upper().replace('-', '_')
            if key not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
                key = f'HTTP_{key}'
            environ[key] = value
    else:
        # Formato de evento directo
        environ = event

    # Función para iniciar la respuesta
    response_headers = []
    response_body = []
    
    def start_response(status, headers, exc_info=None):
        nonlocal response_headers
        response_headers[:] = [status, headers]
        return response_body.append
    
    # Ejecutar la aplicación
    app_iter = app(environ, start_response)
    
    # Obtener el cuerpo de la respuesta
    try:
        body = b''.join([chunk for chunk in app_iter if chunk])
    finally:
        if hasattr(app_iter, 'close'):
            app_iter.close()
    
    # Construir la respuesta para API Gateway
    status_code = int(response_headers[0].split(' ')[0])
    headers = dict(response_headers[1])
    
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': body.decode('utf-8') if body else '',
        'isBase64Encoded': False
    }

# Para desarrollo local
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
