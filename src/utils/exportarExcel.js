// Función para exportar datos a Excel usando SheetJS
import * as XLSX from 'xlsx';

export function exportarExcel(estimados, reales) {
  // Convertir estimados y reales a arrays
  const estimadosArr = Object.entries(estimados).map(([nombre, datos]) => ({
    Concepto: nombre,
    Monto: datos.monto,
    Fecha: datos.fecha || '',
    Descripcion: datos.descripcion || '',
  }));
  const realesArr = Object.entries(reales).map(([nombre, datos]) => ({
    Concepto: nombre,
    Monto: datos.monto,
    Fecha: datos.fecha || '',
    Descripcion: datos.descripcion || '',
  }));

  // Crear libro y hojas
  const wb = XLSX.utils.book_new();
  const wsEstimados = XLSX.utils.json_to_sheet(estimadosArr);
  const wsReales = XLSX.utils.json_to_sheet(realesArr);
  XLSX.utils.book_append_sheet(wb, wsEstimados, 'Estimados');
  XLSX.utils.book_append_sheet(wb, wsReales, 'Reales');

  // Exportar
  XLSX.writeFile(wb, 'finanzas_personales.xlsx');
}
