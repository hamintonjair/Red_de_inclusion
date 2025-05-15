import React, { useState, useEffect, useRef } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from 'notistack';
import fondoImg from '../fondo/fondo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Para evitar actualizaciones cuando el componente ya esté desmontado
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const usuario = await login(email, password);
      if (!isMounted.current) return;

      switch (usuario.rol) {
        case 'admin':
          return navigate('/admin/dashboard');
        case 'funcionario':
          return navigate('/funcionario/dashboard');
        default:
          setError('Rol no autorizado');
          enqueueSnackbar('Rol no autorizado', { variant: 'error' });
      }
    } catch (err) {
      if (isMounted.current) {
        const msg = err.message || 'Error de inicio de sesión';
        setError(msg);
        enqueueSnackbar(msg, { variant: 'error' });
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <CssBaseline />

      {/* Lado izquierdo con imagen */}
      <Grid
        item xs={false} sm={4} md={7}
        sx={{
          backgroundImage: `url(${fondoImg})`,
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) =>
            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'contain',
          backgroundPosition: 'left',
        }}
      />

      {/* Formulario de login */}
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Iniciar Sesión
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              disabled={loading}
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
            />
            <TextField
              disabled={loading}
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
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Login;
