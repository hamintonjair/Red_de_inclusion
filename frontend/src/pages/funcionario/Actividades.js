import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    IconButton, 
    TablePagination,
    Chip,
    CircularProgress,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    InputAdornment,
    InputAdornment as MuiInputAdornment
} from '@mui/material';
import { 
    Add as AddIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon,
    Event as EventIcon,
    People as PeopleIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { getActividades, deleteActividad } from '../../services/actividadService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PageLayout from '../../components/layout/PageLayout';

const Actividades = () => {
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [ordenCampo, setOrdenCampo] = useState('fecha');
    const [ordenDireccion, setOrdenDireccion] = useState('desc');
    const navigate = useNavigate();

    const pageTitle = 'Listado de actividades';
    const pageDescription =   <Typography variant="h5" component="h1">
    Gestiona tus actividades o reuniones realizadas, edita/elimina aquellas que veas convenientes.
</Typography>;
    const cargarActividades = async (nuevaPagina = pagina, nuevaBusqueda = busqueda) => {
        try {
            setLoading(true);
            const { actividades: datos, total: totalRegistros, totalPaginas: paginasTotales } = await getActividades({
                pagina: nuevaPagina,
                porPagina,
                busqueda: nuevaBusqueda,
                campoOrden: ordenCampo,
                direccionOrden: ordenDireccion
            });
            
            setActividades(datos || []);
            setTotal(totalRegistros || 0);
            setTotalPaginas(paginasTotales || 1);
            setError(null);
        } catch (err) {
            console.error('Error al cargar actividades:', err);
            setError(err.message || 'No se pudieron cargar las actividades. Intente nuevamente.');
            setActividades([]);
            setTotal(0);
            setTotalPaginas(1);
        } finally {
            setLoading(false);
        }
    };

    // Cargar actividades cuando cambian los parámetros de búsqueda u ordenación
    useEffect(() => {
        cargarActividades();
    }, [pagina, porPagina, ordenCampo, ordenDireccion]);

    // Función para manejar cambios en la búsqueda
    const handleBuscar = (e) => {
        e && e.preventDefault();
        setPagina(1); // Volver a la primera página al realizar una nueva búsqueda
        cargarActividades(1, busqueda);
    };

    // Función para manejar cambios en el campo de búsqueda
    const handleChangeBusqueda = (e) => {
        setBusqueda(e.target.value);
        // Si el campo de búsqueda está vacío, realizar la búsqueda automáticamente
        if (e.target.value === '') {
            handleBuscar();
        }
    };

    // Función para manejar cambios de página
    const handleChangePagina = (event, nuevaPagina) => {
        setPagina(nuevaPagina);
    };

    // Función para manejar cambios en la cantidad de elementos por página
    const handleChangePorPagina = (event) => {
        setPorPagina(parseInt(event.target.value, 10));
        setPagina(1);
    };

    // Función para manejar el ordenamiento
    const handleOrdenar = (campo) => {
        const esOrdenAsc = ordenCampo === campo && ordenDireccion === 'asc';
        setOrdenCampo(campo);
        setOrdenDireccion(esOrdenAsc ? 'desc' : 'asc');
        setPagina(1);
    };

    const [actividadAEliminar, setActividadAEliminar] = useState(null);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [eliminando, setEliminando] = useState(false);

    const handleEliminarClick = (id) => {
        setActividadAEliminar(id);
        setMostrarConfirmacion(true);
    };

    const confirmarEliminacion = async () => {
        if (!actividadAEliminar) return;
        
        try {
            setEliminando(true);
            await deleteActividad(actividadAEliminar);
            cargarActividades();
            setError(null);
        } catch (error) {
            console.error('Error al eliminar la actividad:', error);
            setError('No se pudo eliminar la actividad. Por favor, intente nuevamente.');
        } finally {
            setEliminando(false);
            setMostrarConfirmacion(false);
            setActividadAEliminar(null);
        }
    };

    const cancelarEliminacion = () => {
        setMostrarConfirmacion(false);
        setActividadAEliminar(null);
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box component="form" onSubmit={handleBuscar} sx={{ flex: '1 1 300px', maxWidth: '500px' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar por tema, lugar, dependencia..."
                        value={busqueda}
                        onChange={handleChangeBusqueda}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: busqueda && (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="limpiar búsqueda"
                                        onClick={() => {
                                            setBusqueda('');
                                            handleBuscar();
                                        }}
                                        edge="end"
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/funcionario/actividades/nueva')}
                >
                    Nueva Actividad
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell 
                                sx={{ 
                                    backgroundColor: '#1976d2', 
                                    color: 'white', 
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: '#1565c0' }
                                }}
                                onClick={() => handleOrdenar('tema')}
                            >
                                <Box display="flex" alignItems="center">
                                    Tema
                                    {ordenCampo === 'tema' && (
                                        <Box ml={1} display="flex" flexDirection="column">
                                            <ArrowUpwardIcon fontSize="small" style={{
                                                opacity: ordenDireccion === 'asc' ? 1 : 0.3,
                                                marginBottom: -8
                                            }} />
                                            <ArrowDownwardIcon fontSize="small" style={{
                                                opacity: ordenDireccion === 'desc' ? 1 : 0.3,
                                                marginTop: -8
                                            }} />
                                        </Box>
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    backgroundColor: '#1976d2', 
                                    color: 'white', 
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: '#1565c0' }
                                }}
                                onClick={() => handleOrdenar('fecha')}
                            >
                                <Box display="flex" alignItems="center">
                                    Fecha y Hora
                                    {ordenCampo === 'fecha' && (
                                        <Box ml={1} display="flex" flexDirection="column">
                                            <ArrowUpwardIcon fontSize="small" style={{
                                                opacity: ordenDireccion === 'asc' ? 1 : 0.3,
                                                marginBottom: -8
                                            }} />
                                            <ArrowDownwardIcon fontSize="small" style={{
                                                opacity: ordenDireccion === 'desc' ? 1 : 0.3,
                                                marginTop: -8
                                            }} />
                                        </Box>
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    backgroundColor: '#1976d2', 
                                    color: 'white', 
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: '#1565c0' }
                                }}
                                onClick={() => handleOrdenar('lugar')}
                            >
                                <Box display="flex" alignItems="center">
                                    Lugar
                                    {ordenCampo === 'lugar' && (
                                        <Box ml={1} display="flex" flexDirection="column">
                                            <ArrowUpwardIcon fontSize="small" style={{
                                                opacity: ordenDireccion === 'asc' ? 1 : 0.3,
                                                marginBottom: -8
                                            }} />
                                            <ArrowDownwardIcon fontSize="small" style={{
                                                opacity: ordenDireccion === 'desc' ? 1 : 0.3,
                                                marginTop: -8
                                            }} />
                                        </Box>
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    backgroundColor: '#1976d2', 
                                    color: 'white', 
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: '#1565c0' }
                                }}
                                onClick={() => handleOrdenar('dependencia')}
                            >
                                <Box display="flex" alignItems="center">
                                    Dependencia
                                    {ordenCampo === 'dependencia' && (
                                        <Box ml={1} display="flex" flexDirection="column">
                                            <ArrowUpwardIcon fontSize="small" style={{
                                                opacity: ordenDireccion === 'asc' ? 1 : 0.3,
                                                marginBottom: -8
                                            }} />
                                            <ArrowDownwardIcon fontSize="small" style={{
                                                opacity: ordenDireccion === 'desc' ? 1 : 0.3,
                                                marginTop: -8
                                            }} />
                                        </Box>
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Asistentes</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }} align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {actividades.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    No hay actividades registradas
                                </TableCell>
                            </TableRow>
                        ) : (
                            actividades.map((actividad) => (
                                <TableRow key={actividad._id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle1">
                                            {actividad.tema}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {actividad.objetivo?.substring(0, 50)}...
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {actividad.fecha && (
                                            <Box>
                                                <Typography>
                                                    {(() => {
                                                        try {
                                                            // Asegurarse de que la fecha tenga el formato correcto
                                                            const fecha = actividad.fecha;
                                                            // Crear una fecha en UTC para evitar problemas de zona horaria
                                                            const fechaUTC = new Date(fecha);
                                                            // Ajustar la fecha para que coincida con la zona horaria local
                                                            const fechaAjustada = new Date(fechaUTC.getTime() + (fechaUTC.getTimezoneOffset() * 60000));
                                                            
                                                            return !isNaN(fechaAjustada.getTime()) 
                                                                ? format(fechaAjustada, 'PPPP', { locale: es })
                                                                : 'Fecha no válida';
                                                        } catch (e) {
                                                            console.error('Error al formatear fecha:', e);
                                                            return 'Fecha no especificada';
                                                        }
                                                    })()}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {actividad.hora_inicio} - {actividad.hora_fin}
                                                </Typography>
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell>{actividad.lugar}</TableCell>
                                    <TableCell>
                                        {actividad.dependencia}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center">
                                            <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
                                            {actividad.asistentes?.length || 0}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            color="primary" 
                                            onClick={() => navigate(`/funcionario/actividades/${actividad._id}`)}
                                        >
                                            <EventIcon />
                                        </IconButton>
                                        <IconButton 
                                            color="primary" 
                                            onClick={() => navigate(`/funcionario/actividades/editar/${actividad._id}`)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            color="error" 
                                            onClick={() => handleEliminarClick(actividad._id)}
                                            disabled={loading || eliminando}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {/* Controles de paginación */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={4}>
                <Box display="flex" alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                        Mostrando {actividades.length} de {total} actividades
                    </Typography>
                </Box>
                <TablePagination
                    component="div"
                    count={total}
                    page={pagina - 1}
                    onPageChange={(e, nuevaPagina) => handleChangePagina(e, nuevaPagina + 1)}
                    rowsPerPage={porPagina}
                    onRowsPerPageChange={handleChangePorPagina}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Box>

            {/* Diálogo de confirmación de eliminación */}
            <Dialog
                open={mostrarConfirmacion}
                onClose={cancelarEliminacion}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Confirmar eliminación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        ¿Está seguro de que desea eliminar esta actividad? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={cancelarEliminacion} 
                        color="primary"
                        disabled={eliminando}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={confirmarEliminacion} 
                        color="error" 
                        autoFocus
                        disabled={eliminando}
                        startIcon={eliminando ? <CircularProgress size={20} /> : null}
                    >
                        {eliminando ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
        </PageLayout>
    );
};

export default Actividades;
