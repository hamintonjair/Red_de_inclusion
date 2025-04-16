import axiosInstance from '../config/axiosConfig';

export const obtenerNombreLineaTrabajo = async (nombreLineaTrabajo) => {
    try {
        // Codificar el nombre de la línea de trabajo para manejar espacios y caracteres especiales
        const lineaTrabajoEncoded = encodeURIComponent(nombreLineaTrabajo);
        
        const response = await axiosInstance.get(`/lineas-trabajo/${lineaTrabajoEncoded}`);
        
        // Devolver el ID de la línea de trabajo
        return response.data._id;
    } catch (error) {
        console.error('Error detallado al obtener línea de trabajo:', {
            mensaje: error.message,
            respuesta: error.response?.data,
            estado: error.response?.status,
            nombreLineaTrabajo: nombreLineaTrabajo
        });
        
        // Lanzar el error para que pueda ser manejado por el llamador
        throw error;
    }
};

// Función para obtener todas las líneas de trabajo
export const obtenerLineasTrabajo = async () => {
    try {
        const response = await axiosInstance.get('/lineas-trabajo');
        return response.data;
    } catch (error) {
        console.error('Error al obtener líneas de trabajo:', error);
        throw error;
    }
};

const lineaTrabajoService = {
    obtenerNombreLineaTrabajo,
    obtenerLineasTrabajo
};

export default lineaTrabajoService;
