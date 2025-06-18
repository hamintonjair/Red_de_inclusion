import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Button,
    Typography,
    IconButton,
    Box,
    Chip,
    CircularProgress
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import funcionarioService from '../../services/funcionarioService';

const ListadoFuncionarios = () => {
    const [funcionarios, setFuncionarios] = useState([]);
    const [loadingOverlay, setLoadingOverlay] = useState(false);
    const navigate = useNavigate();

    const cargarFuncionarios = async () => {
        setLoadingOverlay(true);
        try {
            const data = await funcionarioService.obtenerFuncionarios();
        
            setFuncionarios(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error al cargar funcionarios:', {
                mensaje: error.mensaje || 'Error desconocido',
                detalles: error.detalles || {}
            });
        } finally {
            setLoadingOverlay(false);
        }
    };

    useEffect(() => {
        cargarFuncionarios();
    }, []);

    const handleEditar = (id) => {
        navigate(`/admin/funcionarios/editar/${id}`);
    };

    const handleNuevoFuncionario = () => {
        navigate('/admin/funcionarios/registro');
    };

    const handleEliminar = async (id) => {
        try {
            await funcionarioService.eliminarFuncionario(id);
            // Recargar la lista de funcionarios
            cargarFuncionarios();
        } catch (error) {
            console.error('Error al eliminar funcionario:', error);
        }
    };

    return (
        <div>
            {loadingOverlay && (
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
            )}
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2 
                }}
            >
                <Typography variant="h5">
                
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    onClick={handleNuevoFuncionario}
                >
                    Nuevo Funcionario
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Secretaría</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Línea de Trabajo</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Rol</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {funcionarios.map((funcionario) => (
                            <TableRow key={funcionario._id || funcionario.id}>
                                <TableCell>{funcionario.secretaría}</TableCell>
                                <TableCell>{funcionario.nombre}</TableCell>
                                <TableCell>{funcionario.email}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={
                                            funcionario.nombreLineaTrabajo || 
                                            funcionario.lineaTrabajo?.nombre || 
                                            'Sin línea'
                                        }
                                        color="primary" 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell>{funcionario.rol}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={funcionario.estado} 
                                        color={funcionario.estado === 'Activo' ? 'success' : 'default'}
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton 
                                        color="primary" 
                                        onClick={() => handleEditar(funcionario._id || funcionario.id)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    {funcionario.rol !== 'admin' && (
                                        <IconButton 
                                            color="error" 
                                            onClick={() => handleEliminar(funcionario._id || funcionario.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default ListadoFuncionarios;
