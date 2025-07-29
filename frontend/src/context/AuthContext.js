import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import usuarioService from '../services/usuarioService';
import { jwtDecode } from 'jwt-decode';

// Tiempo de inactividad en milisegundos (30 minutos)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const inactivityTimerRef = useRef(null);

    const logout = useCallback(() => {
        localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
        localStorage.removeItem('user');
        setUser(null);
        
        // Limpiar temporizador
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
    }, []);

    const resetInactivityTimer = useCallback(() => {
        // Limpiar el temporizador existente
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // Configurar nuevo temporizador
        inactivityTimerRef.current = setTimeout(() => {
            logout();
        }, INACTIVITY_TIMEOUT);
    }, [logout]);

    const setupInactivityTimer = useCallback(() => {
        // Limpiar cualquier listener existente
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        // Función manejadora para los eventos
        const handleActivity = () => {
            resetInactivityTimer();
        };
        
        // Agregar nuevos listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Iniciar el temporizador
        resetInactivityTimer();

        // Función de limpieza
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        };
    }, [resetInactivityTimer]);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp > currentTime) {
                    // Token válido, obtener información completa del usuario
                    const userData = await usuarioService.obtenerUsuarioPorId(decodedToken.sub);
                    return {
                        ...userData,
                        token: token,
                        telefono: userData.telefono || ''
                    };
                } else {
                    // Token expirado
                    logout();
                    return null;
                }
            } catch (error) {
                console.error('Error al verificar autenticación:', error);
                logout();
                return null;
            }
        }
        return null;
    }, [logout]);

    useEffect(() => {
        // Verificar autenticación al cargar
        const verifyAuth = async () => {
            try {
                const userData = await checkAuth();
                if (userData) {
                    setUser(userData);
                    // Configurar temporizador de inactividad solo si el usuario está autenticado
                    return setupInactivityTimer();
                }
            } catch (error) {
                console.error('Error al verificar autenticación:', error);
            } finally {
                setLoading(false);
            }
            return () => {}; // No-op cleanup si no hay usuario
        };

        const cleanup = verifyAuth();
        
        // Limpieza al desmontar
        return () => {
            if (cleanup && typeof cleanup.then === 'function') {
                cleanup.then(cleanupFn => cleanupFn && cleanupFn());
            } else if (typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, [checkAuth, setupInactivityTimer]);

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
            // Almacenar datos de usuario en localStorage
            localStorage.setItem('user', JSON.stringify(userWithRole));
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
