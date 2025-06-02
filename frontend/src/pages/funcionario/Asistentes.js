import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, 
    Button, 
    Card, 
    CardContent, 
    CardHeader, 
    Divider, 
    Grid, 
    IconButton, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    TextField,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axiosInstance from '../../utils/axiosConfig';
import PageLayout from '../../components/layout/PageLayout';

const Asistentes = () => {
    const [asistentes, setAsistentes] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [lineasTrabajo, setLineasTrabajo] = useState([]);
    
    const pageTitle = 'Registro de Asistentes';
    const pageDescription = 'Formulario para registro de asistentes a reuniones';
    
    const [asistente, setAsistente] = useState({
        tipo: 'funcionario',
        nombre: '',
        cedula: '',
        dependencia: '',
        cargo: '',
        tipo_participacion: 'SERVIDOR PÚBLICO',
        telefono: '',
        email: ''
    });
    
    const [errores, setErrores] = useState({});

    const tiposParticipacion = [
        'SERVIDOR PÚBLICO',
        'CONTRATISTA',
        'CIUDADANO',
        'LÍDER COMUNITARIO',
        'ESTUDIANTE',
        'JOVEN LÍDER'
    ];

    const navigate = useNavigate();

    // Cargar asistentes
    const cargarAsistentes = async () => {
        try {
            const response = await axiosInstance.get('/api/asistentes');
            setAsistentes(response.data.data || []);
        } catch (error) {
            console.error('Error al cargar asistentes:', error);
            const mensajeError = error.response?.data?.message || 'Error al cargar la lista de asistentes';
            setError(mensajeError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarAsistentes();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAsistente(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validarFormulario = () => {
        const nuevosErrores = {};
        
        // Validar cédula única
        const cedulaExistente = asistentes.some(a => 
            a.cedula === asistente.cedula && a._id !== editingId
        );
        if (cedulaExistente) {
            nuevosErrores.cedula = 'Esta cédula ya está registrada';
        }
        
        // Validar email único si está presente
        if (asistente.email) {
            const emailExistente = asistentes.some(a => 
                a.email && a.email.toLowerCase() === asistente.email.toLowerCase() && a._id !== editingId
            );
            if (emailExistente) {
                nuevosErrores.email = 'Este correo electrónico ya está registrado';
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(asistente.email)) {
                nuevosErrores.email = 'Ingrese un correo electrónico válido';
            }
        }
        
        // Validar campos requeridos
        if (!asistente.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es requerido';
        }
        
        if (!asistente.cedula.trim()) {
            nuevosErrores.cedula = 'La cédula es requerida';
        }
        
        if (!asistente.dependencia.trim()) {
            nuevosErrores.dependencia = 'La dependencia es requerida';
        }
        
        if (!asistente.cargo.trim()) {
            nuevosErrores.cargo = 'El cargo es requerido';
        }
        
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) {
            return;
        }
        
        try {
            if (editingId) {
                const { data } = await axiosInstance.put(`/api/asistentes/${editingId}`, asistente);
                setSuccess(data.message || 'Asistente actualizado correctamente');
            } else {
                const { data } = await axiosInstance.post('/api/asistentes', asistente);
                setSuccess(data.message || 'Asistente creado correctamente');
            }
            setOpenDialog(false);
            cargarAsistentes();
            resetForm();
        } catch (error) {
            console.error('Error al guardar asistente:', error);
            const mensajeError = error.response?.data?.message || 'Error al guardar el asistente';
            setError(mensajeError);
        }
    };

    const handleEdit = (asistente) => {
        setAsistente({
            tipo: asistente.tipo,
            nombre: asistente.nombre,
            cedula: asistente.cedula,
            dependencia: asistente.dependencia,
            cargo: asistente.cargo,
            tipo_participacion: asistente.tipo_participacion,
            telefono: asistente.telefono,
            email: asistente.email,
            linea_trabajo_id: asistente.linea_trabajo_id || ''
        });
        setEditingId(asistente._id);
        setOpenDialog(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este asistente?')) {
            try {
                const { data } = await axiosInstance.delete(`/api/asistentes/${id}`);
                setSuccess(data.message || 'Asistente eliminado correctamente');
                cargarAsistentes();
            } catch (error) {
                console.error('Error al eliminar asistente:', error);
                const mensajeError = error.response?.data?.message || 'Error al eliminar el asistente';
                setError(mensajeError);
            }
        }
    };

    const resetForm = () => {
        setAsistente({
            tipo: 'funcionario',
            nombre: '',
            cedula: '',
            dependencia: '',
            cargo: '',
            tipo_participacion: 'SERVIDOR PÚBLICO',
            telefono: '',
            email: ''
        });
        setErrores({});
        setEditingId(null);
    };

    const handleOpenDialog = () => {
        resetForm();
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        resetForm();
    };

    return (
        <PageLayout title={pageTitle} description={pageDescription}>
            <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader 
                                action={
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        startIcon={<AddIcon />}
                                        onClick={handleOpenDialog}
                                    >
                                        Agregar Asistente
                                    </Button>
                                }
                            />
                            <Divider />
                            <CardContent>
                            {error && (
                                <Box sx={{ color: 'error.main', mb: 2 }}>{error}</Box>
                            )}
                            {success && (
                                <Box sx={{ color: 'success.main', mb: 2 }}>{success}</Box>
                            )}
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Cédula</TableCell>
                                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Dependencia</TableCell>
                                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Cargo</TableCell>
                                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                                            <TableCell sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>

                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {asistentes.map((asistente) => (
                                            <TableRow key={asistente._id}>
                                                <TableCell>{asistente.nombre}</TableCell>
                                                <TableCell>{asistente.cedula}</TableCell>
                                                <TableCell>{asistente.dependencia}</TableCell>
                                                <TableCell>{asistente.cargo}</TableCell>
                                                <TableCell>{asistente.tipo_participacion}</TableCell>
                                                <TableCell>
                                                    <IconButton 
                                                        color="primary" 
                                                        onClick={() => handleEdit(asistente)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton 
                                                        color="error" 
                                                        onClick={() => handleDelete(asistente._id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Diálogo para agregar/editar asistente */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>{editingId ? 'Editar Asistente' : 'Agregar Nuevo Asistente'}</DialogTitle>
                    <form onSubmit={handleSubmit}>
                        <DialogContent>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Nombre Completo"
                                        name="nombre"
                                        value={asistente.nombre}
                                        onChange={handleInputChange}
                                        error={!!errores.nombre}
                                        helperText={errores.nombre}
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Cédula"
                                        name="cedula"
                                        value={asistente.cedula}
                                        onChange={handleInputChange}
                                        error={!!errores.cedula}
                                        helperText={errores.cedula}
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Dependencia"
                                        name="dependencia"
                                        value={asistente.dependencia}
                                        onChange={handleInputChange}
                                        error={!!errores.dependencia}
                                        helperText={errores.dependencia}
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Cargo"
                                        name="cargo"
                                        value={asistente.cargo}
                                        onChange={handleInputChange}
                                        error={!!errores.cargo}
                                        helperText={errores.cargo}
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth margin="normal" required>
                                        <InputLabel>Tipo de Participación</InputLabel>
                                        <Select
                                            name="tipo_participacion"
                                            value={asistente.tipo_participacion}
                                            onChange={handleInputChange}
                                            label="Tipo de Participación"
                                        >
                                            {tiposParticipacion.map((tipo) => (
                                                <MenuItem key={tipo} value={tipo}>
                                                    {tipo}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Teléfono"
                                        name="telefono"
                                        value={asistente.telefono}
                                        onChange={handleInputChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Correo Electrónico"
                                        name="email"
                                        type="email"
                                        value={asistente.email}
                                        onChange={handleInputChange}
                                        error={!!errores.email}
                                        helperText={errores.email}
                                        margin="normal"
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancelar</Button>
                            <Button type="submit" variant="contained" color="primary">
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </PageLayout>
    );
};

export default Asistentes;
