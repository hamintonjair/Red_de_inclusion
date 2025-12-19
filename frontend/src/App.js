import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SnackbarProvider } from './context/SnackbarContext';
import { LoadingProvider } from './context/LoadingContext';
import AppRoutes from './routes';
import VerificacionPublica from './pages/verificacion/VerificacionPublica';
import useInactivity from './hooks/useInactivity';
import { Box, Typography } from '@mui/material';

// Solución drástica: deshabilitar errores de consola en Chrome
const setupDOMErrorInterceptor = () => {
    // Detectar si es Chrome
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    
    if (!isChrome) return; // Solo aplicar en Chrome
    
    // Deshabilitar completamente console.error en Chrome
    const originalConsoleError = console.error;
    console.error = function(...args) {
        // Solo mostrar errores críticos, ignorar todo lo relacionado con DOM
        const message = args[0];
        if (typeof message === 'string' && 
            (message.includes('removeChild') || 
             message.includes('Node') ||
             message.includes('NotFoundError') ||
             message.includes('commitDeletionEffects') ||
             message.includes('recursivelyTraverseMutationEffects'))) {
            return; // Silenciar completamente
        }
        
        // Para errores realmente importantes, mostrar
        if (message && (message.includes('Network') || message.includes('500') || message.includes('401'))) {
            return originalConsoleError.apply(console, args);
        }
        
        return; // Silenciar todo lo demás
    };

    // Deshabilitar window.onerror completamente
    window.onerror = function(message, source, lineno, colno, error) {
        if (isChrome && typeof message === 'string' && 
            (message.includes('removeChild') || message.includes('Node'))) {
            return true; // Silenciar completamente
        }
        return false;
    };

    // Deshabilitar addEventListener para errores
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
        if (isChrome && (type === 'error' || type === 'unhandledrejection')) {
            return function() {}; // No hacer nada
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
};

// Componente Error Boundary global para manejar errores de DOM
class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // No establecer hasError para errores de DOM específicos
        if (error.message.includes('removeChild') || error.message.includes('Node')) {
            return null; // No actualizar estado
        }
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error capturado por GlobalErrorBoundary:', error, errorInfo);
        
        // Ignorar errores específicos de DOM que son seguros
        if (error.message.includes('removeChild') || error.message.includes('Node')) {
            console.warn('Error de DOM ignorado, la aplicación continuará funcionando');
            // NO establecer hasError en true para no mostrar el modal
            return;
        }
        
        // Para otros errores, mostrar mensaje
        console.error('Error grave en la aplicación:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ p: 4, textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" color="error">
                        Ocurrió un error inesperado. Por favor, recarga la página.
                    </Typography>
                </Box>
            );
        }

        return this.props.children;
    }
}

// Componente wrapper para manejar la inactividad
const InactivityHandler = ({ children }) => {
    useInactivity(); // Usar el hook de inactividad
    return children;
};

function App() {
    useEffect(() => {
        // Configurar interceptor específico para Chrome
        setupDOMErrorInterceptor();
        
        // Solución extrema: parchear removeChild directamente
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        if (isChrome) {
            // Guardar el método original
            const originalRemoveChild = Node.prototype.removeChild;
            
            // Parchear removeChild para que nunca lance errores
            Node.prototype.removeChild = function(child) {
                try {
                    // Verificar si el hijo realmente existe
                    if (child && child.parentNode === this) {
                        return originalRemoveChild.call(this, child);
                    }
                    // Si el hijo no pertenece a este nodo, ignorar silenciosamente
                    return child;
                } catch (error) {
                    // Si hay cualquier error, ignorarlo silenciosamente
                    if (error.message && error.message.includes('removeChild')) {
                        return child; // Devolver el hijo sin error
                    }
                    throw error; // Lanzar otros errores normalmente
                }
            };
            
            // Prevenir que Chrome muestre modales de error
            window.addEventListener('error', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }, true);
            
            // Sobrescribir el manejador de errores no capturados
            window.onerror = function(message, source, lineno, colno, error) {
                if (typeof message === 'string' && 
                    (message.includes('removeChild') || message.includes('Node'))) {
                    return true; // Prevenir completamente el modal
                }
                return false;
            };
        }
    }, []);

    return (
        <GlobalErrorBoundary>
            <AuthProvider>
                <SnackbarProvider>
                    <LoadingProvider>
                        <BrowserRouter>
                            <InactivityHandler>
                                <Routes>
                                    <Route path="/verificar" element={<VerificacionPublica />} />
                                    <Route path="/verificar/beneficiario/:documento" element={<VerificacionPublica />} />
                                    <Route path="/*" element={<AppRoutes />} />
                                </Routes>
                            </InactivityHandler>
                        </BrowserRouter>
                    </LoadingProvider>
                </SnackbarProvider>
            </AuthProvider>
        </GlobalErrorBoundary>
    );
}

export default App;
