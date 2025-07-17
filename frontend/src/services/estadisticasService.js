import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
       
        return Promise.reject(error);
    }
);

// Interceptor de respuestas
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
       
        
        // Manejar específicamente errores de red
        if (error.message === 'Network Error') {
            throw new Error('No se puede conectar con el servidor. Verifique su configuración de red y que el backend esté corriendo.');
        }
        
        return Promise.reject(error);
    }
);

const estadisticasService = {
    obtenerEstadisticasPorLinea: async (lineaTrabajoId) => {
        return await estadisticasService.obtenerEstadisticasBeneficiarios(lineaTrabajoId);
    },
    obtenerEstadisticasBeneficiarios: async (lineaTrabajoId) => {
        try {
            console.log(`Obteniendo estadísticas para línea de trabajo: ${lineaTrabajoId}`);
            
            // Usar URL completa con el prefijo correcto de beneficiarios
            const urlCompleta = `${axiosInstance.defaults.baseURL}/api/beneficiario/estadisticas/${lineaTrabajoId}`;
            console.log('URL de la solicitud:', urlCompleta);
            
            const response = await axiosInstance.get(urlCompleta);
            console.log('Respuesta del servidor:', response.data);
            
            // Validar estructura de respuesta
            if (!response.data) {
                throw new Error('La respuesta del servidor está vacía');
            }
            
            if (response.data.status === 'error') {
                throw new Error(response.data.msg || 'Error al obtener estadísticas');
            }
            
            if (!response.data.estadisticas) {
                throw new Error('La respuesta no contiene el campo "estadisticas"');
            }
            
            // Asegurarse de que los valores numéricos sean números
            const estadisticas = response.data.estadisticas;
            const estadisticasProcesadas = {};
            
            // Convertir todos los valores a números
            Object.keys(estadisticas).forEach(key => {
                if (typeof estadisticas[key] === 'number') {
                    estadisticasProcesadas[key] = estadisticas[key];
                } else if (typeof estadisticas[key] === 'string' && !isNaN(estadisticas[key])) {
                    estadisticasProcesadas[key] = parseFloat(estadisticas[key]);
                } else {
                    estadisticasProcesadas[key] = 0; // Valor por defecto si no es un número
                }
            });
            
            console.log('Estadísticas procesadas:', estadisticasProcesadas);
            return estadisticasProcesadas;
            
        } catch (error) {
            console.error('Error en obtenerEstadisticasBeneficiarios:', error);
            console.error('Detalles del error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data
                }
            });
            
            // Devolver un objeto con valores por defecto en caso de error
            return {
                total_beneficiarios: 0,
                total_victimas: 0,
                total_discapacidad: 0,
                total_ayuda_humanitaria: 0,
                total_menores_13: 0,
                total_13_25: 0,
                total_mayores_60: 0,
                total_alfabetizados: 0,
                total_analfabetas: 0,
                total_mujeres_menores_con_hijos: 0
            };
        }
    },
    obtenerEstadisticasGlobalesAdmin: async () => {
        try {
            const response = await axiosInstance.get('/api/beneficiario/estadisticas');
            if (!response.data || !response.data.estadisticas) {
                throw new Error('Respuesta inválida del servidor');
            }
            return response.data.estadisticas;
        } catch (error) {
          
            throw error;
        }
    },
    obtenerEstadisticasMensuales: async () => {
        try {
            const response = await axiosInstance.get('/beneficiarios/estadisticas/por-mes');
            // La respuesta es un array de objetos { mes: 'YYYY-MM', cantidad: N }
            if (!Array.isArray(response.data)) {
                throw new Error('Respuesta inválida del servidor para estadísticas mensuales');
            }
            return response.data;
        } catch (error) {
           
            throw error;
        }
    }
};

export default estadisticasService;