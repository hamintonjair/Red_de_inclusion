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
        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Log de depuración para verificar token y configuración
       
        
        return config;
    },
    error => {
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
        console.log('beneficiarioService.js, Datos validados A ENVIAR AL BACKEND:', datosValidados); // DEBUG LINE

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
            'sabe_leer',
            'sabe_escribir',
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

        const response = await axiosInstance.post('/beneficiarios/registrar', datosValidados);
        return response.data;
    } catch (error) {
               
        // Detalles adicionales del error
              
        throw error;
    }
};

export const obtenerBeneficiarios = async (filtros = {}) => {
    try {
        
        const params = new URLSearchParams();
        
        // Agregar filtros a los parámetros
        Object.keys(filtros).forEach(key => {
            if (filtros[key] !== undefined && filtros[key] !== null) {
                params.append(key, filtros[key]);
            }
        });
        
        const response = await axiosInstance.get('/beneficiarios/listar', { params });
        
             
        return response.data;
    } catch (error) {
               
        // Lanzar un error personalizado
        const errorMsg = error.response?.data?.msg || 'Error al obtener beneficiarios';
        const customError = new Error(errorMsg);
        customError.status = error.response?.status;
        customError.data = error.response?.data;
        
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
            throw new Error(msg || 'Error al eliminar beneficiario');
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

export const obtenerDetallesBeneficiario = async (beneficiarioId) => {
    try {
        const response = await axiosInstance.get(`/beneficiarios/detalle/${beneficiarioId}`);
        return response.data;
    } catch (error) {
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

export const verificarDocumentoUnico = async (numero_documento) => {
    try {
        const response = await axiosInstance.get(`/beneficiarios/verificar-documento/${numero_documento}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const verificarCorreoUnico = async (correo_electronico) => {
    try {
        const response = await axiosInstance.get(`/beneficiarios/verificar-correo/${correo_electronico}`);
        return response.data;
    } catch (error) {
        throw error;
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
    obtenerBeneficiarioPorId,
    actualizarBeneficiario,
    eliminarBeneficiario,
    listarBeneficiarios,
    buscarBeneficiarios,
    obtenerFormulariosPorBeneficiario,
    obtenerDetallesBeneficiario,
    listarBeneficiariosAdmin,
    obtenerTodosBeneficiariosAdmin,
    verificarDocumentoUnico,
    verificarCorreoUnico,
    exportarBeneficiariosAExcel,
    listarBeneficiariosPorRango,
};

export default beneficiarioService;
