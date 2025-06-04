import axios from 'axios';
import axiosInstance from '../utils/axiosConfig';

/**
 * Obtiene los asistentes de una actividad
 * @param {string} actividadId - ID de la actividad
 * @returns {Promise<Array>} - Lista de asistentes
 */
export const obtenerAsistentes = async (actividadId) => {
  try {
    const response = await axiosInstance.get(`/actividades/${actividadId}/asistentes`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los asistentes:', error);
    throw error;
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
