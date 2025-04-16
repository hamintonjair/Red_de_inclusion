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
    Add as AddIcon
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import fondoImg from '../../fondo/fondo.png';

const menuItems = [
    { 
        text: 'Dashboard', 
        icon: <DashboardIcon />, 
        path: '/funcionario/dashboard' 
    },
    { 
        text: 'Beneficiarios', 
        icon: <PeopleIcon />, 
        path: '/funcionario/beneficiarios' 
    },
    { 
        text: 'Registrar Beneficiario', 
        icon: <AddIcon />, 
        path: '/funcionario/beneficiarios/registro' 
    },
    { 
        text: 'Perfil', 
        icon: <PersonIcon />, 
        path: '/funcionario/perfil' 
    }
];

const FuncionarioLayout = () => {
    const [open, setOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

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
                                       backgroundSize: '100% 100%',
                                       backgroundPosition: 'center',
                                       backgroundRepeat: 'no-repeat',
                                       color: '#fff',
                                       height: 90,
                                       justifyContent: 'center',
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
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
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
                    width: open ? 240 : 57,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    '& .MuiDrawer-paper': {
                        width: open ? 240 : 57,
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
                    {menuItems.map((item) => (
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
                    p: 12, 
                    mt: 35,
                    ml: open ? '240px' : '57px',
                    maxWidth: '1600px', // Nuevo ancho máximo
                    width: '100%',
                    margin: '0 auto', // C
                    transition: (theme) => theme.transitions.create('margin', {
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
