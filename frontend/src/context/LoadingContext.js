import React, { createContext, useContext } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const LoadingContext = createContext({});

export const LoadingProvider = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const drawerWidth = 240;
  const appBarHeight = 64;

  const getLoadingPosition = (sidebarOpen = true) => {
    return {
      position: 'fixed',
      top: `${appBarHeight}px`,
      left: sidebarOpen ? `${drawerWidth}px` : '0px',
      right: 0,
      bottom: 0,
      bgcolor: 'rgba(0,0,0,0.35)',
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(2px)',
      transition: theme.transitions.create(['left'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    };
  };

  return (
    <LoadingContext.Provider value={{ getLoadingPosition }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
