import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Paper,
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from 'notistack';
import fondoImg from '../fondo/fondo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    if (!email.trim() || !password) {
      setError('Por favor ingrese correo y contraseña');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const usuario = await login(email.trim(), password);
      
      // Usar el estado de ubicación para redirigir a la ruta previa o al dashboard
      const from = location.state?.from?.pathname || 
                  (usuario.rol === 'admin' ? '/admin/dashboard' : '/funcionario/dashboard');
      
      navigate(from, { replace: true });
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Error de inicio de sesión';
      
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { 
        variant: 'error',
        autoHideDuration: 5000,
        preventDuplicate: true,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Grid container component="main" sx={{ minHeight: '100vh' }}>
      <CssBaseline />

      {/* Lado izquierdo con imagen */}
      <Grid
        item 
        xs={false} 
        sm={4} 
        md={7}
        sx={{
          backgroundImage: `url(${fondoImg})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundColor: '#f5f5f5',
          backgroundOrigin: 'content-box',
          padding: '20px',
          '@media (max-width: 600px)': {
            display: 'none'
          }
        }}
      />

      {/* Formulario de login */}
      <Grid 
        item 
        xs={12} 
        sm={8} 
        md={5} 
        component={Paper} 
        elevation={6} 
        square
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <Box 
          sx={{ 
            my: 8, 
            mx: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Iniciar Sesión
          </Typography>
          
          <Box 
            component="form" 
            noValidate 
            onSubmit={handleSubmit} 
            sx={{ 
              mt: 3,
              width: '100%',
              maxWidth: 400
            }}
          >
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 2 
                }}
              >
                {error}
              </Alert>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              sx={{ mt: 2, mb: 2 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none'
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Login;