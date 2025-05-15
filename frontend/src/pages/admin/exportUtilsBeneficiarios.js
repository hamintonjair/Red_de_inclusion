import * as XLSX from 'xlsx';

/**
 * Exporta una lista de beneficiarios a Excel.
 * @param {Array<Object>} beneficiarios - Lista de beneficiarios, cada objeto representa una fila.
 * @param {string} nombreArchivo - Nombre del archivo a descargar (por defecto 'listado_beneficiarios.xlsx').
 */
export async function exportarListadoBeneficiariosAExcel({ beneficiarios, nombreArchivo = 'listado_beneficiarios.xlsx' }) {
    if (!beneficiarios || beneficiarios.length === 0) return;
    // 1. Crear hoja con los datos de beneficiarios
    const ws = XLSX.utils.json_to_sheet(beneficiarios);

    // 2. Ajustar ancho de columnas automáticamente
    const cols = Object.keys(beneficiarios[0] || {});
    ws['!cols'] = cols.map(key => ({ wch: Math.max(key.length, ...beneficiarios.map(b => String(b[key] || '').length)) + 2 }));

    // 2.1. Poner encabezados en negrita
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = ws[cellAddress].s || {};
        ws[cellAddress].s.font = ws[cellAddress].s.font || {};
        ws[cellAddress].s.font.bold = true;
    }

    // 3. Crear libro y exportar
    const wb = XLSX.utils.book_new();
    wb.Sheets['Listado de Beneficiarios'] = ws;
    wb.SheetNames.push('Listado de Beneficiarios');
    XLSX.writeFile(wb, nombreArchivo, { cellStyles: true });
}
