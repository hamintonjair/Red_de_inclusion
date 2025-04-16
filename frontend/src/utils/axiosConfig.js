import axios from 'axios';

// Configuración base de axios
const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    timeout: 30000, // Aumentar timeout a 30 segundos
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para añadir token de autenticación
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
