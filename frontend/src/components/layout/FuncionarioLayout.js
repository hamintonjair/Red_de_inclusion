import React, { useState } from 'react';
import { 
    Box, 
    CssBaseline, 
    Drawer, 
    AppBar, 
    Toolbar, 
    List, 
    Typography, 
    Divider, 
    IconButton, 
    ListItem, 
    ListItemIcon, 
    ListItemText,
    Avatar
} from '@mui/material';
import { 
    Menu as MenuIcon, 
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Event as EventIcon,
    Group as GroupIcon
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import fondoImg from '../../fondo/fondo.png';

// Definir las rutas base para cada tipo de beneficiario
const RUTAS_BENEFICIARIOS = {
    // Ruta para población migrante
    'Población Migrante': {
        text: 'Migrantes',
        path: '/funcionario/poblacion-migrante',
        icon: <PeopleIcon />
    },
    // Ruta por defecto para otras líneas de trabajo
    '_default': {
        text: 'Habitantes',
        path: '/funcionario/beneficiarios',
        icon: <PeopleIcon />
    }
};

// Elementos del menú base
const menuItemsBase = [
    { 
        text: 'Dashboard', 
        icon: <DashboardIcon />, 
        path: '/funcionario/dashboard'
    },
    // Este ítem será reemplazado dinámicamente según la línea de trabajo
    { 
        text: 'Beneficiarios', // Texto temporal, será reemplazado
        icon: null, // Se establecerá dinámicamente
        path: '' // Ruta temporal, será reemplazada
    },
    { 
        text: 'Actividades', 
        icon: <EventIcon />, 
        path: '/funcionario/actividades'
    },
    { 
        text: 'Asistentes', 
        icon: <GroupIcon />, 
        path: '/funcionario/asistentes'
    },
    { 
        text: 'Perfil', 
        icon: <PersonIcon />, 
        path: '/funcionario/perfil'
    }
];

export const FuncionarioLayout = ({ children }) => {
    const [open, setOpen] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Obtener la configuración de la ruta de beneficiarios según la línea de trabajo
    const configuracionBeneficiarios = RUTAS_BENEFICIARIOS[user?.linea_trabajo_nombre] || RUTAS_BENEFICIARIOS._default;
    
    // Crear una copia del menú base
    const menuItems = [...menuItemsBase];
    
    // Encontrar el ítem de beneficiarios y actualizarlo con la configuración correcta
    const indiceBeneficiarios = menuItems.findIndex(item => item.text === 'Beneficiarios');
    if (indiceBeneficiarios !== -1) {
        menuItems[indiceBeneficiarios] = {
            ...menuItems[indiceBeneficiarios],
            text: configuracionBeneficiarios.text,
            path: configuracionBeneficiarios.path,
            icon: configuracionBeneficiarios.icon
        };
    }
    
    // Filtrar elementos del menú si es necesario
    const filteredMenuItems = menuItems;

    const toggleDrawer = () => {
        setOpen(!open);
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                open={open}
                sx={{
                    backgroundImage: `url(${fondoImg})`,
                    backgroundSize: { xs: 'cover', md: '100% 100%' },
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    color: '#fff',
                    height: 90,
                    justifyContent: 'center',
                    transition: (theme) => theme.transitions.create(['margin-left', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    ml: { xs: 0, md: open ? '280px' : '57px' },
                    width: { xs: '100%', md: `calc(100% - ${open ? 280 : 57}px)` },
                }}
            >
                <Toolbar sx={{ minHeight: 90 }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={toggleDrawer}
                        edge="start"
                        sx={{
                            marginRight: 5,
                            ...(open && { display: 'none' }),
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1, textShadow: '0 3px 12px #000, 0 1px 0 #000, 2px 2px 8px #000' }}>
                        Panel de Funcionario
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                            {user?.nombre?.charAt(0).toUpperCase()}
                        </Avatar>
                        <IconButton color="inherit" onClick={handleLogout} sx={{ backgroundColor: 'green', '&:hover': { backgroundColor: '#388e3c' } }}>
                            <LogoutIcon />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer 
                variant="permanent" 
                open={open}
                sx={{
                    width: open ? 280 : 57,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    '& .MuiDrawer-paper': {
                        width: open ? 280 : 57,
                        transition: (theme) => theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflowX: 'hidden',
                    },
                }}
            >
                <Toolbar>
                    <IconButton onClick={toggleDrawer}>
                        <ChevronLeftIcon />
                    </IconButton>
                </Toolbar>
                <Divider />
                <List>
                    {filteredMenuItems.map((item) => (
                        <ListItem 
                            button 
                            key={item.text}
                            onClick={() => handleNavigation(item.path)}
                            selected={
                                item.path === '/funcionario/beneficiarios' 
                                    ? location.pathname === item.path 
                                    : location.pathname.startsWith(item.path)
                            }
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Box 
                component="main" 
                sx={{
                    flexGrow: 1,
                    width: '100%',
                    maxWidth: '100%',
                    ml: { xs: 0, md: open ? '240px' : '57px' },
                    margin: { xs: 0, md: '0 auto' },
                    p: { xs: 1, sm: 2, md: 4, lg: 6 },
                    mt: { xs: 12, md: 8 },
                    boxSizing: 'border-box',
                    transition: (theme) => theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default FuncionarioLayout;
