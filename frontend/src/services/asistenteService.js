import axios from 'axios';
import axiosInstance from '../utils/axiosConfig';

/**
 * Obtiene la lista completa de asistentes disponibles
 * @returns {Promise<Array>} - Lista de asistentes
 */
export const obtenerAsistentes = async () => {
  try {
    const response = await axiosInstance.get('/api/asistente', {
      timeout: 60000, // Aumentar timeout a 60 segundos
      timeoutErrorMessage: 'La solicitud está tomando más tiempo de lo esperado. Por favor, intente nuevamente.'
    });
    
    // Verificar si la respuesta tiene datos
    if (!response.data) {
      console.warn('La respuesta de la API no contiene datos');
      return [];
    }
    
    // Manejar diferentes formatos de respuesta
    const asistentes = response.data.data || response.data.asistentes || response.data || [];
    
    if (asistentes.length === 0) {
      console.warn('La lista de asistentes está vacía');
    }
    
    return asistentes;
  } catch (error) {
    console.error('Error al obtener los asistentes:', error);
    
    // Manejar diferentes tipos de errores
    if (error.code === 'ECONNABORTED') {
      console.error('La solicitud ha excedido el tiempo de espera');
      throw new Error('El servidor está tardando demasiado en responder. Por favor, verifica tu conexión e inténtalo de nuevo.');
    }
    
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de respuesta del servidor:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      if (error.response.status === 401) {
        // No autorizado - redirigir a login
        localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return [];
      }
      
      throw new Error(error.response.data.message || 'Error al cargar los asistentes');
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor');
      throw new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.');
    } else {
      // Algo más causó el error
      console.error('Error al configurar la solicitud:', error.message);
      throw new Error('Error al procesar la solicitud');
    }
  }
};

/**
 * Guarda los asistentes de una actividad
 * @param {string} actividadId - ID de la actividad
 * @param {Array} asistentes - Lista de asistentes a guardar
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const guardarAsistentes = async (actividadId, asistentes) => {
  try {
    const response = await axiosInstance.post(
      `/actividades/${actividadId}/asistentes`,
      { asistentes }
    );
    return response.data;
  } catch (error) {
    console.error('Error al guardar los asistentes:', error);
    throw error;
  }
};

/**
 * Exporta los asistentes a Excel
 * @param {string} actividadId - ID de la actividad
 * @returns {Promise} - Respuesta con el archivo Excel
 */
export const exportarAsistentesExcel = async (actividadId) => {
  try {
    const response = await axiosInstance.get(
      `/actividades/${actividadId}/asistentes/exportar`,
      { responseType: 'blob' }
    );
    return response;
  } catch (error) {
    console.error('Error al exportar los asistentes:', error);
    throw error;
  }
};
