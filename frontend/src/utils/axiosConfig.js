import axios from 'axios';
import config from '../config';

// Configuración base de axios
const axiosInstance = axios.create({
    baseURL: config.API_URL,
    timeout: 30000, // Aumentar timeout a 30 segundos
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para añadir token de autenticación
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem(config.TOKEN_KEY);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Token y usuario:', { token, user });
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        if (error.response && error.response.status === 401) {
            // Token inválido o expirado
            localStorage.removeItem(config.TOKEN_KEY);
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
