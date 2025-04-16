import React, { useState, useEffect } from 'react';
import { 
    Container, 
    Typography, 
    Grid, 
    TextField, 
    Button, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    FormControlLabel, 
    Checkbox, 
    Switch,
    Paper
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import lineaTrabajoService from '../../services/lineaTrabajoService';
import { 
    crearBeneficiario, 
    actualizarBeneficiario,
    verificarDocumentoUnico,
    verificarCorreoUnico 
} from '../../services/beneficiarioService';
import { obtenerComunas } from '../../services/comunaService';

// Constantes para selección
const TIPOS_DOCUMENTO = ['Cédula', 'Tarjeta de Identidad', 'Pasaporte', 'Registro Civil'];
const GENEROS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];
const RANGOS_EDAD = ['0-12', '13-18', '19-25', '26-35', '36-45', '46-55', '56-65', '66 o más'];
const ETNIAS = ['Mestizo', 'Indígena', 'Afrodescendiente', 'Otro'];
const TIPOS_DISCAPACIDAD = ['Física', 'Visual', 'Auditiva', 'Cognitiva', 'Múltiple', 'Ninguna'];
const NIVELES_EDUCATIVOS = ['Primaria', 'Secundaria', 'Técnico', 'Tecnólogo', 'Universitario', 'Posgrado', 'Ninguno'];
const SITUACIONES_LABORALES = ['Empleado', 'Desempleado', 'Estudiante', 'Independiente', 'Jubilado'];
const TIPOS_VIVIENDA = ['Propia', 'Arrendada', 'Familiar', 'Compartida'];

// Constantes de validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegistroBeneficiarios() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const [beneficiarios, setBeneficiarios] = useState([]);
    const [comunas, setComunas] = useState([]);
    
    // Valores iniciales con valores por defecto explícitos
    const VALORES_INICIALES = {
        // Datos del funcionario
        funcionario_id: user?.id || '',
        funcionario_nombre: user?.nombre || '',
        linea_trabajo: user?.linea_trabajo || '',
        fecha_registro: new Date().toISOString().split('T')[0],

        // Datos personales
        nombre_completo: '',
        tipo_documento: 'Cédula', // Valor por defecto
        numero_documento: '',
        genero: 'Prefiero no decir', // Valor por defecto
        rango_edad: '26-35', // Valor por defecto
        
        // Habilidades básicas
        sabe_leer: true, // Valor por defecto
        sabe_escribir: true, // Valor por defecto
        
        // Contacto
        numero_celular: '',
        correo_electronico: '',

        // Datos socioculturales
        etnia: 'Ninguna', // Valor por defecto
        comuna: '',
        barrio: 'No especificado', // Valor por defecto
        
        // Discapacidad
        tiene_discapacidad: false, // Valor por defecto
        tipo_discapacidad: '',
        
        // Conflicto armado
        victima_conflicto: false, // Valor por defecto
        
        // Familia
        hijos_a_cargo: 0, // Valor por defecto
        
        // Datos educativos y laborales
        estudia_actualmente: false, // Valor por defecto
        nivel_educativo: 'Ninguno', // Valor por defecto
        situacion_laboral: 'Otro', // Valor por defecto
        tipo_vivienda: 'Otra', // Valor por defecto

        // Ayuda humanitaria
        ayuda_humanitaria: false,
        descripcion_ayuda_humanitaria: ''
    };

    const [formData, setFormData] = useState(VALORES_INICIALES);
    const [nombreLineaTrabajo, setNombreLineaTrabajo] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [beneficiarioId, setBeneficiarioId] = useState(null);

    // Estados de validación
    const [errores, setErrores] = useState({
        numero_documento: '',
        correo_electronico: ''
    });

    // Validar documento único
    const validarDocumentoUnico = async (numero_documento) => {
        try {
            const { existe, msg } = await verificarDocumentoUnico(numero_documento);
            if (existe) {
                setErrores(prev => ({
                    ...prev, 
                    numero_documento: msg
                }));
                return false;
            }
            setErrores(prev => ({
                ...prev, 
                numero_documento: ''
            }));
            return true;
        } catch (error) {
            enqueueSnackbar('Error al verificar documento', { variant: 'error' });
            return false;
        }
    };

    // Validar correo único
    const validarCorreoUnico = async (correo_electronico) => {
        // Solo validar si el correo tiene formato válido
        if (!EMAIL_REGEX.test(correo_electronico)) {
            setErrores(prev => ({
                ...prev, 
                correo_electronico: 'Formato de correo inválido'
            }));
            return false;
        }

        try {
            const { existe, msg } = await verificarCorreoUnico(correo_electronico);
            if (existe) {
                setErrores(prev => ({
                    ...prev, 
                    correo_electronico: msg
                }));
                return false;
            }
            setErrores(prev => ({
                ...prev, 
                correo_electronico: ''
            }));
            return true;
        } catch (error) {
            enqueueSnackbar('Error al verificar correo', { variant: 'error' });
            return false;
        }
    };

    // Modificar handleChange para manejar switches y selects
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Manejar diferentes tipos de inputs
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' || type === 'switch' ? checked : value
        }));
    };

    // Modificar handleSubmit para incluir validaciones
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (modoEdicion) {
                // Obtener el beneficiario actual para comparar
                const beneficiarioActual = location.state?.beneficiario;
                
                // Validaciones individuales para documento y correo
                if (formData.numero_documento !== beneficiarioActual?.numero_documento) {
                    const documentoValido = await validarDocumentoUnico(formData.numero_documento);
                    if (!documentoValido) {
                        return; // Detener si el documento no es válido
                    }
                }

                if (formData.correo_electronico !== beneficiarioActual?.correo_electronico) {
                    const correoValido = formData.correo_electronico 
                        ? await validarCorreoUnico(formData.correo_electronico) 
                        : true;
                    
                    if (!correoValido) {
                        return; // Detener si el correo no es válido
                    }
                }

                // Preparar datos para actualización
                const datosParaEnviar = {
                    // Datos del funcionario
                    funcionario_id: user.id,
                    funcionario_nombre: user.nombre,
                    
                    // Usar linea_trabajo para enviar el ID de línea de trabajo
                    linea_trabajo: user.linea_trabajo,
                    
                    fecha_registro: formData.fecha_registro || new Date().toISOString(),

                    // Datos personales
                    nombre_completo: formData.nombre_completo,
                    tipo_documento: formData.tipo_documento || 'Cédula de ciudadanía',
                    numero_documento: formData.numero_documento,
                    genero: formData.genero || 'Prefiere no decirlo',
                    rango_edad: formData.rango_edad || '29-59',
                    fecha_nacimiento: formData.fecha_nacimiento || null,

                    // Habilidades básicas
                    sabe_leer: formData.sabe_leer !== undefined ? formData.sabe_leer : true,
                    sabe_escribir: formData.sabe_escribir !== undefined ? formData.sabe_escribir : true,

                    // Contacto
                    numero_celular: formData.numero_celular || '',
                    correo_electronico: formData.correo_electronico || '',

                    // Datos socioculturales
                    etnia: formData.etnia || 'Ninguna',
                    comuna: formData.comuna || '',
                    barrio: formData.barrio || 'No especificado',

                    // Discapacidad
                    tiene_discapacidad: formData.tiene_discapacidad !== undefined 
                        ? formData.tiene_discapacidad 
                        : false,
                    tipo_discapacidad: formData.tipo_discapacidad || '',

                    // Conflicto armado
                    victima_conflicto: formData.victima_conflicto !== undefined 
                        ? formData.victima_conflicto 
                        : false,

                    // Familia
                    hijos_a_cargo: formData.hijos_a_cargo !== undefined 
                        ? parseInt(formData.hijos_a_cargo, 10) 
                        : 0,

                    // Datos educativos y laborales
                    estudia_actualmente: formData.estudia_actualmente !== undefined 
                        ? formData.estudia_actualmente 
                        : false,
                    nivel_educativo: formData.nivel_educativo || 'Ninguno',
                    situacion_laboral: formData.situacion_laboral || 'Otro',
                    tipo_vivienda: formData.tipo_vivienda || 'Otra',

                    // Ayuda Humanitaria
                    ayuda_humanitaria: formData.ayuda_humanitaria !== undefined 
                        ? formData.ayuda_humanitaria 
                        : false,
                    descripcion_ayuda_humanitaria: formData.descripcion_ayuda_humanitaria || ''
                };

                // Filtrar datos que realmente han cambiado
                const datosActualizacion = {};
                
                // Función para comparar valores
                const sonValoresIguales = (valorActual, valorNuevo) => {
                    // Manejar casos especiales como booleanos y números
                    if (typeof valorActual === 'boolean' || typeof valorNuevo === 'boolean') {
                        return Boolean(valorActual) === Boolean(valorNuevo);
                    }
                    if (typeof valorActual === 'number' || typeof valorNuevo === 'number') {
                        return Number(valorActual) === Number(valorNuevo);
                    }
                    // Para strings y otros tipos
                    return (valorActual || '') === (valorNuevo || '');
                };

                // Comparar cada campo con el valor actual
                Object.keys(datosParaEnviar).forEach(campo => {
                    // Ignorar campos específicos
                    const camposIgnorar = [
                        'funcionario_id', 
                        'funcionario_nombre', 
                        'linea_trabajo', 
                        'fecha_registro'
                    ];
                    
                    if (camposIgnorar.includes(campo)) return;

                    // Si no hay beneficiario actual, agregar todos los campos
                    if (!beneficiarioActual) {
                        datosActualizacion[campo] = datosParaEnviar[campo];
                        return;
                    }

                    // Comparar valores
                    if (!sonValoresIguales(beneficiarioActual[campo], datosParaEnviar[campo])) {
                        datosActualizacion[campo] = datosParaEnviar[campo];
                    }
                });

                // Solo enviar si hay cambios
                if (Object.keys(datosActualizacion).length === 0) {
                    enqueueSnackbar('No se detectaron cambios', { variant: 'info' });
                    return;
                }

                try {
                    const respuesta = await actualizarBeneficiario(beneficiarioId, datosActualizacion);
                    enqueueSnackbar('Beneficiario actualizado exitosamente', { variant: 'success' });
                    navigate('/funcionario/beneficiarios', { 
                        state: { beneficiarioActualizado: respuesta } 
                    });
                } catch (error) {
                    // Manejar errores específicos de documento o correo
                    if (error.campo === 'numero_documento') {
                        setErrores(prev => ({
                            ...prev, 
                            numero_documento: error.message
                        }));
                    } else if (error.campo === 'correo_electronico') {
                        setErrores(prev => ({
                            ...prev, 
                            correo_electronico: error.message
                        }));
                    } else {
                        enqueueSnackbar('Error al actualizar beneficiario', { variant: 'error' });
                    }
                }
            } else {
                // Preparar datos para envío
                const datosParaEnviar = {
                    // Datos del funcionario
                    funcionario_id: user.id,
                    funcionario_nombre: user.nombre,
                    
                    // Enviar el ID de línea de trabajo como linea_trabajo
                    linea_trabajo: user.linea_trabajo,  // Asumiendo que user.linea_trabajo contiene el ID
                    
                    // Depuración de línea de trabajo
                    _debug_user: JSON.parse(JSON.stringify(user)),
                    
                    fecha_registro: new Date().toISOString(),

                    // Datos personales
                    nombre_completo: formData.nombre_completo,
                    tipo_documento: formData.tipo_documento || 'Cédula de ciudadanía',
                    numero_documento: formData.numero_documento,
                    genero: formData.genero || 'Prefiere no decirlo',
                    rango_edad: formData.rango_edad || '29-59',

                    // Habilidades básicas
                    sabe_leer: formData.sabe_leer !== undefined ? formData.sabe_leer : true,
                    sabe_escribir: formData.sabe_escribir !== undefined ? formData.sabe_escribir : true,

                    // Contacto
                    numero_celular: formData.numero_celular || '',
                    correo_electronico: formData.correo_electronico || '',

                    // Datos socioculturales
                    etnia: formData.etnia || 'Ninguna',
                    comuna: formData.comuna || '',
                    barrio: formData.barrio || 'No especificado',

                    // Discapacidad
                    tiene_discapacidad: formData.tiene_discapacidad !== undefined 
                        ? formData.tiene_discapacidad 
                        : false,
                    tipo_discapacidad: formData.tipo_discapacidad || '',

                    // Conflicto armado
                    victima_conflicto: formData.victima_conflicto !== undefined 
                        ? formData.victima_conflicto 
                        : false,

                    // Familia
                    hijos_a_cargo: formData.hijos_a_cargo !== undefined 
                        ? parseInt(formData.hijos_a_cargo, 10) 
                        : 0,

                    // Datos educativos y laborales
                    estudia_actualmente: formData.estudia_actualmente !== undefined 
                        ? formData.estudia_actualmente 
                        : false,
                    nivel_educativo: formData.nivel_educativo || 'Ninguno',
                    situacion_laboral: formData.situacion_laboral || 'Otro',
                    tipo_vivienda: formData.tipo_vivienda || 'Otra',

                    // Ayuda Humanitaria
                    ayuda_humanitaria: formData.ayuda_humanitaria !== undefined 
                        ? formData.ayuda_humanitaria 
                        : false,
                    descripcion_ayuda_humanitaria: formData.descripcion_ayuda_humanitaria || ''
                };


                const respuesta = await crearBeneficiario(datosParaEnviar);
                
                enqueueSnackbar('Beneficiario registrado exitosamente', { variant: 'success' });
                
                // Actualizar lista de beneficiarios
                const nuevosBeneficiarios = [
                    ...beneficiarios, 
                    { 
                        nombre_completo: datosParaEnviar.nombre_completo,
                        id: respuesta.beneficiario_id 
                    }
                ];
                setBeneficiarios(nuevosBeneficiarios);
                
                // Limpiar formulario
                setFormData({
                    ...VALORES_INICIALES, // Usar valores iniciales
                    funcionario_id: user.id,
                    funcionario_nombre: user.nombre,
                    linea_trabajo: user.linea_trabajo,
                    fecha_registro: new Date().toISOString().split('T')[0]
                });

                // Limpiar errores
                setErrores({
                    numero_documento: '',
                    correo_electronico: ''
                });
            }
        } catch (error) {
            enqueueSnackbar('Error al guardar beneficiario', { variant: 'error' });
        }
    };

    const handleFinalizarRegistro = () => {
        // Navegar a la lista de beneficiarios registrados
        navigate('/funcionario/beneficiarios');
    };

    useEffect(() => {
        const cargarComunas = async () => {
            try {
                const comunasObtenidas = await obtenerComunas();
                if (comunasObtenidas.length === 0) {
                    enqueueSnackbar('No se pudieron cargar las comunas. Intente nuevamente.', { variant: 'warning' });
                }
                setComunas(comunasObtenidas);
            } catch (error) {
                enqueueSnackbar('Error al cargar comunas. Verifique su conexión.', { variant: 'error' });
            }
        };

        const cargarNombreLineaTrabajo = async () => {
            try {
                // Usar directamente el nombre de la línea de trabajo del usuario
                if (user.linea_trabajo) {
                    // Obtener el nombre de la línea de trabajo
                    setNombreLineaTrabajo(user.linea_trabajo_nombre);
                    
                    // Opcional: obtener el ID si es necesario
                    try {
                        const lineaTrabajoId = await lineaTrabajoService.obtenerNombreLineaTrabajo(user.linea_trabajo);
                        setFormData(prevData => ({
                            ...prevData,
                            linea_trabajo: lineaTrabajoId
                        }));
                    } catch (idError) {
                        console.warn('No se pudo obtener el ID de la línea de trabajo:', idError);
                    }
                }
            } catch (error) {
                console.error('Error al cargar línea de trabajo:', error);
            }
        };

        const verificarModoEdicion = () => {
            const state = location.state || {};
            if (state.modoEdicion && state.beneficiario) {
                setModoEdicion(true);
                const beneficiario = state.beneficiario;
                setBeneficiarioId(beneficiario._id);
                
                // Mapear datos del beneficiario al formulario
                setFormData({
                    // Datos del funcionario
                    funcionario_id: user?.id || '',
                    funcionario_nombre: user?.nombre || '',
                    linea_trabajo: user?.linea_trabajo || '',
                    fecha_registro: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD

                    // Datos personales
                    nombre_completo: beneficiario.nombre_completo || '',
                    tipo_documento: beneficiario.tipo_documento || 'Cédula', // Valor por defecto
                    numero_documento: beneficiario.numero_documento || '',
                    genero: beneficiario.genero || 'Prefiero no decir', // Valor por defecto
                    rango_edad: beneficiario.rango_edad || '26-35', // Valor por defecto
                    
                    // Habilidades básicas
                    sabe_leer: beneficiario.sabe_leer || true, // Valor por defecto
                    sabe_escribir: beneficiario.sabe_escribir || true, // Valor por defecto
                    
                    // Contacto
                    numero_celular: beneficiario.numero_celular || '',
                    correo_electronico: beneficiario.correo_electronico || '',

                    // Datos socioculturales
                    etnia: beneficiario.etnia || 'Ninguna', // Valor por defecto
                    comuna: beneficiario.comuna || '',
                    barrio: beneficiario.barrio || 'No especificado', // Valor por defecto
                    
                    // Discapacidad
                    tiene_discapacidad: beneficiario.tiene_discapacidad || false, // Valor por defecto
                    tipo_discapacidad: beneficiario.tipo_discapacidad || '',
                    
                    // Conflicto armado
                    victima_conflicto: beneficiario.victima_conflicto || false, // Valor por defecto
                    
                    // Familia
                    hijos_a_cargo: beneficiario.hijos_a_cargo || 0, // Valor por defecto
                    
                    // Datos educativos y laborales
                    estudia_actualmente: beneficiario.estudia_actualmente || false, // Valor por defecto
                    nivel_educativo: beneficiario.nivel_educativo || 'Ninguno', // Valor por defecto
                    situacion_laboral: beneficiario.situacion_laboral || 'Otro', // Valor por defecto
                    tipo_vivienda: beneficiario.tipo_vivienda || 'Otra', // Valor por defecto

                    // Ayuda humanitaria
                    ayuda_humanitaria: beneficiario.ayuda_humanitaria || false,
                    descripcion_ayuda_humanitaria: beneficiario.descripcion_ayuda_humanitaria || ''
                });
            }
        };

        cargarComunas();
        cargarNombreLineaTrabajo();
        verificarModoEdicion();
    }, [user, enqueueSnackbar, location.state]);

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Información del Funcionario */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Nombre del Funcionario"
                                value={formData.funcionario_nombre}
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Línea de Trabajo"
                                value={nombreLineaTrabajo}
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Fecha de Registro"
                                type="date"
                                name="fecha_registro"
                                value={formData.fecha_registro}
                                onChange={handleChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Typography variant="h5" gutterBottom>
                        Datos del Beneficiario
                    </Typography>
                    <Grid container spacing={3}>
                        {/* Datos Personales */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nombre Completo"
                                name="nombre_completo"
                                value={formData.nombre_completo}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Tipo de Documento</InputLabel>
                                <Select
                                    name="tipo_documento"
                                    value={formData.tipo_documento}
                                    label="Tipo de Documento"
                                    onChange={handleChange}
                                >
                                    {TIPOS_DOCUMENTO.map(tipo => (
                                        <MenuItem key={tipo} value={tipo}>
                                            {tipo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Número de Documento"
                                name="numero_documento"
                                value={formData.numero_documento}
                                onChange={handleChange}
                                onBlur={() => validarDocumentoUnico(formData.numero_documento)}
                                required
                                error={!!errores.numero_documento}
                                helperText={errores.numero_documento}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Género</InputLabel>
                                <Select
                                    name="genero"
                                    value={formData.genero}
                                    label="Género"
                                    onChange={handleChange}
                                >
                                    {GENEROS.map(genero => (
                                        <MenuItem key={genero} value={genero}>
                                            {genero}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Rango de Edad</InputLabel>
                                <Select
                                    name="rango_edad"
                                    value={formData.rango_edad}
                                    label="Rango de Edad"
                                    onChange={handleChange}
                                >
                                    {RANGOS_EDAD.map(rango => (
                                        <MenuItem key={rango} value={rango}>
                                            {rango}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Habilidades Básicas */}
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="sabe_leer"
                                        checked={formData.sabe_leer}
                                        onChange={handleChange}
                                    />
                                }
                                label="Sabe Leer"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="sabe_escribir"
                                        checked={formData.sabe_escribir}
                                        onChange={handleChange}
                                    />
                                }
                                label="Sabe Escribir"
                            />
                        </Grid>

                        {/* Contacto */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Número de Celular"
                                name="numero_celular"
                                value={formData.numero_celular}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Correo Electrónico"
                                name="correo_electronico"
                                type="email"
                                value={formData.correo_electronico}
                                onChange={handleChange}
                                onBlur={() => validarCorreoUnico(formData.correo_electronico)}
                                error={!!errores.correo_electronico}
                                helperText={errores.correo_electronico}
                            />
                        </Grid>

                        {/* Datos Socioculturales */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Etnia</InputLabel>
                                <Select
                                    name="etnia"
                                    value={formData.etnia}
                                    label="Etnia"
                                    onChange={handleChange}
                                >
                                    {ETNIAS.map(etnia => (
                                        <MenuItem key={etnia} value={etnia}>
                                            {etnia}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Comuna</InputLabel>
                                <Select
                                    name="comuna"
                                    value={formData.comuna}
                                    label="Comuna"
                                    onChange={handleChange}
                                >
                                    {comunas.map(comuna => (
                                        <MenuItem key={comuna.id} value={comuna.nombre}>
                                            {comuna.nombre} - {comuna.zona}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Barrio"
                                name="barrio"
                                value={formData.barrio}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        {/* Discapacidad */}
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="tiene_discapacidad"
                                        checked={formData.tiene_discapacidad}
                                        onChange={handleChange}
                                    />
                                }
                                label="Tiene Discapacidad"
                            />
                            {formData.tiene_discapacidad && (
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Tipo de Discapacidad</InputLabel>
                                        <Select
                                            name="tipo_discapacidad"
                                            value={formData.tipo_discapacidad}
                                            label="Tipo de Discapacidad"
                                            onChange={handleChange}
                                        >
                                            {TIPOS_DISCAPACIDAD.map(tipo => (
                                                <MenuItem key={tipo} value={tipo}>
                                                    {tipo}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}
                        </Grid>

                        {/* Conflicto Armado */}
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="victima_conflicto"
                                        checked={formData.victima_conflicto}
                                        onChange={handleChange}
                                    />
                                }
                                label="Víctima del Conflicto Armado"
                            />
                        </Grid>

                        {/* Familia */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Hijos a Cargo"
                                name="hijos_a_cargo"
                                type="number"
                                value={formData.hijos_a_cargo}
                                onChange={handleChange}
                                inputProps={{ min: 0 }}
                            />
                        </Grid>

                        {/* Datos Educativos y Laborales */}
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="estudia_actualmente"
                                        checked={formData.estudia_actualmente}
                                        onChange={handleChange}
                                    />
                                }
                                label="Estudia Actualmente"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Nivel Educativo</InputLabel>
                                <Select
                                    name="nivel_educativo"
                                    value={formData.nivel_educativo}
                                    label="Nivel Educativo"
                                    onChange={handleChange}
                                >
                                    {NIVELES_EDUCATIVOS.map(nivel => (
                                        <MenuItem key={nivel} value={nivel}>
                                            {nivel}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Situación Laboral</InputLabel>
                                <Select
                                    name="situacion_laboral"
                                    value={formData.situacion_laboral}
                                    label="Situación Laboral"
                                    onChange={handleChange}
                                >
                                    {SITUACIONES_LABORALES.map(situacion => (
                                        <MenuItem key={situacion} value={situacion}>
                                            {situacion}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Tipo de Vivienda</InputLabel>
                                <Select
                                    name="tipo_vivienda"
                                    value={formData.tipo_vivienda}
                                    label="Tipo de Vivienda"
                                    onChange={handleChange}
                                >
                                    {TIPOS_VIVIENDA.map(tipo => (
                                        <MenuItem key={tipo} value={tipo}>
                                            {tipo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Ayuda Humanitaria */}
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="ayuda_humanitaria"
                                        checked={formData.ayuda_humanitaria}
                                        onChange={handleChange}
                                    />
                                }
                                label="Recibe Ayuda Humanitaria"
                            />
                            {formData.ayuda_humanitaria && (
                                <TextField
                                    fullWidth
                                    label="Descripción de la Ayuda Humanitaria"
                                    name="descripcion_ayuda_humanitaria"
                                    value={formData.descripcion_ayuda_humanitaria}
                                    onChange={handleChange}
                                />
                            )}
                        </Grid>

                        {/* Botones de Acción */}
                        <Grid item xs={12} container spacing={2}>
                            <Grid item xs={6}>
                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    color="primary" 
                                    fullWidth
                                >
                                    {modoEdicion ? 'Actualizar Persona' : 'Guardar Registro'}
                                </Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button 
                                    variant="outlined" 
                                    color="secondary" 
                                    fullWidth
                                    onClick={handleFinalizarRegistro}
                                >
                                    Finalizar Registro
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </form>

                {/* Lista de Beneficiarios Registrados */}
                {beneficiarios.length > 0 && (
                    <Paper elevation={2} sx={{ mt: 4, p: 2 }}>
                        <Typography variant="h6">Beneficiarios Registrados</Typography>
                        {beneficiarios.map((beneficiario, index) => (
                            <Typography key={index} variant="body2">
                                {beneficiario.nombre_completo}
                            </Typography>
                        ))}
                    </Paper>
                )}
            </Paper>
        </Container>
    );
}
