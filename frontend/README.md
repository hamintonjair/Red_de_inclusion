# Red de Inclusión - Frontend

## Descripción
Frontend de la aplicación Red de Inclusión, construido con React y Material-UI. Proporciona una interfaz moderna y responsiva para la gestión de:
- Beneficiarios y su información personal
- Funcionarios y sus líneas de trabajo
- Comunas y barrios
- Estadísticas y reportes
- Autenticación y autorización
- Verificación biométrica (huellas dactilares)

## Tecnologías principales
- React 18+
- Material-UI (MUI) 5
- React Router
- Axios para peticiones HTTP
- WebAuthn para verificación biométrica





### Gestión de Funcionarios
- Registro y edición de funcionarios
- Asignación de líneas de trabajo
- Gestión de permisos
- Panel de perfil

### Sistema de Reportes
- Dashboard con estadísticas
- Exportación de datos
- Filtros por fecha y ubicación
- Gráficos interactivos

### Autenticación y Seguridad
- Sistema de autenticación JWT
- Roles: administrador y funcionario
- Protección de rutas
- Gestión de sesiones
- Validación de formularios

### UI/UX
- Interfaz moderna y responsive
- Tema oscuro/claro
- Notificaciones
- Loading states
- Manejo de errores

## Requisitos
- Node.js 16+
- NPM o Yarn
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


