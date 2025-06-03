// Configuración de la aplicación
const config = {
    // URL base de la API (sin /api al final)
    // API_URL: 'http://localhost:5000',

    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',

    // Clave para el token de autenticación
    TOKEN_KEY: process.env.REACT_APP_TOKEN_KEY || 'red_inclusion_token',
    
    // Secreto para JWT (usado en el backend)
    JWT_SECRET: process.env.REACT_APP_JWT_SECRET || 'red_inclusion_secret_2024',
    
    // URL para verificación de correo
    VERIFICATION_URL: process.env.REACT_APP_VERIFICATION_URL || 'http://localhost:3000/verificar/',
        
    
    // Configuración de temas
    theme: {
        primaryColor: '#1976d2',
        secondaryColor: '#dc004e',
        errorColor: '#f44336',
        warningColor: '#ff9800',
        infoColor: '#2196f3',
        successColor: '#4caf50',
    },
    
    // Configuración de la aplicación
    app: {
        name: 'Red de Inclusión',
        description: 'Sistema de gestión para la Red de Inclusión',
        version: '1.0.0',
    },
    
    // Configuración de paginación
    pagination: {
        rowsPerPageOptions: [10, 25, 50, 100],
        defaultRowsPerPage: 10,
    },
};

export const { API_URL } = config;
export default config;
