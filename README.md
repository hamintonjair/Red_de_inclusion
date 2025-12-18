# Red de Inclusión - Frontend

## Descripción
Este software tiene como finalidad facilitar la gestión integral de beneficiarios, funcionarios y líneas de trabajo para programas de inclusión social. Permite a los administradores y funcionarios registrar, consultar y gestionar información clave de manera segura, eficiente y centralizada. La plataforma está diseñada para optimizar procesos de seguimiento, reporte y análisis, contribuyendo a una mejor toma de decisiones en iniciativas sociales.

La aplicación se conecta a un backend construido en Flask que utiliza **MySQL** como base de datos principal para almacenar y gestionar toda la información.

## Desarrollador
- **Nombre:** Haminton Mena
- **Correo:** ing.haminton@outlook.com

## Requisitos
- Node.js 16+
- npm 8+

## Instalación y ejecución

1. Instala las dependencias:
   ```bash
   npm install
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
- MySQL (a través del backend Flask)

---

## Licencia
MIT

- React Router
- Axios
- JWT Decode

### Base de Datos
- MySQL

## Requisitos Previos

- Python 3.11+
- Node.js 18+
- MySQL 8.0+

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
  - Consultas optimizadas en MySQL
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

## Prompt técnico completo del sistema

Objetivo
Eres una IA asistente técnica. Con el siguiente contexto debes entender, mantener y extender un sistema de gestión de beneficiarios, funcionarios y líneas de trabajo. El sistema está dividido en un backend Flask con MySQL y un frontend React. Usa esta especificación para comprender arquitectura, estructura de carpetas y responsabilidades, y para identificar dónde crear o modificar páginas, modelos, servicios, rutas y esquemas.

Arquitectura y estructura
- Backend: Python/Flask, MySQL, Marshmallow para validación, JWT, logging.
- Frontend: React, React Router, Material UI, Axios, JWT Decode.
- Repositorio:
  - `backend/` API Flask
  - `frontend/` SPA React
  - `exportar_reunion_fixed.py` (script utilitario independiente)

Backend
- Inicialización y configuración
  - `backend/app/__init__.py` inicializa Flask, CORS, DB y registra blueprints.
  - `backend/config.py` variables de configuración (cadena de conexión MySQL/DSN, JWT, etc.).
  - `backend/run.py` punto de arranque local.
  - `backend/app/utils/response.py` helpers de respuesta estandarizada.

- Modelos y atributos (MySQL relacional)
  - `backend/app/models/actividad.py` (ActividadSchema)
    - tema: string (3-200)
    - objetivo: string
    - lugar: string
    - dependencia: string
    - fecha: datetime
    - hora_inicio: string
    - hora_fin: string
    - linea_trabajo_id: int/UUID (FK a líneas de trabajo)
    - asistentes: lista de objetos { beneficiario_id: string, asistio: bool, observaciones: string? }
    - funcionario_id: int/UUID (FK a funcionarios)
    - tipo: string en {'actividad','reunion'} (requerido)
    - estado: string en {'pendiente','en_progreso','completada','cancelada'} (default 'pendiente')
    - logo_url: string?
    - creado_por: string
    - actualizado_por: string?
    - fecha_creacion: datetime (default utcnow)
    - fecha_actualizacion: datetime (default utcnow)

  - `backend/app/models/asignacion_linea.py` (AsignacionLineaSchema)
    - beneficiario_id: int/UUID (FK a beneficiarios)
    - linea_trabajo_id: int/UUID (FK a líneas de trabajo)
    - funcionario_id: int/UUID (FK a funcionarios)
    - fecha_asignacion: datetime (default ahora)
    - estado: string en {'Activo','Suspendido','Completado','En Proceso'} (default 'Activo')
    - observaciones: string? (<= 500)

  - `backend/app/models/beneficiario.py` (BeneficiarioSchema)
    - funcionario_id: int/UUID (FK a funcionarios)
    - funcionario_nombre: string
    - linea_trabajo: string
    - fecha_registro: string (en modelo se sobrescribe a utcnow)
    - nombre_completo: string
    - tipo_documento: string (ver TIPOS_DOCUMENTO)
    - huella_dactilar: objeto opcional (id,type,quality,documento,nombre,fecha_registro,datos_biometricos,codigo_verificacion,enlace_qr)
    - firma: string base64 opcional
    - verificacion_biometrica: objeto { credential_id, public_key, fecha_registro, tipo_verificacion in {'huella_digital','firma_digital'}, estado in {'pendiente','verificado','rechazado'}, dispositivo: dict, metadata: dict }
    - codigo_verificacion: string
    - numero_documento: string
    - genero: string (ver GENEROS)
    - rango_edad: string (ver RANGOS_EDAD)
    - sabe_leer: bool
    - sabe_escribir: bool
    - numero_celular: string
    - correo_electronico: string (email)
    - etnia: string (ver ETNIAS)
    - comuna: string (o FK si existe tabla `comunas`)
    - barrio: string
    - barrio_lat: float?
    - barrio_lng: float?
    - tiene_discapacidad: bool
    - tipo_discapacidad: string (ver TIPOS_DISCAPACIDAD)
    - nombre_cuidadora: string
    - labora_cuidadora: bool
    - tiene_certificado_discapacidad: bool (en `beneficiario_updated.py`)
    - victima_conflicto: bool
    - hijos_a_cargo: int
    - estudia_actualmente: bool
    - nivel_educativo: string (ver NIVELES_EDUCATIVOS)
    - situacion_laboral: string (ver SITUACIONES_LABORALES)
    - tipo_vivienda: string (ver TIPOS_VIVIENDA)
    - ayuda_humanitaria: bool
    - descripcion_ayuda_humanitaria: string

  - `backend/app/models/comuna.py` (estructura de tabla)
    - id: int/UUID (PK)
    - nombre: string (puede almacenarse como "{nombre} - {zona}")
    - zona: string
    - fecha_registro: datetime (created_at)
    - fecha_actualizacion: datetime (updated_at)

  - `backend/app/models/funcionario.py` + `backend/app/schemas/funcionario_schema.py`
    - nombre: string (2-100)
    - secretaría: string (2-100; válido dentro de conjunto permitido)
    - email: email
    - password: string (min 8, con mayúscula, minúscula, número y especial; solo carga)
    - password_hash: bytes (almacenado tras hash; no expuesto)
    - linea_trabajo: int/UUID (FK a líneas de trabajo)
    - rol: {'funcionario','admin'} (default 'funcionario')
    - estado: {'Activo','Inactivo'} (default 'Activo') o 'Activo' en inserción por modelo
    - telefono: string (regex internacional, opcional)
    - fecha_ingreso: date/datetime (opcional)
    - fecha_registro: datetime (created_at)
    - ultima_actualizacion: datetime (updated_at)

  - `backend/app/models/linea_trabajo.py` (LineaTrabajoSchema)
    - id: int/UUID (PK)
    - nombre: string (2-100, regex permitido)
    - descripcion: string? (<= 500)
    - fecha_creacion: datetime (created_at)
    - estado: {'Activo','Inactivo'} (default 'Activo')
    - responsable: string? (ID de funcionario)

  - `backend/app/models/usuario.py` (UsuarioSchema)
    - id: int/UUID (PK)
    - nombre_completo: string (>=3)
    - correo_electronico: email
    - numero_documento: string
    - contrasena: string (load_only)
    - rol: {'funcionario','admin'}
    - linea_trabajo: int/UUID (FK a líneas de trabajo)
    - fecha_registro: datetime (created_at)

- Rutas/Endpoints (no exhaustivo, agrupados por dominio)
  - Autenticación y usuarios: `routes/auth.py`, `routes/usuarios.py`
  - Beneficiarios: `routes/beneficiario.py`, `routes/beneficiarios.py`
  - Funcionarios y asistentes: `routes/funcionarios.py`, `routes/asistente.py`
  - Catálogos: `routes/comunas.py`, `routes/lineas_trabajo.py`
  - Operación y reportes: `routes/actividad.py`, `routes/asignaciones.py`, `routes/dashboard.py`, `routes/reportes.py`, `routes/poblacion_migrante.py`
  - Verificación: `routes/verificacion.py`, `routes/verificacion_temp.py`

- Controladores
  - `controllers/actividad_controller.py`: reglas de negocio de actividades.
  - `controllers/verificacion_controller.py`: flujos de verificación.

- Schemas
  - `schemas/funcionario_schema.py`: validación completa para funcionarios.

Frontend
- Entradas principales
  - `src/index.js`, `src/App.js`.
  - `src/config/` y `src/config.js`: configuración (baseURL, etc.).
  - `src/context/`: contextos globales (ej. autenticación).

- Rutas (routing)
  - `src/routes/AppRoutes.js`: rutas principales.
  - `src/routes/AdminRoutes.js`, `src/routes/FuncionarioRoutes.js`: segmentos por rol.
  - `src/components/ProtectedRoute.js`: protección por autenticación/rol.

- Servicios (cliente API con Axios) `src/services/`
  - auth.js, usuarioService.js, funcionarioService.js, beneficiarioService.js, actividadService.js,
    asistenteService.js, comunaService.js, lineaTrabajoService.js, dashboardService.js,
    estadisticasService.js, poblacionMigranteService.js, verificacionService.js, biometricService.js.

- Páginas `src/pages/`
  - Generales: `Login.js`, `Unauthorized.js`, `VerificacionRegistro.jsx`.
  - Admin (`src/pages/admin/`): gestión de beneficiarios, funcionarios, comunas, líneas de trabajo, dashboards y exportaciones.
  - Funcionario (`src/pages/funcionario/`): registro y gestión de beneficiarios, población migrante, actividades y reuniones, dashboard, utilitarios.
  - Verificación (`src/pages/verificacion/`): verificación pública y de beneficiarios.

- Componentes `src/components/`
  - `ComunasSidebar.js`, `MapaRegistros.js`, `SeleccionarColumnasDialog.js`, `LineaTrabajoFiltro.js`, etc.

Buenas prácticas para extender el sistema
- Backend: crear ruta en `app/routes/`, lógica en `app/controllers/`, reutilizar `app/models/`, validar con `app/schemas/`, respuestas con `app/utils/response.py`, registrar blueprint en `app/__init__.py`.
- Frontend: crear página en `src/pages/`, agregar ruta en `src/routes/`, consumir API desde `src/services/`, proteger con `ProtectedRoute` si aplica.
- Mantener naming consistente y manejo de errores en UI.
- Usar variables de entorno en `.env` (no exponer valores en repositorio).

Checklist rápido para otra IA
- Identificar el dominio (beneficiarios, funcionarios, actividades, comunas, líneas, usuarios, verificación, dashboard/reportes).
- Ver modelos y atributos arriba antes de modificar/crear endpoints o formularios.
- Actualizar servicios y rutas correspondientes.
- Asegurar validación y respuestas consistentes.
- Agregar documentación mínima de nuevos cambios.

## Inventario exacto de archivos del sistema
 
Nota: Se excluyen archivos de respaldo (.bak), carpetas de caché (`__pycache__/`), y artefactos no productivos (`node_modules/`, `venv/`, `logs/`).
 
Backend (`backend/`)
- Archivos raíz relevantes
  - `backend/README.md`
  - `backend/config.py`
  - `backend/requirements.txt`
  - `backend/run.py`
  - `backend/setup.ps1`
  - `backend/package.json`
  - `backend/package-lock.json`
  - `backend/vercel.json`
 
- API
  - `backend/api/index.py`
 
- Aplicación (`backend/app/`)
  - `backend/app/__init__.py`
 
  - Controladores (`backend/app/controllers/`)
    - `backend/app/controllers/actividad_controller.py`
    - `backend/app/controllers/verificacion_controller.py`
 
  - Modelos (`backend/app/models/`)
    - `backend/app/models/actividad.py`
    - `backend/app/models/asignacion_linea.py`
    - `backend/app/models/asistente.py`
    - `backend/app/models/beneficiario.py`
    - `backend/app/models/comuna.py`
    - `backend/app/models/funcionario.py`
    - `backend/app/models/linea_trabajo.py`
    - `backend/app/models/usuario.py`
 
  - Rutas (`backend/app/routes/`)
    - `backend/app/routes/actividad.py`
    - `backend/app/routes/asignaciones.py`
    - `backend/app/routes/asistente.py`
    - `backend/app/routes/auth.py`
    - `backend/app/routes/beneficiario.py`
    - `backend/app/routes/beneficiarios.py`
    - `backend/app/routes/comunas.py`
    - `backend/app/routes/dashboard.py`
    - `backend/app/routes/funcionarios.py`
    - `backend/app/routes/lineas_trabajo.py`
    - `backend/app/routes/poblacion_migrante.py`
    - `backend/app/routes/reportes.py`
    - `backend/app/routes/usuarios.py`
    - `backend/app/routes/verificacion.py`
    - `backend/app/routes/verificacion_temp.py`
 
  - Schemas (`backend/app/schemas/`)
    - `backend/app/schemas/__init__.py`
    - `backend/app/schemas/funcionario_schema.py`
 
  - Utilitarios (`backend/app/utils/`)
    - `backend/app/utils/__init__.py`
    - `backend/app/utils/response.py`
 
- Pruebas (`backend/tests/`)
  - `backend/tests/inicializar_db.py`
  - `backend/tests/listar_usuarios.py`
  - `backend/tests/test_beneficiarios_endpoints.py`
  - `backend/tests/test_endpoints.py`
 
Frontend (`frontend/`)
- Archivos raíz relevantes
  - `frontend/README.md`
  - `frontend/package.json`
  - `frontend/package-lock.json`
 
- Público (`frontend/public/`)
  - `frontend/public/index.html`
  - `frontend/public/favicon.ico`
  - `frontend/public/logo192.png`
  - `frontend/public/logo512.png`
  - `frontend/public/manifest.json`
  - `frontend/public/robots.txt`
  - `frontend/public/fondo/` (carpeta de assets)
 
- Código fuente (`frontend/src/`)
  - Entradas
    - `frontend/src/index.js`
    - `frontend/src/App.js`
 
  - Configuración
    - `frontend/src/config/axiosConfig.js`
    - `frontend/src/config.js`
 
  - Contextos
    - `frontend/src/context/AuthContext.js`
    - `frontend/src/context/LoadingContext.js`
    - `frontend/src/context/SnackbarContext.js`
 
  - Hooks
    - `frontend/src/hooks/useInactivity.js`
 
  - Datos
    - `frontend/src/data/barriosPorComuna.js`
 
  - Estilos
    - `frontend/src/styles/MapaBeneficiarios.css`
 
  - Utilitarios
    - `frontend/src/utils/api.js`
    - `frontend/src/utils/auth.js`
    - `frontend/src/utils/axiosConfig.js`
 
  - Componentes (`frontend/src/components/`)
    - `frontend/src/components/ComunasSidebar.js`
    - `frontend/src/components/LineaTrabajoFiltro.js`
    - `frontend/src/components/MapaRegistros.js`
    - `frontend/src/components/ProtectedRoute.js`
    - `frontend/src/components/SeleccionarColumnasDialog.js`
    - `frontend/src/components/funcionario/Sidebar.jsx`
    - Layout (`frontend/src/components/layout/`)
      - `frontend/src/components/layout/AdminLayout.js`
      - `frontend/src/components/layout/FuncionarioLayout.js`
      - `frontend/src/components/layout/PageLayout.js`
 
  - Rutas (`frontend/src/routes/`)
    - `frontend/src/routes/index.js`
    - `frontend/src/routes/AppRoutes.js`
    - `frontend/src/routes/AdminRoutes.js`
    - `frontend/src/routes/FuncionarioRoutes.js`
 
  - Servicios (`frontend/src/services/`)
    - `frontend/src/services/actividadService.js`
    - `frontend/src/services/asistenteService.js`
    - `frontend/src/services/auth.js`
    - `frontend/src/services/beneficiarioService.js`
    - `frontend/src/services/biometricService.js`
    - `frontend/src/services/comunaService.js`
    - `frontend/src/services/dashboardService.js`
    - `frontend/src/services/estadisticasService.js`
    - `frontend/src/services/funcionarioService.js`
    - `frontend/src/services/lineaTrabajoService.js`
    - `frontend/src/services/poblacionMigranteService.js`
    - `frontend/src/services/usuarioService.js`
    - `frontend/src/services/verificacionService.js`
 
  - Páginas (`frontend/src/pages/`)
    - Generales
      - `frontend/src/pages/Login.js`
      - `frontend/src/pages/Unauthorized.js`
      - `frontend/src/pages/VerificacionRegistro.jsx`
    - Admin (`frontend/src/pages/admin/`)
      - `frontend/src/pages/admin/Beneficiarios.js`
      - `frontend/src/pages/admin/Comunas.js`
      - `frontend/src/pages/admin/CrearLineaTrabajo.js`
      - `frontend/src/pages/admin/Dashboard.js`
      - `frontend/src/pages/admin/DetalleFuncionario.js`
      - `frontend/src/pages/admin/EditarBeneficiario.js`
      - `frontend/src/pages/admin/EditarFuncionario.js`
      - `frontend/src/pages/admin/EditarLineaTrabajo.js`
      - `frontend/src/pages/admin/Funcionarios.js`
      - `frontend/src/pages/admin/LineasTrabajo.js`
      - `frontend/src/pages/admin/ListadoBeneficiarios.js`
      - `frontend/src/pages/admin/ListadoFuncionarios.js`
      - `frontend/src/pages/admin/ListadoLineasTrabajo.js`
      - `frontend/src/pages/admin/MapaRegistros.js`
      - `frontend/src/pages/admin/Perfil.js`
      - `frontend/src/pages/admin/RegistroBeneficiarios.js`
      - `frontend/src/pages/admin/RegistroFuncionarios.js`
      - `frontend/src/pages/admin/exportUtils.js`
      - `frontend/src/pages/admin/exportUtilsBeneficiarios.js`
      - `frontend/src/pages/admin/Dashboard copy.js` (archivo de trabajo)
    - Funcionario (`frontend/src/pages/funcionario/`)
      - `frontend/src/pages/funcionario/Actividades.js`
      - `frontend/src/pages/funcionario/Asistentes.js`
      - `frontend/src/pages/funcionario/Beneficiarios.js`
      - `frontend/src/pages/funcionario/Dashboard.js`
      - `frontend/src/pages/funcionario/DashboardMapa.js`
      - `frontend/src/pages/funcionario/DetalleActividad.js`
      - `frontend/src/pages/funcionario/EditarBeneficiario.js`
      - `frontend/src/pages/funcionario/ListadoBeneficiarios.js`
      - `frontend/src/pages/funcionario/ListadoPoblacionMigrante.js`
      - `frontend/src/pages/funcionario/NuevaActividad.js`
      - `frontend/src/pages/funcionario/NuevaReunion.js`
      - `frontend/src/pages/funcionario/Perfil.js`
      - `frontend/src/pages/funcionario/RegistroBeneficiarios.js`
      - `frontend/src/pages/funcionario/RegistroPoblacionMigrante.jsx`
      - `frontend/src/pages/funcionario/__tests__/` (carpeta)
      - `frontend/src/pages/funcionario/agregar_firma.js`
      - `frontend/src/pages/funcionario/cambios_requeridos.txt`
      - `frontend/src/pages/funcionario/update_etnia.js`
      - Archivos de respaldo no incluidos en el sistema: `RegistroBeneficiarios.js.bak`, `RegistroPoblacionMigrante.jsx.bak`
    - Funcionarios (`frontend/src/pages/funcionarios/`)
      - `frontend/src/pages/funcionarios/CrearFuncionario.js`
    - Verificación (`frontend/src/pages/verificacion/`)
      - `frontend/src/pages/verificacion/VerificacionBeneficiario.js`
      - `frontend/src/pages/verificacion/VerificacionPublica.js`
