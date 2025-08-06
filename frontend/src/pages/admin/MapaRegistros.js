import React from 'react';
import MapaRegistros from '../../components/MapaRegistros';
import beneficiarioService from '../../services/beneficiarioService';
import { Box, Typography, CircularProgress } from '@mui/material';

const MapaRegistrosPage = () => {
  const [registros, setRegistros] = React.useState([]);
  const [totalRegistros, setTotalRegistros] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const cargarRegistros = async () => {
      console.log('Iniciando carga de registros...');
      setLoading(true);
      try {
        // 1. Primero obtenemos el total de registros
        console.log('Obteniendo conteo total de beneficiarios...');
        const total = await beneficiarioService.contarBeneficiarios();
        console.log('Total de beneficiarios obtenido:', total);
        setTotalRegistros(total || 0);
        
        // 2. Luego obtenemos los registros para el mapa (limitado a 800)
        const response = await beneficiarioService.obtenerBeneficiarios({
          por_pagina: 800,
          pagina: 1,
          incluir_total: true
        });
                
        // 3. Procesar la respuesta para extraer los registros
        let registrosObtenidos = [];
        
        // Verificar diferentes formatos de respuesta
        if (Array.isArray(response)) {
          registrosObtenidos = response;
        } else if (response?.data) {
          if (Array.isArray(response.data)) {
            registrosObtenidos = response.data;
          } else if (Array.isArray(response.data.beneficiarios)) {
            registrosObtenidos = response.data.beneficiarios;
          }
        } else if (Array.isArray(response?.beneficiarios)) {
          registrosObtenidos = response.beneficiarios;
        }
        setRegistros(registrosObtenidos);
        
      } catch (err) {
        console.error('Error al cargar registros:', err);
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
        Mapa de registros de beneficiarios
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <MapaRegistros registros={registros} totalRegistros={totalRegistros} />
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            p: 1.5,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            border: '1px solid #e0e0e0',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Mostrando {Math.min(registros.length, 800)} de {totalRegistros} registros
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Límite: 800 registros
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default MapaRegistrosPage;
