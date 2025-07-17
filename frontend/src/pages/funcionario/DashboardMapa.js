import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Button,
  Grid
} from '@mui/material';
import beneficiarioService from '../../services/beneficiarioService';
import MapaRegistros, { agruparPorComunaYBarrio } from '../../components/MapaRegistros';
import ComunasSidebar from '../../components/ComunasSidebar';
import { useAuth } from '../../context/AuthContext';

const DashboardMapa = () => {
  const [registros, setRegistros] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar todos los registros sin paginación
  const cargarRegistros = useCallback(async () => {
    if (!user?.linea_trabajo) return;
    
    setLoading(true);
    try {
      // Usar la nueva función que obtiene todos los registros sin paginación
      const items = await beneficiarioService.obtenerTodosBeneficiarios({ 
        linea_trabajo: user.linea_trabajo 
      });
      
      if (items && items.length > 0) {
        // Diagnóstico: Mostrar información sobre los registros
        console.log('=== DIAGNÓSTICO DE REGISTROS ===');
        console.log('Total de registros recibidos:', items.length);
        
        // Contar registros con/sin comuna
        const conComuna = items.filter(r => r.comuna).length;
        console.log(`- Con comuna: ${conComuna} (${items.length > 0 ? (conComuna/items.length*100).toFixed(1) : 0}%)`);
        
        // Contar registros con coordenadas completas
        const conCoordenadas = items.filter(r => r.barrio_lat && r.barrio_lng).length;
        console.log(`- Con coordenadas completas: ${conCoordenadas} (${items.length > 0 ? (conCoordenadas/items.length*100).toFixed(1) : 0}%)`);
        
        // Mostrar ejemplos de registros sin coordenadas
        const sinCoordenadas = items.filter(r => !r.barrio_lat || !r.barrio_lng).slice(0, 3);
        if (sinCoordenadas.length > 0) {
          console.log('Ejemplos de registros sin coordenadas completas:', sinCoordenadas);
        }
        
        // Mostrar distribución por comuna
        const porComuna = {};
        items.forEach(r => {
          const comuna = r.comuna || 'Sin comuna';
          porComuna[comuna] = (porComuna[comuna] || 0) + 1;
        });
        console.log('Distribución por comuna:', porComuna);
        
        // Mostrar nombres de barrios únicos
        const barriosUnicos = [...new Set(items.map(r => r.barrio).filter(Boolean))];
        console.log('Nombres de barrios únicos:', barriosUnicos);
        
        console.log('================================');
        
        setRegistros(items);
      }
    } catch (err) {
      console.error('Error al cargar registros:', err);
      setError('Error al cargar registros. Intente de nuevo más tarde.');
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  // Memoizar el cálculo de datos agrupados para evitar recálculos innecesarios
  const datosAgrupados = useMemo(() => {
    return agruparPorComunaYBarrio(registros);
  }, [registros]);

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Mapa de beneficiarios registrados
        </Typography>
      </Box>

      {loading && registros.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3, bgcolor: 'error.light', color: 'white', borderRadius: 1, mb: 2 }}>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            color="inherit" 
            onClick={cargarRegistros}
            sx={{ mt: 1 }}
          >
            Reintentar
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
              <ComunasSidebar 
                agrupadoPorComuna={datosAgrupados} 
                loading={loading && registros.length > 0}
              />
            </Grid>
            <Grid item xs={12} md={8} lg={9}>
              <Box sx={{ height: '70vh', minHeight: 500, position: 'relative' }}>
                <MapaRegistros registros={registros} loading={loading} />
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default DashboardMapa;
