import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    InputAdornment,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format as formatDate, parse, parseISO, format } from 'date-fns';
import axiosInstance from '../../utils/axiosConfig';
import { es } from 'date-fns/locale';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import {
    createActividad,
    updateActividad,
    getActividadById,
    registrarAsistencia
} from '../../services/actividadService';
import { obtenerBeneficiarios } from '../../services/beneficiarioService';
import { obtenerLineasTrabajo } from '../../services/lineaTrabajoService';
import PageLayout from '../../components/layout/PageLayout';

const NuevaActividad = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [filtroFecha, setFiltroFecha] = useState(null);
    const [beneficiarios, setBeneficiarios] = useState([]);
    const [beneficiariosFiltrados, setBeneficiariosFiltrados] = useState([]);
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    const [asistentes, setAsistentes] = useState([]);
    const [tipoAsistencia, setTipoAsistencia] = useState('linea_trabajo'); // 'linea_trabajo' o 'asistentes'

    const pageTitle = 'Edicion de la Actividad';
    const pageDescription = <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
        </IconButton>

        {id ? 'Formulario para la edicion de la actividad, recuerde que los cambios no se guardan automaticamente' : 'Alcaldía municipal de de Quibdó'}

    </Box>;

    // Estado para la lista de asistentes disponibles
    const [asistentesDisponibles, setAsistentesDisponibles] = useState([]);
    const [asistentesSeleccionados, setAsistentesSeleccionados] = useState([]);

    const [formData, setFormData] = useState({
        tema: '',
        objetivo: '',
        lugar: '',
        dependencia: '',
        fecha: new Date(),
        hora_inicio: '09:00',
        hora_fin: '10:00',
        observaciones: '',
        linea_trabajo_id: user?.linea_trabajo_id || ''
    });

    // Cargar asistentes disponibles
    const cargarAsistentes = async () => {
        try {
            const response = await axiosInstance.get('/api/asistentes');
            setAsistentesDisponibles(response.data.data || []);
        } catch (error) {
            console.error('Error al cargar asistentes:', error);
            setError('Error al cargar la lista de asistentes');
        }
    };

    // Cargar datos iniciales al montar el componente
    useEffect(() => {
        cargarAsistentes();
        const cargarDatosIniciales = async () => {
            try {
                setLoading(true);

                // Cargar líneas de trabajo
                try {
                    const lineas = await obtenerLineasTrabajo();
                    setLineasTrabajo(lineas);
                } catch (error) {
                    console.error('Error al cargar líneas de trabajo:', error);
                }

                // Si es edición, cargar datos de la actividad
                if (id) {
                    const actividad = await getActividadById(id);
                    if (actividad) {
                        const actividadEditada = {
                            ...actividad,
                            fecha: actividad.fecha ? new Date(actividad.fecha) : new Date(),
                        };



                        setFormData(actividadEditada);
                        setAsistentes(actividad.asistentes?.map(a => a.beneficiario_id) || []);

                        // Cargar beneficiarios de la línea de trabajo de la actividad
                        if (actividadEditada.linea_trabajo_id) {
                            try {
                                // Obtener solo los beneficiarios de la línea de trabajo actual
                                const response = await obtenerBeneficiarios({
                                    linea_trabajo: actividadEditada.linea_trabajo_id,
                                    por_pagina: 1000
                                });

                                // Extraer el array de beneficiarios de la respuesta
                                const beneficiariosFiltrados = response.beneficiarios || [];

                                setBeneficiarios(beneficiariosFiltrados);
                                setBeneficiariosFiltrados(beneficiariosFiltrados);
                            } catch (error) {
                                console.error('Error al cargar beneficiarios:', error);
                            }
                        }
                    }
                } else if (user?.linea_trabajo_id) {
                    // Cargar solo los beneficiarios de la línea de trabajo del usuario
                    try {
                        // Obtener solo los beneficiarios de la línea de trabajo del usuario
                        const response = await obtenerBeneficiarios({
                            linea_trabajo: user.linea_trabajo_id,
                            por_pagina: 1000
                        });

                        // Extraer el array de beneficiarios de la respuesta
                        const beneficiariosFiltrados = response.beneficiarios || [];


                        setBeneficiarios(beneficiariosFiltrados);
                        setBeneficiariosFiltrados(beneficiariosFiltrados);

                        // Establecer la línea de trabajo del usuario solo si no hay un valor ya establecido
                        setFormData(prev => ({
                            ...prev,
                            linea_trabajo_id: prev.linea_trabajo_id || user.linea_trabajo_id
                        }));
                    } catch (error) {
                        console.error('Error al cargar beneficiarios:', error);
                    }
                }
            } catch (err) {
                setError('No se pudieron cargar los datos necesarios');
            } finally {
                setLoading(false);
            }
        };

        cargarDatosIniciales();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user?.linea_trabajo_id]);

    // Función para cargar beneficiarios con filtros
    const cargarBeneficiarios = async (filtrosAdicionales = {}) => {
        if (!user?.linea_trabajo_id) {
            console.warn('No se pudo cargar beneficiarios: No hay línea de trabajo definida');
            return [];
        }

        try {
            // Crear objeto de filtros base
            const filtrosBase = {
                linea_trabajo: user.linea_trabajo_id,
                por_pagina: 1000
            };

            // Combinar con filtros adicionales
            const filtros = {
                ...filtrosBase,
                ...filtrosAdicionales
            };

            // Asegurarse de que la fecha sea un objeto Date válido
            if (filtros.fecha) {
                // Si es un string, convertirlo a Date
                if (typeof filtros.fecha === 'string') {
                    filtros.fecha = new Date(filtros.fecha);
                }
                // Si es una fecha inválida, usar la fecha actual
                if (isNaN(filtros.fecha.getTime())) {
                    filtros.fecha = new Date();
                }
                // El servicio se encargará del formato ISO
            }

            // Realizar la petición al servidor
            const response = await obtenerBeneficiarios(filtros);

            if (!response || !Array.isArray(response.beneficiarios)) {
                console.warn('La respuesta no contiene un array de beneficiarios:', response);
                setBeneficiarios([]);
                setBeneficiariosFiltrados([]);
                return [];
            }

            const beneficiariosFiltrados = response.beneficiarios;

            // Actualizar el estado con los beneficiarios obtenidos
            setBeneficiarios(beneficiariosFiltrados);
            setBeneficiariosFiltrados(beneficiariosFiltrados);

            return beneficiariosFiltrados;
        } catch (error) {
            console.error('Error al cargar beneficiarios:', error);
            setBeneficiarios([]);
            setBeneficiariosFiltrados([]);
            return [];
        }
    };

    // Efecto para cargar beneficiarios cuando cambia la línea de trabajo
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Cargar beneficiarios solo por línea de trabajo, sin filtrar por fecha
                await cargarBeneficiarios({
                    linea_trabajo: user?.linea_trabajo_id
                });
            } catch (error) {
                console.error('Error al cargar beneficiarios:', error);
            }
        };

        cargarDatos();
    }, [user?.linea_trabajo_id]);

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

        // Asegurarse de que la fecha sea un objeto Date válido
        const fechaValida = date instanceof Date && !isNaN(date) ? date : new Date();

        setFormData(prev => ({
            ...prev,
            [field]: fechaValida
        }));
    };

    const handleTimeChange = (time, field) => {
        // Si time es null o no es una fecha válida, usar la hora actual
        const horaValida = time && !isNaN(new Date(time)) ?
            format(time, 'HH:mm') :
            field === 'hora_inicio' ? '09:00' : '10:00';

        setFormData(prev => ({
            ...prev,
            [field]: horaValida
        }));
    };

    // Función para validar los datos del formulario
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
            throw new Error('La fecha de la actividad no es válida');
        }

        if (!formData.hora_inicio || !formData.hora_fin) {
            throw new Error('Las horas de inicio y fin son requeridas');
        }

        if (!user?.linea_trabajo_id) {
            throw new Error('No se ha podido determinar la línea de trabajo');
        }

        return true;
    };

    // Función para verificar si un beneficiario ya está en otra actividad en la misma fecha
    const estaEnOtraActividad = async (beneficiarioId, fecha) => {
        try {
            // Aquí deberías implementar la lógica para verificar si el beneficiario
            // ya está registrado en otra actividad en la misma fecha
            // Por ahora, retornamos false para no bloquear la selección
            return false;
        } catch (error) {
            return false;
        }
    };

    const handleLineaTrabajoChange = (e) => {
        const lineaTrabajoId = e.target.value;
        const newFormData = {
            ...formData,
            linea_trabajo_id: lineaTrabajoId
        };
        setFormData(newFormData);

        // No es necesario filtrar aquí ya que el efecto se encargará de ello
    };



    const eliminarAsistente = (asistenteId) => {
        setAsistentes(asistentes.filter(id => id !== asistenteId));
    };

    const handleToggleAsistente = (asistenteId) => {
        setAsistentesSeleccionados(prev => {
            if (prev.includes(asistenteId)) {
                return prev.filter(id => id !== asistenteId);
            } else {
                return [...prev, asistenteId];
            }
        });
    };

    const handleSelectAllAsistentes = (event) => {
        if (event.target.checked) {
            const allIds = asistentesDisponibles.map(a => a._id);
            setAsistentesSeleccionados(allIds);
        } else {
            setAsistentesSeleccionados([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // Validar el formulario
            validarFormulario();

            // Validar que haya al menos un asistente o beneficiario según el tipo de asistencia
            if (tipoAsistencia === 'asistentes') {
                if (asistentesSeleccionados.length === 0) {
                    throw new Error('Debe seleccionar al menos un asistente para la actividad');
                }
            } else if (tipoAsistencia === 'linea_trabajo') {
                if (asistentes.length === 0) {
                    throw new Error('Debe seleccionar al menos un beneficiario para la actividad');
                }
            }

            // Obtener los asistentes seleccionados
            const asistentesSeleccionadosData = tipoAsistencia === 'asistentes'
                ? asistentesDisponibles
                    .filter(a => asistentesSeleccionados.includes(a._id))
                    .map(a => ({
                        tipo: 'funcionario', // Cambiado de 'asistente' a 'funcionario' para coincidir con el esquema
                        funcionario_id: a._id, // Cambiado de asistente_id a funcionario_id
                        nombre: a.nombre,
                        cedula: a.cedula,
                        dependencia: a.dependencia,
                        cargo: a.cargo,
                        tipo_participacion: a.tipo_participacion,
                        telefono: a.telefono,
                        email: a.email,
                        asistio: true,
                        observaciones: ''
                    }))
                : []; // Para línea de trabajo, se usan los beneficiarios en el array asistentes

            // Preparar los datos para enviar al backend
            const actividadData = {
                // Usar los valores del formulario
                tema: formData.tema.trim(),
                objetivo: formData.objetivo.trim(),
                lugar: formData.lugar.trim(),
                dependencia: formData.dependencia.trim(),
                fecha: format(formData.fecha, 'yyyy-MM-dd'),
                hora_inicio: formData.hora_inicio || '09:00',
                hora_fin: formData.hora_fin || '10:00',
                linea_trabajo_id: user.linea_trabajo_id,
                funcionario_id: user.id,
                creado_por: user.id,
                observaciones: formData.observaciones?.trim() || '',
                tipo_asistencia: tipoAsistencia,
                estado: 'pendiente', // Campo requerido por el esquema

                // Manejar asistentes según el tipo de asistencia
                asistentes: tipoAsistencia === 'linea_trabajo'
                    ? asistentes.map(id => ({
                        tipo: 'beneficiario',
                        beneficiario_id: id,
                        asistio: true,
                        observaciones: ''
                    }))
                    : asistentesSeleccionadosData
            };



            // Llamar al servicio correspondiente según sea creación o actualización
            let response;
            if (id) {
                response = await updateActividad(id, actividadData);
            } else {
                response = await createActividad(actividadData);
            }

            // Mostrar mensaje de éxito
            if (response && (response.message || response._id)) {
                // Redirigir a la lista de actividades con mensaje de éxito
                navigate('/funcionario/actividades', {
                    state: {
                        message: id ? 'Actividad actualizada correctamente' : 'Actividad creada correctamente',
                        severity: 'success'
                    }
                });
            } else {
                throw new Error('No se recibió una respuesta válida del servidor');
            }
        } catch (error) {

            // Manejar errores específicos de la API
            let errorMessage = 'Error al guardar la actividad. Por favor, intente nuevamente.';

            if (error.response) {
                // El servidor respondió con un estado de error
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
                // La petición fue hecha pero no se recibió respuesta
                errorMessage = 'No se pudo conectar con el servidor. Por favor, verifique su conexión a Internet.';
            } else if (error.message) {
                // Error en el mensaje de validación
                errorMessage = error.message;
            }

            setError(errorMessage);

            // Desplazarse al principio del formulario para mostrar el error
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

    return (
        <PageLayout title={pageTitle} description={pageDescription}>
            <Box sx={{ p: 3 }}>
                {/* <Box display="flex" alignItems="center" mb={3}>
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
                        textAlign: 'center',
                        boxShadow: 1
                    }}
                >
                    {id ? 'Editar Actividad' : 'Nuevas Actividad'}
                </Typography>
            </Box> */}

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
                                                label="Tema de la actividad"
                                                name="tema"
                                                value={formData.tema}
                                                onChange={handleChange}
                                                required
                                                margin="normal"
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
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={4}>
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                <DatePicker
                                                    label="Fecha de la actividad"
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
                                                    color="primary"
                                                    type="submit"
                                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                                    disabled={saving}
                                                >
                                                    {saving ? 'Guardando...' : 'Guardar Actividad'}
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
                                    <Box display="flex" flexDirection="column" mb={2}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    backgroundColor: '#1976d2',
                                                    color: 'white',
                                                    p: 1,
                                                    borderRadius: 1,
                                                    textAlign: 'center',
                                                    minWidth: '150px'
                                                }}
                                            >
                                                Asistentes
                                            </Typography>
                                            <FormControl variant="outlined" size="small" sx={{ minWidth: 200, ml: 2 }}>
                                                <InputLabel id="tipo-asistencia-label">Tipo de Asistencia</InputLabel>
                                                <Select
                                                    labelId="tipo-asistencia-label"
                                                    id="tipo-asistencia"
                                                    value={tipoAsistencia}
                                                    onChange={(e) => setTipoAsistencia(e.target.value)}
                                                    label="Tipo de Asistencia"
                                                >
                                                    <MenuItem value="linea_trabajo">Línea de Trabajo</MenuItem>
                                                    <MenuItem value="asistentes">Asistentes</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        {tipoAsistencia === 'linea_trabajo' && (
                                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                <DatePicker
                                                    label="Filtrar por fecha"
                                                    value={filtroFecha}
                                                    onChange={(date) => {
                                                        setFiltroFecha(date);
                                                        cargarBeneficiarios(date ? { fecha: format(date, 'yyyy-MM-dd') } : {});
                                                    }}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            fullWidth
                                                            size="small"
                                                            margin="normal"
                                                        />
                                                    )}
                                                />
                                            </LocalizationProvider>
                                        )}

                                        {tipoAsistencia === 'asistentes' && (
                                            <Box mt={2}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Seleccione los asistentes para esta actividad
                                                </Typography>

                                                <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                                                    <Table size="small" stickyHeader>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell padding="checkbox">
                                                                    <Checkbox
                                                                        color="primary"
                                                                        indeterminate={
                                                                            asistentesSeleccionados.length > 0 &&
                                                                            asistentesSeleccionados.length < asistentesDisponibles.length
                                                                        }
                                                                        checked={
                                                                            asistentesDisponibles.length > 0 &&
                                                                            asistentesSeleccionados.length === asistentesDisponibles.length
                                                                        }
                                                                        onChange={handleSelectAllAsistentes}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>Nombre</TableCell>
                                                                <TableCell>Documento</TableCell>
                                                                <TableCell>Dependencia</TableCell>
                                                                <TableCell>Cargo</TableCell>
                                                                <TableCell>Tipo</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {asistentesDisponibles.map((asistente) => (
                                                                <TableRow
                                                                    key={asistente._id}
                                                                    hover
                                                                    onClick={() => handleToggleAsistente(asistente._id)}
                                                                    sx={{ cursor: 'pointer' }}
                                                                >
                                                                    <TableCell padding="checkbox">
                                                                        <Checkbox
                                                                            color="primary"
                                                                            checked={asistentesSeleccionados.includes(asistente._id)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onChange={() => handleToggleAsistente(asistente._id)}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>{asistente.nombre}</TableCell>
                                                                    <TableCell>{asistente.cedula}</TableCell>
                                                                    <TableCell>{asistente.dependencia}</TableCell>
                                                                    <TableCell>{asistente.cargo}</TableCell>
                                                                    <TableCell>{asistente.tipo_participacion}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                            {asistentesDisponibles.length === 0 && (
                                                                <TableRow>
                                                                    <TableCell colSpan={6} align="center">
                                                                        No hay asistentes registrados
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>

                                                <Box mt={2} display="flex" justifyContent="flex-end">
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<PersonAddIcon />}
                                                        onClick={() => navigate('/funcionario/asistentes')}
                                                    >
                                                        Gestionar Asistentes
                                                    </Button>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box mb={2}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Beneficiarios disponibles ({beneficiariosFiltrados.length})
                                        </Typography>

                                        <Box display="flex" justifyContent="space-between" mb={1}>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    // Agregar todos los beneficiarios filtrados que no estén ya en asistentes
                                                    const nuevosAsistentes = [...new Set([...asistentes, ...beneficiariosFiltrados
                                                        .filter(b => !asistentes.includes(b._id))
                                                        .map(b => b._id)
                                                    ])];
                                                    setAsistentes(nuevosAsistentes);
                                                }}
                                                disabled={beneficiariosFiltrados.length === 0}
                                            >
                                                Seleccionar todos
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    // Mantener solo los asistentes que no estén en los beneficiarios filtrados
                                                    const nuevosAsistentes = asistentes.filter(
                                                        id => !beneficiariosFiltrados.some(b => b._id === id)
                                                    );
                                                    setAsistentes(nuevosAsistentes);
                                                }}
                                                disabled={asistentes.length === 0}
                                            >
                                                Deseleccionar todos
                                            </Button>
                                        </Box>

                                        <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1, mb: 2 }}>
                                            {beneficiariosFiltrados.length > 0 ? (
                                                <List dense>
                                                    {beneficiariosFiltrados.map((beneficiario) => (
                                                        <ListItem
                                                            key={beneficiario._id}
                                                            dense
                                                            button
                                                            onClick={() => {
                                                                const nuevosAsistentes = asistentes.includes(beneficiario._id)
                                                                    ? asistentes.filter(id => id !== beneficiario._id)
                                                                    : [...asistentes, beneficiario._id];
                                                                setAsistentes(nuevosAsistentes);
                                                            }}
                                                        >
                                                            <ListItemIcon>
                                                                <Checkbox
                                                                    edge="start"
                                                                    checked={asistentes.includes(beneficiario._id)}
                                                                    tabIndex={-1}
                                                                    disableRipple
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={`${beneficiario.nombre_completo
                                                                    }`}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            ) : (
                                                <Typography variant="body2" color="textSecondary" align="center" sx={{ p: 2 }}>
                                                    No hay beneficiarios disponibles
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2">
                                            Asistentes seleccionados ({asistentes.length})
                                        </Typography>
                                        {asistentes.length > 0 && (
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => setAsistentes([])}
                                                startIcon={<ClearAllIcon />}
                                            >
                                                Limpiar todo
                                            </Button>
                                        )}
                                    </Box>

                                    <Box sx={{
                                        maxHeight: 200,
                                        overflow: 'auto',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        p: 1
                                    }}>
                                        {asistentes.length > 0 ? (
                                            <List dense>
                                                {asistentes.map((asistenteId) => {
                                                    const asistente = beneficiarios.find(b => b._id === asistenteId);
                                                    if (!asistente) return null;

                                                    return (
                                                        <ListItem
                                                            key={asistenteId}
                                                            sx={{
                                                                '&:hover': {
                                                                    backgroundColor: 'action.hover',
                                                                    borderRadius: 1
                                                                },
                                                                '& .MuiListItemSecondaryAction-root': {
                                                                    right: '8px'
                                                                }
                                                            }}
                                                            secondaryAction={
                                                                <IconButton
                                                                    edge="end"
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        eliminarAsistente(asistenteId);
                                                                    }}
                                                                    color="error"
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            }
                                                        >
                                                            <ListItemText
                                                                primary={`${asistente.nombre_completo}`}
                                                            />
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary" align="center" sx={{ p: 2 }}>
                                                No hay asistentes seleccionados
                                            </Typography>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </PageLayout>
    );
};

export default NuevaActividad;
