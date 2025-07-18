import axios from 'axios';
import { getToken } from '../utils/auth';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const VERIFICACION_URL = process.env.REACT_APP_VERIFICACION_URL || 'http://localhost:3000/verificar';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para añadir token de autorización
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Interceptor de respuestas para manejar errores 401
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Token inválido o expirado
            console.error('Error 401 - No autorizado. Redirigiendo a login...');
            localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const crearBeneficiario = async (datos) => {
    try {  
        // Obtener información del usuario actual
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Preparar datos completos para registro
        const datosCompletos = {
            funcionario_id: user.id || user._id,
            funcionario_nombre: user.nombre,
            fecha_registro: new Date().toISOString(),
            ...datos
        };

        // Limpiar y validar datos antes de enviar
        const datosValidados = Object.keys(datosCompletos).reduce((acc, key) => {
            // Eliminar campos undefined, null, _debug, o no relevantes
            const camposNoPermitidos = [
                '_debug_user', 
                '_id', 
                'token', 
                'secretaría', 
                'rol', 
                'estado', 
                'email', 
                'linea_trabajo_id', 
                'linea_trabajo_nombre'
            ];

            if (
                datosCompletos[key] !== undefined && 
                datosCompletos[key] !== null && 
                !camposNoPermitidos.includes(key)
            ) {
                // Convertir algunos campos a los tipos esperados
                if (key === 'linea_trabajo' && typeof datosCompletos[key] === 'object') {
                    acc[key] = datosCompletos[key]._id || datosCompletos[key].id || datosCompletos[key];
                } else if (['sabe_leer', 'sabe_escribir', 'tiene_discapacidad', 'victima_conflicto', 'estudia_actualmente', 'ayuda_humanitaria'].includes(key)) {
                    // Asegurar que sean booleanos
                    acc[key] = !!datosCompletos[key];
                } else if (['hijos_a_cargo'].includes(key)) {
                    // Asegurar que sean números
                    acc[key] = Number(datosCompletos[key]) || 0;
                } else {
                    acc[key] = datosCompletos[key];
                }
            }
            return acc;
        }, {});

        // Validaciones adicionales
        const camposRequeridos = [
            'funcionario_id',
            'funcionario_nombre', 
            'fecha_registro',
            'nombre_completo', 
            'tipo_documento', 
            'numero_documento', 
            'genero', 
            'rango_edad',
            'numero_celular',
            'linea_trabajo',
            'comuna',
            'barrio'
        ];

        const camposFaltantes = camposRequeridos.filter(campo => 
            !datosValidados[campo] || 
            (typeof datosValidados[campo] === 'string' && datosValidados[campo].trim() === '')
        );

        if (camposFaltantes.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
        }

        console.log('Enviando solicitud a /beneficiarios/registrar con datos:', {
            url: '/beneficiarios/registrar',
            data: datosValidados,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        const response = await axiosInstance.post('/beneficiarios/registrar', datosValidados);
        return response.data;
    } catch (error) {
        console.error('Error al crear beneficiario:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
            }
        });
        
        if (error.response?.status === 403) {
            // Token might be missing or invalid
            const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'authToken');
            console.error('Authentication error. Token exists:', !!token);
            
            if (!token) {
                console.error('No authentication token found in localStorage');
            } else {
                console.error('Token might be expired or invalid');
            }
            
            // Redirect to login if token is missing or invalid
            localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'authToken');
            window.location.href = '/login';
        }
        
        throw error;
    }
};

/**
 * Obtiene una lista de beneficiarios con filtros opcionales
 * @param {Object} filtros - Objeto con los filtros a aplicar
 * @param {string} [filtros.linea_trabajo] - ID de la línea de trabajo para filtrar
 * @param {string} [filtros.fecha] - Fecha para filtrar beneficiarios (formato YYYY-MM-DD)
 * @param {number} [filtros.por_pagina=50] - Cantidad de registros por página (reducido para mejor rendimiento)
 * @param {number} [filtros.pagina=1] - Número de página a solicitar
 * @returns {Promise<Object>} Respuesta del servidor con los beneficiarios y metadatos de paginación
 */
export const obtenerBeneficiarios = async (filtros = {}) => {
    try {
        // Configurar parámetros por defecto con valores más conservadores
        const { 
            por_pagina = 50,  // Reducido para mejor rendimiento
            pagina = 1, 
            campos = '',
            ...otrosFiltros 
        } = filtros;

        // Manejar el caso especial de todos los registros
        const esCargaCompleta = otrosFiltros.todos_los_registros === true;
        
        // Si es una carga completa, no limitar la paginación
        const por_pagina_limitado = esCargaCompleta ? 
            (parseInt(por_pagina) || 1000) : 
            Math.min(parseInt(por_pagina) || 50, 100);
            
        const pagina_actual = parseInt(pagina) || 1;

        // Construir los parámetros de consulta
        const queryParams = {};
        
        // Agregar parámetros de paginación
        queryParams.por_pagina = por_pagina_limitado;
        queryParams.pagina = pagina_actual;
        
        // Agregar campos si se especifican
        if (campos) {
            queryParams.campos = campos;
        }
        
        // Agregar otros filtros, excluyendo todos_los_registros que es un parámetro especial
        Object.entries(otrosFiltros).forEach(([key, value]) => {
            if (key !== 'todos_los_registros' && value !== undefined && value !== null && value !== '') {
                queryParams[key] = value;
            }
        });

        // Agregar timestamp para evitar caché
        queryParams._t = Date.now();

        // Configurar timeout dinámico basado en la cantidad de registros
        const timeout = por_pagina_limitado > 100 ? 120000 : // 2 minutos para cargas grandes
                       por_pagina_limitado > 50 ? 60000 : 30000; // 1 minuto para medianas, 30s para pequeñas
        
        console.log('Solicitando beneficiarios con parámetros:', queryParams);
        
        // Realizar la petición con el timeout configurado
        const response = await axiosInstance.get('/beneficiarios/listar', { 
            params: queryParams,
            paramsSerializer: params => {
                return Object.entries(params)
                    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
                    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                    .join('&');
            },
            timeout: timeout
        });
        
        // Si no hay datos en la respuesta, devolver estructura vacía
        if (!response.data) {
            console.warn('La respuesta de la API no contiene datos');
            return { 
                beneficiarios: [],
                total: 0,
                pagina_actual: pagina_actual,
                paginas: 0
            };
        }
        
        // Asegurarse de que la respuesta tenga la estructura esperada
        if (Array.isArray(response.data)) {
            return {
                beneficiarios: response.data,
                total: response.data.length,
                pagina_actual: pagina_actual,
                paginas: 1
            };
        }
        
        // Si la respuesta ya tiene la estructura esperada, devolverla
        return {
            beneficiarios: response.data.beneficiarios || [],
            total: response.data.total || 0,
            pagina_actual: response.data.pagina || pagina_actual,
            paginas: response.data.paginas || 1,
            ...response.data // Mantener cualquier otro dato adicional
        };
    } catch (error) {
        console.error('Error al obtener beneficiarios:', error);
        
        // Proporcionar un objeto de error más detallado
        const errorInfo = {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            code: error.code
        };
        
        console.error('Detalles del error:', errorInfo);
        
        // Si es un error de autenticación, forzar cierre de sesión
        if (error.response?.status === 401) {
            const tokenKey = process.env.REACT_APP_TOKEN_KEY || 'token';
            localStorage.removeItem(tokenKey);
            window.location.href = '/login';
            return {
                beneficiarios: [],
                total: 0,
                pagina_actual: 1,
                paginas: 0,
                error: 'Sesión expirada. Por favor, inicie sesión nuevamente.'
            };
        }
        
        // Lanzar un error personalizado con más contexto
        const errorMsg = error.response?.data?.msg || 
                       (error.code === 'ECONNABORTED' 
                           ? 'La solicitud está tardando demasiado. Por favor, intente con menos registros o más tarde.' 
                           : 'Error al obtener beneficiarios');
        
        const customError = new Error(errorMsg);
        customError.status = error.response?.status;
        customError.data = error.response?.data;
        customError.code = error.code;
        
        // Si es un error de timeout, devolver datos vacíos en lugar de fallar completamente
        if (error.code === 'ECONNABORTED') {
            console.warn('Timeout al obtener beneficiarios. Devolviendo conjunto de datos vacío.');
            return {
                beneficiarios: [],
                total: 0,
                pagina_actual: 1,
                paginas: 0,
                error: errorMsg
            };
        }
        
        throw customError;
    }
};

/**
 * Obtiene TODOS los beneficiarios con paginación optimizada
 * @param {Object} filtros - Filtros opcionales para la búsqueda
 * @returns {Promise<Array>} Lista de beneficiarios paginada
 */
// Obtiene TODOS los registros de beneficiarios con paginación automática
export const obtenerTodosBeneficiarios = async (filtros = {}, todosLosRegistros = false) => {
    try {
        // Extraer campos específicos si se proporcionan
        const { campos, ...filtrosRestantes } = filtros;
        
        // Configuración de paginación por defecto
        let por_pagina = parseInt(filtrosRestantes.por_pagina) || 100;
        let pagina = parseInt(filtrosRestantes.pagina) || 1;
        
        // Si se solicitan todos los registros, forzar una página grande
        if (todosLosRegistros) {
            por_pagina = 1000; // Número grande para obtener todos los registros en una sola petición
        }

        // Eliminar propiedades de paginación para no enviarlas al backend
        const { por_pagina: pp, pagina: pg, ...filtrosSinPaginacion } = filtrosRestantes;

        // Construir los parámetros de consulta
        const queryParams = {
            ...filtrosSinPaginacion,
            por_pagina: por_pagina,
            pagina: pagina,
            _t: Date.now() // Evitar caché
        };

        // Agregar selección de campos si se especifica
        if (campos) {
            queryParams.campos = campos;
        } else {
            // Por defecto, solo solicitar campos necesarios para el dashboard
            queryParams.campos = 'id,nombre,apellido,documento,direccion,comuna,barrio,lat,lng';
        }

        console.log('Obteniendo beneficiarios con parámetros:', queryParams);
        
        // Hacer la petición al servidor con timeout dinámico
        const timeout = por_pagina > 50 ? 60000 : 30000; // 60s para más de 50 registros, 30s para menos
        
        const response = await axiosInstance.get('/beneficiarios/listar', {
            params: queryParams,
            paramsSerializer: params => {
                const filteredParams = Object.fromEntries(
                    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
                );
                return new URLSearchParams(filteredParams).toString();
            },
            timeout: timeout
        });

        // Procesar la respuesta
        if (!response.data) {
            console.warn('La respuesta de la API no contiene datos');
            return [];
        }

        // Manejar diferentes formatos de respuesta
        if (Array.isArray(response.data)) {
            return response.data; // Formato de respuesta directa
        } else if (response.data.beneficiarios && Array.isArray(response.data.beneficiarios)) {
            return response.data.beneficiarios; // Formato paginado
        }

        return [];

    } catch (error) {
        console.error('Error en obtenerTodosBeneficiarios:', error);
        
        // Proporcionar un objeto de error más detallado
        const errorInfo = {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                params: error.config?.params,
                timeout: error.config?.timeout
            },
            code: error.code,
            isAxiosError: error.isAxiosError
        };
        
        console.error('Detalles completos del error:', errorInfo);
        
        // Si es un error de autenticación, forzar cierre de sesión
        if (error.response?.status === 401) {
            console.warn('Error de autenticación, cerrando sesión...');
            localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'authToken');
            window.location.href = '/login';
            return [];
        }
        
        // Si es un error de timeout, intentar con un timeout mayor
        if (error.code === 'ECONNABORTED') {
            console.warn('Timeout al obtener beneficiarios, intentando con un timeout mayor...');
            // Podríamos implementar un reintento con un timeout mayor aquí si es necesario
        }
        
        // Lanzar un error personalizado con más contexto
        const errorMsg = error.response?.data?.msg || 'Error al obtener todos los beneficiarios';
        const customError = new Error(errorMsg);
        customError.status = error.response?.status;
        customError.data = error.response?.data;
        customError.isAxiosError = error.isAxiosError;
        customError.code = error.code;
        
        // Si estamos en desarrollo, mostrar más detalles del error
        if (process.env.NODE_ENV === 'development') {
            console.error('Error detallado:', customError);
        }
        
        // En producción, devolver un array vacío en lugar de fallar completamente
        if (process.env.NODE_ENV === 'production') {
            console.error('Error en producción, devolviendo array vacío:', customError.message);
            return [];
        }
        
        throw customError;
    }
};

export const obtenerBeneficiarioPorId = async (beneficiarioId) => {
    try {
        const response = await axiosInstance.get(`/beneficiarios/${beneficiarioId}`);
        return response.data.beneficiario;
    } catch (error) {
        throw error;
    }
};

export const actualizarBeneficiario = async (beneficiarioId, datos) => {
    try {
        const response = await axiosInstance.put(`/beneficiarios/actualizar/${beneficiarioId}`, datos);
        return response.data;
    } catch (error) {
        // Manejar errores específicos de documento y correo
        if (error.response && error.response.status === 400) {
            const { msg, campo } = error.response.data;
            
            // Lanzar un error con información específica para manejar en el formulario
            const errorPersonalizado = new Error(msg);
            errorPersonalizado.campo = campo;
            throw errorPersonalizado;
        }
        
        // Otros errores
        throw error;
    }
};

export const eliminarBeneficiario = async (beneficiarioId) => {
    try {
        const response = await axiosInstance.delete(`/beneficiarios/${beneficiarioId}`);
        return response.data;
    } catch (error) {
        
        // Manejar errores específicos
        if (error.response) {
            // El servidor respondió con un código de estado fuera del rango 2xx
            const { msg } = error.response.data;
            throw new Error(msg || 'Error al eliminar habitante');
        } else if (error.request) {
            // La solicitud fue hecha pero no se recibió respuesta
            throw new Error('No se recibió respuesta del servidor');
        } else {
            // Algo sucedió al configurar la solicitud
            throw new Error('Error al configurar la eliminación');
        }
    }
};

export const listarBeneficiarios = async (
    pagina = 1, 
    porPagina = 10, 
    filtro = '', 
    lineaTrabajo = null
) => {
    try {
        // Convertir lineaTrabajo a string si es un objeto
        const lineaTrabajoParam = typeof lineaTrabajo === 'object' 
            ? lineaTrabajo.nombre 
            : lineaTrabajo;

        const response = await axiosInstance.get('/beneficiarios/listar', {
            params: {
                pagina,
                por_pagina: porPagina,
                filtro,
                linea_trabajo: lineaTrabajoParam
            }
        });
        
        return {
            data: response.data.beneficiarios,
            total: response.data.total
        };
    } catch (error) {
     
        throw error;
    }
};

export const buscarBeneficiarios = async (termino) => {
    try {
        const response = await axiosInstance.get('/beneficiarios/buscar', {
            params: { termino }
        });
        return response.data.beneficiarios || [];
    } catch (error) {
        throw error;
    }
};

export const obtenerFormulariosPorBeneficiario = async (beneficiarioId) => {
    try {
        const response = await axiosInstance.get(`/beneficiarios/${beneficiarioId}/formularios`);
        return response.data.formularios || [];
    } catch (error) {
        throw error;
    }
};

export const obtenerDetalleBeneficiario = async (beneficiarioId) => {
    try {
        const response = await axiosInstance.get(`/beneficiarios/detalle/${beneficiarioId}`);
        console.log('Respuesta del servidor:', response.data);
        return response.data; // El backend ya devuelve el objeto beneficiario directamente
    } catch (error) {
        console.error('Error al obtener detalles del beneficiario:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error status:', error.response.status);
        }
        throw error;
    }
};

export const listarBeneficiariosAdmin = async (
    pagina = 1, 
    porPagina = 10, 
    filtro = '',
    lineaTrabajo = null
) => {
    try {
       
        // Convertir lineaTrabajo a string si es un objeto
        const lineaTrabajoParam = typeof lineaTrabajo === 'object' 
            ? lineaTrabajo.nombre 
            : lineaTrabajo;

        const response = await axiosInstance.get('/beneficiarios/listar', {
            params: {
                pagina,
                por_pagina: porPagina,
                filtro,
                linea_trabajo: lineaTrabajoParam,
                admin: true
            }
        });
        
      
        // Verificar la estructura de los datos
        if (Array.isArray(response.data)) {
            return {
                data: response.data,
                total: response.data.length
            };
        } else if (response.data.beneficiarios) {
            return {
                data: response.data.beneficiarios,
                total: response.data.total || response.data.beneficiarios.length
            };
        } else {
            return {
                data: [],
                total: 0
            };
        }
    } catch (error) {
       
        throw error;
    }
};

export const obtenerTodosBeneficiariosAdmin = async (filtro = '') => {
    try {
        const response = await axiosInstance.get('/beneficiarios', {
            params: { 
                pagina: 1, 
                por_pagina: 10000000, 
                filtro, 
                admin: true 
            }
        });
        
        // Verificar si hay datos y devolver todos los beneficiarios
        if (response.data && response.data.beneficiarios) {
            return response.data.beneficiarios;
        }
        
        return []; // Devolver lista vacía si no hay datos
    } catch (error) {
        throw error;
    }
};

/**
 * Verifica si un número de documento ya está registrado
 * @param {string} numero_documento - Número de documento a verificar
 * @param {string} [excluirId=null] - ID del beneficiario a excluir de la verificación (útil en edición)
 * @returns {Promise<{existe: boolean, msg: string}>} Objeto con el resultado de la verificación
 */
export const verificarDocumentoUnico = async (numero_documento, excluirId = null) => {
    
    if (!numero_documento) {
        return { existe: false, msg: '' };
    }
    
    try {
        let url = `/beneficiarios/verificar-documento/${encodeURIComponent(numero_documento)}`;
        if (excluirId) {
            url += `?excluirId=${encodeURIComponent(excluirId)}`;
        }
        
        const response = await axiosInstance.get(url);
        
        const resultado = {
            existe: response.data.existe || false,
            msg: response.data.msg || 'Este documento ya está registrado en el sistema para otro habitante.'
        };
        
        return resultado;
    } catch (error) {
        const errorMsg = error.response?.data?.msg || 'Error al verificar el documento. Por favor, intente nuevamente.';
        return { existe: true, msg: errorMsg };
    }
};

/**
 * Verifica si un correo electrónico ya está registrado
 * @param {string} correo_electronico - Correo electrónico a verificar
 * @param {string} [excluirId=null] - ID del beneficiario a excluir de la verificación (útil en edición)
 * @returns {Promise<{existe: boolean, msg: string}>} Objeto con el resultado de la verificación
 */
export const verificarCorreoUnico = async (correo_electronico, excluirId = null) => {
    if (!correo_electronico) {
        return { existe: false, msg: '' };
    }
    
    // Validación básica de formato de correo
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(correo_electronico)) {
        return { existe: true, msg: 'El formato del correo electrónico no es válido.' };
    }
    
    try {
        let url = `/beneficiarios/verificar-correo/${encodeURIComponent(correo_electronico)}`;
        if (excluirId) {
            url += `?excluirId=${encodeURIComponent(excluirId)}`;
        }
        const response = await axiosInstance.get(url);
        return {
            existe: response.data.existe || false,
            msg: response.data.msg || 'Este correo electrónico ya está registrado en el sistema para otro habitante.'
        };
    } catch (error) {
        console.error('Error al verificar correo electrónico:', error);
        const errorMsg = error.response?.data?.msg || 'Error al verificar el correo electrónico. Por favor, intente nuevamente.';
        return { existe: true, msg: errorMsg };
    }
};

export async function exportarBeneficiariosAExcel({ filtro, tipo_exportacion, fecha_inicio, fecha_fin }) {
    const QRCode = require('qrcode');
    const ExcelJS = require('exceljs');

    try {
        // Obtener datos de beneficiarios
        const { data: beneficiarios } = await axiosInstance.get('/beneficiarios/listar', {
            params: { filtro, fecha_inicio, fecha_fin }
        });

        if (!beneficiarios || beneficiarios.length === 0) {
            throw new Error('NO_DATA');
        }

        // Crear workbook y worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Beneficiarios');

        // Configurar columnas
        worksheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Documento', key: 'documento', width: 20 },
            { header: 'Fecha Registro', key: 'fecha', width: 20 },
            { header: 'Estado Verificación', key: 'verificacion', width: 15 },
            { header: 'Código QR', key: 'qr', width: 20 }
        ];

        // Añadir datos y QR para cada beneficiario
        for (const beneficiario of beneficiarios) {
            // Generar URL de verificación
            const urlVerificacion = `${VERIFICACION_URL}/${beneficiario.codigo_verificacion}`;
            
            // Generar QR como imagen
            const qrBuffer = await QRCode.toBuffer(urlVerificacion);
            
            // Añadir imagen QR al workbook
            const imageId = workbook.addImage({
                buffer: qrBuffer,
                extension: 'png'
            });

            // Añadir fila con datos
            const row = worksheet.addRow({
                nombre: beneficiario.nombre_completo,
                documento: beneficiario.numero_documento,
                fecha: beneficiario.fecha_registro,
                verificacion: beneficiario.verificacion_biometrica?.estado || 'Pendiente'
            });

            // Añadir QR a la celda
            worksheet.addImage(imageId, {
                tl: { col: 4, row: row.number - 1 },
                br: { col: 5, row: row.number }
            });
        }

        // Generar archivo Excel
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Beneficiarios.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        if (error.message === 'NO_DATA') {
            // Permitir manejo especial en el frontend
            throw new Error('No hay datos para exportar en el rango seleccionado.');
        }
        throw error;
    }
};

export const listarBeneficiariosPorRango = async ({ fecha_inicio, fecha_fin, filtro }) => {
    try {
        const response = await axiosInstance.get('/beneficiarios/listar', {
            params: {
                pagina: 1,
                por_pagina: 10000000,
                filtro,
                fecha_inicio,
                fecha_fin,
                admin: true
            }
        });
        if (Array.isArray(response.data)) {
            return { data: response.data };
        } else if (response.data.beneficiarios) {
            return { data: response.data.beneficiarios };
        } else {
            return { data: [] };
        }
    } catch (error) {
        throw error;
    }
};

const beneficiarioService = {
    crearBeneficiario,
    obtenerBeneficiarios,
    obtenerTodosBeneficiarios,
    obtenerBeneficiarioPorId,
    actualizarBeneficiario,
    eliminarBeneficiario,
    listarBeneficiarios,
    buscarBeneficiarios,
    obtenerFormulariosPorBeneficiario,
    obtenerDetalleBeneficiario,
    listarBeneficiariosAdmin,
    obtenerTodosBeneficiariosAdmin,
    verificarDocumentoUnico,
    verificarCorreoUnico,
    exportarBeneficiariosAExcel,
    listarBeneficiariosPorRango,
};

export default beneficiarioService;
