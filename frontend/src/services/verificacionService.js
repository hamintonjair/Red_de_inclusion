import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;


export const verificacionService = {
    async verificarBeneficiario(documento, codigoVerificacion) {
        try {
            const response = await axios.get(`${API_URL}/beneficiarios/verificar`, {
                params: { 
                    documento, 
                    codigo_verificacion: codigoVerificacion 
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al verificar beneficiario:', error);
            throw error;
        }
    }
};
