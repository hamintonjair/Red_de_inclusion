import * as XLSX from 'xlsx-js-style';

/**
 * Exporta una lista de beneficiarios a Excel con estilos.
 * @param {Array<Object>} beneficiarios - Lista de beneficiarios, cada objeto representa una fila.
 * @param {string} nombreArchivo - Nombre del archivo a descargar (por defecto 'listado_beneficiarios.xlsx').
 */
export async function exportarListadoBeneficiariosAExcel({ 
    beneficiarios, 
    nombreArchivo = 'listado_beneficiarios.xlsx',
    onProgress 
}) {
    if (!beneficiarios || beneficiarios.length === 0) return;

    // 1. Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // 2. Procesar los datos en lotes para actualizar el progreso
    const totalFilas = beneficiarios.length;
    const loteSize = Math.max(1, Math.ceil(totalFilas / 10)); // Dividir en 10 lotes
    let filasProcesadas = 0;

    // Función para actualizar el progreso
    const actualizarProgreso = (incremento) => {
        if (onProgress) {
            filasProcesadas += incremento;
            const progreso = (filasProcesadas / totalFilas) * 100;
            onProgress(progreso);
        }
    };

    // 3. Procesar los datos en lotes
    const datosProcesados = [];
    for (let i = 0; i < beneficiarios.length; i++) {
        datosProcesados.push(beneficiarios[i]);
        
        // Actualizar progreso cada lote
        if (i > 0 && i % loteSize === 0) {
            actualizarProgreso(loteSize);
        }
    }
    actualizarProgreso(totalFilas % loteSize || 0); // Último lote

    // 4. Convertir los datos a una hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(datosProcesados);
    
    // 3. Obtener los encabezados
    const header = Object.keys(beneficiarios[0] || {});
    
    // 4. Aplicar estilos a los encabezados
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
        if (!ws[cellAddress]) continue;
        
        // Aplicar estilos al encabezado
        ws[cellAddress].s = {
            font: { bold: true, color: { rgb: 'FFFFFFFF' } },
            fill: { fgColor: { rgb: '1976D2' }, patternType: 'solid' },
            alignment: { vertical: 'center', horizontal: 'center', wrapText: true }
        };
    }
    
    // 5. Definir anchos personalizados para columnas específicas
    const anchosPersonalizados = {
        'FECHA DE REGISTRO': 10,
        'NOMBRE COMPLETO': 25,
        'TIPO DOCUMENTO': 18,
        'IDENTIFICACIÓN': 13,
        'GÉNERO': 15,
        'RANGO DE EDAD': 5,
        'COMUNA': 10,
        'BARRIO': 20,
        'CORREO ELECTRÓNICO': 25,
        'NÚMERO CELULAR': 13,
        'LÍNEA DE TRABAJO': 18,
        '¿ESTUDIA?': 5,
        'NIVEL EDUCATIVO': 10,
        '¿LABORA/ESTUDIA?': 18,
        '¿LEE?': 5,
        '¿ESCRIBE?': 5,
        'TIPO DE VIVIENDA': 10,
        'ÉTNIA': 15,
        '¿RECIBE AYUDA?': 5,
        'TIPO DE AYUDA': 25,
        'DISCAPACIDAD': 5,
        '¿TIENE CERTIFICADO DISCAPACIDAD?': 15,
        'TIPO DE DISCAPACIDAD': 10,
        'NOMBRE DEL CUIDADOR/A': 25,
        '¿TRABAJA?': 5,
        '¿VÍCTIMA?': 5
    };

    // 6. Ajustar el ancho de las columnas
    const colWidths = header.map(h => {
        // Usar ancho personalizado si existe, de lo contrario calcularlo
        const anchoPersonalizado = anchosPersonalizados[h];
        if (anchoPersonalizado) {
            return { wch: anchoPersonalizado };
        }
        
        // Calcular ancho basado en el contenido
        const contenido = beneficiarios.map(row => String(row[h] || '').length);
        const anchoContenido = Math.max(...contenido, h.length);
        
        // Limitar el ancho máximo y mínimo
        return { 
            wch: Math.min(
                Math.max(anchoContenido * 1.2, h.length * 1.5),
                50 // Ancho máximo por defecto
            )
        };
    });
    
    ws['!cols'] = colWidths;
    
    // 7. Configurar alturas de fila para asegurar que todas sean visibles
    const rowCount = datosProcesados.length + 1; // +1 para el encabezado
    const rowHeights = [];
    
    // Configurar altura para el encabezado (fila 0)
    rowHeights[0] = { hpx: 70 };
    
    // Configurar altura para las filas de datos
    for (let i = 1; i < rowCount; i++) {
        rowHeights[i] = { hpx: 20 }; // Altura estándar para filas de datos
    }
    
    ws['!rows'] = rowHeights;
    
    // 8. Asegurar que el texto se ajuste y se muestre completo en todas las celdas
    const columnRange = XLSX.utils.decode_range(ws['!ref']);
    
    // Aplicar estilos a todas las celdas
    for (let R = columnRange.s.r; R <= columnRange.e.r; ++R) {
        for (let C = columnRange.s.c; C <= columnRange.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
            
            if (!ws[cellAddress]) {
                ws[cellAddress] = { v: '' };
            }
            
            if (!ws[cellAddress].s) {
                ws[cellAddress].s = {};
            }
            
            // Estilo para celdas de encabezado (fila 0)
            if (R === 0) {
                ws[cellAddress].s = {
                    font: { bold: true, color: { rgb: 'FFFFFFFF' } },
                    fill: { fgColor: { rgb: '1976D2' }, patternType: 'solid' },
                    alignment: { 
                        vertical: 'center', 
                        horizontal: 'center',
                        wrapText: true
                    }
                };
            } else {
                // Estilo para celdas de datos
                ws[cellAddress].s = {
                    alignment: { 
                        vertical: 'top',
                        wrapText: true
                    }
                };
            }
        }
    }
    
    // 7. Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Habitantes');
    
    // 8. Generar el archivo Excel
    XLSX.writeFile(wb, nombreArchivo);
}
