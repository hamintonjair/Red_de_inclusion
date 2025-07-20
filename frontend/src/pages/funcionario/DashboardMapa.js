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
    setProgressRegistros({ loaded: 0, total: 0 });
    try {
      const pageSize = 100;
      let pagina = 1;
      let registrosAcumulados = [];
      let totalRegistros = 0;
      let continuar = true;

      while (continuar) {
        const resp = await beneficiarioService.obtenerBeneficiarios({
          linea_trabajo: user.linea_trabajo,
          por_pagina: pageSize,
          pagina,
        });

        // Normalizar respuesta
        const lista = Array.isArray(resp)
          ? resp
          : Array.isArray(resp?.beneficiarios)
            ? resp.beneficiarios
            : [];
        const total = resp?.total ?? lista.length + (pagina - 1) * pageSize;

        // Acumular y actualizar estados
        registrosAcumulados = registrosAcumulados.concat(lista);
        totalRegistros = total;
        setRegistros(pagina === 1 ? lista : [...registrosAcumulados]);
        setProgressRegistros({ loaded: registrosAcumulados.length, total: totalRegistros });

        // Salir si se acabaron los registros
        if (lista.length < pageSize) {
          continuar = false;
        } else {
          pagina += 1;
        }
      }

      // Limpieza final
      setError(null);
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
            <Grid item xs={12} md={8} lg={9} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '70vh' }}>
  <Box sx={{ flex: 1, position: 'relative', minHeight: 500 }}>
    <MapaRegistros registros={registros} loading={loading} />

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
