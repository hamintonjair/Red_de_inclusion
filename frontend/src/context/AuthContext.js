import { createContext, useState, useEffect, useContext } from 'react';
import usuarioService from '../services/usuarioService';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp > currentTime) {
                    // Token válido, obtener información completa del usuario
                    usuarioService.obtenerUsuarioPorId(decodedToken.sub)
                        .then(userData => {
                            console.log('Datos de usuario completos:', JSON.parse(JSON.stringify(userData)));
                            console.log('Teléfono en datos de usuario:', userData.telefono);
                            
                            setUser({
                                ...userData,
                                token: token,
                                telefono: userData.telefono || '' // Asegurar campo de teléfono
                            });
                        })
                        .catch(error => {
                            console.error('Error al obtener datos de usuario:', error);
                            localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
                            setUser(null);
                        })
                        .finally(() => {
                            setLoading(false);
                        });
                } else {
                    // Token expirado
                    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
                    setUser(null);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error al decodificar token:', error);
                localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
                setUser(null);
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        try {
            const userData = await usuarioService.iniciarSesion(email, password);
            // Almacenar token y datos de usuario
            localStorage.setItem(process.env.REACT_APP_TOKEN_KEY, userData.token);
            // Asegurar que el usuario tenga un rol
            const userWithRole = {
                ...userData,
                rol: userData.rol || 'funcionario'
            };
            setUser(userWithRole);
            return userWithRole;
        } catch (error) {
            // Extraer mensaje de error más detallado
            const errorMessage = error.response?.data?.mensaje || 
                                 error.message || 
                                 'Error desconocido al iniciar sesión';
            throw new Error(errorMessage);
        }
    };

    const logout = () => {
        localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            logout,
            isAuthenticated: !!user 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
