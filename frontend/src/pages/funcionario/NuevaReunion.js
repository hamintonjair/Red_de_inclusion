import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Alert,
    Box, 
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Snackbar
} from '@mui/material';
import { 
    Save as SaveIcon, 
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon,
    Group as GroupIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker, DatePicker } from '@mui/x-date-pickers';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import PageLayout from '../../components/layout/PageLayout';
import { 
    createActividad, 
    updateActividad, 
    getActividadById,
    registrarAsistencia
} from '../../services/actividadService';
import funcionarioService from '../../services/funcionarioService';
import { obtenerLineasTrabajo } from '../../services/lineaTrabajoService';
import { obtenerAsistentes } from '../../services/asistenteService';

// Función para obtener una reunión por su ID
const obtenerReunionPorId = async (id) => {
    try {
        // Aquí deberías reemplazar esto con una llamada real a tu API
        // Por ahora, devolvemos un objeto vacío para evitar errores
        return {};
    } catch (error) {
        console.error('Error al obtener la reunión:', error);
        throw error;
    }
};

const NuevaReunion = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [loadingBeneficiarios, setLoadingBeneficiarios] = useState(false);
    const [asistentes, setAsistentes] = useState([]);
    const [asistentesDisponibles, setAsistentesDisponibles] = useState([]);
    const [asistentesFiltrados, setAsistentesFiltrados] = useState([]);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [filtroAsistente, setFiltroAsistente] = useState('');
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    
    const eliminarAsistente = (asistenteId) => {
        setAsistentes(asistentes.filter(id => id !== asistenteId));
    };
    
    const [formData, setFormData] = useState({
        tema: '',
        objetivo: '',
        lugar: '',
        dependencia: user?.dependencia || '',
        fecha: new Date(),
        hora_inicio: '09:00',
        hora_fin: '10:00',
        observaciones: '',
        linea_trabajo_id: user?.linea_trabajo_id || '',
        es_reunion: true
    });
    
    // Estado para el snackbar de notificaciones
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
        autoHideDuration: 3000
    });
    
    // Función para cerrar el snackbar
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({
            ...prev,
            open: false
        }));
    };

    // Función para cargar todos los asistentes con manejo de errores mejorado
    const cargarAsistentes = useCallback(async (filtros = {}) => {
        try {
            
            // Mostrar estado de carga
            if (!filtros.fecha) {
                setLoadingBeneficiarios(true);
            }
            
            // Mostrar snackbar de carga
            setSnackbar({
                open: true,
                message: 'Cargando lista de asistentes...',
                severity: 'info',
                autoHideDuration: 3000
            });
            
            // Obtener asistentes con manejo de errores mejorado
            const asistentesArray = await obtenerAsistentes();
            
            // Verificar si se recibieron asistentes
            if (!asistentesArray || asistentesArray.length === 0) {
                setSnackbar({
                    open: true,
                    message: 'No se encontraron asistentes registrados',
                    severity: 'info',
                    autoHideDuration: 4000
                });
                
                setAsistentesDisponibles([]);
                setAsistentesFiltrados([]);
                return [];
            }
                        
            // Mostrar mensaje de éxito
            setSnackbar({
                open: true,
                message: `Se cargaron ${asistentesArray.length} asistentes`,
                severity: 'success',
                autoHideDuration: 3000
            });
            
            // Mapear los datos de los asistentes al formato esperado
            const asistentesData = asistentesArray.map(asistente => {
                // Asegurarse de que cada asistente tenga un ID
                const id = asistente._id || asistente.id || Math.random().toString(36).substr(2, 9);
                
                // Construir nombre completo si no existe
                const nombreCompleto = asistente.nombre_completo || 
                    `${asistente.nombres || ''} ${asistente.apellidos || ''}`.trim() || 
                    'Nombre no disponible';
                
                return {
                    ...asistente,
                    _id: id,
                    id: id,
                    nombre_completo: nombreCompleto,
                    nombres: asistente.nombres || '',
                    apellidos: asistente.apellidos || '',
                    tipo_documento: asistente.tipo_documento || '',
                    numero_documento: asistente.numero_documento || asistente.documento || '',
                    documento: asistente.documento || asistente.numero_documento || '',
                    correo: asistente.correo || asistente.email || '',
                    telefono: asistente.telefono || '',
                    cargo: asistente.cargo || 'Sin cargo asignado',
                    linea_trabajo: asistente.linea_trabajo || '',
                    linea_trabajo_nombre: asistente.linea_trabajo_nombre || 'Sin línea asignada'
                };
            });
            
            // Actualizar estados con todos los asistentes
            setAsistentesDisponibles(asistentesData);
            setAsistentesFiltrados(asistentesData);
            setLoadingBeneficiarios(false);
            return asistentesData;
            
        } catch (error) {
            console.error('Error al cargar asistentes:', error);
            console.error('Detalles del error:', error.response?.data || error.message);
            
            setAsistentesDisponibles([]);
            setAsistentesFiltrados([]);
            setLoadingBeneficiarios(false);
            setError('Error al cargar los asistentes. Por favor, intente nuevamente.');
            return [];
        }
    }, []);

    // Función para aplicar filtros y búsqueda mejorada
    const aplicarFiltros = useCallback(() => {
        
        let result = [...asistentesDisponibles];
        
        // Aplicar búsqueda
        if (terminoBusqueda) {
            const searchTerm = terminoBusqueda.trim().toLowerCase();
            
            // Si el término de búsqueda es muy corto, no filtrar
            if (searchTerm.length < 2) {
                setAsistentesFiltrados(result);
                return;
            }
            
            // Eliminar acentos y caracteres especiales del término de búsqueda
            const normalizedSearchTerm = searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            result = result.filter(asistente => {
                // Construir nombre completo si no existe
                const nombreCompleto = asistente.nombre_completo || 
                    `${asistente.nombres || ''} ${asistente.apellidos || ''}`.trim();
                
                // Normalizar nombre completo para búsqueda
                const nombreNormalizado = nombreCompleto
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
                
                // Obtener documento (probando diferentes campos posibles)
                const documento = [
                    asistente.documento,
                    asistente.numero_documento,
                    asistente.identificacion,
                    asistente.cedula
                ]
                .filter(Boolean) // Eliminar valores nulos/undefined
                .map(d => d.toString().toLowerCase())
                .join(' ');
                                
                // Buscar en nombre completo o documento
                const encontradoEnNombre = nombreNormalizado.includes(normalizedSearchTerm);
                const encontradoEnDocumento = documento.includes(normalizedSearchTerm);
              
                return encontradoEnNombre || encontradoEnDocumento;
            });
            
        }
        
        setAsistentesFiltrados(result);
    }, [terminoBusqueda, asistentesDisponibles]);

    // Efecto para aplicar filtros cuando cambia el término de búsqueda
    useEffect(() => {
        aplicarFiltros();
    }, [aplicarFiltros]);

    // Función para cargar asistentes disponibles
    const cargarAsistentesDisponibles = useCallback(async () => {
        try {
            setLoadingBeneficiarios(true);
            
            // Cargar asistentes usando la función principal
            const asistentes = await cargarAsistentes();
            
            // Mostrar todos los asistentes
            setAsistentesFiltrados(asistentes);
            setLoadingBeneficiarios(false);
            
        } catch (error) {
            console.error('Error al cargar asistentes disponibles:', error);
            setError('Error al cargar los asistentes. Por favor, intente nuevamente.');
            setLoadingBeneficiarios(false);
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (date, field) => {
        if (!date) {
            console.warn('Fecha no válida recibida');
            return;
        }
        
        const fechaValida = date instanceof Date && !isNaN(date) ? date : new Date();
        
        setFormData(prev => ({
            ...prev,
            [field]: fechaValida
        }));
    };
    
    const handleTimeChange = (time, field) => {
        const horaValida = time && !isNaN(new Date(time)) ? 
            format(time, 'HH:mm') : 
            field === 'hora_inicio' ? '09:00' : '10:00';
            
        setFormData(prev => ({
            ...prev,
            [field]: horaValida
        }));
    };
    
    // Cargar asistentes al montar el componente
    useEffect(() => {
        cargarAsistentes();
    }, [cargarAsistentes]);

    const validarFormulario = () => {
        if (!formData.tema || formData.tema.trim().length < 3) {
            throw new Error('El tema es requerido y debe tener al menos 3 caracteres');
        }
        
        if (!formData.objetivo || formData.objetivo.trim().length < 10) {
            throw new Error('El objetivo es requerido y debe ser descriptivo');
        }
        
        if (!formData.lugar || !formData.dependencia) {
            throw new Error('El lugar y la dependencia son campos requeridos');
        }
        
        if (!formData.fecha || isNaN(new Date(formData.fecha))) {
            throw new Error('La fecha de la reunión no es válida');
        }
        
        if (!formData.hora_inicio || !formData.hora_fin) {
            throw new Error('Las horas de inicio y fin son requeridas');
        }
        
        if (!user?.linea_trabajo_id) {
            throw new Error('No se ha podido determinar la línea de trabajo');
        }
        
        if (asistentes.length === 0) {
            throw new Error('Debe seleccionar al menos un asistente para la reunión');
        }
        
        return true;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // Validar el formulario
            validarFormulario();
            
            // Preparar los datos para enviar al backend
            const reunionData = {
                ...formData,
                tema: formData.tema.trim(),
                objetivo: formData.objetivo.trim(),
                lugar: formData.lugar.trim(),
                dependencia: formData.dependencia.trim(),
                fecha: format(formData.fecha, 'yyyy-MM-dd'),
                hora_inicio: formData.hora_inicio,
                hora_fin: formData.hora_fin,
                linea_trabajo_id: user.linea_trabajo_id,
                funcionario_id: user.id,
                creado_por: user.id,
                tipo: 'reunion',  // Siempre establecer como 'reunion' para este componente
                asistentes: asistentes.map(id => ({
                    beneficiario_id: id,
                    asistio: true,
                    observaciones: 'Asistió a la reunión'
                }))
            };

            // Llamar al servicio correspondiente según sea creación o actualización
            let response;
            if (id) {
                response = await updateActividad(id, reunionData);
            } else {
                response = await createActividad(reunionData);
            }

            // Mostrar mensaje de éxito
            if (response && (response.message || response._id)) {
                navigate('/funcionario/actividades', { 
                    state: { 
                        message: id ? 'Reunión actualizada correctamente' : 'Reunión creada correctamente',
                        severity: 'success'
                    } 
                });
            } else {
                throw new Error('No se recibió una respuesta válida del servidor');
            }
        } catch (error) {
            let errorMessage = 'Error al guardar la reunión. Por favor, intente nuevamente.';
            
            if (error.response) {
                if (error.response.status === 400) {
                    errorMessage = 'Datos inválidos. Por favor, verifique la información ingresada.';
                } else if (error.response.status === 401) {
                    errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
                } else if (error.response.status === 403) {
                    errorMessage = 'No tiene permisos para realizar esta acción.';
                } else if (error.response.status === 404) {
                    errorMessage = 'Recurso no encontrado.';
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.request) {
                errorMessage = 'No se pudo conectar con el servidor. Por favor, verifique su conexión a Internet.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                bgcolor: 'rgba(0,0,0,0.35)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress size={100} thickness={5} value={100} variant="determinate" color="secondary" />
                    <Box
                        sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <Typography variant="h5" component="div" color="white">Cargando...</Typography>
                    </Box>
                </Box>
            </Box>
        );
    }

    const pageTitle = id ? 'Editar Reunión' : 'Nueva Reunión';
    const pageDescription = (
        <Typography variant="h5" component="h1">
            {id ? 'Edita los detalles de la reunión' : 'Crea una nueva reunión y registra los asistentes'}
        </Typography>
    );

    return (
        <PageLayout title={pageTitle} description={pageDescription}>
            <Box sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography 
                        variant="h4" 
                        component="h1"
                        sx={{
                            backgroundColor: '#1976d2',
                            color: 'white',
                            p: 1.5,
                            borderRadius: 1,
                            width: '100%',
                            textAlign: 'left',
                            boxShadow: 1
                        }}
                    >
                        👈 Volver al listado
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography 
                                        variant="h6" 
                                        sx={{
                                            backgroundColor: '#1976d2',
                                            color: 'white',
                                            p: 1,
                                            borderRadius: 1,
                                            mb: 2,
                                            textAlign: 'center'
                                        }}
                                    >
                                        Información Básica
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Tema de la reunión"
                                                name="tema"
                                                value={formData.tema}
                                                onChange={handleChange}
                                                required
                                                margin="normal"
                                                placeholder="Ej: Reunión de coordinación del equipo"
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Objetivo"
                                                name="objetivo"
                                                value={formData.objetivo}
                                                onChange={handleChange}
                                                multiline
                                                rows={4}
                                                required
                                                margin="normal"
                                                placeholder="Describa el objetivo principal de la reunión"
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Lugar"
                                                name="lugar"
                                                value={formData.lugar}
                                                onChange={handleChange}
                                                required
                                                margin="normal"
                                                placeholder="Ej: Sala de juntas, Piso 3"
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Dependencia"
                                                name="dependencia"
                                                value={formData.dependencia}
                                                onChange={handleChange}
                                                required
                                                margin="normal"
                                                placeholder="Ej: Departamento de Recursos Humanos"
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} md={4}>
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                <DatePicker
                                                    label="Fecha de la reunión"
                                                    value={formData.fecha}
                                                    onChange={(date) => handleDateChange(date, 'fecha')}
                                                    renderInput={(params) => (
                                                        <TextField 
                                                            {...params} 
                                                            fullWidth 
                                                            margin="normal"
                                                            required
                                                        />
                                                    )}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={4}>
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                <TimePicker
                                                    label="Hora de inicio"
                                                    value={formData.hora_inicio ? parse(formData.hora_inicio, 'HH:mm', new Date()) : null}
                                                    onChange={(time) => handleTimeChange(time, 'hora_inicio')}
                                                    renderInput={(params) => (
                                                        <TextField 
                                                            {...params} 
                                                            fullWidth 
                                                            margin="normal"
                                                            required
                                                        />
                                                    )}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={4}>
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                <TimePicker
                                                    label="Hora de fin"
                                                    value={formData.hora_fin ? parse(formData.hora_fin, 'HH:mm', new Date()) : null}
                                                    onChange={(time) => handleTimeChange(time, 'hora_fin')}
                                                    renderInput={(params) => (
                                                        <TextField 
                                                            {...params} 
                                                            fullWidth 
                                                            margin="normal"
                                                            required
                                                        />
                                                    )}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Línea de Trabajo"
                                                value={user?.linea_trabajo_nombre || 'No asignada'}
                                                disabled
                                                margin="normal"
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                            <input 
                                                type="hidden" 
                                                name="linea_trabajo_id" 
                                                value={user?.linea_trabajo_id || ''} 
                                            />
                                        </Grid>
                                        
                                     
                                        
                                        <Grid item xs={12}>
                                            <Box display="flex" justifyContent="flex-end" mt={2}>
                                                <Button 
                                                    variant="contained"
                                                    color="success"
                                                    type="submit"
                                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                                    disabled={saving}
                                                >
                                                    {saving ? 'Guardando...' : 'Guardar Reunión'}
                                                </Button>
                                            </Box>
                                        </Grid>
                                        
                                     


                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography 
                                        variant="h6"
                                        sx={{
                                            backgroundColor: '#1976d2',
                                            color: 'white',
                                            p: 1,
                                            borderRadius: 1,
                                            textAlign: 'center',
                                            mb: 2
                                        }}
                                    >
                                        <GroupIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                        Asistentes
                                    </Typography>
                                    {/* Lista de asistentes disponibles */}
                                    <Box mb={3}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="subtitle2">
                                                Seleccionar asistentes
                                                {asistentesFiltrados.length > 0 && (
                                                    <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                                                        ({asistentesFiltrados.length} disponibles)
                                                    </Typography>
                                                )}
                                            </Typography>
                                            {asistentesFiltrados.length > 0 && (
                                                <Button 
                                                    size="small" 
                                                    onClick={() => {
                                                        if (asistentes.length === asistentesFiltrados.length) {
                                                            setAsistentes([]);
                                                        } else {
                                                            setAsistentes(asistentesFiltrados.map(a => a._id));
                                                        }
                                                    }}
                                                >
                                                    {asistentes.length === asistentesFiltrados.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                                                </Button>
                                            )}
                                        </Box>
                                        
                                        <Box sx={{ mb: 2 }}>
                                            <TextField 
                                                fullWidth 
                                                size="small"
                                                variant="outlined"
                                                placeholder="Buscar por documento"
                                                value={terminoBusqueda}
                                                onChange={(e) => {
                                                    setTerminoBusqueda(e.target.value);
                                                }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchIcon />
                                                        </InputAdornment>
                                                    ),
                                                    endAdornment: terminoBusqueda && (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                edge="end"
                                                                size="small"
                                                                onClick={() => {
                                                                    setTerminoBusqueda('');
                                                                    // Restaurar la lista completa
                                                                    setAsistentesFiltrados(asistentesDisponibles);
                                                                }}
                                                            >
                                                                <ClearIcon fontSize="small" />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Box>
                                        
                                        <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                                            {loadingBeneficiarios ? (
                                                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                                    <CircularProgress size={24} />
                                                </Box>
                                            ) : asistentesFiltrados.length > 0 ? (
                                                <List dense>
                                                    {asistentesFiltrados.map((asistente) => (
                                                        <ListItem 
                                                            key={asistente._id}
                                                            dense
                                                            button
                                                            onClick={() => {
                                                                const nuevosAsistentes = asistentes.includes(asistente._id)
                                                                    ? asistentes.filter(id => id !== asistente._id)
                                                                    : [...asistentes, asistente._id];
                                                                setAsistentes(nuevosAsistentes);
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                                <Checkbox
                                                                    edge="start"
                                                                    checked={asistentes.includes(asistente._id)}
                                                                    tabIndex={-1}
                                                                    disableRipple
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText 
                                                                primary={asistente.nombre}
                                                                secondary={asistente.cargo || 'Sin cargo'}
                                                                secondaryTypographyProps={{ variant: 'caption' }}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            ) : (
                                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        No hay asistentes disponibles
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Paper>
                                    </Box>
                                    {/* Lista de asistentes seleccionados */}
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="subtitle2">
                                                Asistentes seleccionados
                                                {asistentes.length > 0 && (
                                                    <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                                                        ({asistentes.length} seleccionados)
                                                    </Typography>
                                                )}
                                            </Typography>
                                            {asistentes.length > 0 && (
                                                <Button 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => setAsistentes([])}
                                                    startIcon={<ClearAllIcon />}
                                                >
                                                    Limpiar
                                                </Button>
                                            )}
                                        </Box>
                                        
                                        {asistentes.length > 0 ? (
                                            <Paper variant="outlined">
                                                <List dense>
                                                    {asistentes.map(asistenteId => {
                                                        const asistente = asistentesFiltrados.find(a => a._id === asistenteId);
                                                        if (!asistente) return null;
                                                        
                                                        return (
                                                            <ListItem 
                                                                key={asistenteId}
                                                                secondaryAction={
                                                                    <IconButton 
                                                                        edge="end" 
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setAsistentes(asistentes.filter(id => id !== asistenteId));
                                                                        }}
                                                                        color="error"
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                }
                                                                sx={{
                                                                    '&:hover': {
                                                                        backgroundColor: 'action.hover',
                                                                        borderRadius: 1
                                                                    },
                                                                    '& .MuiListItemSecondaryAction-root': {
                                                                        right: '8px'
                                                                    }
                                                                }}
                                                            >
                                                                <ListItemText 
                                                                    primary={asistente.nombre}
                                                                    secondary={asistente.cargo || 'Sin cargo'}
                                                                    secondaryTypographyProps={{ variant: 'caption' }}
                                                                />
                                                            </ListItem>
                                                        );
                                                    })}
                                                </List>
                                            </Paper>
                                        ) : (
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography variant="body2" color="textSecondary">
                                                    No hay asistentes seleccionados
                                                </Typography>
                                            </Paper>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </form>
                
                {/* Snackbar para notificaciones */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={snackbar.autoHideDuration || 6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert 
                        onClose={handleCloseSnackbar} 
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </PageLayout>
    );
};

export default NuevaReunion;
