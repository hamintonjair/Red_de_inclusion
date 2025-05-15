import React, { useMemo } from 'react';
// Mapa personalizado sobre imagen SVG de comunas de Quibdó

// Colores por comuna
export const COMUNA_COLORS = {
  'Comuna 1': '#e74c3c', // Rojo
  'Comuna 2': '#e67e22', // Naranja
  'Comuna 3': '#f1c40f', // Amarillo
  'Comuna 4': '#27ae60', // Verde
  'Comuna 5': '#2980b9', // Azul
  'Comuna 6': '#8e44ad', // Morado
};

// Agrupa los registros por comuna y barrio
export function agruparPorComunaYBarrio(registros) {
  const resultado = {};
  registros.forEach(r => {
    if (!resultado[r.comuna]) resultado[r.comuna] = {};
    if (!resultado[r.comuna][r.barrio]) resultado[r.comuna][r.barrio] = 0;
    resultado[r.comuna][r.barrio]++;
  });
  return resultado;
}

const MapaRegistros = ({ registros }) => {
  // Agrupar registros por barrio y coordenadas
  // Mostrar cada registro individual como un punto, sin agrupar
  const barriosMarcados = useMemo(() => {
    // Cada registro es un punto, sin agrupar
    return registros.map(r => ({
      comuna: r.comuna,
      barrio: r.barrio,
      lat: r.barrio_lat,
      lng: r.barrio_lng,
    }));
  }, [registros]);

  // Conversión de lat/lng a coordenadas X/Y sobre la imagen SVG
  const latLngToXY = (lat, lng) => {
    // Estos valores deben coincidir con la proyección de tu SVG
    const minLat = 5.6800, maxLat = 5.7000;
    const minLng = -76.6820, maxLng = -76.6400;
    const width = 1200;
    const height = 900;
    const x = ((lng - minLng) / (maxLng - minLng)) * width;
    const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
    return { x, y };
  };

  return (
    <div className="mapa-beneficiarios-print" style={{ position: 'relative', width: 1200, height: 900, margin: '0 auto', background: '#fff', border: '1px solid #ccc' }}>
      <img src="/fondo/comunas_quibdo.svg" alt="Mapa comunas Quibdó" style={{ width: 1200, height: 900, display: 'block' }} />
      {barriosMarcados.map((barrio, idx) => {
        const { x, y } = latLngToXY(barrio.lat, barrio.lng);
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: x - 8,
              top: y - 8,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: COMUNA_COLORS[barrio.comuna] || '#555',
              border: '2px solid #fff',
              boxShadow: '0 1px 4px #0006',
              zIndex: 2
            }}
            title={barrio.barrio + ' (' + barrio.comuna + ')'}
          />
        );
      })}
    </div>
  );
};

export default MapaRegistros;
