# Red de Inclusión Backend

## Descripción
Este backend está construido con Flask y utiliza JWT (JSON Web Tokens) para autenticación y autorización de usuarios. Incluye integración con MongoDB y manejo de CORS.

## Dependencias principales
- flask
- flask-cors
- flask-jwt-extended
- pymongo
- python-dotenv

## Variables de entorno (.env)
Asegúrate de definir las siguientes variables en un archivo `.env` en la raíz del backend:

```
JWT_SECRET_KEY=tu_clave_secreta_jwt
MONGO_URI=tu_uri_de_mongodb
```

## Autenticación y Sesión
- El backend utiliza JWT para proteger las rutas. Los tokens se generan al iniciar sesión y deben enviarse en el header `Authorization`.
- Cuando el token expira, el frontend detecta la expiración y redirige automáticamente al login.

## Levantar el backend
```bash
pip install -r requirements.txt
python run.py
```

## Frontend
El frontend está construido en React. Usa la dependencia `jwt-decode` para manejar la expiración del token JWT y proteger rutas. Las variables de entorno relevantes en el frontend son:

```
REACT_APP_JWT_SECRET=red_inclusion_secret_2024
REACT_APP_TOKEN_KEY=red_inclusion_token
REACT_APP_API_URL=http://localhost:5000
```

### Instalación de dependencias del frontend
```bash
cd frontend
npm install
```

### Levantar el frontend
```bash
npm start
```

## Flujo de autenticación
1. El usuario inicia sesión y recibe un JWT.
2. El JWT se almacena en el navegador.
3. Cada petición protegida envía el JWT en el header.
4. Si el JWT expira, el usuario es redirigido al login automáticamente.

---

## Requisitos
- Python 3.9+
- MongoDB (local o Atlas)

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
