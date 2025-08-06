import React, { useState, useEffect } from 'react';
import { 
    Container, 
    Typography, 
    Button, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Box,
    CircularProgress
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import comunaService from '../../services/comunaService';

const Comunas = () => {
    const [comunas, setComunas] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [comunaActual, setComunaActual] = useState({ nombre: '', zona: '' });
    const [modoEdicion, setModoEdicion] = useState(false);
    const [loadingOverlay, setLoadingOverlay] = useState(false);

    useEffect(() => {
        cargarComunas();
    }, []);

    const cargarComunas = async () => {
        setLoadingOverlay(true);
        try {
            const response = await comunaService.obtenerComunas();
            setComunas(response || []);
        } catch (error) {
            setComunas([]);
        } finally {
            setLoadingOverlay(false);
        }
    };

    const handleAbrirModal = (comuna = null) => {
        if (comuna) {
            setComunaActual(comuna);
            setModoEdicion(true);
        } else {
            setComunaActual({ nombre: '', zona: '' });
            setModoEdicion(false);
        }
        setOpenModal(true);
    };

    const handleCerrarModal = () => {
        setOpenModal(false);
        setComunaActual({ nombre: '', zona: '' });
    };

    const handleGuardarComuna = async () => {
        try {
            if (modoEdicion) {
                await comunaService.actualizarComuna(comunaActual._id, comunaActual);
            } else {
                await comunaService.crearComuna(comunaActual);
            }
            cargarComunas();
            handleCerrarModal();
        } catch (error) {
            console.error('Error al guardar Comuna:', error);
            const errorMessage = error.response?.data?.message || 
                                 error.message || 
                                 'Error desconocido al guardar Comuna';
            alert(errorMessage);
        }
    };

    const handleEliminarComuna = async (comunaId) => {
        try {
            await comunaService.eliminarComuna(comunaId);
            cargarComunas();
        } catch (error) {
            console.error('Error al eliminar Comuna:', error);
        }
    };

    const handleCambioInput = (e) => {
        const { name, value } = e.target;
        setComunaActual(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Container maxWidth="md">
            {/* Overlay de carga - Cubre toda la pantalla */}
            {loadingOverlay && (
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0,0,0,0.35)',
                    zIndex: 1199, /* Detrás del sidebar (1200) */
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(2px)',
                    paddingTop: '64px', /* Altura del AppBar */
                    boxSizing: 'border-box',
                }}>
                    <Box sx={{ 
                        position: 'relative', 
                        display: 'inline-flex',
                        bgcolor: 'background.paper',
                        p: 4,
                        borderRadius: 2,
                        boxShadow: 3,
                    }}>
                        <CircularProgress size={80} thickness={4} value={100} variant="determinate" color="secondary" />
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
                            <Typography variant="h6" component="div" color="text.primary">Cargando...</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
            <Typography variant="h5" gutterBottom>
                Gestión de Comunas
            </Typography>

            <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleAbrirModal()}
                sx={{ mb: 2 }}
            >
                Crear Nueva Comuna
            </Button>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Zona</TableCell>
                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {comunas.map((comuna) => (
                            <TableRow key={comuna._id}>
                                <TableCell>{comuna.nombre}</TableCell>
                                <TableCell>{comuna.zona}</TableCell>
                                <TableCell>
                                    <IconButton 
                                        color="primary" 
                                        onClick={() => handleAbrirModal(comuna)}
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton 
                                        color="secondary" 
                                        onClick={() => handleEliminarComuna(comuna._id)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openModal} onClose={handleCerrarModal}>
                <DialogTitle>
                    {modoEdicion ? 'Editar Comuna' : 'Crear Nueva Comuna'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        name="nombre"
                        label="Nombre"
                        fullWidth
                        value={comunaActual.nombre}
                        onChange={handleCambioInput}
                        sx={{ mb: 2, mt: 2 }}
                    />
                    <TextField
                        name="zona"
                        label="Zona"
                        fullWidth
                        value={comunaActual.zona}
                        onChange={handleCambioInput}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCerrarModal} color="secondary">
                        Cancelar
                    </Button>
                    <Button onClick={handleGuardarComuna} color="primary">
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Comunas;
