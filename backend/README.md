# Red de Inclusión - Backend

Este backend está construido en Flask y utiliza **MongoDB** como base de datos principal. Provee autenticación JWT, gestión de usuarios, funcionarios y beneficiarios, así como reportes y estadísticas.

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
