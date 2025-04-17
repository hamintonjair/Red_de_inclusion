import React from 'react';
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
import { useState } from 'react';
import fondoImg from '../fondo/fondo.png';
import { useSnackbar } from 'notistack';
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { closeSnackbar } = useSnackbar();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const usuario = await login(email, password);
            // Cerrar snackbars antes de navegar para evitar errores de desmontaje
            closeSnackbar();
            setTimeout(() => {
                switch(usuario.rol) {
                    case 'admin':
                        navigate('/admin/dashboard');
                        break;
                    case 'funcionario':
                        navigate('/funcionario/dashboard');
                        break;
                    default:
                        setError('Rol no autorizado');
                }
            }, 300);
        } catch (err) {
            setError(err.message || 'Error de inicio de sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container component="main" sx={{ height: '100vh' }}>
            <CssBaseline />
            {loading && (
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    bgcolor: 'rgba(255,255,255,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1300
                }}>
                    <CircularProgress size={80} color="success" thickness={5} />
                </Box>
            )}
            <Grid
                item
                xs={false}
                sm={4}
                md={7}
                sx={{
                    backgroundImage:  `url(${fondoImg})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: (t) =>
                        t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                    backgroundSize: 'contain',
                    backgroundPosition: 'left',
                }}
            />
            <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                <Box
                    sx={{
                        my: 8,
                        mx: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
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
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Correo Electrónico"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
                        </Button>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};

export default Login;
