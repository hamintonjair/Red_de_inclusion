import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SnackbarProvider } from './context/SnackbarContext';
import AppRoutes from './routes';
import VerificacionPublica from './pages/verificacion/VerificacionPublica';

function App() {
    return (
        <AuthProvider>
            <SnackbarProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/verificar" element={<VerificacionPublica />} />
                        <Route path="/verificar/beneficiario/:documento" element={<VerificacionPublica />} />
                        <Route path="/*" element={<AppRoutes />} />
                    </Routes>
                </BrowserRouter>
            </SnackbarProvider>
        </AuthProvider>
    );
}

export default App;
