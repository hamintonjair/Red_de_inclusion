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
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Mapa de beneficiarios registrados
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            alignItems: 'stretch',
          }}
        >
          <Box sx={{ width: { xs: '100%', md: 320 }, mb: { xs: 2, md: 0 } }}>
            <ComunasSidebar agrupadoPorComuna={agruparPorComunaYBarrio(registros)} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <MapaRegistros registros={registros} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DashboardMapa;
