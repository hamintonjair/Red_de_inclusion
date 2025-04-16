import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Crear una instancia de axios con configuración base
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor de solicitudes
axiosInstance.interceptors.request.use(
    (config) => {



        const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Error en solicitud:', error);
        return Promise.reject(error);
    }
);

// Interceptor de respuestas
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Error de comunicación completo:', {
            mensaje: error.message,
            codigo: error.code,
            config: error.config,
            respuesta: error.response
        });
        
        // Manejar específicamente errores de red
        if (error.message === 'Network Error') {
            throw new Error('No se puede conectar con el servidor. Verifique su configuración de red y que el backend esté corriendo.');
        }
        
        // Manejar errores específicos de respuesta
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    throw new Error(error.response.data.msg || 'Error de solicitud');
                case 401:
                    throw new Error(error.response.data.msg || 'No autorizado');
                case 404:
                    throw new Error(error.response.data.msg || 'Recurso no encontrado');
                case 500:
                    throw new Error(error.response.data.msg || 'Error interno del servidor');
                default:
                    throw new Error(error.response.data.msg || 'Error desconocido');
            }
        }
        
        return Promise.reject(error);
    }
);

export const obtenerLineasTrabajo = async () => {
    try {
        // const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
        
        const response = await axiosInstance.get('/lineas-trabajo');
    
        console.groupEnd();

        // Validar que la respuesta sea un array con elementos
        if (!Array.isArray(response.data) || response.data.length === 0) {
            console.warn('La respuesta no es un array válido o está vacío');
            return [];
        }

        return response.data;
    } catch (error) {
        console.group('Error al Obtener Líneas de Trabajo');
        console.error('Error COMPLETO al obtener líneas de trabajo:', {
            fullError: error,
            responseData: error.response?.data,
            responseStatus: error.response?.status,
            errorMessage: error.message
        });
        console.groupEnd();

        throw error; // Re-lanzar el error para que el componente lo maneje
    }
};

const usuarioService = {
    iniciarSesion: async (email, password) => {
        try {


            
            const response = await axiosInstance.post('/auth/login', { 
                email, 
                password 
            });

            
            // Validar estructura de respuesta
            if (!response.data || !response.data.funcionario || !response.data.access_token) {
                throw new Error('Respuesta de inicio de sesión inválida');
            }
            
            // Devolver datos del funcionario con token
            const userData = {
                ...response.data.funcionario,
                token: response.data.access_token,
                rol: response.data.funcionario.rol || 'funcionario',
                
                // Usar linea_trabajo_id del backend
                linea_trabajo: response.data.funcionario.linea_trabajo_id,
                linea_trabajo_nombre: response.data.funcionario.linea_trabajo_nombre || response.data.funcionario.linea_trabajo
            };
            

            return userData;
        } catch (error) {
            console.error('Error COMPLETO al iniciar sesión:', {
                fullError: error,
                responseData: error.response?.data,
                responseStatus: error.response?.status,
                errorMessage: error.message
            });

            throw error; // Re-lanzar el error para que el componente lo maneje
        }
    },

    registrarFuncionario: async (funcionario) => {
        try {
            // const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
            
            const response = await axiosInstance.post('/usuarios/funcionarios', funcionario);
            

            return response.data;
        } catch (error) {
            console.error('Error COMPLETO al registrar funcionario:', {
                fullError: error,
                responseData: error.response?.data,
                responseStatus: error.response?.status,
                errorMessage: error.message
            });

            throw error; // Re-lanzar el error para que el componente lo maneje
        }
    },

    obtenerLineasTrabajo,
    listarFuncionarios: async () => {
        try {

            
            const response = await axiosInstance.get('/usuarios/funcionarios');
            

            
            return response.data;
        } catch (error) {
            console.error('Error COMPLETO al obtener funcionarios:', {
                fullError: error,
                mensaje: error.response?.data?.mensaje || 'Error desconocido',
                responseData: error.response?.data,
                responseStatus: error.response?.status,
                errorMessage: error.message
            });
            
            // Lanzar un error personalizado
            const errorMsg = error.response?.data?.msg || 'Error al obtener funcionarios';
            const customError = new Error(errorMsg);
            customError.status = error.response?.status;
            customError.data = error.response?.data;
            
            throw customError;
        }
    },

    obtenerFuncionarioPorId: async (id) => {
        try {

            
            const response = await axiosInstance.get(`/funcionarios/funcionarios/${id}`);
            

            
            // Asegurar que todos los campos necesarios estén presentes
            const funcionario = response.data.funcionario || response.data;
            
            // Campos por defecto si no existen
            const camposDefecto = {
                nombre: funcionario.nombre || '',
                email: funcionario.email || '',
                lineaTrabajo: funcionario.lineaTrabajo || funcionario.linea_trabajo || null,
                rol: funcionario.rol || 'funcionario',
                estado: funcionario.estado || 'Activo',
                // Agregar más campos según sea necesario
                fechaRegistro: funcionario.fechaRegistro || funcionario.fecha_registro || new Date().toISOString(),
                ultimaActualizacion: funcionario.ultimaActualizacion || funcionario.ultima_actualizacion || new Date().toISOString(),
                secretaría: funcionario.secretaría || funcionario.secretaria || ''
            };
            
            return {
                ...funcionario,
                ...camposDefecto,
                id: funcionario._id || funcionario.id || id
            };
        } catch (error) {
            console.error('Error COMPLETO al obtener funcionario:', {
                fullError: error,
                responseData: error.response?.data,
                responseStatus: error.response?.status,
                errorMessage: error.message,
                requestUrl: error.config?.url
            });

            throw new Error(error.response?.data?.msg || 'Error al obtener funcionario');
        }
    },

    actualizarFuncionario: async (id, funcionario) => {
        try {

            
            // Filtrar campos para actualización
            const camposActualizacion = {
                ...(funcionario.nombre && { nombre: funcionario.nombre }),
                ...(funcionario.email && { email: funcionario.email }),
                ...(funcionario.secretaría && { secretaría: funcionario.secretaría }),
                ...(funcionario.lineaTrabajo && { 
                    linea_trabajo: funcionario.lineaTrabajo.id || funcionario.lineaTrabajo 
                }),
                ...(funcionario.rol && { rol: funcionario.rol }),
                ...(funcionario.estado && { estado: funcionario.estado })
            };


            
            const response = await axiosInstance.put(`/funcionarios/funcionarios/${id}`, camposActualizacion);
            
            console.log('Respuesta completa de actualización:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error COMPLETO al actualizar funcionario:', {
                fullError: error,
                responseData: error.response?.data,
                responseStatus: error.response?.status,
                errorMessage: error.message,
                requestUrl: error.config?.url
            });

            // Extraer mensaje de error más detallado si está disponible
            const errorMsg = error.response?.data?.msg || 
                             error.response?.data?.detalles?.join(', ') || 
                             'Error al actualizar funcionario';

            throw new Error(errorMsg);
        }
    },

    obtenerLineaTrabajoPorId: async (lineaId) => {
        try {

            
            if (!lineaId || lineaId === 'undefined') {
                console.warn('ID de línea de trabajo no válido');
                return {
                    id: lineaId,
                    nombre: 'Sin línea de trabajo',
                    descripcion: 'No definida',
                    estado: 'Inactivo'
                };
            }
            
            const response = await axiosInstance.get(`/lineas-trabajo/${lineaId}`);
            

            
            // Asegurar que la línea tenga un ID y nombre
            const lineaConId = {
                ...response.data,
                id: response.data._id || response.data.id || lineaId,
                nombre: response.data.nombre || 'Sin nombre'
            };
            

            
            return lineaConId;
        } catch (error) {
            console.warn('Error al obtener línea de trabajo:', {
                mensaje: error.response?.data?.mensaje || error.message,
                id: lineaId
            });
            
            // Devolver un objeto por defecto en caso de error
            return {
                id: lineaId,
                nombre: 'Sin línea de trabajo',
                descripcion: 'No definida',
                estado: 'Inactivo'
            };
        }
    },

    eliminarLineaTrabajo: async (id) => {
        try {

            
            if (!id || id === 'undefined') {
                throw new Error('ID de línea de trabajo no válido');
            }
            
            const response = await axiosInstance.delete(`/lineas-trabajo/${id}`);
            

            
            return response.data;
        } catch (error) {
            console.error('Error al eliminar línea de trabajo:', {
                mensaje: error.response?.data?.mensaje || error.message,
                detalles: error.response?.data || 'Sin detalles adicionales',
                id: id,
                url: error.config?.url,
                method: error.config?.method,
                fullError: error
            });
            throw error; // Re-lanzar el error para que el componente lo maneje
        }
    },

    actualizarLineaTrabajo: async (id, lineaTrabajo) => {
        try {

            
            if (!id || id === 'undefined') {
                throw new Error('ID de línea de trabajo no válido');
            }
            

            
            const response = await axiosInstance.put(`/lineas-trabajo/${id}`, lineaTrabajo);
            
            console.log('Respuesta completa de actualización:', response.data);
            
            // Asegurar que la línea tenga un ID
            const lineaConId = {
                ...response.data,
                _id: response.data._id || response.data.id || id,
                id: response.data._id || response.data.id || id
            };
            
            return lineaConId;
        } catch (error) {
            console.error('Error al actualizar línea de trabajo:', {
                mensaje: error.response?.data?.mensaje || error.message,
                detalles: error.response?.data || 'Sin detalles adicionales',
                id: id,
                url: error.config?.url,
                method: error.config?.method,
                fullError: error
            });

            // Extraer y mostrar detalles específicos de validación
            const errorDetalles = error.response?.data?.errores || {};
            const mensajesError = Object.values(errorDetalles).flat().join(', ');
            
            throw new Error(mensajesError || error.message);
        }
    },

    crearLineaTrabajo: async (lineaTrabajo) => {
        try {

            
            const response = await axiosInstance.post('/lineas-trabajo', lineaTrabajo);
            

            
            // Manejar la nueva estructura de respuesta
            const lineaCreada = response.data.linea_trabajo || response.data;
            
            // Asegurar que la línea tenga un ID
            const lineaConId = {
                ...lineaCreada,
                _id: lineaCreada._id || lineaCreada.id || response.data.id,
                id: lineaCreada._id || lineaCreada.id || response.data.id
            };
            
            return lineaConId;
        } catch (error) {
            console.error('Error al crear línea de trabajo:', {
                mensaje: error.response?.data?.mensaje || error.message,
                detalles: error.response?.data || 'Sin detalles adicionales',
                url: error.config?.url,
                method: error.config?.method,
                fullError: error
            });

            // Extraer y mostrar detalles específicos de validación
            const errorDetalles = error.response?.data?.errores || {};
            const mensajesError = Object.values(errorDetalles).flat().join(', ');
            
            throw new Error(mensajesError || error.message);
        }
    },

    obtenerLineaTrabajoPorNombre: async (nombre) => {
        try {

            
            if (!nombre || nombre.trim() === '') {
                throw new Error('Nombre de línea de trabajo no válido');
            }
            
            const response = await axiosInstance.get('/lineas-trabajo', {
                params: {
                    nombre: nombre.trim()
                }
            });
            

            
            // Buscar la línea de trabajo por nombre exacto
            const lineaEncontrada = response.data.find(
                linea => linea.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
            );
            
            if (!lineaEncontrada) {
                console.warn('No se encontró línea de trabajo con nombre:', nombre);
                return null;
            }
            
            // Asegurar que la línea tenga un ID
            const lineaConId = {
                ...lineaEncontrada,
                _id: lineaEncontrada._id || lineaEncontrada.id,
                id: lineaEncontrada._id || lineaEncontrada.id
            };
            
            return lineaConId;
        } catch (error) {
            console.error('Error al obtener línea de trabajo por nombre:', {
                mensaje: error.response?.data?.mensaje || error.message,
                detalles: error.response?.data || 'Sin detalles adicionales',
                nombre: nombre,
                url: error.config?.url,
                method: error.config?.method,
                fullError: error
            });
            throw error; // Re-lanzar el error para que el componente lo maneje
        }
    },

    actualizarPerfil: async (id, perfil) => {
        try {

            const response = await axiosInstance.put(`/usuarios/perfil/${id}`, perfil);
            console.log('Respuesta completa de actualización:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar perfil:', {
                mensaje: error.response?.data?.mensaje || error.message,
                detalles: error.response?.data || 'Sin detalles adicionales',
                url: error.config?.url,
                method: error.config?.method,
                fullError: error
            });
            throw error; // Re-lanzar el error para que el componente lo maneje
        }
    },

    obtenerUsuarioPorId: async (id) => {
        try {

            const response = await axiosInstance.get(`/usuarios/${id}`);
            
            
            // Crear copia de datos con transformaciones específicas
            const userData = {
                ...response.data,
                id: response.data._id || response.data.id,
                rol: response.data.rol || 'funcionario'
            };
            
            return userData;
        } catch (error) {
            console.error('Error al obtener usuario por ID:', {
                mensaje: error.response?.data?.mensaje || error.message,
                detalles: error.response?.data || 'Sin detalles adicionales',
                url: error.config?.url,
                method: error.config?.method,
                fullError: error
            });
            throw error;
        }
    },
};

export default usuarioService;
