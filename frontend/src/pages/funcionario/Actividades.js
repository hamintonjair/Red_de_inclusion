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
    InputAdornment
} from '@mui/material';
import { 
    Add as AddIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon,
    Event as EventIcon,
    People as PeopleIcon,
    GroupAdd as GroupAddIcon,
    Search as SearchIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { getActividades, deleteActividad } from '../../services/actividadService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PageLayout from '../../components/layout/PageLayout';

const Actividades = () => {
    const navigate = useNavigate();
    const [actividades, setActividades] = useState([]);
    const [filteredActividades, setFilteredActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Estados para el diálogo de confirmación
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [actividadAEliminar, setActividadAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    const pageTitle = 'Listado de actividades';
    const pageDescription =   <Typography variant="h5" component="h1">
    Gestiona tus actividades realizadas, edita o elimina aquellas que no sean relevantes.
</Typography>;

    // Función para cargar las actividades
    const cargarActividades = async () => {
        try {
            setLoading(true);
            const response = await getActividades();
            // La respuesta de la API tiene la estructura {data: [...], success: true}
            const actividadesData = response.data || [];
            setActividades(actividadesData);
            setFilteredActividades(actividadesData);
            setError(null);
        } catch (err) {
            console.error('Error al cargar actividades:', err);
            setError('Error al cargar las actividades. Por favor, intente de nuevo.');
            setActividades([]);
            setFilteredActividades([]);
        } finally {
            setLoading(false);
        }
    };

    // Función para manejar la búsqueda
    const handleSearch = (e) => {
        const term = e.target.value;
        console.log('Término de búsqueda:', term); // Debug
        setSearchTerm(term);
        
        if (!term || term.trim() === '') {
            console.log('Búsqueda vacía, mostrando todas las actividades'); // Debug
            setFilteredActividades(actividades);
            return;
        }
        
        const searchTermLower = term.trim().toLowerCase();
        const normalizedSearchTerm = searchTermLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        console.log('Buscando con término normalizado:', normalizedSearchTerm); // Debug
        
        const resultados = actividades.filter(actividad => {
            // Incluir el documento en la búsqueda
            const documento = actividad.documento || '';
            const camposBusqueda = [
                actividad.nombre_actividad || '',
                actividad.descripcion || '',
                actividad.lugar || '',
                actividad.dependencia || '',
                actividad.tipo_actividad || '',
                documento.toString() // Asegurarse de que sea string
            ].join(' ')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
            
            console.log('Actividad:', actividad.nombre_actividad); // Debug
            console.log('Campos de búsqueda:', camposBusqueda); // Debug
            
            const resultado = camposBusqueda.includes(normalizedSearchTerm);
            console.log('Coincide?', resultado); // Debug
            
            return resultado;
        });
        
        console.log('Resultados encontrados:', resultados.length); // Debug
        setFilteredActividades(resultados);
        setPage(0);
    };

    // Manejadores de cambio de página y filas por página
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Calcular las actividades a mostrar en la página actual
    const actividadesPaginadas = Array.isArray(filteredActividades) 
        ? filteredActividades.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
          )
        : [];

    useEffect(() => {
        cargarActividades();
    }, []);

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
            <Box sx={{ mb: 3 }}>
                {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        {pageTitle}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        component={Link}
                        to="/funcionario/actividades/nueva"
                    >
                        Nueva Actividad
                    </Button>
                </Box> */}
                
                {/* Campo de búsqueda */}
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Buscar actividad..."
                    value={searchTerm}
                    onChange={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilteredActividades(actividades);
                                    }}
                                    edge="end"
                                >
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                    sx={{ mb: 2 }}
                />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="success"
                        startIcon={<AddIcon />}
                        component={Link}
                        to="/funcionario/actividades/nueva"
                    >
                        Nueva Actividad
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<GroupAddIcon />}
                        component={Link}
                        to="/funcionario/actividades/reunion"
                    >
                        Nueva Reunión
                    </Button>
                </Box>
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
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Tema</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Fecha y Hora</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Lugar</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Dependencia</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Asistentes</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }} align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Alert severity="error">{error}</Alert>
                                </TableCell>
                            </TableRow>
                        ) : actividadesPaginadas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body1">
                                        {searchTerm 
                                            ? 'No se encontraron actividades que coincidan con la búsqueda'
                                            : 'No hay actividades registradas'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            actividadesPaginadas.map((actividad) => (
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
                                                        const fecha = new Date(actividad.fecha);
                                                        return !isNaN(fecha.getTime()) 
                                                            ? format(fecha, 'PPP', { locale: es })
                                                            : 'Fecha no válida';
                                                    } catch (e) {
                                                        console.error('Error al formatear fecha:', e, 'Valor:', actividad.fecha);
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
                                    <TableCell>{actividad.dependencia}</TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center">
                                            <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
                                            {actividad.asistentes?.length || 0}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            color="primary" 
                                            onClick={() => {
                                                if (actividad.tipo === 'reunion') {
                                                    navigate(`/funcionario/actividades/reunion/${actividad._id}`);
                                                } else {
                                                    navigate(`/funcionario/actividades/${actividad._id}`);
                                                }
                                            }}
                                        >
                                            <EventIcon />
                                        </IconButton>
                                        <IconButton 
                                            color="primary" 
                                            onClick={() => {
                                                if (actividad.tipo === 'reunion') {
                                                    navigate(`/funcionario/actividades/editar-reunion/${actividad._id}`);
                                                } else {
                                                    navigate(`/funcionario/actividades/editar/${actividad._id}`);
                                                }
                                            }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            color="error" 
                                            onClick={() => handleEliminarClick(actividad._id)}
                                            disabled={eliminando}
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
            
            {/* Paginación */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredActividades.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
                sx={{ mt: 2 }}
            />
            
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
