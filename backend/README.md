# Red de Inclusión - Backend

## Descripción
Backend de la aplicación Red de Inclusión, construido con Flask y MongoDB. Proporciona endpoints REST para la gestión de:
- Beneficiarios y su información personal
- Funcionarios y sus líneas de trabajo
- Comunas y barrios
- Estadísticas y reportes
- Autenticación y autorización
- Verificación biométrica (huellas dactilares)

## Tecnologías principales
- Flask 2.x
- MongoDB
- JWT para autenticación
- CORS para manejo de peticiones cross-origin
- WebAuthn para verificación biométrica

## Dependencias principales
- flask
- flask-cors
- flask-jwt-extended
- pymongo
- python-dotenv

## Configuración

### Variables de entorno
Crear un archivo `.env` con las siguientes variables:

```
FLASK_APP=app
FLASK_ENV=development # o production
MONGODB_URI=tu_uri_de_mongodb
JWT_SECRET_KEY=tu_clave_secreta_jwt
PORT=5000
```

### Dependencias
Las dependencias principales están en `requirements.txt`:
- flask
- flask-cors
- flask-jwt-extended
- pymongo
- python-dotenv
- bcrypt
- pandas
- openpyxl

## Autenticación
- Sistema de autenticación basado en JWT
- Roles: administrador y funcionario
- Protección de rutas según permisos
- Tokens de acceso y refresco
- Manejo automático de expiración

## API Endpoints

### Autenticación
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

### Beneficiarios
- GET /beneficiarios
- POST /beneficiarios
- PUT /beneficiarios/{id}
- DELETE /beneficiarios/{id}
- GET /beneficiarios/exportar

### Funcionarios
- GET /funcionarios
- POST /funcionarios
- PUT /funcionarios/{id}
- DELETE /funcionarios/{id}

### Líneas de Trabajo
- GET /lineas-trabajo
- POST /lineas-trabajo
- PUT /lineas-trabajo/{id}
- DELETE /lineas-trabajo/{id}

### Comunas y Barrios
- GET /comunas
- GET /barrios
- POST /comunas
- POST /barrios

## Requisitos
- Python 3.9+
- MongoDB (local o Atlas)
- Navegador moderno con soporte para WebAuthn (Chrome, Firefox, Edge, Safari)
- Dispositivo con sensor biométrico para funcionalidad de huellas dactilares

## Notas importantes
- En desarrollo, el backend debe ejecutarse en modo debug para mejor depuración
- Para producción, asegurarse de que las variables de entorno estén correctamente configuradas
- Los endpoints protegidos requieren token JWT en el header `Authorization`
- La funcionalidad biométrica requiere HTTPS en producción (excepto localhost para desarrollo)
---

## Requisitos
- Python 3.9+
- MongoDB (local o Atlas)

## Notas adicionales
- Si tienes problemas con la exportación por rango, revisa que los datos de `fecha_registro` estén en el formato adecuado.
- El backend soporta ambos formatos (fecha y string ISO) para máxima compatibilidad.

## Instalación

1. Clona el repositorio y entra en la carpeta `backend`:
   ```bash
   git clone <repo_url>
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Crea un archivo `.env` con la configuración de tu base de datos y JWT:
   ```env
   MONGO_URI=mongodb://localhost:27017/red_inclusion
   JWT_SECRET_KEY=tu_clave_secreta
   FLASK_ENV=development
   ```
4. Ejecuta el servidor:
   ```bash
   python run.py
   ```

## Estructura principal
- `app/` - Código fuente principal (modelos, rutas, esquemas, utilidades)
- `tests/` - Pruebas unitarias
- `requirements.txt` - Dependencias del backend
- `run.py` - Script de arranque

## Endpoints principales
- `/auth` - Autenticación y registro
- `/usuarios` - Gestión de usuarios y funcionarios
- `/beneficiarios` - Gestión de beneficiarios
- `/asignaciones` - Asignación de beneficiarios a líneas de trabajo
- `/reportes` - Generación de reportes y exportación
- `/dashboard` - Estadísticas y gráficos

## Dependencias principales
- Flask
- Flask-JWT-Extended
- flask-cors
- pymongo
- python-dotenv
- marshmallow
- bcrypt
- pandas (solo para reportes y dashboard)
- matplotlib (solo para dashboard)
- reportlab (solo para reportes PDF)
- **MongoDB** (base de datos principal)

## Notas
- Si no necesitas reportes ni dashboard, puedes omitir `pandas`, `matplotlib` y `reportlab`.
- El archivo `.env` es obligatorio para la configuración local.

---

## Licencia
MIT
