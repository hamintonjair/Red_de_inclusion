# Red de Inclusión - Plataforma de Gestión Social

## 📋 Descripción
Plataforma integral para la gestión de programas de inclusión social, diseñada para facilitar el seguimiento de beneficiarios, funcionarios y líneas de trabajo. La aplicación ofrece un sistema centralizado para el registro, consulta y análisis de información, mejorando la eficiencia en la toma de decisiones para iniciativas sociales.

## 🚀 Características Principales
- Gestión integral de beneficiarios y sus datos personales
- Administración de funcionarios y líneas de trabajo
- Mapeo geográfico de registros
- Sistema de autenticación y autorización
- Verificación biométrica (huellas dactilares)
- Reportes y estadísticas en tiempo real
- Interfaz responsiva y accesible

## 🏗️ Estructura del Proyecto
```
Red_de_inclusion/
├── backend/           # API en Python (Flask + MongoDB)
├── frontend/          # Aplicación React (Create React App)
├── .gitignore
└── README.md
```

## 🛠️ Requisitos Técnicos

### Backend (Python)
- Python 3.8+
- MongoDB 4.4+
- pip 20.0+
- Flask 2.0+

### Frontend (React)
- Node.js 16+
- npm 8+ o yarn 1.22+
- React 18+
- Material-UI 5+

## 🚀 Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/hamintonjair/Red_de_inclusion.git
cd Red_de_inclusion
```

### 2. Configurar el Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
.\venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### 3. Configurar el Frontend
```bash
cd ../frontend
npm install
```

## ⚙️ Configuración

### Variables de Entorno (Backend)
Crea un archivo `.env` en la carpeta `backend/` con:
```
FLASK_APP=app.py
FLASK_ENV=development
MONGO_URI=mongodb://localhost:27017/red_inclusion
JWT_SECRET_KEY=tu_clave_secreta_aqui
```

### Variables de Entorno (Frontend)
Crea un archivo `.env` en la carpeta `frontend/` con:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚦 Iniciar la Aplicación

### Iniciar Backend
```bash
cd backend
flask run
```

### Iniciar Frontend
```bash
cd frontend
npm start
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- API: http://localhost:5000

## 🚀 Despliegue en Vercel

### Requisitos previos
- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Repositorio en GitHub

### Pasos para el despliegue

1. **Configuración de MongoDB Atlas**
   - Crea un clúster gratuito en MongoDB Atlas
   - Crea un usuario de base de datos
   - Obtén la cadena de conexión

2. **Configuración en Vercel**
   - Importa tu repositorio de GitHub en Vercel
   - Configura las siguientes variables de entorno:
     ```
     FLASK_APP=backend.vercel_bootstrap:app
     FLASK_ENV=production
     MONGO_URI=tu_url_de_mongodb_atlas
     JWT_SECRET_KEY=tu_clave_secreta_segura
     PYTHONUNBUFFERED=1
     ```
   - Establece el comando de construcción: `bash vercel-build.sh`
   - Establece el directorio de salida: (dejar vacío)

3. **Despliegue**
   - Haz clic en "Deploy"
   - Espera a que se complete el despliegue

4. **Configuración de dominios (opcional)**
   - Configura tu dominio personalizado en la pestaña "Domains"
   - Configura los registros DNS según las instrucciones

### Estructura de rutas
- Frontend: `/`
- API Backend: `/api/*`
- Archivos estáticos: `/static/*`

### Solución de problemas
- Revisa los logs de despliegue en Vercel
- Verifica que todas las variables de entorno estén configuradas correctamente
- Asegúrate de que MongoDB Atlas permita conexiones desde cualquier IP (o solo desde la IP de Vercel)

## 📝 Licencia
Este proyecto está bajo la Licencia MIT.

## ✉️ Contacto
- **Desarrollador:** Haminton Mena Mena
- **Correo:** ing.haminton@outlook.com
- **GitHub:** [@hamintonjair](https://github.com/hamintonjair)
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```
   Esto abrirá la aplicación en [http://localhost:3000](http://localhost:3000).

## Scripts disponibles
- `npm start` — Ejecuta la app en modo desarrollo.
- `npm run build` — Genera una versión optimizada para producción.
- `npm test` — Ejecuta los tests configurados.

## Estructura principal
- `src/pages/` — Páginas principales (Login, Dashboard, etc.)
- `src/components/` — Componentes reutilizables
- `src/context/` — Contextos globales (por ejemplo, autenticación)

## Notas
- Asegúrate de que el backend esté corriendo antes de iniciar el frontend.
- Configura las URLs de la API en los archivos de configuración si es necesario.

## Tecnologías utilizadas
- React
- Material-UI
- React Router
- Axios
- JWT Decode
- **MongoDB** (a través del backend Flask)

---

## Licencia
MIT

- React Router
- Axios
- JWT Decode

### Base de Datos
- MongoDB

## Requisitos Previos

- Python 3.11+
- Node.js 18+
- MongoDB 5.0+

## Instalación

### Backend

1. Clonar repositorio
```bash
git clone https://github.com/tu-usuario/red-inclusion.git
cd red-inclusion/backend
```

2. Crear entorno virtual
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. Instalar dependencias
```bash
pip install -r requirements.txt
```

4. Configurar variables de entorno
- Crear archivo `.env`
- Añadir configuraciones de base de datos, JWT, etc.

5. Iniciar servidor
```bash
python run.py
```

### Frontend

1. Instalar dependencias
```bash
cd frontend
npm install
```

2. Iniciar aplicación
```bash
npm start
```

## Estructura del Proyecto

```
red-inclusion/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   └── __init__.py
│   ├── requirements.txt
│   └── run.py
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── App.js
    ├── package.json
    └── README.md
```

## Contribución

1. Fork del repositorio
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## Últimos Cambios y Mejoras

### Exportación de Beneficiarios
- **Funcionalidad Mejorada**: 
  - Soporte para exportar registros con filtros flexibles
  - Manejo de múltiples formatos de fecha
  - Exportación completa o por rango de fechas

### Backend (Python/Flask)
- Actualización de la ruta `/exportar-beneficiarios-excel`
  - Soporte para múltiples formatos de fecha
  - Consultas flexibles en MongoDB
  - Mejora en el manejo de errores y logging
  - Conversión robusta de fechas

### Frontend (React)
- Actualización en `ListadoBeneficiarios.js`
  - Manejo de errores en exportación
  - Integración con nuevo endpoint de exportación
  - Mejora en la experiencia de usuario

## Licencia

Este proyecto está bajo la Licencia MIT.

## Contacto

- Nombre del Equipo
- Email de contacto
- Enlace del proyecto
