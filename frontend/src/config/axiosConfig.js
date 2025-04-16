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
        console.error('Error en solicitud:', error);
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

export default axiosInstance;
