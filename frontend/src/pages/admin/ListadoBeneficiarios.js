import React, { useState, useEffect } from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Box,
    TablePagination,
    TextField,
    InputAdornment,
    Button,
    Grid,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress
} from '@mui/material';
import { 
    Delete as DeleteIcon,
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    FileDownload as ExportIcon
} from '@mui/icons-material';

import beneficiarioService from '../../services/beneficiarioService';
import usuarioService from '../../services/usuarioService';
import { exportarListadoBeneficiariosAExcel } from './exportUtilsBeneficiarios';
import { useSnackbar } from 'notistack';

const ListadoBeneficiarios = () => {
    const [beneficiarios, setBeneficiarios] = useState([]);
    const [lineasTrabajo, setLineasTrabajo] = useState({});
    const [beneficiarioSeleccionado, setBeneficiarioSeleccionado] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openDetallesDialog, setOpenDetallesDialog] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalBeneficiarios, setTotalBeneficiarios] = useState(0);
    const [filtro, setFiltro] = useState('');
    const [openExportDialog, setOpenExportDialog] = useState(false);
    const [tipoExportacion, setTipoExportacion] = useState('todos');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
 
    const { enqueueSnackbar } = useSnackbar();
    const [loadingOverlay, setLoadingOverlay] = useState(false);
    const [loadingExport, setLoadingExport] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    useEffect(() => {
        const cargarDatos = async () => {
            setLoadingOverlay(true);
            try {
                const { data: beneficiariosData, total } = await beneficiarioService.listarBeneficiariosAdmin(
                    page + 1, 
                    rowsPerPage,
                    filtro
                );

                const lineasTrabajoData = await usuarioService.obtenerLineasTrabajo();
                
                // Convertir líneas de trabajo a objeto para búsqueda rápida
                const lineasTrabajoMap = lineasTrabajoData.reduce((acc, linea) => {
                    acc[linea.id] = linea.nombre;
                    return acc;
                }, {});

                // Mapear beneficiarios para asegurar campos
                const beneficiariosFormateados = beneficiariosData.map(beneficiario => ({
                    ...beneficiario,
                    nombre: beneficiario.nombre_completo,
                    identificacion: beneficiario.numero_documento,
                    lineaTrabajo: beneficiario.linea_trabajo
                }));

                setBeneficiarios(beneficiariosFormateados);
                setLineasTrabajo(lineasTrabajoMap);
                setTotalBeneficiarios(total);
            } catch (error) {
                enqueueSnackbar('Error al cargar beneficiarios', { variant: 'error' });
            } finally {
                setLoadingOverlay(false);
            }
        };

        cargarDatos();
    }, [page, rowsPerPage, filtro, enqueueSnackbar]);

    const handleEliminar = async () => {
        try {
            await beneficiarioService.eliminarBeneficiario(beneficiarioSeleccionado._id);
            setOpenConfirmDialog(false);
            // Recargar datos después de eliminar
            const { data: beneficiariosData, total } = await beneficiarioService.listarBeneficiariosAdmin(
                page + 1, 
                rowsPerPage,
                filtro
            );
            
            // Formatear beneficiarios nuevamente
            const beneficiariosFormateados = beneficiariosData.map(beneficiario => ({
                ...beneficiario,
                nombre: beneficiario.nombre_completo,
                identificacion: beneficiario.numero_documento,
                lineaTrabajo: beneficiario.linea_trabajo
            }));

            setBeneficiarios(beneficiariosFormateados);
            setTotalBeneficiarios(total);
        } catch (error) {
            console.error('Error al eliminar beneficiario:', error);
        }
    };

    const confirmarEliminacion = (beneficiario) => {
        setBeneficiarioSeleccionado(beneficiario);
        setOpenConfirmDialog(true);
    };

    const mostrarDetalles = (beneficiario) => {
        setBeneficiarioSeleccionado(beneficiario);
        setOpenDetallesDialog(true);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFiltroChange = (event) => {
        setFiltro(event.target.value);
        setPage(0);
    };

    const handleExportarClick = () => {
        setOpenExportDialog(true);
    };

    const handleExportarConfirmar = async () => {
        setLoadingExport(true);
        setExportProgress(0);
        try {
            if (tipoExportacion === 'rango' && (!fechaInicio || !fechaFin)) {
                enqueueSnackbar('Debe seleccionar ambas fechas', { variant: 'warning' });
                setLoadingExport(false);
                return;
            }
            setExportProgress(15);
            // Obtener datos según tipo de exportación
           
            let beneficiariosExportar = [];
            if (tipoExportacion === 'todos') {
                // Obtener TODOS los beneficiarios (sin paginación)
                const { data } = await beneficiarioService.listarBeneficiariosAdmin(1, 1000000000, filtro); // ajustar 10000 si hay más
                beneficiariosExportar = data;
               
            } else if (tipoExportacion === 'rango') {
               
                // Obtener beneficiarios por rango de fechas
                const { data } = await beneficiarioService.listarBeneficiariosPorRango({
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin,
                    filtro
                });
              
                beneficiariosExportar = data;
            }
            setExportProgress(70);
            if (!beneficiariosExportar || beneficiariosExportar.length === 0) {
                enqueueSnackbar('No hay datos para exportar en el rango seleccionado.', { variant: 'info' });
                setLoadingExport(false);
                setExportProgress(0);
                return;
            }
            // Formatear datos para Excel (puedes personalizar columnas aquí)
            const beneficiariosFormateados = beneficiariosExportar.map(b => ({
                Nombre: b.nombre_completo,
                Identificación: b.numero_documento,
                'Tipo Documento': b.tipo_documento,
                Género: b.genero,
                'Fecha Registro': b.fecha_registro,
               
                Comuna: b.comuna,
                Barrio: b.barrio,
                'Correo Electrónico': b.correo_electronico,
                'Número Celular': b.numero_celular,
                'Nivel Educativo': b.nivel_educativo,
                'Situación Laboral': b.situacion_laboral,
                'Ayuda Humanitaria': b.ayuda_humanitaria ? 'Sí' : 'No',
                'Estudia Actualmente': b.estudia_actualmente ? 'Sí' : 'No',
                'Sabe Leer': b.sabe_leer ? 'Sí' : 'No',
                'Sabe Escribir': b.sabe_escribir ? 'Sí' : 'No',
                'Tiene Discapacidad': b.tiene_discapacidad ? 'Sí' : 'No',
                'Víctima de Conflicto': b.victima_conflicto ? 'Sí' : 'No',
            }));
            setExportProgress(90);
            await exportarListadoBeneficiariosAExcel({ beneficiarios: beneficiariosFormateados });
            setExportProgress(100);
            enqueueSnackbar('Exportación exitosa', { variant: 'success' });
            setTimeout(() => {
                setOpenExportDialog(false);
            }, 500);
        } catch (error) {
            enqueueSnackbar('Error al exportar beneficiarios', { variant: 'error' });
        } finally {
            setTimeout(() => {
                setLoadingExport(false);
                setExportProgress(0);
            }, 800);
        }
    };

    const renderDetallesBeneficiario = () => {
        if (!beneficiarioSeleccionado) return null;

        const detalles = [
            { label: 'Nombre Completo', value: beneficiarioSeleccionado.nombre_completo },
            { label: 'Tipo de Documento', value: beneficiarioSeleccionado.tipo_documento },
            { label: 'Número de Documento', value: beneficiarioSeleccionado.numero_documento },
            { label: 'Género', value: beneficiarioSeleccionado.genero },
            { label: 'Fecha de Registro', value: beneficiarioSeleccionado.fecha_registro },
            { label: 'Línea de Trabajo', value: lineasTrabajo[beneficiarioSeleccionado.linea_trabajo] },
            { label: 'Comuna', value: beneficiarioSeleccionado.comuna },
            { label: 'Barrio', value: beneficiarioSeleccionado.barrio },
            { label: 'Correo Electrónico', value: beneficiarioSeleccionado.correo_electronico },
            { label: 'Número de Celular', value: beneficiarioSeleccionado.numero_celular },
            { label: 'Nivel Educativo', value: beneficiarioSeleccionado.nivel_educativo },
            { label: 'Situación Laboral', value: beneficiarioSeleccionado.situacion_laboral },
        ];

        const chipDetalles = [
            { label: 'Ayuda Humanitaria', value: beneficiarioSeleccionado.ayuda_humanitaria ? 'Sí' : 'No' },
            { label: 'Estudia Actualmente', value: beneficiarioSeleccionado.estudia_actualmente ? 'Sí' : 'No' },
            { label: 'Sabe Leer', value: beneficiarioSeleccionado.sabe_leer ? 'Sí' : 'No' },
            { label: 'Sabe Escribir', value: beneficiarioSeleccionado.sabe_escribir ? 'Sí' : 'No' },
            { label: 'Tiene Discapacidad', value: beneficiarioSeleccionado.tiene_discapacidad ? 'Sí' : 'No' },
            { label: 'Víctima de Conflicto', value: beneficiarioSeleccionado.victima_conflicto ? 'Sí' : 'No' },
        ];

        return (
            <Grid container spacing={2}>
                {detalles.map((detalle, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                        <Typography variant="body2">
                            <strong>{detalle.label}:</strong> {detalle.value || 'No especificado'}
                        </Typography>
                    </Grid>
                ))}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                        Detalles Adicionales
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {chipDetalles.map((chip, index) => (
                            <Chip 
                                key={index} 
                                label={`${chip.label}: ${chip.value}`} 
                                color={chip.value === 'Sí' ? 'primary' : 'default'}
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </Grid>
            </Grid>
        );
    };

    return (
        <Box sx={{ position: 'relative', minHeight: '100vh' }}>
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
            {loadingExport && (
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    zIndex: 3000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress size={100} thickness={5} value={exportProgress} variant="determinate" color="secondary" />
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
                            <Typography variant="h5" component="div" color="white">
                                {`${Math.round(exportProgress)}%`}
                            </Typography>
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
                <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Buscar persona"
                    value={filtro}
                    onChange={handleFiltroChange}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                />
                <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<ExportIcon />}
                    onClick={handleExportarClick}
                >
                    Exportar
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Identificación</TableCell>
                            <TableCell>Línea de Trabajo</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {beneficiarios.map((beneficiario) => (
                            <TableRow key={beneficiario._id}>
                                <TableCell>{beneficiario.nombre}</TableCell>
                                <TableCell>{beneficiario.identificacion}</TableCell>
                                <TableCell>
                                    {lineasTrabajo[beneficiario.lineaTrabajo] || 'Sin línea'}
                                </TableCell>
                                <TableCell>
                                    <IconButton 
                                        color="primary" 
                                        onClick={() => mostrarDetalles(beneficiario)}
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                    <IconButton 
                                        color="error" 
                                        onClick={() => confirmarEliminacion(beneficiario)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalBeneficiarios}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            <Dialog
                open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)}
            >
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    ¿Está seguro que desea eliminar al beneficiario {beneficiarioSeleccionado?.nombre}?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleEliminar} color="error">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openDetallesDialog}
                onClose={() => setOpenDetallesDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Detalles del Beneficiario</DialogTitle>
                <DialogContent>
                    {beneficiarioSeleccionado && renderDetallesBeneficiario()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetallesDialog(false)} color="primary">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)}>
                <DialogTitle>Exportar Registros</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                        <InputLabel>Tipo de Exportación</InputLabel>
                        <Select
                            value={tipoExportacion}
                            label="Tipo de Exportación"
                            onChange={(e) => setTipoExportacion(e.target.value)}
                        >
                            <MenuItem value="todos">Todos los Registros</MenuItem>
                            <MenuItem value="rango">Rango de Fechas</MenuItem>
                        </Select>
                    </FormControl>

                    {tipoExportacion === 'rango' && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Fecha Inicio"
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                            <TextField
                                label="Fecha Fin"
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenExportDialog(false)}>Cancelar</Button>
                    <Button 
                        onClick={handleExportarConfirmar} 
                        color="success" 
                        variant="contained"
                        disabled={tipoExportacion === 'rango' && (!fechaInicio || !fechaFin)}
                    >
                        Exportar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ListadoBeneficiarios;
