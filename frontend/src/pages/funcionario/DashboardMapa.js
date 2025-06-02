import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import beneficiarioService from '../../services/beneficiarioService';
import MapaRegistros, { agruparPorComunaYBarrio } from '../../components/MapaRegistros';
import ComunasSidebar from '../../components/ComunasSidebar';
import { useAuth } from '../../context/AuthContext';

const DashboardMapa = () => {
  const [registros, setRegistros] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarRegistros = async () => {
      setLoading(true);
      try {
        let registrosFiltrados = [];
        if (user?.linea_trabajo) {
          // Pasar el filtro al backend para obtener solo los registros de la línea logueada
          const data = await beneficiarioService.obtenerBeneficiarios({ linea_trabajo: user.linea_trabajo, por_pagina: 100 });
          if (Array.isArray(data)) {
            registrosFiltrados = data;
          } else if (Array.isArray(data?.beneficiarios)) {
            registrosFiltrados = data.beneficiarios;
          }
        
        }
        setRegistros(registrosFiltrados);
      } catch (err) {
        setError('Error al cargar registros');
      } finally {
        setLoading(false);
      }
    };
    cargarRegistros();
  }, []);

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 auto',
      minHeight: 0,
      overflow: 'hidden',
      position: 'relative',
      p: { xs: 1, md: 0 }
    }}>
      <Typography variant="h6" sx={{ px: 2, py: 1, mb: 1 }}>
        Mapa de habitantes registrados
      </Typography>
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 400 
        }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: 'stretch',
            height: '100%',
            minHeight: 0,
            flex: '1 1 auto',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Box sx={{ 
            width: '100%',
            flex: { xs: '0 0 auto', md: '0 0 320px' },
            maxHeight: { xs: '40vh', md: '100%' },
            overflow: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 2,
            bgcolor: 'background.paper',
            boxShadow: 1
          }}>
            <ComunasSidebar agrupadoPorComuna={agruparPorComunaYBarrio(registros)} />
          </Box>
          <Box sx={{ 
            flex: 1, 
            minHeight: { xs: '50vh', md: '60vh' },
            position: 'relative',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            bgcolor: '#f5f5f5',
            whiteSpace: 'nowrap',
            p: 2,
            '& > div': {
              display: 'inline-block',
              whiteSpace: 'normal',
              verticalAlign: 'top',
              transformOrigin: 'top left',
              '@media (max-width: 900px)': {
                transform: 'scale(0.9)'
              },
              '@media (max-width: 600px)': {
                transform: 'scale(0.7)'
              }
            }
          }}>
            <MapaRegistros registros={registros} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DashboardMapa;
