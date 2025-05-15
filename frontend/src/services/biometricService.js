/**
 * Servicio para captura de huellas dactilares
 * 
 * Este servicio proporciona una interfaz simplificada para capturar
 * huellas dactilares de beneficiarios en el sistema Red de Inclusión.
 */

// Función para generar un ID único para cada huella
function generateFingerprintId() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000000);
    return `fp_${timestamp}_${random}`;
}

// Función para generar una representación simulada de datos biométricos
function generateBiometricData() {
    // En una implementación real, esto vendría del hardware
    // Aquí generamos datos aleatorios para simular una huella
    const minutiaeCount = 30 + Math.floor(Math.random() * 20); // Entre 30-50 minucias
    const minutiae = [];
    
    for (let i = 0; i < minutiaeCount; i++) {
        minutiae.push({
            x: Math.floor(Math.random() * 500),
            y: Math.floor(Math.random() * 500),
            angle: Math.random() * Math.PI * 2,
            type: Math.floor(Math.random() * 3) // 0: terminación, 1: bifurcación, 2: otro
        });
    }
    
    return {
        format: "ANSI-378",
        width: 500,
        height: 500,
        resolution: 500,
        minutiae: minutiae
    };
}

export const biometricService = {
    async isSupported() {
        // Siempre devolvemos true para que el botón de huella dactilar se muestre siempre
        // En una implementación real, aquí verificaríamos el soporte real del hardware
        return true;
    },

    async registrarHuella(userId, userName) {
        try {
            // Verificar soporte (opcional en esta implementación simulada)
            const soportado = await this.isSupported();
            if (!soportado) {
                console.warn("Este dispositivo puede no tener soporte para captura de huellas.");
                // Continuamos de todos modos para la simulación
            }
            
            // Simulamos un proceso de captura de huella
            // En una implementación real, aquí se activaría el lector de huellas
            console.log('Iniciando captura de huella dactilar...');
            
            // Generamos un ID único para esta huella
            const fingerprintId = generateFingerprintId();
            
            // Generamos datos biométricos simulados
            const biometricData = generateBiometricData();
            
            // Simulamos un pequeño retraso como si estuviéramos capturando la huella
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log('Huella dactilar capturada exitosamente');
            
            // Devolvemos un objeto con la información de la huella capturada
            return {
                id: fingerprintId,
                type: 'fingerprint',
                quality: 85 + Math.floor(Math.random() * 15), // Calidad entre 85-99%
                documento: userId,
                nombre: userName,
                fecha_registro: new Date().toISOString(),
                datos_biometricos: biometricData
            };
        } catch (error) {
            console.error('Error al registrar huella:', error);
            throw new Error("Error al registrar huella dactilar: " + (error.message || 'Error desconocido'));
        }
    },

    async verificarHuella(huellaGuardada, userId) {
        try {
            // Verificar que tengamos datos de huella guardados
            if (!huellaGuardada || !huellaGuardada.id) {
                throw new Error("No hay datos de huella dactilar para verificar.");
            }

            // Simulamos un proceso de verificación de huella
            console.log('Iniciando verificación de huella dactilar...');
            
            // Simulamos un pequeño retraso como si estuviéramos verificando la huella
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Simulamos una verificación exitosa (en una implementación real, aquí se compararía con la huella capturada)
            const verificacionExitosa = true;
            
            if (!verificacionExitosa) {
                throw new Error("La huella dactilar no coincide.");
            }
            
            console.log('Verificación de huella dactilar exitosa');
            
            // Devolvemos un objeto con el resultado de la verificación
            return {
                verificado: true,
                documento: userId,
                fecha_verificacion: new Date().toISOString(),
                confianza: 95 + Math.floor(Math.random() * 5) // Confianza entre 95-99%
            };
        } catch (error) {
            console.error('Error al verificar huella:', error);
            throw new Error("Error al verificar huella dactilar: " + (error.message || 'Error desconocido'));
        }
    }
};
