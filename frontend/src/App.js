import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SnackbarProvider } from './context/SnackbarContext';
import AppRoutes from './routes';

function App() {
    return (
        <AuthProvider>
            <SnackbarProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </SnackbarProvider>
        </AuthProvider>
    );
}

export default App;
