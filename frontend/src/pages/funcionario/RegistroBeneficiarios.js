import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Checkbox,
  Switch,
  Paper,
} from "@mui/material";
import { barriosPorComuna } from "../../data/barriosPorComuna";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSnackbar } from "../../context/SnackbarContext";
import lineaTrabajoService from "../../services/lineaTrabajoService";
import {
  crearBeneficiario,
  actualizarBeneficiario,
  verificarDocumentoUnico,
  verificarCorreoUnico,
} from "../../services/beneficiarioService";
import { obtenerComunas } from "../../services/comunaService";

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
const ETNIAS = ["Mestizo", "Indígena", "Afrodescendiente", "Otro"];
const TIPOS_DISCAPACIDAD = [
  "Física",
  "Visual",
  "Auditiva",
  "Cognitiva",
  "Múltiple",
  "Ninguna",
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

export default function RegistroBeneficiarios() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [barriosDisponibles, setBarriosDisponibles] = useState([]);

  const [comunas, setComunas] = useState([]);
  const [currentComunaCentroide, setCurrentComunaCentroide] = useState(null); // NUEVO ESTADO para el centroide

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
    tipo_documento: "Cédula", // Valor por defecto
    numero_documento: "",
    genero: "Prefiero no decir", // Valor por defecto
    rango_edad: "26-35", // Valor por defecto

    // Habilidades básicas
    sabe_leer: true, // Valor por defecto
    sabe_escribir: true, // Valor por defecto

    // Contacto
    numero_celular: "",
    correo_electronico: "",

    // Datos socioculturales
    etnia: "Ninguna", // Valor por defecto
    comuna: "",
    barrio: "No especificado", // Valor por defecto
    otroBarrio: "",
    barrio_lat: null,
    barrio_lng: null,

    // Discapacidad
    tiene_discapacidad: false, // Valor por defecto
    tipo_discapacidad: "",
    nombre_cuidadora: "",
    labora_cuidadora: false, // Valor por defecto

    // Conflicto armado
    victima_conflicto: false, // Valor por defecto

    // Familia
    hijos_a_cargo: 0, // Valor por defecto

    // Datos educativos y laborales
    estudia_actualmente: false, // Valor por defecto
    nivel_educativo: "Ninguno", // Valor por defecto
    situacion_laboral: "Otro", // Valor por defecto
    tipo_vivienda: "Otra", // Valor por defecto

    // Ayuda humanitaria
    ayuda_humanitaria: false,
    descripcion_ayuda_humanitaria: "",
  }), [user?.id, user?.nombre, user?.linea_trabajo]);

  const [formData, setFormData] = useState(VALORES_INICIALES);

  const [nombreLineaTrabajo, setNombreLineaTrabajo] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [beneficiarioId, setBeneficiarioId] = useState(null);

  // useEffect para manejar la carga inicial de barrios cuando se está editando
  useEffect(() => {
    if (location.state?.beneficiario) {
      const beneficiario = location.state.beneficiario;
      setModoEdicion(true);
      setBeneficiarioId(beneficiario.id);

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

        // Actualizar formData con los datos del beneficiario
        setFormData({
          ...VALORES_INICIALES,
          ...beneficiario,
          // Si el barrio no está en la lista de barrios disponibles, marcarlo como "otro"
          barrio: barriosDeComuna.some(b => b.nombre === beneficiario.barrio) ? beneficiario.barrio : "otro",
          otroBarrio: barriosDeComuna.some(b => b.nombre === beneficiario.barrio) ? "" : beneficiario.barrio
        });
      } else {
        // Si no hay comuna, simplemente actualizar formData con los datos del beneficiario
        setFormData({
          ...VALORES_INICIALES,
          ...beneficiario
        });
      }
    }
  }, [location.state, VALORES_INICIALES, obtenerBarriosPorComuna]);

  // Estados de validación
  const [errores, setErrores] = useState({
    numero_documento: "",
    correo_electronico: "",
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
  const validarDocumentoUnico = async (numero_documento) => {
    try {
      const { existe, msg } = await verificarDocumentoUnico(numero_documento);
      if (existe) {
        setErrores((prev) => ({
          ...prev,
          numero_documento: msg,
        }));
        return false;
      }
      setErrores((prev) => ({
        ...prev,
        numero_documento: "",
      }));
      return true;
    } catch (error) {
      enqueueSnackbar("Error al verificar documento", { variant: "error" });
      return false;
    }
  };

  // Validar correo único
  const validarCorreoUnico = async (correo_electronico) => {
    // Solo validar si el correo tiene formato válido
    if (!EMAIL_REGEX.test(correo_electronico)) {
      setErrores((prev) => ({
        ...prev,
        correo_electronico: "Formato de correo inválido",
      }));
      return false;
    }

    try {
      const { existe, msg } = await verificarCorreoUnico(correo_electronico);
      if (existe) {
        setErrores((prev) => ({
          ...prev,
          correo_electronico: msg,
        }));
        return false;
      }
      setErrores((prev) => ({
        ...prev,
        correo_electronico: "",
      }));
      return true;
    } catch (error) {
      enqueueSnackbar("Error al verificar correo", { variant: "error" });
      return false;
    }
  };

  // Modificar handleChange para manejar switches y selects
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Si cambia la comuna, actualizar los barrios disponibles
    // Si cambia la comuna, actualizar los barrios disponibles
    if (name === "comuna") {
      const barrios = obtenerBarriosPorComuna(value); // Llama a la función que filtra los barrios por comuna
      setBarriosDisponibles(barrios); // Actualiza el estado con los barrios disponibles de la comuna seleccionada

      // Buscar la comuna seleccionada en el array barriosPorComuna para obtener su centroide
      const comunaSeleccionadaData = barriosPorComuna.find(
        (c) => c.comuna === value
      );
      setCurrentComunaCentroide(comunaSeleccionadaData ? comunaSeleccionadaData.centroide : null);

      setFormData((prevData) => ({
        ...prevData,
        comuna: value, // Actualiza la comuna seleccionada
        barrio: "", // Limpiar el barrio seleccionado
        otroBarrio: "", // Limpiar el campo de barrio "otro" si se había escrito algo
        barrio_lat: null, // Limpiar lat/lng al cambiar comuna
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
          // Fallback al centroide si no hay barrios disponibles (aunque no debería pasar)
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
    // Manejar el input manual de "otro barrio"
    if (name === "otroBarrio") {
      setFormData((prevData) => ({
        ...prevData,
        // formData.barrio NO se cambia aquí, debe seguir siendo "otro"
        otroBarrio: value, // Solo actualiza el nombre del nuevo barrio
        // Las coordenadas (lat, lng) para "otro" se asignaron cuando se seleccionó "otro" en el dropdown de barrios
      }));
      return;
    }

    // Otros campos
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        type === "checkbox" || type === "switch" ? Boolean(checked) : value,
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
        if (
          formData.numero_documento !== beneficiarioActual?.numero_documento
        ) {
          const documentoValido = await validarDocumentoUnico(
            formData.numero_documento
          );
          if (!documentoValido) {
            return; // Detener si el documento no es válido
          }
        }

        if (
          formData.correo_electronico !== beneficiarioActual?.correo_electronico
        ) {
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
          tipo_documento: formData.tipo_documento || "Cédula de ciudadanía",
          numero_documento: formData.numero_documento,
          genero: formData.genero || "Prefiere no decirlo",
          rango_edad: formData.rango_edad || "29-59",
          fecha_nacimiento: formData.fecha_nacimiento || null,
          // Datos biométricos
          huella_dactilar: formData.huella_dactilar || null,

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
          etnia: formData.etnia || "Ninguna",
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
          enqueueSnackbar("Beneficiario actualizado exitosamente", {
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
            enqueueSnackbar("Error al actualizar beneficiario", {
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
          etnia: formData.etnia || "Ninguna",
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

        enqueueSnackbar("Beneficiario registrado exitosamente", {
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

  useEffect(() => {
    const cargarComunas = async () => {
      try {
        const comunasObtenidas = await obtenerComunas();
        if (comunasObtenidas.length === 0) {
          enqueueSnackbar(
            "No se pudieron cargar las comunas. Intente nuevamente.",
            { variant: "warning" }
          );
        }
        setComunas(comunasObtenidas);
      } catch (error) {
        enqueueSnackbar("Error al cargar comunas. Verifique su conexión.", {
          variant: "error",
        });
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
            const lineaTrabajoId =
              await lineaTrabajoService.obtenerNombreLineaTrabajo(
                user.linea_trabajo
              );
            setFormData((prevData) => ({
              ...prevData,
              linea_trabajo: lineaTrabajoId,
            }));
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

        // Mapear datos del beneficiario al formulario
        setFormData({
          // Datos del funcionario
          funcionario_id: user?.id || "",
          funcionario_nombre: user?.nombre || "",
          linea_trabajo: user?.linea_trabajo || "",
          fecha_registro: new Date().toISOString().split("T")[0], // Fecha actual en formato YYYY-MM-DD

          // Datos personales
          nombre_completo: beneficiario.nombre_completo || "",
          tipo_documento: beneficiario.tipo_documento || "Cédula", // Valor por defecto
          numero_documento: beneficiario.numero_documento || "",
          genero: beneficiario.genero || "Prefiero no decir", // Valor por defecto
          rango_edad: beneficiario.rango_edad || "26-35", // Valor por defecto

          // Habilidades básicas
          sabe_leer: beneficiario.sabe_leer || true, // Valor por defecto
          sabe_escribir: beneficiario.sabe_escribir || true, // Valor por defecto

          // Contacto
          numero_celular: beneficiario.numero_celular || "",
          correo_electronico: beneficiario.correo_electronico || "",

          // Datos socioculturales
          etnia: beneficiario.etnia || "Ninguna", // Valor por defecto
          comuna: beneficiario.comuna || "",
          barrio: beneficiario.barrio || "No especificado", // Valor por defecto

          // Discapacidad
          tiene_discapacidad: beneficiario.tiene_discapacidad || false, // Valor por defecto
          tipo_discapacidad: beneficiario.tipo_discapacidad || "",
          nombre_cuidadora: beneficiario.nombre_cuidadora || "",
          labora_cuidadora:
            beneficiario.labora_cuidadora !== undefined
              ? beneficiario.labora_cuidadora
              : false,

          // Conflicto armado
          victima_conflicto: beneficiario.victima_conflicto || false, // Valor por defecto

          // Familia
          hijos_a_cargo: beneficiario.hijos_a_cargo || 0, // Valor por defecto

          // Datos educativos y laborales
          estudia_actualmente: beneficiario.estudia_actualmente || false, // Valor por defecto
          nivel_educativo: beneficiario.nivel_educativo || "Ninguno", // Valor por defecto
          situacion_laboral: beneficiario.situacion_laboral || "Otro", // Valor por defecto
          tipo_vivienda: beneficiario.tipo_vivienda || "Otra", // Valor por defecto

          // Ayuda humanitaria
          ayuda_humanitaria: beneficiario.ayuda_humanitaria || false,
          descripcion_ayuda_humanitaria:
            beneficiario.descripcion_ayuda_humanitaria || "",
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
                value={formData.numero_documento}
                onChange={handleChange}
                onBlur={() => validarDocumentoUnico(formData.numero_documento)}
                required
                error={!!errores.numero_documento}
                helperText={errores.numero_documento}
              />
            </Grid>
            {/* Campo de Huella Dactilar */}
            {soportaBiometria && (
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color={huellaRegistrada ? "success" : "primary"}
                  startIcon={<FingerprintIcon />}
                  onClick={async () => {
                    try {
                      if (!formData.numero_documento) {
                        enqueueSnackbar("Por favor, ingrese primero el número de documento", { variant: "warning" });
                        return;
                      }

                      const datosHuella = await biometricService.registrarHuella(
                        formData.numero_documento,
                        formData.nombre_completo
                      );

                      console.log('RegistroBeneficiarios.js, DATOS RECIBIDOS de biometricService:', datosHuella); // DEBUG LINE
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
                  sx={{ height: '56px' }} // Mismo alto que los TextField
                >
                  {huellaRegistrada ? "Huella Registrada" : "Registrar Huella Dactilar"}
                </Button>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Género</InputLabel>
                <Select
                  name="genero"
                  value={formData.genero}
                  label="Género"
                  onChange={handleChange}
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
              <FormControl fullWidth required>
                <InputLabel>Rango de Edad</InputLabel>
                <Select
                  name="rango_edad"
                  value={formData.rango_edad}
                  label="Rango de Edad"
                  onChange={handleChange}
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
                  {ETNIAS.map((etnia) => (
                    <MenuItem key={etnia} value={etnia}>
                      {etnia}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Comuna */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Comuna</InputLabel>
                <Select
                  name="comuna"
                  value={formData.comuna}
                  label="Comuna"
                  onChange={handleChange}
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
              <FormControl fullWidth required>
                <InputLabel>Barrio</InputLabel>
                <Select
                  name="barrio"
                  value={formData.barrio}
                  label="Barrio"
                  onChange={handleChange}
                >
                  {barriosDisponibles.map((barrio, idx) => (
                    <MenuItem key={idx} value={barrio.nombre}>
                      {barrio.nombre}
                    </MenuItem>
                  ))}
                  <MenuItem value="otro">Otro (especificar)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Campo para ingresar el nombre del barrio manualmente si se eligió "otro" */}
            {formData.barrio === "otro" && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Especifique el Barrio"
                  name="otroBarrio"
                  value={formData.otroBarrio || ""}
                  onChange={handleChange}
                  required
                />
              </Grid>
            )}

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
                <Grid container spacing={2} sx={{ mt: 1, mb: 1 }}>
                  <Grid item xs={12} sm={12}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Discapacidad</InputLabel>
                      <Select
                        name="tipo_discapacidad"
                        value={formData.tipo_discapacidad}
                        label="Tipo de Discapacidad"
                        onChange={handleChange}
                      >
                        {TIPOS_DISCAPACIDAD.map((tipo) => (
                          <MenuItem key={tipo} value={tipo}>
                            {tipo}
                          </MenuItem>
                        ))}
                      </Select>
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
                  {NIVELES_EDUCATIVOS.map((nivel) => (
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
                  {SITUACIONES_LABORALES.map((situacion) => (
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
