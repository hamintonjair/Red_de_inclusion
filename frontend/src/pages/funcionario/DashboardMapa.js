import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Button,
  LinearProgress,
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
  const [progressRegistros, setProgressRegistros] = useState({ loaded: 0, total: 0 });

  // Cargar registros con paginación incremental
  const cargarRegistros = useCallback(async () => {
    if (!user?.linea_trabajo) return;

    setLoading(true);
    setError(null);
    setProgressRegistros({ loaded: 0, total: 0 });
    
    try {
      const MAX_RECORDS = 700; // Límite de registros para el mapa
      const pageSize = 50; // Reducir el tamaño de página para cargas más rápidas
      let pagina = 1;
      let registrosAcumulados = [];
      let totalRegistros = 0;

      // Primero obtenemos solo el conteo total
      try {
        const conteo = await beneficiarioService.contarBeneficiarios({
          linea_trabajo: user.linea_trabajo
        });
        totalRegistros = conteo?.total || 0;
        setProgressRegistros(prev => ({ ...prev, total: totalRegistros }));
      } catch (error) {
        console.error('Error obteniendo conteo total:', error);
        // Continuar aunque falle el conteo
      }

      // Luego cargamos los datos en lotes
      while (registrosAcumulados.length < MAX_RECORDS) {
        try {
          const resp = await beneficiarioService.obtenerBeneficiarios({
            linea_trabajo: user.linea_trabajo,
            por_pagina: Math.min(pageSize, MAX_RECORDS - registrosAcumulados.length),
            pagina,
            campos: 'id,comuna,barrio,barrio_lat,barrio_lng,nombre_completo' // Solo los campos necesarios
          });

          // Normalizar respuesta
          const lista = Array.isArray(resp)
            ? resp
            : Array.isArray(resp?.beneficiarios)
              ? resp.beneficiarios
              : [];
          
          // Si no hay más registros, salir
          if (lista.length === 0) break;

          // Filtrar registros sin coordenadas
          const registrosConCoordenadas = lista.filter(r => r.barrio_lat && r.barrio_lng);
          
          registrosAcumulados = [...registrosAcumulados, ...registrosConCoordenadas];
          
          // Actualizar el estado con los registros cargados
          setRegistros(registrosAcumulados);
          setProgressRegistros({ 
            loaded: registrosAcumulados.length, 
            total: totalRegistros || registrosAcumulados.length
          });

          // Si ya alcanzamos el límite o no hay más registros, salir
          if (lista.length < pageSize || registrosAcumulados.length >= MAX_RECORDS) {
            break;
          }
          
          pagina += 1;
          
        } catch (error) {
          console.error(`Error cargando página ${pagina}:`, error);
          setError('Error cargando algunos registros. Mostrando los disponibles.');
          break; // Salir del bucle en caso de error
        }
      }

      // Mostrar mensaje si no hay registros
      if (registrosAcumulados.length === 0) {
        setError('No se encontraron registros con coordenadas para mostrar en el mapa.');
      }
    } catch (err) {
      console.error('Error en la carga de registros:', err);
      setError('Error al cargar los registros. Por favor, intente de nuevo más tarde.');
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
        <Box sx={{ p: 3, bgcolor: 'error.light', color: 'black', borderRadius: 1, mb: 2 }}>
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
            <Grid item xs={12} md={8} lg={9} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '70vh' }}>
  <Box sx={{ flex: 1, position: 'relative', minHeight: 500 }}>
      <MapaRegistros 
        registros={registros} 
        totalRegistros={progressRegistros.total || registros.length}
      /> 

    {/* Overlay de progreso */}
    {progressRegistros.total > 0 && progressRegistros.loaded < progressRegistros.total && (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(255,255,255,0.75)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
        }}
      >
        <Typography sx={{ mb: 1 }}>
          Cargando registros {progressRegistros.loaded} de {progressRegistros.total}...
        </Typography>
        <Box sx={{ width: '80%', maxWidth: 400 }}>
          <LinearProgress
            variant="determinate"
            value={(progressRegistros.loaded / progressRegistros.total) * 100}
          />
        </Box>
      </Box>
    )}
  </Box>
</Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default DashboardMapa;
