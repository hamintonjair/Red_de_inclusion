# Red de Inclusión - Frontend

## 🚀 Descripción
Aplicación web desarrollada con React y Material-UI para la gestión integral del sistema Red de Inclusión. Proporciona una interfaz moderna, accesible y responsiva para la gestión de beneficiarios, funcionarios, líneas de trabajo y reportes.

## 🛠️ Tecnologías Principales

### Core
- React 18+
- TypeScript
- React Router v6
- Redux Toolkit
- Axios

### UI/UX
- Material-UI (MUI) 5
- Styled Components
- React Hook Form
- Yup (Validación)

### Utilidades
- React Query
- React Toastify
- React Icons
- Date-fns
- Chart.js

## 📦 Requisitos Previos

- Node.js 18+
- npm 9+ o yarn 1.22+
- API Backend en funcionamiento

## 🚀 Configuración Inicial

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/hamintonjair/Red_de_inclusion.git
   cd Red_de_inclusion/frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   Crea un archivo `.env` en la carpeta frontend con:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_ENV=development
   ```

4. **Iniciar servidor de desarrollo**
   ```bash
   npm start
   # o
   yarn start
   ```
   La aplicación estará disponible en: http://localhost:3000

## 🏗️ Estructura del Proyecto

```
frontend/
├── public/              # Archivos estáticos
├── src/
│   ├── assets/          # Recursos estáticos (imágenes, fuentes)
│   ├── components/      # Componentes reutilizables
│   ├── config/          # Configuraciones globales
│   ├── hooks/           # Custom Hooks
│   ├── layouts/         # Layouts de la aplicación
│   ├── pages/           # Páginas/views
│   ├── redux/           # Estado global (Redux)
│   ├── services/        # Lógica de servicios/API
│   ├── styles/          # Estilos globales
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilidades
│   ├── App.tsx          # Componente raíz
│   └── index.tsx        # Punto de entrada
├── .env                 # Variables de entorno
├── package.json         # Dependencias y scripts
└── tsconfig.json        # Configuración TypeScript
```

## 🔧 Variables de Entorno

| Variable                | Descripción                             | Valor por defecto       |
|-------------------------|-----------------------------------------|-------------------------|
| REACT_APP_API_URL      | URL base de la API del backend          | http://localhost:5000/api |
| REACT_APP_ENV          | Entorno de ejecución (development/prod) | development             |


## 🚀 Despliegue en Producción

### Requisitos
- Cuenta en [Vercel](https://vercel.com)
- Repositorio en GitHub
- API Backend desplegada

### Pasos para el despliegue

1. **Preparar el proyecto**
   ```bash
   npm run build
   # o
   yarn build
   ```

2. **Configuración en Vercel**
   - Importa tu repositorio en Vercel
   - Establece el directorio raíz como `frontend`
   - Configura las variables de entorno:
     ```
     REACT_APP_API_URL=https://tudominio.vercel.app/api
     REACT_APP_ENV=production
     ```
   - Establece el comando de construcción: `npm run build` o `yarn build`
   - Establece el directorio de salida: `build`

3. **Desplegar**
   - Haz clic en "Deploy"
   - Una vez completado, la aplicación estará disponible en la URL proporcionada por Vercel

## 🧪 Ejecutar Pruebas

```bash
# Ejecutar pruebas unitarias
npm test
# o
yarn test

# Generar cobertura de código
npm run test:coverage
# o
yarn test:coverage
```

## 🛠️ Scripts Disponibles

- `start`: Inicia el servidor de desarrollo
- `build`: Crea la versión de producción
- `test`: Ejecuta las pruebas
- `eject`: Expone la configuración de webpack (no reversible)
- `lint`: Ejecuta ESLint
- `format`: Formatea el código con Prettier

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Para funcionalidad biométrica: dispositivo con sensor de huellas dactilares

## Estructura del Proyecto
```
frontend/
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── pages/            # Páginas principales
│   ├── services/         # Servicios API
│   ├── context/          # Contextos de React
│   ├── styles/           # Estilos globales
│   └── utils/            # Funciones utilitarias
├── public/               # Archivos estáticos
└── tests/               # Pruebas unitarias
```

## Desarrollo

### Scripts disponibles

```bash
# Iniciar el servidor de desarrollo
npm start

# Compilar para producción
npm run build

# Ejecutar pruebas
npm test

# Ejecutar linter
npm run lint
```

## Despliegue

1. Compilar para producción:
```bash
npm run build
```

2. Servir los archivos estáticos generados en `build/`

## Soporte y Mantenimiento

### Monitoreo
- Logging de errores
- Manejo de excepciones
- Validación de datos
- Límites de rate limiting

### Seguridad
- Validación de tokens JWT
- Protección contra CSRF
- Sanitización de datos
- Manejo seguro de contraseñas

## Licencia
MIT


