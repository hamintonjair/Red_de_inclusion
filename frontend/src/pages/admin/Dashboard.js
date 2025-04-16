// Modificación para Dashboard.js
import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
    Grid, 
    Typography, 
    Box, 
    Card, 
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,   
} from '@mui/material';

// Importaciones de iconos
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import GroupAdd from '@mui/icons-material/GroupAdd';
import FamilyRestroom from '@mui/icons-material/FamilyRestroom';
import House from '@mui/icons-material/House';
import Download from '@mui/icons-material/Download';
import {
    Accessibility,
    ChildCare,
    School,
    PersonSearch,
    People,
    Work
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import usuarioService from '../../services/usuarioService';
import estadisticasService from '../../services/estadisticasService';
import funcionarioService from '../../services/funcionarioService';

import { PieChart, LineChart, Pie, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true); // 2. Estado para controlar la carga
    const [stats, setStats] = useState({
        totalFuncionarios: 0,
        totalLineasTrabajo: 0,
        totalBeneficiarios: 0
    });

    const [estadisticasBeneficiarios, setEstadisticasBeneficiarios] = useState({
        total_beneficiarios: 0,
        total_victimas: 0,
        total_discapacidad: 0,
        total_ayuda_humanitaria: 0,
        total_menores_13: 0,
        total_13_25: 0,
        total_mayores_25: 0,
        total_alfabetizados: 0,
        total_analfabetas: 0,
        total_mujeres_menores_con_hijos: 0
    });

    const [estadisticasGlobales, setEstadisticasGlobales] = useState({
        total_comunas: {},
        menores_estudian: 0,
        beneficiarios_trabajan: 0,
        vivienda_propia: 0,
        vivienda_arrendada: 0,
        vivienda_familiar: 0,
        vivienda_compartida: 0
    });

    const [openExportDialog, setOpenExportDialog] = useState(false);
    const [datosGraficos, setDatosGraficos] = useState({});
    const [mostrarGraficos, setMostrarGraficos] = useState(false);
    const [loadingExportGraph, setLoadingExportGraph] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    // Añadimos un estado para los datos mensuales
    const [datosMensuales, setDatosMensuales] = useState([]);
    // Paleta de colores más vivos
    const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33F7', '#F7FF33', '#33FFF7', '#7D33FF', '#FF7D33'];

    // Paletas de colores específicas para cada gráfico (tonos más oscuros y contrastantes)
    const COLORS_VICTIMAS = ['#b71c1c', '#e53935']; // rojos intensos
    const COLORS_DISCAPACIDAD = ['#1b5e20', '#388e3c']; // verdes intensos
    const COLORS_AYUDA = ['#ff8f00', '#ffb300']; // amarillos/naranja fuertes
    const COLORS_ALFABETIZACION = ['#1a237e', '#3949ab']; // azules oscuros
    const COLORS_MUJERES_HIJOS = ['#4a148c', '#8e24aa']; // morados intensos
    const COLORS_LABORAL = ['#006064', '#00838f']; // cian oscuros

    // Paleta de colores oscuros para comunas (única y diferente a las demás)
    const COLORS_COMUNAS = [
        '#ad1457', '#6a1b9a', '#283593', '#1565c0', '#00838f', '#00695c', '#2e7d32', '#558b2f', '#f9a825',
        '#ef6c00', '#d84315', '#4e342e', '#424242', '#263238', '#212121', '#b71c1c', '#ff6f00', '#00bfae', '#3949ab'
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true); // 3. Activar carga al inicio

                const funcionarios = await funcionarioService.obtenerFuncionarios();
                const lineasTrabajoCount = await usuarioService.obtenerLineasTrabajo();

                let estadisticasBeneficiarios = {};
                let estadisticasMensuales = [];

                try {
                    estadisticasBeneficiarios = await estadisticasService.obtenerEstadisticasGlobalesAdmin();
                } catch (error) {
                    console.error('Error al obtener estadísticas globales admin:', error);
                }

                // Obtener datos mensuales
                try {
                    estadisticasMensuales = await estadisticasService.obtenerEstadisticasMensuales();
                    // CORRECCIÓN: Si la API devuelve null o undefined, usar []
                    if (!estadisticasMensuales) estadisticasMensuales = [];
                    const datosMensualesTransformados = Array.isArray(estadisticasMensuales)
    ? estadisticasMensuales.map(item => ({
        name: item.mes || item.nombre || item.label || '',
        beneficiarios: item.cantidad ?? item.total ?? item.value ?? 0
    }))
    : [];
setDatosMensuales(datosMensualesTransformados);
                } catch (error) {
                    setDatosMensuales([]);
                    console.error('Error al obtener estadísticas mensuales:', error);
                }

                setStats({
                    totalFuncionarios: funcionarios.length,
                    totalLineasTrabajo: lineasTrabajoCount.length,
                    totalBeneficiarios: estadisticasBeneficiarios.total_beneficiarios
                });

                setEstadisticasBeneficiarios(estadisticasBeneficiarios);
                setEstadisticasGlobales(estadisticasBeneficiarios);
                
                // Procesar datos para gráficos
                procesarDatosGraficos(estadisticasBeneficiarios);
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            }finally {
                setLoading(false); // 4. Desactivar carga al finalizar (éxito o error)
            }
        };
        fetchStats();
    }, []);

    // Función para procesar datos y crear estructura para gráficos
    const procesarDatosGraficos = (datos) => {
        const totalBeneficiarios = datos.total_beneficiarios || 0;
        
        // Crear datos procesados para cada categoría
        const datosVictimas = [
            { name: 'Son víctimas', value: datos.total_victimas || 0 },
            { name: 'No son víctimas', value: totalBeneficiarios - (datos.total_victimas || 0) }
        ];
        
        const datosDiscapacidad = [
            { name: 'Con discapacidad', value: datos.total_discapacidad || 0 },
            { name: 'Sin discapacidad', value: totalBeneficiarios - (datos.total_discapacidad || 0) }
        ];
        
        const datosAyudaHumanitaria = [
            { name: 'Recibieron ayuda', value: datos.total_ayuda_humanitaria || 0 },
            { name: 'No recibieron', value: totalBeneficiarios - (datos.total_ayuda_humanitaria || 0) }
        ];
        
        const datosEdad = [
            { name: 'Menores de 13', value: datos.total_menores_13 || 0 },
            { name: 'Entre 13 y 25', value: datos.total_13_25 || 0 },
            { name: 'Mayores de 25', value: datos.total_mayores_25 || 0 }
        ];
        
        const datosAlfabetizacion = [
            { name: 'Alfabeta', value: datos.total_alfabetizados || 0 },
            { name: 'Analfabetas', value: datos.total_analfabetas || 0 }
        ];
        
        const datosMujeresMenores = [
            { name: 'Con hijos', value: datos.total_mujeres_menores_con_hijos || 0 },
            { name: 'No tiene', value: totalBeneficiarios - (datos.total_mujeres_menores_con_hijos || 0) }
        ];
        
        const datosEstudian = [
            { name: 'Estudian', value: datos.menores_estudian || 0 },
            { name: 'No estudian', value: totalBeneficiarios - (datos.menores_estudian || 0) }
        ];
        
        const datosTrabajo = [
            { name: 'Trabajan', value: datos.beneficiarios_trabajan || 0 },
            { name: 'No trabajan', value: totalBeneficiarios - (datos.beneficiarios_trabajan || 0) }
        ];
        
        const datosVivienda = [
            { name: 'Propia', value: datos.vivienda_propia || 0 },
            { name: 'Arrendada', value: datos.vivienda_arrendada || 0 },
            { name: 'Familiar', value: datos.vivienda_familiar || 0 },
            { name: 'Compartida', value: datos.vivienda_compartida || 0 }
        ];
        
        // Procesar datos de comunas
        const datosComunas = Object.entries(datos.total_comunas || {}).map(([nombre, cantidad]) => ({
            name: nombre,
            value: cantidad
        }));

        setDatosGraficos({
            victimas: datosVictimas,
            discapacidad: datosDiscapacidad,
            ayudaHumanitaria: datosAyudaHumanitaria,
            edad: datosEdad,
            alfabetizacion: datosAlfabetizacion,
            mujeresMenores: datosMujeresMenores,
            estudian: datosEstudian,
            trabajo: datosTrabajo,
            vivienda: datosVivienda,

            comunas: datosComunas
        });
        
        setMostrarGraficos(true);
    };

    // Handler para exportar TODAS las gráficas (como antes, pero con loader centrado)
    const handleExportarGrafica = async () => {
        setLoadingExportGraph(true);
        setExportProgress(0);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const graficosContainer = document.getElementById('graficos-container');
            const graficos = graficosContainer.querySelectorAll('.grafico-card');
            for (let i = 0; i < graficos.length; i += 2) {
                setExportProgress(Math.round((i / graficos.length) * 100));
                if (i > 0) pdf.addPage();
                // Primer gráfico (arriba)
                const canvas1 = await html2canvas(graficos[i]);
                const imgData1 = canvas1.toDataURL('image/png');
                const imgProps1 = pdf.getImageProperties(imgData1);
                const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
                const pdfHeight = (pdf.internal.pageSize.getHeight() / 2) - 20;
                const imgHeight1 = (imgProps1.height * pdfWidth) / imgProps1.width;
                const finalHeight1 = Math.min(imgHeight1, pdfHeight);
                pdf.addImage(imgData1, 'PNG', 10, 10, pdfWidth, finalHeight1);
                // Segundo gráfico (abajo) si existe
                if (i + 1 < graficos.length) {
                    const canvas2 = await html2canvas(graficos[i + 1]);
                    const imgData2 = canvas2.toDataURL('image/png');
                    const imgProps2 = pdf.getImageProperties(imgData2);
                    const imgHeight2 = (imgProps2.height * pdfWidth) / imgProps2.width;
                    const finalHeight2 = Math.min(imgHeight2, pdfHeight);
                    pdf.addImage(imgData2, 'PNG', 10, pdfHeight + 15, pdfWidth, finalHeight2);
                }
                // Pie de página
                pdf.setFontSize(10);
                pdf.text(`Página ${Math.floor(i / 2) + 1}`, pdf.internal.pageSize.getWidth() - 20, pdf.internal.pageSize.getHeight() - 10);
            }
            setExportProgress(100);
            pdf.save('graficos_dashboard.pdf');
            enqueueSnackbar('Gráficas exportadas con éxito', { variant: 'success' });
            setOpenExportDialog(false);
        } catch (error) {
            enqueueSnackbar('Error al exportar gráficas', { variant: 'error' });
        } finally {
            setTimeout(() => {
                setLoadingExportGraph(false);
                setExportProgress(0);
            }, 600);
        }
    };

    // Función para renderizar gráficos con porcentaje y cantidad
    const renderPieChart = (data, title, colors) => {
        // Calcular total para mostrar valores absolutos
        const total = data.reduce((sum, item) => sum + item.value, 0);
        
        return (
            <Grid item xs={12} md={6} className="grafico-card">
                <Card elevation={3} sx={{ height: 350, p: 2, width: '100%', maxWidth: 550, mx: 'auto' }}>
                    <Typography variant="h6" gutterBottom>{title} (Total: {total})</Typography>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie
    data={data}
    cx="50%"
    cy="50%"
    labelLine={false}
    outerRadius={80}
    label={({ percent, cx, cy, midAngle, outerRadius } = {}) => {
        // Calcula una posición más cercana al centro
        const RADIAN = Math.PI / 180;
        const radius = outerRadius - 20; // 20px más cerca del centro
        const xPos = cx + radius * Math.cos(-midAngle * RADIAN);
        const yPos = cy + radius * Math.sin(-midAngle * RADIAN);
        const percentage = (percent * 100).toFixed(1);
        return (
            <text x={xPos} y={yPos} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13}>
                {`${percentage}%`}
            </text>
        );
    }}
    fill="#8884d8"
    dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value, name) => [
                                    `${value} (${((value / total) * 100).toFixed(1)}%)`,
                                    name
                                ]}
                            />
                            <Legend 
                                formatter={(value, entry, index) => {
                                    const item = data[index];
                                    const percentage = ((item.value / total) * 100).toFixed(1);
                                    return `${value}: ${item.value} (${percentage}%)`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </Grid>
        );
    };


    const renderTarjetaEstadistica = (titulo, valor, icono, color = 'primary') => (
        <Grid item xs={12} md={4}>
            <Card elevation={3}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h6" color="textSecondary">
                                {titulo}
                            </Typography>
                            <Typography variant="h4" color={color}>
                                {valor}
                            </Typography>
                        </Box>
                        {icono}
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );

    return (
        <Box sx={{ position: 'relative', minHeight: '100vh' }}>
            {/* Overlay de carga circular centrada con porcentaje */}
            {loading && (
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
            {loadingExportGraph && (
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
                            <Typography variant="h5" component="div" color="white">{`${exportProgress}%`}</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
            <Box>
                <Typography variant="h5" gutterBottom>
                    Dashboard Administrativo
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<Download />}
                    onClick={() => setOpenExportDialog(true)}
                    sx={{ my: 2 }}
                    disabled={loadingExportGraph}
                >
                    Exportar Estadísticas
                </Button>
            </Box>
            
            <Grid container spacing={3} sx={{ marginBottom: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h6" color="textSecondary">
                                        Funcionarios
                                    </Typography>
                                    <Typography variant="h4" color="primary">
                                        {stats.totalFuncionarios}
                                    </Typography>
                                </Box>
                                <People color="primary" sx={{ fontSize: 50 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h6" color="textSecondary">
                                        Líneas de Trabajo
                                    </Typography>
                                    <Typography variant="h4" color="error">
                                        {stats.totalLineasTrabajo}
                                    </Typography>
                                </Box>
                                <AssessmentOutlined color="error" sx={{ fontSize: 50 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h6" color="textSecondary">
                                        Total Registros
                                    </Typography>
                                    <Typography variant="h4" color="success">
                                        {stats.totalBeneficiarios}
                                    </Typography>
                                </Box>
                                <GroupAdd color="success" sx={{ fontSize: 50 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Typography variant="h5" gutterBottom sx={{ marginTop: 3 }}>
                Estadísticas de Registros
            </Typography>
            
            <Grid container spacing={3}>
                {renderTarjetaEstadistica(
                    'Total Víctimas de Conflicto', 
                    estadisticasBeneficiarios.total_victimas, 
                    <PersonSearch color="warning" sx={{ fontSize: 50 }} />,
                    "warning"
                )}
                {renderTarjetaEstadistica(
                    'Con Discapacidad', 
                    estadisticasBeneficiarios.total_discapacidad, 
                    <Accessibility color="secondary" sx={{ fontSize: 50 }} />,
                    "secondary"
                )}
                {renderTarjetaEstadistica(
                    'Ayuda Humanitaria', 
                    estadisticasBeneficiarios.total_ayuda_humanitaria, 
                    <ChildCare color="success" sx={{ fontSize: 50 }} />,
                    "success"
                )}
                {renderTarjetaEstadistica(
                    'Menores de 13', 
                    estadisticasBeneficiarios.total_menores_13, 
                    <ChildCare color="info" sx={{ fontSize: 50 }} />,
                    "info"
                )}
                {renderTarjetaEstadistica(
                    'Entre 13 y 25', 
                    estadisticasBeneficiarios.total_13_25, 
                    <School color="info" sx={{ fontSize: 50 }} />,
                    "info"
                )}
                {renderTarjetaEstadistica(
                    'Mayores de 25', 
                    estadisticasBeneficiarios.total_mayores_25, 
                    <School color="secondary" sx={{ fontSize: 50 }} />,
                    "secondary"
                )}
                {renderTarjetaEstadistica(
                    'Alfabetizados', 
                    estadisticasBeneficiarios.total_alfabetizados, 
                    <School color="primary" sx={{ fontSize: 50 }} />,
                    "primary"
                )}
                {renderTarjetaEstadistica(
                    'Analfabetas', 
                    estadisticasBeneficiarios.total_analfabetas, 
                    <School color="error" sx={{ fontSize: 50 }} />,
                    "error"
                )}
                {renderTarjetaEstadistica(
                    'Mujeres Menores con Hijos', 
                    estadisticasBeneficiarios.total_mujeres_menores_con_hijos, 
                    <ChildCare color="warning" sx={{ fontSize: 50 }} />,
                    "warning"
                )}
            </Grid>

            <Typography variant="h5" gutterBottom sx={{ marginTop: 3 }}>
                Estadísticas Globales
            </Typography>
            
            <Grid container spacing={3}>
                {renderTarjetaEstadistica(
                    'Menores Estudiando', 
                    estadisticasGlobales.menores_estudian, 
                    <School color="primary" sx={{ fontSize: 50 }} />,
                    "primary"
                )}
                {renderTarjetaEstadistica(
                    'Beneficiarios Trabajando', 
                    estadisticasGlobales.beneficiarios_trabajan, 
                    <Work color="secondary" sx={{ fontSize: 50 }} />,
                    "secondary"
                )}
                {renderTarjetaEstadistica(
                    'Vivienda Propia', 
                    estadisticasGlobales.vivienda_propia, 
                    <House color="success" sx={{ fontSize: 50 }} />,
                    "success"
                )}
                {renderTarjetaEstadistica(
                    'Vivienda Arrendada', 
                    estadisticasGlobales.vivienda_arrendada, 
                    <House color="warning" sx={{ fontSize: 50 }} />,
                    "warning"
                )}
                {renderTarjetaEstadistica(
                    'Vivienda Familiar', 
                    estadisticasGlobales.vivienda_familiar, 
                    <FamilyRestroom color="info" sx={{ fontSize: 50 }} />,
                    "info"
                )}
                {renderTarjetaEstadistica(
                    'Vivienda Compartida', 
                    estadisticasGlobales.vivienda_compartida, 
                    <FamilyRestroom color="error" sx={{ fontSize: 50 }} />,
                    "error"
                )}
            </Grid>

            {mostrarGraficos && (
    <>
        <Typography variant="h5" gutterBottom sx={{ marginTop: 4 }}>
            Gráficos Estadísticos
        </Typography>
        
        <Grid container spacing={3} id="graficos-container">
    {/* Ajuste responsivo: cada gráfica ocupa toda la fila en móvil (xs=12) y media fila en desktop (md=6) */}
            {/* Primera fila de gráficos circulares */}
            {renderPieChart(datosGraficos.victimas, 'Víctimas de Conflicto', COLORS_VICTIMAS)}
            {renderPieChart(datosGraficos.discapacidad, 'Personas con Discapacidad', COLORS_DISCAPACIDAD)}

            {/* Segunda fila de gráficos circulares */}
            {renderPieChart(datosGraficos.ayudaHumanitaria, 'Ayuda Humanitaria', COLORS_AYUDA)}
            {renderPieChart(datosGraficos.alfabetizacion, 'Alfabetización', COLORS_ALFABETIZACION)}

            {/* Tercera fila de gráficos circulares */}
            {renderPieChart(datosGraficos.mujeresMenores, 'Mujeres Menores con Hijos', COLORS_MUJERES_HIJOS)}
            {renderPieChart(datosGraficos.trabajo, 'Situación Laboral', COLORS_LABORAL)}

            {/* Cuarta fila de gráficos circulares */}
            {renderPieChart(datosGraficos.edad, 'Distribución por Edad', COLORS)}
            {renderPieChart(datosGraficos.vivienda, 'Tipo de Vivienda', COLORS)}

            {/* Gráfica de Comunas */}
            <Grid item xs={12} md={6} className="grafico-card">
                <Card elevation={3} sx={{ height: 350, p: 2, width: '100%', maxWidth: 550, mx: 'auto' }}>
                    <Typography variant="h6" gutterBottom>Beneficiarios por Comuna</Typography>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie
                                data={datosGraficos.comunas}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ percent, cx, cy, midAngle, outerRadius }) => {
    // Calcula una posición más cercana al centro
    const RADIAN = Math.PI / 180;
    const radius = outerRadius - 20; // 20px más cerca del centro
    const xPos = cx + radius * Math.cos(-midAngle * RADIAN);
    const yPos = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentage = (percent * 100).toFixed(0);
    return (
        <text x={xPos} y={yPos} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13}>
            {`${percentage}%`}
        </text>
    );
}}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {datosGraficos.comunas && datosGraficos.comunas.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_COMUNAS[index % COLORS_COMUNAS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value, name) => [
                                    `${value} beneficiarios`, 
                                    name
                                ]} 
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </Grid>
            
            {/* Gráfica de crecimiento mensual/anual */}
            {Array.isArray(datosMensuales) && datosMensuales.length > 0 ? (
    <Grid item xs={12} className="grafico-card">
        <Card elevation={3} sx={{ p: 2, width: '100%', maxWidth: 550, mx: 'auto', height: 'auto' }}>
            <Typography variant="h6" gutterBottom>Crecimiento mensual de registros</Typography>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={datosMensuales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
    dataKey="name"
    tickFormatter={(str) => {
        if (!str) return '';
        const [year, month] = str.split("-");
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        if (!year || !month) return str;
        return `${meses[parseInt(month, 10) - 1]} ${year}`;
    }}
/>
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={value => [`${value}`, 'Cantidad']} labelFormatter={label => `Mes: ${label}`}/>
                    <Legend />
                    <Line 
    type="monotone" 
    dataKey="beneficiarios" 
    stroke="#1976d2" 
    strokeWidth={3} 
    dot={{ r: 8, stroke: "#1976d2", strokeWidth: 3, fill: "#fff" }} 
    activeDot={{ r: 12 }} 
/>
                </LineChart>
            </ResponsiveContainer>
        </Card>
    </Grid>
) : (
    <Grid item xs={12} className="grafico-card">
        <Card elevation={3} sx={{ p: 2, width: '100%', maxWidth: 550, mx: 'auto', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <Typography variant="body1" color="text.secondary">
                No hay datos mensuales para mostrar la gráfica.
            </Typography>
        </Card>
    </Grid>
)}
        </Grid>
    </>
)}

<Button 
    variant="contained" 
    color="primary" 
    startIcon={<Download />}
    onClick={() => setOpenExportDialog(true)}
    sx={{ my: 2 }}
    disabled={loadingExportGraph}
>
    Exportar Gráficas
</Button>


<Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)}>
    <DialogTitle>Exportar Gráficas</DialogTitle>
    <DialogContent>
        <Typography variant="body1" gutterBottom>
            Esta opción exportará todas las gráficas estadísticas mostradas en el dashboard
            en formato PDF para su posterior análisis.
        </Typography>
        <Button 
            fullWidth 
            variant="contained" 
            color="primary"
            onClick={handleExportarGrafica}
            sx={{ mt: 2 }}
            disabled={loadingExportGraph}
        >
            Exportar Gráficas a PDF
        </Button>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setOpenExportDialog(false)} color="primary">
            Cancelar
        </Button>
    </DialogActions>
</Dialog>
        </Box>
    );
};

export default Dashboard;