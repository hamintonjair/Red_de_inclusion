// Funciones de utilidad para manejo de autenticación

export const getToken = () => {
    return localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'authToken');
};

export const setToken = (token) => {
    localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'authToken', token);
};

export const removeToken = () => {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'authToken');
};

export const isAuthenticated = () => {
    const token = getToken();
    return !!token; // Convierte a booleano
};

const authUtils = {
    getToken,
    setToken,
    removeToken,
    isAuthenticated
};

export default authUtils;
