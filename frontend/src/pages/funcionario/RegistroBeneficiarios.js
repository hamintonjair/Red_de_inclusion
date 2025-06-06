import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { biometricService } from "../../services/biometricService";
import FingerprintIcon from '@mui/icons-material/Fingerprint';
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
  FormLabel,
  FormGroup,
  FormHelperText,
  Checkbox,
  Switch,
  Paper,
} from "@mui/material";
import { barriosPorComuna } from "../../data/barriosPorComuna";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSnackbar } from "../../context/SnackbarContext";
import lineaTrabajoService from "../../services/lineaTrabajoService";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CircularProgress from '@mui/material/CircularProgress';
import {
  crearBeneficiario,
  actualizarBeneficiario,
  verificarDocumentoUnico,
  verificarCorreoUnico,
} from "../../services/beneficiarioService";
import { obtenerComunas } from "../../services/comunaService";
import PageLayout from '../../components/layout/PageLayout';

// Valores iniciales para el formulario
const VALORES_INICIALES = {
  // Datos del funcionario
  funcionario_id: "",
  funcionario_nombre: "",
  linea_trabajo: "",
  fecha_registro: "",
  
  // Datos personales
  nombre_completo: "",
  tipo_documento: "Cédula",
  numero_documento: "",
  genero: "Prefiero no decir",
  rango_edad: "26-35",
  etnia: "Ninguna",
  barrio: "",
  otroBarrio: "",
  
  // Habilidades básicas
  sabe_leer: false,
  sabe_escribir: false,
  
  // Contacto
  numero_celular: "",
  correo_electronico: "",
  
  // Datos socioculturales
  comuna: "",
  
  // Discapacidad
  tiene_discapacidad: false,
  tipo_discapacidad: "",
  nombre_cuidadora: "",
  labora_cuidadora: false,
  
  // Conflicto armado
  victima_conflicto: false,
  
  // Familia
  hijos_a_cargo: 0,
  
  // Datos educativos y laborales
  estudia_actualmente: false,
  nivel_educativo: "Ninguno",
  situacion_laboral: "Otro",
  tipo_vivienda: "Otra",
  
  // Ayuda humanitaria
  ayuda_humanitaria: false,
  descripcion_ayuda_humanitaria: "",
  
  // Huella digital
  huella_dactilar: null
};

// Constantes para selección
const TIPOS_DOCUMENTO = [
  "Cédula",
  "Tarjeta de Identidad",
  "Pasaporte",
  "Registro Civil",
];
const GENEROS = ["Masculino", "Femenino", "Otro", "Prefiero no decir"];
const RANGOS_EDAD = [
  "0-12",
  "13-18",
  "19-25",
  "26-35",
  "36-45",
  "46-55",
  "56-65",
  "66 o más",
];
const ETNIAS = ["Mestizo", "Indígena", "Afrodescendiente"];
const TIPOS_DISCAPACIDAD = [
  "Física",
  "Visual",
  "Auditiva",
  "Cognitiva",
  "Múltiple",
  
];
const NIVELES_EDUCATIVOS = [
  "Primaria",
  "Secundaria",
  "Técnico",
  "Tecnólogo",
  "Universitario",
  "Posgrado",
  "Ninguno",
];
const SITUACIONES_LABORALES = [
  "Empleado",
  "Desempleado",
  "Estudiante",
  "Independiente",
  "Jubilado",
];
const TIPOS_VIVIENDA = ["Propia", "Arrendada", "Familiar", "Compartida"];

// Constantes de validación
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Función para preparar los datos del formulario
const prepararDatosFormulario = (beneficiario, barriosDeComuna = []) => {
  console.log('Preparando datos del beneficiario:', beneficiario);
  
  // Verificar si la etnia es personalizada (no está en la lista de ETNIAS)
  const etniaEsPersonalizada = beneficiario.etnia && 
                         !ETNIAS.includes(beneficiario.etnia) && 
                         beneficiario.etnia !== "Ninguna" &&
                         beneficiario.etnia !== "Otro";
  
  // Verificar si el barrio es personalizado (no está en la lista de barrios de la comuna)
  const barrioExisteEnLista = barriosDeComuna.some(b => b.nombre === beneficiario.barrio);
  const barrioEsPersonalizado = beneficiario.barrio && 
                               !barrioExisteEnLista && 
                               beneficiario.barrio !== "No especificado" &&
                               beneficiario.barrio !== "otro";

  console.log('Etnia personalizada:', etniaEsPersonalizada, 'etnia:', beneficiario.etnia);
  console.log('Barrio personalizado:', barrioEsPersonalizado, 'barrio:', beneficiario.barrio);
  console.log('Barrios disponibles:', barriosDeComuna.map(b => b.nombre));
  console.log('Barrio existe en lista:', barrioExisteEnLista);

  // Preparar los datos del formulario
  const datos = {
    ...VALORES_INICIALES,
    ...beneficiario,
    // Manejar etnia personalizada
    etnia: etniaEsPersonalizada ? "Otro" : (beneficiario.etnia || "Ninguna"),
    etniaPersonalizada: etniaEsPersonalizada ? beneficiario.etnia : ""
  };

  // Manejar barrio personalizado
  if (barrioEsPersonalizado) {
    console.log('Configurando barrio personalizado:', beneficiario.barrio);
    datos.barrio = "otro";
    datos.otroBarrio = beneficiario.barrio;
  } else if (beneficiario.barrio === "otro" && beneficiario.otroBarrio) {
    console.log('Manteniendo barrio personalizado existente:', beneficiario.otroBarrio);
    datos.barrio = "otro";
    datos.otroBarrio = beneficiario.otroBarrio;
  } else if (beneficiario.otroBarrio && !barrioExisteEnLista) {
    console.log('Usando otroBarrio como valor personalizado:', beneficiario.otroBarrio);
    datos.barrio = "otro";
    datos.otroBarrio = beneficiario.otroBarrio;
  } else {
    console.log('Usando barrio normal:', beneficiario.barrio);
    datos.barrio = beneficiario.barrio || "";
    datos.otroBarrio = "";
  }

  // Asegurarse de que la huella se mantenga si existe
  datos.huella_dactilar = beneficiario.huella_dactilar || null;
  
  // Asegurar que los valores booleanos se manejen correctamente
  datos.sabe_leer = !!beneficiario.sabe_leer;
  datos.sabe_escribir = !!beneficiario.sabe_escribir;
  datos.tiene_discapacidad = !!beneficiario.tiene_discapacidad;
  datos.labora_cuidadora = !!beneficiario.labora_cuidadora;
  datos.victima_conflicto = !!beneficiario.victima_conflicto;
  datos.estudia_actualmente = !!beneficiario.estudia_actualmente;
  datos.ayuda_humanitaria = !!beneficiario.ayuda_humanitaria;

  return datos;
};

export default function RegistroBeneficiarios() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [barriosDisponibles, setBarriosDisponibles] = useState([]);

  const [comunas, setComunas] = useState([]);
  const [currentComunaCentroide, setCurrentComunaCentroide] = useState(null); // NUEVO ESTADO para el centroide

  const pageTitle = 'Registro de Habitantes';
  const pageDescription = 'Formulario para caracterización de habitantes en Quibdó';
  
  // Función para obtener barrios por comuna (envuelta en useCallback)
  const obtenerBarriosPorComuna = useCallback((comunaNombre) => {
    // Función auxiliar para extraer solo 'Comuna X' del nombre
    const getComunaKey = (nombre) => {
      if (!nombre) return "";
      const match = nombre.match(/Comuna ?\d+/i);
      return match ? match[0].trim() : nombre.trim();
    };
    if (!comunaNombre) {
      console.warn("obtenerBarriosPorComuna: comunaNombre vacío o undefined");
      return [];
    }

    if (!Array.isArray(barriosPorComuna)) {
      console.warn(
        "obtenerBarriosPorComuna: barriosPorComuna no es un array",
        barriosPorComuna
      );
      return [];
    }

    const comunaKey = getComunaKey(comunaNombre);
    if (!comunaKey) {
      console.warn(
        "obtenerBarriosPorComuna: comunaKey no pudo generarse para",
        comunaNombre
      );
      return [];
    }

    const comunaEncontrada = barriosPorComuna.find(
      (c) => c && typeof c === "object" && c.comuna === comunaKey
    );

    if (!comunaEncontrada) {
      console.warn(
        `obtenerBarriosPorComuna: no se encontró la comuna "${comunaKey}" en barriosPorComuna`
      );
      return [];
    }

    return Array.isArray(comunaEncontrada.barrios)
      ? comunaEncontrada.barrios
      : [];
  }, []);

  // Valores iniciales con valores por defecto explícitos (envueltos en useMemo)
  const VALORES_INICIALES = useMemo(() => ({
    // Datos biométricos
    huella_dactilar: null,
    // Datos del funcionario
    funcionario_id: user?.id || "",
    funcionario_nombre: user?.nombre || "",
    linea_trabajo: user?.linea_trabajo || "",
    fecha_registro: new Date().toISOString().split("T")[0],

    // Datos personales
    nombre_completo: "",
    tipo_documento: "", // Inicialmente vacío para forzar selección
    numero_documento: "",
    genero: "", // Inicialmente vacío para forzar selección
    rango_edad: "", // Inicialmente vacío para forzar selección

    // Habilidades básicas (campos opcionales con valor por defecto false)
    sabe_leer: false,
    sabe_escribir: false,

    // Contacto
    numero_celular: "",
    correo_electronico: "",

    // Datos socioculturales
    etnia: "", // Inicialmente vacío para forzar selección
    etniaPersonalizada: "", // NUEVO CAMPO para etnia personalizada
    comuna: "",
    barrio: "",
    otroBarrio: "",
    barrio_lat: null,
    barrio_lng: null,

    // Discapacidad
    tiene_discapacidad: false,
    tipo_discapacidad: "",
    nombre_cuidadora: "",
    labora_cuidadora: false,

    // Conflicto armado
    victima_conflicto: false,

    // Familia
    hijos_a_cargo: 0,
    // Datos educativos y laborales
    estudia_actualmente: false,
    nivel_educativo: "", // Inicialmente vacío para forzar selección
    situacion_laboral: "", // Inicialmente vacío para forzar selección
    tipo_vivienda: "", // Inicialmente vacío para forzar selección
    // Ayuda humanitaria
    ayuda_humanitaria: false,
    descripcion_ayuda_humanitaria: "",
  }), [user?.id, user?.nombre, user?.linea_trabajo]);

  const [formData, setFormData] = useState({
    ...VALORES_INICIALES,
    funcionario_id: user?.id || "",
    funcionario_nombre: user?.nombre || "",
    linea_trabajo: user?.linea_trabajo || "",
    fecha_registro: new Date().toISOString().split("T")[0],
    etnia: "",
    etniaPersonalizada: ""
  });

  const [nombreLineaTrabajo, setNombreLineaTrabajo] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [beneficiarioId, setBeneficiarioId] = useState(null);

  // useEffect para manejar la carga inicial de barrios cuando se está editando
  useEffect(() => {
    if (location.state?.beneficiario) {
      const beneficiario = location.state.beneficiario;
      console.log('Beneficiario cargado:', beneficiario);
      setModoEdicion(true);
      setBeneficiarioId(beneficiario.id);

      // Actualizar el estado de la huella registrada si el beneficiario ya tiene una
      if (beneficiario.huella_dactilar) {
        setHuellaRegistrada(true);
      }

      // Verificar si la etnia es personalizada (no está en la lista de ETNIAS)
      const etniaEsPersonalizada = beneficiario.etnia && 
                                 !ETNIAS.includes(beneficiario.etnia) && 
                                 beneficiario.etnia !== "Ninguna" &&
                                 beneficiario.etnia !== "Otro";
      
      // Función para preparar los datos del formulario
      const prepararDatosFormulario = (beneficiario, barriosDeComuna = []) => {
        console.log('Preparando datos del beneficiario:', beneficiario);
        
        // Verificar si la etnia es personalizada (no está en la lista de ETNIAS)
        const etniaEsPersonalizada = beneficiario.etnia && 
                                   !ETNIAS.includes(beneficiario.etnia) && 
                                   beneficiario.etnia !== "Ninguna" &&
                                   beneficiario.etnia !== "Otro";
        
        // Verificar si el barrio es personalizado (no está en la lista de barrios de la comuna)
        const barrioExisteEnLista = barriosDeComuna.some(b => b.nombre === beneficiario.barrio);
        const barrioEsPersonalizado = beneficiario.barrio && 
                                     !barrioExisteEnLista && 
                                     beneficiario.barrio !== "No especificado" &&
                                     beneficiario.barrio !== "otro";

        console.log('Etnia personalizada:', etniaEsPersonalizada, 'etnia:', beneficiario.etnia);
        console.log('Barrio personalizado:', barrioEsPersonalizado, 'barrio:', beneficiario.barrio);
        console.log('Barrios disponibles:', barriosDeComuna.map(b => b.nombre));
        console.log('Barrio existe en lista:', barrioExisteEnLista);

        // Preparar los datos del formulario
        const datos = {
          ...VALORES_INICIALES,
          ...beneficiario,
          // Manejar etnia personalizada
          etnia: etniaEsPersonalizada ? "Otro" : (beneficiario.etnia || "Ninguna"),
          etniaPersonalizada: etniaEsPersonalizada ? beneficiario.etnia : ""
        };

        // Manejar barrio personalizado
        if (barrioEsPersonalizado) {
          console.log('Configurando barrio personalizado:', beneficiario.barrio);
          datos.barrio = "otro";
          datos.otroBarrio = beneficiario.barrio;
        } else if (beneficiario.barrio === "otro" && beneficiario.otroBarrio) {
          console.log('Manteniendo barrio personalizado existente:', beneficiario.otroBarrio);
          datos.barrio = "otro";
          datos.otroBarrio = beneficiario.otroBarrio;
        } else if (beneficiario.otroBarrio && !barrioExisteEnLista) {
          console.log('Usando otroBarrio como valor personalizado:', beneficiario.otroBarrio);
          datos.barrio = "otro";
          datos.otroBarrio = beneficiario.otroBarrio;
        } else {
          console.log('Usando barrio normal:', beneficiario.barrio);
          datos.barrio = beneficiario.barrio || "";
          datos.otroBarrio = "";
        }

        // Asegurarse de que la huella se mantenga si existe
        datos.huella_dactilar = beneficiario.huella_dactilar || null;
        
        // Asegurar que los valores booleanos se manejen correctamente
        datos.sabe_leer = !!beneficiario.sabe_leer;
        datos.sabe_escribir = !!beneficiario.sabe_escribir;
        datos.tiene_discapacidad = !!beneficiario.tiene_discapacidad;
        datos.labora_cuidadora = !!beneficiario.labora_cuidadora;
        datos.victima_conflicto = !!beneficiario.victima_conflicto;
        datos.estudia_actualmente = !!beneficiario.estudia_actualmente;
        datos.ayuda_humanitaria = !!beneficiario.ayuda_humanitaria;

        return datos;
      };

      // Si el beneficiario tiene una comuna, cargar sus barrios
      if (beneficiario.comuna) {
        const barriosDeComuna = obtenerBarriosPorComuna(beneficiario.comuna);
        setBarriosDisponibles(barriosDeComuna);

        // Obtener el centroide de la comuna
        const comunaSeleccionadaData = barriosPorComuna.find(
          (c) => c.comuna === beneficiario.comuna
        );
        setCurrentComunaCentroide(
          comunaSeleccionadaData ? comunaSeleccionadaData.centroide : null
        );

        // Preparar los datos del formulario con los barrios cargados
        const datosFormulario = prepararDatosFormulario(beneficiario, barriosDeComuna);
        console.log('Datos del formulario a establecer (con barrios):', datosFormulario);
        setFormData(datosFormulario);
      } else {
        // Si no hay comuna, preparar los datos sin barrios
        const datosFormulario = prepararDatosFormulario(beneficiario);
        console.log('Datos del formulario a establecer (sin barrios):', datosFormulario);
        setFormData(datosFormulario);
      }
    }
  }, [location.state, VALORES_INICIALES, obtenerBarriosPorComuna]);

  // Estados de validación
  const [errores, setErrores] = useState({});
  const [validando, setValidando] = useState({
    documento: false,
    correo: false
  });
  const [estadoValidacion, setEstadoValidacion] = useState({
    documento: null, // null: no validado, true: válido, false: inválido
    correo: null
  });

  // Estado para manejar la huella dactilar
  const [huellaRegistrada, setHuellaRegistrada] = useState(false);
  const [soportaBiometria, setSoportaBiometria] = useState(false);

  // Verificar si el dispositivo soporta biometría
  useEffect(() => {
    const verificarSoporteBiometrico = async () => {
      const soportado = await biometricService.isSupported();
      setSoportaBiometria(soportado);
    };
    verificarSoporteBiometrico();
  }, []);
  // La función obtenerBarriosPorComuna se movió arriba

  // Validar documento único
  const validarDocumentoUnico = async (numero_documento, beneficiarioId = null) => {
    if (!numero_documento) {
      setErrores(prev => ({ ...prev, numero_documento: "El documento es requerido" }));
      setEstadoValidacion(prev => ({ ...prev, documento: false }));
      return false;
    }

    setValidando(prev => ({ ...prev, documento: true }));
    
    try {
      const { existe, msg } = await verificarDocumentoUnico(numero_documento, beneficiarioId);
      
      if (existe) {
        setErrores(prev => ({
          ...prev,
          numero_documento: msg || "Este documento ya está registrado en el sistema.",
        }));
        setEstadoValidacion(prev => ({ ...prev, documento: false }));
        return false;
      }
      
      setErrores(prev => ({
        ...prev,
        numero_documento: "",
      }));
      setEstadoValidacion(prev => ({ ...prev, documento: true }));
      return true;
      
    } catch (error) {
      console.error("Error al validar documento:", error);
      setErrores(prev => ({
        ...prev,
        numero_documento: "Error al validar el documento. Por favor, intente nuevamente.",
      }));
      setEstadoValidacion(prev => ({ ...prev, documento: false }));
      return false;
      setValidando(prev => ({ ...prev, documento: false }));
    }
  };

  // Validar correo único
  const validarCorreoUnico = async (correo_electronico, excluirId = null) => {
    // Si el campo está vacío, no mostrar error (es opcional)
    if (!correo_electronico) {
      setErrores(prev => ({ ...prev, correo_electronico: "" }));
      setEstadoValidacion(prev => ({ ...prev, correo: null }));
      return true;
    }

    // Validar formato de correo
    if (!EMAIL_REGEX.test(correo_electronico)) {
      setErrores(prev => ({
        ...prev,
        correo_electronico: "El formato del correo electrónico no es válido",
      }));
      setEstadoValidacion(prev => ({ ...prev, correo: false }));
      return false;
    }

    setValidando(prev => ({ ...prev, correo: true }));
    
    try {
      const { existe, msg } = await verificarCorreoUnico(correo_electronico, excluirId);
      
      if (existe) {
        setErrores(prev => ({
          ...prev,
          correo_electronico: msg || "Este correo electrónico ya está registrado en el sistema.",
        }));
        setEstadoValidacion(prev => ({ ...prev, correo: false }));
        return false;
      }
      
      setErrores(prev => ({
        ...prev,
        correo_electronico: "",
      }));
      setEstadoValidacion(prev => ({ ...prev, correo: true }));
      return true;
      
    } catch (error) {
      console.error("Error al validar correo:", error);
      setErrores(prev => ({
        ...prev,
        correo_electronico: "Error al validar el correo electrónico. Por favor, intente nuevamente.",
      }));
      setEstadoValidacion(prev => ({ ...prev, correo: false }));
      return false;
    } finally {
      setValidando(prev => ({ ...prev, correo: false }));
    }
  };

  // Manejar cambio en campos del formulario con validación en tiempo real
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Validar que el campo de número de documento solo acepte números
    if (name === 'numero_documento' && value !== '') {
      // Expresión regular que solo permite números
      const soloNumeros = /^[0-9\b]+$/;
      if (!soloNumeros.test(value)) {
        return; // No actualizar el estado si no es un número
      }
    }

    // Manejo especial para el campo de etnia
    if (name === 'etnia') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Si se selecciona 'Otro', limpiamos el valor de etniaPersonalizada
        etniaPersonalizada: value === 'Otro' ? '' : prev.etniaPersonalizada
      }));
      return;
    }

    // Manejo especial para campos booleanos
    if (type === 'checkbox') {
      setFormData(prevData => ({
        ...prevData,
        [name]: checked
      }));
      
      // Limpiar errores de validación para los checkboxes opcionales
      if (name === 'sabe_leer' || name === 'sabe_escribir') {
        setErrores(prevErrores => ({
          ...prevErrores,
          [name]: null
        }));
      }
      return;
    }

    // Si cambia la comuna, actualizar los barrios disponibles
    if (name === "comuna") {
      const barrios = obtenerBarriosPorComuna(value);
      setBarriosDisponibles(barrios);

      // Buscar la comuna seleccionada en el array barriosPorComuna para obtener su centroide
      const comunaSeleccionadaData = barriosPorComuna.find(
        (c) => c.comuna === value
      );
      setCurrentComunaCentroide(comunaSeleccionadaData ? comunaSeleccionadaData.centroide : null);

      setFormData((prevData) => ({
        ...prevData,
        comuna: value,
        barrio: "",
        otroBarrio: "",
        barrio_lat: null,
        barrio_lng: null,
      }));
      return;
    }

    // Si cambia el select de barrio
    if (name === "barrio") {
      if (value === "otro") {
        let lat = null;
        let lng = null;

        if (barriosDisponibles && barriosDisponibles.length > 0) {
          const randomIndex = Math.floor(Math.random() * barriosDisponibles.length);
          const randomBarrio = barriosDisponibles[randomIndex];
          
          // Pequeño desplazamiento aleatorio (entre +/- 0.0001 y +/- 0.0005 grados)
          const latOffset = (Math.random() - 0.5) * 0.0008 + 0.0001;
          const lngOffset = (Math.random() - 0.5) * 0.0008 + 0.0001;
          
          lat = randomBarrio.lat + latOffset;
          lng = randomBarrio.lng + lngOffset;
        } else if (currentComunaCentroide) {
          // Fallback al centroide si no hay barrios disponibles
          lat = currentComunaCentroide.lat;
          lng = currentComunaCentroide.lng;
        }

        setFormData((prevData) => ({
          ...prevData,
          barrio: "otro",
          otroBarrio: "",
          barrio_lat: lat,
          barrio_lng: lng,
        }));
      } else {
        // Buscar el barrio seleccionado en barriosDisponibles
        const barrioObj = barriosDisponibles.find((b) => b.nombre === value);
        setFormData((prevData) => ({
          ...prevData,
          barrio: value,
          otroBarrio: "",
          barrio_lat: barrioObj ? barrioObj.lat : null,
          barrio_lng: barrioObj ? barrioObj.lng : null,
        }));
      }
      return;
    }

    // Manejar el input manual de "otro barrio"
    if (name === "otroBarrio") {
      setFormData((prevData) => ({
        ...prevData,
        otroBarrio: value,
      }));
      return;
    }

    // Para el resto de los campos
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
    
    // Validación en tiempo real para campos específicos
    if (name === 'numero_documento' && value) {
      // Usar un pequeño retraso para evitar múltiples llamadas mientras el usuario escribe
      const timer = setTimeout(() => {
        validarDocumentoUnico(value);
      }, 500);
      return () => clearTimeout(timer);
    }
    
    if (name === 'correo_electronico') {
      const timer = setTimeout(() => {
        validarCorreoUnico(value);
      }, 500);
      return () => clearTimeout(timer);
    }
  };

  // Función para validar campos requeridos
  const validarCamposRequeridos = () => {
    // Lista de campos requeridos con sus mensajes de error
    const camposRequeridos = [
      // Validar huella dactilar si el dispositivo soporta biometría
      // Solo requerir huella si no estamos en modo edición
      ...(soportaBiometria && !modoEdicion ? [{
        campo: 'huella_dactilar',
        etiqueta: 'Huella Dactilar',
        mensaje: 'El registro de la huella dactilar es obligatorio',
        tipo: 'huella',
        validar: (valor) => {
          // Validar que la huella no sea nula, indefinida o vacía
          return valor !== null && valor !== undefined && Object.keys(valor).length > 0;
        }
      }] : []),
      { 
        campo: 'nombre_completo', 
        etiqueta: 'Nombre Completo',
        mensaje: 'El nombre completo es requerido',
        tipo: 'texto'
      },
      { 
        campo: 'tipo_documento', 
        etiqueta: 'Tipo de Documento',
        mensaje: 'El tipo de documento es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      { 
        campo: 'numero_documento', 
        etiqueta: 'Número de Documento',
        mensaje: 'El número de documento es requerido',
        tipo: 'texto'
      },
      { 
        campo: 'genero', 
        etiqueta: 'Género',
        mensaje: 'El género es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      { 
        campo: 'rango_edad', 
        etiqueta: 'Rango de Edad',
        mensaje: 'El rango de edad es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      // Los campos 'sabe_leer' y 'sabe_escribir' son opcionales
      // y NO deben incluirse en la validación de campos requeridos
      { 
        campo: 'numero_celular', 
        etiqueta: 'Número de Celular',
        mensaje: 'El número de celular es requerido',
        tipo: 'texto'
      },
      { 
        campo: 'etnia', 
        etiqueta: 'Etnia',
        mensaje: 'La etnia es requerida',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      { 
        campo: 'comuna', 
        etiqueta: 'Comuna',
        mensaje: 'La comuna es requerida',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      { 
        campo: 'barrio', 
        etiqueta: 'Barrio',
        mensaje: 'El barrio es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...',
        condicion: () => formData.comuna // Solo es requerido si hay una comuna seleccionada
      },
      { 
        campo: 'tipo_vivienda', 
        etiqueta: 'Tipo de Vivienda',
        mensaje: 'El tipo de vivienda es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      { 
        campo: 'nivel_educativo', 
        etiqueta: 'Nivel Educativo',
        mensaje: 'El nivel educativo es requerido',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      },
      {
        campo: 'situacion_laboral',
        etiqueta: 'Situación Laboral',
        mensaje: 'La situación laboral es requerida',
        tipo: 'select',
        opcionInicial: 'Seleccione...'
      }
    ];

    const nuevosErrores = {};
    const camposIncompletos = [];
    let hayErrores = false;

    camposRequeridos.forEach(({ campo, etiqueta, mensaje, tipo, condicion, opcionInicial, validar: validarCampo }) => {
      // Si hay una condición y no se cumple, saltar la validación de este campo
      if (condicion && !condicion()) {
        return;
      }

      let esInvalido = false;
      const valor = formData[campo];
      
      // Si hay una función de validación personalizada, usarla
      if (validarCampo) {
        esInvalido = !validarCampo(valor);
      } else {
        // Validación específica por tipo de campo
        switch (tipo) {
          case 'select':
            // Un campo select es inválido si está vacío, es nulo, indefinido o igual a la opción inicial
            esInvalido = !valor || valor === '' || (opcionInicial && valor === opcionInicial);
            break;
          case 'numero':
            esInvalido = valor === null || valor === undefined || valor === '';
            break;
          case 'texto':
            esInvalido = !valor || valor.trim() === '';
            break;
          case 'booleano':
            // Los campos booleanos solo son inválidos si son null o undefined explícitamente
            // No son inválidos si son false, ya que false es un valor válido para campos booleanos
            esInvalido = valor === null || valor === undefined;
            // Si el campo es 'sabe_leer' o 'sabe_escribir', no es obligatorio
            if (campo === 'sabe_leer' || campo === 'sabe_escribir') {
              esInvalido = false; // Nunca marcar como inválido
            }
            break;
          case 'huella':
            // Usar la función de validación personalizada si está definida, de lo contrario usar la validación por defecto
            esInvalido = validarCampo ? !validarCampo(valor) : !valor;
            break;
          default:
            esInvalido = !valor || (typeof valor === 'string' && valor.trim() === '');
        }
      }
      
      if (esInvalido) {
        nuevosErrores[campo] = mensaje;
        camposIncompletos.push(etiqueta);
        hayErrores = true;
      }
    });

    // Validar discapacidad
    if (formData.tiene_discapacidad && !formData.tipo_discapacidad) {
      nuevosErrores.tipo_discapacidad = 'Debe especificar el tipo de discapacidad';
      camposIncompletos.push('Tipo de Discapacidad');
      hayErrores = true;
    }

    // Validar ayuda humanitaria
    if (formData.ayuda_humanitaria && !formData.descripcion_ayuda_humanitaria) {
      nuevosErrores.descripcion_ayuda_humanitaria = 'Debe describir la ayuda humanitaria';
      camposIncompletos.push('Descripción de Ayuda Humanitaria');
      hayErrores = true;
    }
    
    // Asegurarse de que los campos opcionales no generen errores
    if (errores.sabe_leer) delete nuevosErrores.sabe_leer;
    if (errores.sabe_escribir) delete nuevosErrores.sabe_escribir;

    // Mostrar notificaciones para cada campo faltante
    if (camposIncompletos.length > 0) {
      // Mostrar una notificación general primero
      enqueueSnackbar(`Por favor complete los campos requeridos:`, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
      
      // Luego mostrar notificaciones individuales para cada campo faltante
      setTimeout(() => {
        camposIncompletos.forEach((campo, index) => {
          setTimeout(() => {
            enqueueSnackbar(`• ${campo} es requerido`, { 
              variant: 'error',
              autoHideDuration: 3000,
              anchorOrigin: { vertical: 'top', horizontal: 'right' }
            });
          }, index * 300); // Espaciar las notificaciones
        });
      }, 500);
    }

    setErrores(nuevosErrores);
    return hayErrores;
  };

  // Modificar handleSubmit para incluir validaciones
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos requeridos
    const hayErrores = validarCamposRequeridos();
    if (hayErrores) {
      enqueueSnackbar("Por favor complete todos los campos requeridos", { variant: "error" });
      return;
    }
    
    // Validar huella dactilar solo si es un nuevo registro y el dispositivo soporta biometría
    if (soportaBiometria && !modoEdicion) {
      // Verificar si hay una huella registrada
      const tieneHuellaValida = formData.huella_dactilar && 
                               Object.keys(formData.huella_dactilar).length > 0;
      
      if (!tieneHuellaValida) {
        enqueueSnackbar("Por favor registre la huella dactilar antes de continuar", { variant: "error" });
        setErrores(prev => ({
          ...prev,
          huella_dactilar: 'El registro de la huella dactilar es obligatorio para nuevos registros'
        }));
        return;
      } else {
        // Limpiar el error de huella si existe
        setErrores(prev => {
          const newErrores = { ...prev };
          delete newErrores.huella_dactilar;
          return newErrores;
        });
      }
    }
    
    
    const esDocumentoValido = await validarDocumentoUnico(
      formData.numero_documento,
      modoEdicion ? (beneficiarioId || location.state?.beneficiario?.id) : null
    );
    
    
    if (!esDocumentoValido) {
      enqueueSnackbar("Por favor corrija el número de documento antes de continuar", { variant: "error" });
      return;
    }
    
    // Si hay correo electrónico, validarlo
    if (formData.correo_electronico) {
      const esCorreoValido = await validarCorreoUnico(
        formData.correo_electronico,
        modoEdicion ? beneficiarioId : null
      );
      if (!esCorreoValido) {
        enqueueSnackbar("Por favor corrija el correo electrónico antes de continuar", { variant: "error" });
        return;
      }
    }

    try {
      if (modoEdicion) {
        // Obtener el beneficiario actual para comparar
        const beneficiarioActual = location.state?.beneficiario;

        // Validaciones individuales para documento y correo
        if (
          formData.numero_documento !== beneficiarioActual?.numero_documento
        ) {
          const documentoValido = await validarDocumentoUnico(
            formData.numero_documento,
            beneficiarioId // Incluir el ID del beneficiario actual para excluirlo de la validación
          );
          if (!documentoValido) {
            enqueueSnackbar("Este número de documento ya está registrado en el sistema.", { variant: "error" });
            return; // Detener si el documento no es válido
          }
        }

        if (
          formData.correo_electronico !== beneficiarioActual?.correo_electronico
        ) {
          const correoValido = formData.correo_electronico
            ? await validarCorreoUnico(
                formData.correo_electronico,
                beneficiarioId // Incluir el ID del beneficiario actual para excluirlo de la validación
              )
            : true;

          if (!correoValido) {
            enqueueSnackbar("Este correo electrónico ya está registrado en el sistema.", { variant: "error" });
            return; // Detener si el correo no es válido
          }
        }

        // Preparar datos para actualización
        const datosParaEnviar = {
          // Datos del funcionario
          funcionario_id: user.id,
          funcionario_nombre: user.nombre,

          // Enviar el ID de línea de trabajo como linea_trabajo
          linea_trabajo: user.linea_trabajo,

          fecha_registro: formData.fecha_registro || new Date().toISOString(),

          // Datos personales
          nombre_completo: formData.nombre_completo,
          tipo_documento: formData.tipo_documento,
          numero_documento: formData.numero_documento,
          genero: formData.genero,
          rango_edad: formData.rango_edad,
          fecha_nacimiento: formData.fecha_nacimiento,
          // Datos biométricos
          // Si estamos en modo edición y no se ha modificado la huella, mantener la existente
          huella_dactilar: modoEdicion && !formData.huella_dactilar 
            ? location.state?.beneficiario?.huella_dactilar || null 
            : formData.huella_dactilar || null,

// Habilidades básicas (asegurar que siempre sean booleanos)
          sabe_leer: formData.sabe_leer !== undefined ? Boolean(formData.sabe_leer) : false,
          sabe_escribir: formData.sabe_escribir !== undefined ? Boolean(formData.sabe_escribir) : false,
          // Contacto
          numero_celular: formData.numero_celular || "",
          correo_electronico: formData.correo_electronico || "",

          // Datos socioculturales
          etnia: formData.etnia === "Otro" ? (formData.etniaPersonalizada || "Otra") : (formData.etnia || "Ninguna"),
          comuna: formData.comuna || "",
          barrio: formData.barrio === "otro" ? (formData.otroBarrio || "No especificado") : (formData.barrio || "No especificado"),
          barrio_lat: formData.barrio_lat || null,
          barrio_lng: formData.barrio_lng || null,

          // Discapacidad
          tiene_discapacidad:
            formData.tiene_discapacidad !== undefined
              ? formData.tiene_discapacidad
              : false,
          tipo_discapacidad: formData.tipo_discapacidad || "",
          nombre_cuidadora: formData.nombre_cuidadora || "",
          labora_cuidadora:
            formData.labora_cuidadora !== undefined
              ? formData.labora_cuidadora
              : false,

          // Conflicto armado
          victima_conflicto:
            formData.victima_conflicto !== undefined
              ? formData.victima_conflicto
              : false,

          // Familia
          hijos_a_cargo:
            formData.hijos_a_cargo !== undefined
              ? parseInt(formData.hijos_a_cargo, 10)
              : 0,

          // Datos educativos y laborales
          estudia_actualmente:
            formData.estudia_actualmente !== undefined
              ? formData.estudia_actualmente
              : false,
          nivel_educativo: formData.nivel_educativo || "Ninguno",
          situacion_laboral: formData.situacion_laboral || "Otro",
          tipo_vivienda: formData.tipo_vivienda || "Otra",

          // Ayuda Humanitaria
          ayuda_humanitaria:
            formData.ayuda_humanitaria !== undefined
              ? formData.ayuda_humanitaria
              : false,
          descripcion_ayuda_humanitaria:
            formData.descripcion_ayuda_humanitaria || "",
        };

        // Filtrar datos que realmente han cambiado
        const datosActualizacion = {};

        // Función para comparar valores
        const sonValoresIguales = (valorActual, valorNuevo) => {
          // Manejar casos especiales como booleanos y números
          if (
            typeof valorActual === "boolean" ||
            typeof valorNuevo === "boolean"
          ) {
            return Boolean(valorActual) === Boolean(valorNuevo);
          }
          if (
            typeof valorActual === "number" ||
            typeof valorNuevo === "number"
          ) {
            return Number(valorActual) === Number(valorNuevo);
          }
          // Para strings y otros tipos
          return (valorActual || "") === (valorNuevo || "");
        };

        // Comparar cada campo con el valor actual
        Object.keys(datosParaEnviar).forEach((campo) => {
          // Ignorar campos específicos
          const camposIgnorar = [
            "funcionario_id",
            "funcionario_nombre",
            "linea_trabajo",
            "fecha_registro",
          ];

          if (camposIgnorar.includes(campo)) return;

          // Si no hay beneficiario actual, agregar todos los campos
          if (!beneficiarioActual) {
            datosActualizacion[campo] = datosParaEnviar[campo];
            return;
          }

          // Comparar valores
          if (
            !sonValoresIguales(
              beneficiarioActual[campo],
              datosParaEnviar[campo]
            )
          ) {
            datosActualizacion[campo] = datosParaEnviar[campo];
          }
        });

        // Solo enviar si hay cambios
        if (Object.keys(datosActualizacion).length === 0) {
          enqueueSnackbar("No se detectaron cambios", { variant: "info" });
          return;
        }

        try {
          const respuesta = await actualizarBeneficiario(
            beneficiarioId,
            datosActualizacion
          );
          enqueueSnackbar("Habitante actualizado exitosamente", {
            variant: "success",
          });
          navigate("/funcionario/beneficiarios", {
            state: { beneficiarioActualizado: respuesta },
          });
        } catch (error) {
          // Manejar errores específicos de documento o correo
          if (error.campo === "numero_documento") {
            setErrores((prev) => ({
              ...prev,
              numero_documento: error.message,
            }));
          } else if (error.campo === "correo_electronico") {
            setErrores((prev) => ({
              ...prev,
              correo_electronico: error.message,
            }));
          } else {
            enqueueSnackbar("Error al actualizar habitante", {
              variant: "error",
            });
          }
        }
      } else {
        // Preparar datos para envío
        const datosParaEnviar = {
          // Datos del funcionario
          funcionario_id: user.id,
          funcionario_nombre: user.nombre,

          // Enviar el ID de línea de trabajo como linea_trabajo
          linea_trabajo: user.linea_trabajo, // Asumiendo que user.linea_trabajo contiene el ID

          // Depuración de línea de trabajo
          _debug_user: JSON.parse(JSON.stringify(user)),

          fecha_registro: new Date().toISOString(),

          // Datos personales
          nombre_completo: formData.nombre_completo,
          tipo_documento: formData.tipo_documento || "Cédula de ciudadanía",
          numero_documento: formData.numero_documento,
          genero: formData.genero || "Prefiere no decirlo",
          rango_edad: formData.rango_edad || "29-59",
          huella_dactilar: formData.huella_dactilar || null, // AÑADIDO PARA INCLUIR HUELLA

          // Habilidades básicas
          sabe_leer:
            formData.sabe_leer !== undefined ? formData.sabe_leer : true,
          sabe_escribir:
            formData.sabe_escribir !== undefined
              ? formData.sabe_escribir
              : true,

          // Contacto
          numero_celular: formData.numero_celular || "",
          correo_electronico: formData.correo_electronico || "",

          // Datos socioculturales
          etnia: formData.etnia === "Otro" ? (formData.etniaPersonalizada || "Otra") : (formData.etnia || "Ninguna"),
          comuna: formData.comuna || "",
          barrio: formData.barrio === "otro" ? (formData.otroBarrio || "No especificado") : (formData.barrio || "No especificado"),
          barrio_lat: formData.barrio_lat || null,
          barrio_lng: formData.barrio_lng || null,

          // Discapacidad
          tiene_discapacidad:
            formData.tiene_discapacidad !== undefined
              ? formData.tiene_discapacidad
              : false,
          tipo_discapacidad: formData.tipo_discapacidad || "",
          nombre_cuidadora: formData.nombre_cuidadora || "",
          labora_cuidadora:
            formData.labora_cuidadora !== undefined
              ? formData.labora_cuidadora
              : false,

          // Conflicto armado
          victima_conflicto:
            formData.victima_conflicto !== undefined
              ? formData.victima_conflicto
              : false,

          // Familia
          hijos_a_cargo:
            formData.hijos_a_cargo !== undefined
              ? parseInt(formData.hijos_a_cargo, 10)
              : 0,

          // Datos educativos y laborales
          estudia_actualmente:
            formData.estudia_actualmente !== undefined
              ? formData.estudia_actualmente
              : false,
          nivel_educativo: formData.nivel_educativo || "Ninguno",
          situacion_laboral: formData.situacion_laboral || "Otro",
          tipo_vivienda: formData.tipo_vivienda || "Otra",

          // Ayuda Humanitaria
          ayuda_humanitaria:
            formData.ayuda_humanitaria !== undefined
              ? formData.ayuda_humanitaria
              : false,
          descripcion_ayuda_humanitaria:
            formData.descripcion_ayuda_humanitaria || "",
        };

        const respuesta = await crearBeneficiario(datosParaEnviar);

        enqueueSnackbar("Habitante registrado exitosamente", {
          variant: "success",
        });

        // Actualizar lista de beneficiarios
        const nuevosBeneficiarios = [
          ...beneficiarios,
          {
            nombre_completo: datosParaEnviar.nombre_completo,
            id: respuesta.beneficiario_id,
          },
        ];
        setBeneficiarios(nuevosBeneficiarios);

        // Limpiar formulario
        setHuellaRegistrada(false); // Resetear estado de UI de huella usando la variable existente
        setFormData({
          ...VALORES_INICIALES, // Usar valores iniciales
          funcionario_id: user.id,
          funcionario_nombre: user.nombre,
          linea_trabajo: user.linea_trabajo,
          fecha_registro: new Date().toISOString().split("T")[0],
        });

        // Limpiar errores
        setErrores({
          numero_documento: "",
          correo_electronico: "",
        });
      }
    } catch (error) {
      enqueueSnackbar("Error al guardar beneficiario", { variant: "error" });
    }
  };

  const handleFinalizarRegistro = () => {
    // Navegar a la lista de beneficiarios registrados
    navigate("/funcionario/beneficiarios");
  };

  const cargarNombreLineaTrabajo = async () => {
    try {
      if (user?.linea_trabajo) {
        try {
          // Primero intentamos obtener el nombre de la línea de trabajo
          const lineaTrabajoResponse = await axios.get(
            `http://localhost:4000/api/lineas-trabajo/nombre/${user.linea_trabajo}`
          );
          setNombreLineaTrabajo(lineaTrabajoResponse.data.nombre);

          // Luego intentamos obtener el ID de la línea de trabajo
          const idResponse = await axios.get(
            `http://localhost:4000/api/lineas-trabajo/por-nombre/${encodeURIComponent(
              lineaTrabajoResponse.data.nombre
            )}`
          );
          const lineaTrabajoId = idResponse.data?._id;

          if (lineaTrabajoId) {
            setFormData((prevData) => ({
              ...prevData,
              linea_trabajo: lineaTrabajoId,
            }));
          }
        } catch (idError) {
          console.warn(
            "No se pudo obtener el ID de la línea de trabajo:",
            idError
          );
        }
      }
    } catch (error) {
      console.error("Error al cargar línea de trabajo:", error);
    }
  };

  const verificarModoEdicion = () => {
    const state = location.state || {};
    if (state.modoEdicion && state.beneficiario) {
      setModoEdicion(true);
      const beneficiario = state.beneficiario;
      setBeneficiarioId(beneficiario._id);
      
      console.log('Beneficiario cargado para edición:', beneficiario);

      // Preparar los datos base del formulario
      const datosBase = {
        // Datos del funcionario
        funcionario_id: user?.id || "",
        funcionario_nombre: user?.nombre || "",
        linea_trabajo: user?.linea_trabajo || "",
        fecha_registro: new Date().toISOString().split("T")[0],

        // Datos personales
        nombre_completo: beneficiario.nombre_completo || "",
        tipo_documento: beneficiario.tipo_documento || "Cédula",
        numero_documento: beneficiario.numero_documento || "",
        genero: beneficiario.genero || "Prefiero no decir",
        rango_edad: beneficiario.rango_edad || "26-35",
        etnia: beneficiario.etnia || "Ninguna",
        barrio: beneficiario.barrio || "",
        otroBarrio: beneficiario.otroBarrio || "",

        // Habilidades básicas
        sabe_leer: beneficiario.sabe_leer !== undefined ? beneficiario.sabe_leer : false,
        sabe_escribir: beneficiario.sabe_escribir !== undefined ? beneficiario.sabe_escribir : false,

        // Contacto
        numero_celular: beneficiario.numero_celular || "",
        correo_electronico: beneficiario.correo_electronico || "",

        // Datos socioculturales
        comuna: beneficiario.comuna || "",

        // Discapacidad
        tiene_discapacidad: beneficiario.tiene_discapacidad || false,
        tipo_discapacidad: beneficiario.tipo_discapacidad || "",
        nombre_cuidadora: beneficiario.nombre_cuidadora || "",
        labora_cuidadora: beneficiario.labora_cuidadora !== undefined ? beneficiario.labora_cuidadora : false,

        // Conflicto armado
        victima_conflicto: beneficiario.victima_conflicto || false,
        
        // Familia
        hijos_a_cargo: beneficiario.hijos_a_cargo || 0,
        
        // Datos educativos y laborales
        estudia_actualmente: beneficiario.estudia_actualmente || false,
        nivel_educativo: beneficiario.nivel_educativo || "Ninguno",
        situacion_laboral: beneficiario.situacion_laboral || "Otro",
        tipo_vivienda: beneficiario.tipo_vivienda || "Otra",
        
        // Ayuda humanitaria
        ayuda_humanitaria: beneficiario.ayuda_humanitaria || false,
        descripcion_ayuda_humanitaria: beneficiario.descripcion_ayuda_humanitaria || "",
        
        // Copiar otros campos necesarios
        ...beneficiario
      };

      console.log('Datos base del formulario:', datosBase);

      // Si el beneficiario tiene una comuna, cargar sus barrios
      if (beneficiario.comuna) {
        const barriosDeComuna = obtenerBarriosPorComuna(beneficiario.comuna);
        setBarriosDisponibles(barriosDeComuna);
        
        // Preparar los datos del formulario con los barrios cargados
        const datosFormulario = prepararDatosFormulario(datosBase, barriosDeComuna);
        console.log('Datos del formulario a establecer (con barrios):', datosFormulario);
        setFormData(datosFormulario);
      } else {
        // Si no hay comuna, preparar los datos sin barrios
        const datosFormulario = prepararDatosFormulario(datosBase);
        console.log('Datos del formulario a establecer (sin barrios):', datosFormulario);
        setFormData(datosFormulario);
      }
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargar comunas
        const comunasObtenidas = await obtenerComunas();
        if (comunasObtenidas.length === 0) {
          enqueueSnackbar(
            "No se pudieron cargar las comunas. Intente nuevamente.",
            { variant: "warning" }
          );
        }
        setComunas(comunasObtenidas);

        // Cargar nombre de la línea de trabajo
        await cargarNombreLineaTrabajo();

        // Verificar si estamos en modo edición
        verificarModoEdicion();
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        enqueueSnackbar("Error al cargar datos iniciales", { variant: "error" });
      }
    };

    cargarDatosIniciales();
  }, [user, enqueueSnackbar, location.state]);

  return (
    <PageLayout title={pageTitle} description={pageDescription}>
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
          <Typography variant="h5" gutterBottom mt={2}>
            Datos del Habitante
          </Typography>
          <Grid container spacing={3}>
            {/* Datos Personales */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre Completo *"
                name="nombre_completo"
                value={formData.nombre_completo || ''}
                onChange={handleChange}
                error={!!errores.nombre_completo}
                helperText={errores.nombre_completo}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.tipo_documento}>
                <InputLabel id="tipo-documento-label">Tipo de Documento *</InputLabel>
                <Select
                  name="tipo_documento"
                  value={formData.tipo_documento || ''}
                  labelId="tipo-documento-label"
                  label="Tipo de Documento *"
                  onChange={handleChange}
                  error={!!errores.tipo_documento}
                >
                  {TIPOS_DOCUMENTO.map((tipo) => (
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
                type="tel"
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: 20
                }}
                value={formData.numero_documento || ''}
                onChange={handleChange}
                onBlur={() => validarDocumentoUnico(formData.numero_documento)}
                required
                error={!!errores.numero_documento}
                helperText={errores.numero_documento || "Solo se permiten números"}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <>
                      {validando.documento && <CircularProgress size={20} />}
                      {estadoValidacion.documento === true && <CheckCircleIcon color="success" />}
                      {estadoValidacion.documento === false && <ErrorIcon color="error" />}
                    </>
                  ),
                }}
              />
            </Grid>
            {/* Campo de Huella Dactilar */}
            {soportaBiometria && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errores.huella_dactilar}>
                  <FormLabel component="legend" required>Huella Dactilar *</FormLabel>
                  <Button
                    variant="contained"
                    color={huellaRegistrada ? "success" : "primary"}
                    startIcon={<FingerprintIcon />}
                    onClick={async (e) => {
                    try {
                      if (!formData.numero_documento) {
                        enqueueSnackbar("Por favor, ingrese primero el número de documento", { variant: "warning" });
                        return;
                      }

                      const datosHuella = await biometricService.registrarHuella(
                        formData.numero_documento,
                        formData.nombre_completo
                      );

                      setFormData(prev => ({
                        ...prev,
                        huella_dactilar: datosHuella
                      }));

                      setHuellaRegistrada(true);
                      enqueueSnackbar("Huella dactilar registrada exitosamente", { variant: "success" });
                    } catch (error) {
                      enqueueSnackbar(error.message || "Error al registrar la huella dactilar", { variant: "error" });
                    }
                    }}
                    fullWidth
                    sx={{ height: '56px', mt: 1 }} // Mismo alto que los TextField
                  >
                    {huellaRegistrada ? "Huella Registrada" : "Registrar Huella Dactilar"}
                  </Button>
                  {errores.huella_dactilar && (
                    <FormHelperText error>{errores.huella_dactilar}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.genero}>
                <InputLabel id="genero-label">Género *</InputLabel>
                <Select
                  name="genero"
                  value={formData.genero || ''}
                  labelId="genero-label"
                  label="Género *"
                  onChange={handleChange}
                  error={!!errores.genero}
                >
                  {GENEROS.map((genero) => (
                    <MenuItem key={genero} value={genero}>
                      {genero}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.rango_edad}>
                <InputLabel id="rango-edad-label">Rango de Edad *</InputLabel>
                <Select
                  name="rango_edad"
                  value={formData.rango_edad || ''}
                  labelId="rango-edad-label"
                  label="Rango de Edad *"
                  onChange={handleChange}
                  error={!!errores.rango_edad}
                >
                  {RANGOS_EDAD.map((rango) => (
                    <MenuItem key={rango} value={rango}>
                      {rango}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Habilidades Básicas */}
            <Grid item xs={12} sm={6}>
              <FormControl required error={!!errores.sabe_leer} component="fieldset" variant="standard">
                <FormLabel component="legend">¿Sabe leer?</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.sabe_leer || false}
                        onChange={handleChange}
                        name="sabe_leer"
                      />
                    }
                    label={formData.sabe_leer ? "Sí" : "No"}

                    
                  />
                </FormGroup>
                {errores.sabe_leer && <FormHelperText error>{errores.sabe_leer}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl required error={!!errores.sabe_escribir} component="fieldset" variant="standard">
                <FormLabel component="legend">¿Sabe escribir?</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.sabe_escribir || false}
                        onChange={handleChange}
                        name="sabe_escribir"
                      />
                    }
                    label={formData.sabe_escribir ? "Sí" : "No"}
                  />
                </FormGroup>
                {errores.sabe_escribir && <FormHelperText error>{errores.sabe_escribir}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Contacto */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Celular *"
                name="numero_celular"
                value={formData.numero_celular || ''}
                onChange={handleChange}
                error={!!errores.numero_celular}
                helperText={errores.numero_celular}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                name="correo_electronico"
                type="email"
                value={formData.correo_electronico || ''}
                onChange={handleChange}
                onBlur={() => validarCorreoUnico(formData.correo_electronico)}
                error={!!errores.correo_electronico}
                helperText={errores.correo_electronico}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <>
                      {validando.correo && <CircularProgress size={20} />}
                      {estadoValidacion.correo === true && <CheckCircleIcon color="success" />}
                      {estadoValidacion.correo === false && <ErrorIcon color="error" />}
                    </>
                  ),
                }}
              />
            </Grid>

            {/* Datos Socioculturales */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.etnia}>
                <InputLabel id="etnia-label">Etnia *</InputLabel>
                <Select
                  name="etnia"
                  value={formData.etnia || ''}
                  labelId="etnia-label"
                  label="Etnia *"
                  onChange={handleChange}
                  error={!!errores.etnia}
                >
                  {ETNIAS.map((etnia) => (
                    <MenuItem key={etnia} value={etnia}>
                      {etnia}
                    </MenuItem>
                  ))}
                  <MenuItem value="Otro">Otro (especificar)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Campo para ingresar la etnia personalizada si se seleccionó "Otro" */}
            {formData.etnia === 'Otro' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Especifique la etnia"
                  name="etniaPersonalizada"
                  value={formData.etniaPersonalizada || ''}
                  onChange={handleChange}
                  error={!!errores.etniaPersonalizada}
                  helperText={errores.etniaPersonalizada}
                  required
                />
              </Grid>
            )}
            {/* Comuna */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.comuna}>
                <InputLabel id="comuna-label">Comuna *</InputLabel>
                <Select
                  name="comuna"
                  value={formData.comuna || ''}
                  labelId="comuna-label"
                  label="Comuna *"
                  onChange={handleChange}
                  error={!!errores.comuna}
                >
                  <MenuItem value="">Seleccione una comuna</MenuItem>
                  {comunas.map((comuna) => (
                    <MenuItem key={comuna.id} value={comuna.nombre}>
                      {comuna.nombre} - {comuna.zona}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Barrio */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.barrio}>
                <InputLabel id="barrio-label">Barrio *</InputLabel>
                <Select
                  name="barrio"
                  value={formData.barrio || ''}
                  labelId="barrio-label"
                  label="Barrio *"
                  onChange={handleChange}
                  error={!!errores.barrio}
                  disabled={!formData.comuna}
                >
                  {barriosDisponibles.map((barrio) => (
                    <MenuItem key={barrio.nombre} value={barrio.nombre}>
                      {barrio.nombre}
                    </MenuItem>
                  ))}
                  <MenuItem value="otro">Otro (especificar)</MenuItem>
                </Select>
              </FormControl>
              {(formData.barrio === 'otro' || formData.otroBarrio) && (
                <Grid item xs={12} sm={6} sx={{ mt: 2, ml: 0 }}>
                  <TextField
                    fullWidth
                    label="Especifique el Barrio"
                    name="otroBarrio"
                    value={formData.otroBarrio || ""}
                    onChange={handleChange}
                    required
                    error={!!errores.otroBarrio}
                    helperText={errores.otroBarrio}
                  />
                </Grid>
              )}
            </Grid>

            {/* Discapacidad */}
            <Grid item xs={12} sm={6}>
              <FormControl required error={!!errores.tiene_discapacidad} component="fieldset" variant="standard">
                <FormLabel component="legend">¿Tiene alguna discapacidad? *</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.tiene_discapacidad || false}
                        onChange={handleChange}
                        name="tiene_discapacidad"
                      />
                    }
                    label={formData.tiene_discapacidad ? "Sí" : "No"}
                  />
                </FormGroup>
                {errores.tiene_discapacidad && <FormHelperText error>{errores.tiene_discapacidad}</FormHelperText>}
              </FormControl>
              {formData.tiene_discapacidad && (
                <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
                  <Grid item xs={12} sm={12}>
                    <FormControl fullWidth error={!!errores.tipo_discapacidad} disabled={!formData.tiene_discapacidad} required={formData.tiene_discapacidad}>
                      <InputLabel id="tipo-discapacidad-label">Tipo de Discapacidad {formData.tiene_discapacidad ? '*' : ''}</InputLabel>
                      <Select
                        name="tipo_discapacidad"
                        value={formData.tipo_discapacidad || ''}
                        labelId="tipo-discapacidad-label"
                        label="Tipo de Discapacidad"
                        onChange={handleChange}
                        error={!!errores.tipo_discapacidad}
                      >
                        {TIPOS_DISCAPACIDAD.map((tipo) => (
                          <MenuItem key={tipo} value={tipo}>
                            {tipo}
                          </MenuItem>
                        ))}
                      </Select>
                      {errores.tipo_discapacidad && (
                        <FormHelperText error>{errores.tipo_discapacidad}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <TextField
                      fullWidth
                      label="Nombre de la Cuidadora"
                      name="nombre_cuidadora"
                      value={formData.nombre_cuidadora}
                      onChange={handleChange}
                      sx={{ minWidth: 0 }}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={12}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          name="labora_cuidadora"
                          checked={!!formData.labora_cuidadora}
                          onChange={handleChange}
                        />
                      }
                      label="¿Labora la Cuidadora?"
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>

            {/* Conflicto Armado */}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend">¿Es víctima del conflicto armado? (Opcional)</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.victima_conflicto || false}
                        onChange={handleChange}
                        name="victima_conflicto"
                      />
                    }
                    label={formData.victima_conflicto ? "Sí" : "No"}
                  />
                </FormGroup>
              </FormControl>
            </Grid>

            {/* Familia */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hijos a Cargo *"
                name="hijos_a_cargo"
                type="number"
                value={formData.hijos_a_cargo || 0}
                onChange={handleChange}
                inputProps={{ min: 0 }}
                error={!!errores.hijos_a_cargo}
                helperText={errores.hijos_a_cargo}
                required
              />
            </Grid>

            {/* Datos Educativos y Laborales */}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend">¿Estudia actualmente? (Opcional)</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.estudia_actualmente || false}
                        onChange={handleChange}
                        name="estudia_actualmente"
                      />
                    }
                    label={formData.estudia_actualmente ? "Sí" : "No"}
                  />
                </FormGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.nivel_educativo}>
                <InputLabel id="nivel-educativo-label">Nivel Educativo *</InputLabel>
                <Select
                  name="nivel_educativo"
                  value={formData.nivel_educativo || ''}
                  labelId="nivel-educativo-label"
                  label="Nivel Educativo *"
                  onChange={handleChange}
                  error={!!errores.nivel_educativo}
                >
                  {NIVELES_EDUCATIVOS.map((nivel) => (
                    <MenuItem key={nivel} value={nivel}>
                      {nivel}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.situacion_laboral}>
                <InputLabel id="situacion-laboral-label">Laboral/Estudia *</InputLabel>
                <Select
                  name="situacion_laboral"
                  value={formData.situacion_laboral || ''}
                  labelId="situacion-laboral-label"
                  label="Situación Laboral *"
                  onChange={handleChange}
                  error={!!errores.situacion_laboral}
                >
                  {SITUACIONES_LABORALES.map((situacion) => (
                    <MenuItem key={situacion} value={situacion}>
                      {situacion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errores.tipo_vivienda}>
                <InputLabel id="tipo-vivienda-label">Tipo de Vivienda *</InputLabel>
                <Select
                  name="tipo_vivienda"
                  value={formData.tipo_vivienda || ''}
                  labelId="tipo-vivienda-label"
                  label="Tipo de Vivienda *"
                  onChange={handleChange}
                  error={!!errores.tipo_vivienda}
                >
                  {TIPOS_VIVIENDA.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Ayuda Humanitaria */}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend">¿Recibe ayuda humanitaria? (Opcional)</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.ayuda_humanitaria || false}
                        onChange={handleChange}
                        name="ayuda_humanitaria"
                      />
                    }
                    label={formData.ayuda_humanitaria ? "Sí" : "No"}
                  />
                </FormGroup>
              </FormControl>
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
                  {modoEdicion ? "Actualizar Persona" : "Guardar Registro"}
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
            <Typography variant="h6">Habitantes Registrados</Typography>
            {beneficiarios.map((beneficiario, index) => (
              <Typography key={index} variant="body2">
                {beneficiario.nombre_completo}
              </Typography>
            ))}
          </Paper>
        )}
      </Paper>
    </Container>
    </PageLayout>
  );
}
