// Función para exportar datos a Excel usando SheetJS
import * as XLSX from 'xlsx';

/**
 * Exporta los datos financieros a un archivo Excel con 3 hojas:
 * 1. Estimados (por mes)
 * 2. Reales (con detalle de gastos)
 * 3. Resumen Mensual (comparativa con KPIs)
 */
export function exportarExcel(estimados, reales, mesesDisponibles) {
  const wb = XLSX.utils.book_new();

  // ==================== HOJA 1: ESTIMADOS ====================
  const datosEstimados = [];
  mesesDisponibles.forEach(mes => {
    const datosEst = estimados[mes] || {};
    const ingreso = Number(datosEst.ingreso || 0);
    const inversion = Number(datosEst.inversion || 0);
    const conceptos = datosEst.conceptos || [];
    
    const totalGastos = conceptos.reduce((sum, c) => sum + Number(c.monto || 0), 0);
    
    // Fila resumen del mes
    datosEstimados.push({
      Mes: new Date(mes + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
      Tipo: 'RESUMEN',
      Concepto: '',
      Monto: '',
      Ingreso: ingreso,
      'Total Gastos': totalGastos,
      Inversión: inversion,
      'Ahorro Estimado': ingreso - totalGastos - inversion
    });

    // Conceptos de gasto
    conceptos.forEach(concepto => {
      datosEstimados.push({
        Mes: '',
        Tipo: 'Gasto',
        Concepto: concepto.nombre,
        Monto: Number(concepto.monto || 0),
        Ingreso: '',
        'Total Gastos': '',
        Inversión: '',
        'Ahorro Estimado': ''
      });
    });

    // Línea en blanco entre meses
    datosEstimados.push({
      Mes: '', Tipo: '', Concepto: '', Monto: '', Ingreso: '', 'Total Gastos': '', Inversión: '', 'Ahorro Estimado': ''
    });
  });

  const wsEstimados = XLSX.utils.json_to_sheet(datosEstimados);
  
  // Ajustar ancho de columnas
  wsEstimados['!cols'] = [
    { wch: 20 }, // Mes
    { wch: 12 }, // Tipo
    { wch: 25 }, // Concepto
    { wch: 12 }, // Monto
    { wch: 12 }, // Ingreso
    { wch: 15 }, // Total Gastos
    { wch: 12 }, // Inversión
    { wch: 15 }  // Ahorro Estimado
  ];

  XLSX.utils.book_append_sheet(wb, wsEstimados, 'Estimados');

  // ==================== HOJA 2: REALES ====================
  const datosReales = [];
  mesesDisponibles.forEach(mes => {
    const datosReal = reales[mes] || {};
    const ingreso = Number(datosReal.ingreso || 0);
    const inversion = Number(datosReal.inversion || 0);
    const ganadoInversion = Number(datosReal.ganadoInversion || 0);
    const conceptos = datosReal.conceptos || [];
    
    const totalGastos = conceptos.reduce((sum, c) => {
      const gastosConcepto = (c.gastos || []).reduce((s, g) => s + Number(g.monto || 0), 0);
      return sum + gastosConcepto;
    }, 0);
    
    // Fila resumen del mes
    datosReales.push({
      Mes: new Date(mes + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
      Tipo: 'RESUMEN',
      Concepto: '',
      Detalle: '',
      Monto: '',
      Ingreso: ingreso,
      'Total Gastos': totalGastos,
      Inversión: inversion,
      'Ganancia Inv.': ganadoInversion,
      'Ahorro Real': ingreso - totalGastos - inversion
    });

    // Conceptos con sus gastos detallados
    conceptos.forEach(concepto => {
      const gastosConcepto = concepto.gastos || [];
      
      if (gastosConcepto.length === 0) {
        // Concepto sin detalle
        datosReales.push({
          Mes: '',
          Tipo: 'Gasto',
          Concepto: concepto.nombre,
          Detalle: '',
          Monto: '',
          Ingreso: '',
          'Total Gastos': '',
          Inversión: '',
          'Ganancia Inv.': '',
          'Ahorro Real': ''
        });
      } else {
        // Concepto con items detallados
        const totalConcepto = gastosConcepto.reduce((s, g) => s + Number(g.monto || 0), 0);
        
        datosReales.push({
          Mes: '',
          Tipo: 'Gasto',
          Concepto: concepto.nombre,
          Detalle: 'Total:',
          Monto: totalConcepto,
          Ingreso: '',
          'Total Gastos': '',
          Inversión: '',
          'Ganancia Inv.': '',
          'Ahorro Real': ''
        });

        gastosConcepto.forEach(gasto => {
          datosReales.push({
            Mes: '',
            Tipo: '',
            Concepto: '',
            Detalle: '  • ' + gasto.detalle,
            Monto: Number(gasto.monto || 0),
            Ingreso: '',
            'Total Gastos': '',
            Inversión: '',
            'Ganancia Inv.': '',
            'Ahorro Real': ''
          });
        });
      }
    });

    // Línea en blanco entre meses
    datosReales.push({
      Mes: '', Tipo: '', Concepto: '', Detalle: '', Monto: '', Ingreso: '', 'Total Gastos': '', Inversión: '', 'Ganancia Inv.': '', 'Ahorro Real': ''
    });
  });

  const wsReales = XLSX.utils.json_to_sheet(datosReales);
  
  // Ajustar ancho de columnas
  wsReales['!cols'] = [
    { wch: 20 }, // Mes
    { wch: 12 }, // Tipo
    { wch: 25 }, // Concepto
    { wch: 30 }, // Detalle
    { wch: 12 }, // Monto
    { wch: 12 }, // Ingreso
    { wch: 15 }, // Total Gastos
    { wch: 12 }, // Inversión
    { wch: 15 }, // Ganancia Inv.
    { wch: 15 }  // Ahorro Real
  ];

  XLSX.utils.book_append_sheet(wb, wsReales, 'Reales');

  // ==================== HOJA 3: RESUMEN MENSUAL ====================
  const datosResumen = mesesDisponibles.map(mes => {
    const datosEst = estimados[mes] || {};
    const datosReal = reales[mes] || {};
    
    const ingresoEstimado = Number(datosEst.ingreso || 0);
    const ingresoReal = Number(datosReal.ingreso || 0);
    
    const gastosEstimados = (datosEst.conceptos || []).reduce((sum, c) => sum + Number(c.monto || 0), 0);
    const gastosReales = (datosReal.conceptos || []).reduce((sum, c) => {
      const gastosConcepto = (c.gastos || []).reduce((s, g) => s + Number(g.monto || 0), 0);
      return sum + gastosConcepto;
    }, 0);
    
    const inversionEstimada = Number(datosEst.inversion || 0);
    const inversionReal = Number(datosReal.inversion || 0);
    const ganadoInversion = Number(datosReal.ganadoInversion || 0);
    
    const ahorroEstimado = ingresoEstimado - gastosEstimados - inversionEstimada;
    const ahorroReal = ingresoReal - gastosReales - inversionReal;
    
    const desviacionIngreso = ingresoReal - ingresoEstimado;
    const desviacionGastos = gastosReales - gastosEstimados;
    const desviacionAhorro = ahorroReal - ahorroEstimado;
    
    const cumplimientoPresupuesto = gastosEstimados > 0 
      ? ((gastosEstimados - gastosReales) / gastosEstimados * 100).toFixed(1)
      : 0;

    return {
      Mes: new Date(mes + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
      'Ingreso Est.': ingresoEstimado,
      'Ingreso Real': ingresoReal,
      'Desv. Ingreso': desviacionIngreso,
      'Gastos Est.': gastosEstimados,
      'Gastos Reales': gastosReales,
      'Desv. Gastos': desviacionGastos,
      'Inversión Est.': inversionEstimada,
      'Inversión Real': inversionReal,
      'Ganancia Inv.': ganadoInversion,
      'Ahorro Est.': ahorroEstimado,
      'Ahorro Real': ahorroReal,
      'Desv. Ahorro': desviacionAhorro,
      'Cumplimiento %': parseFloat(cumplimientoPresupuesto)
    };
  });

  // Agregar fila de totales
  const totales = {
    Mes: 'TOTALES',
    'Ingreso Est.': datosResumen.reduce((s, d) => s + d['Ingreso Est.'], 0),
    'Ingreso Real': datosResumen.reduce((s, d) => s + d['Ingreso Real'], 0),
    'Desv. Ingreso': datosResumen.reduce((s, d) => s + d['Desv. Ingreso'], 0),
    'Gastos Est.': datosResumen.reduce((s, d) => s + d['Gastos Est.'], 0),
    'Gastos Reales': datosResumen.reduce((s, d) => s + d['Gastos Reales'], 0),
    'Desv. Gastos': datosResumen.reduce((s, d) => s + d['Desv. Gastos'], 0),
    'Inversión Est.': datosResumen.reduce((s, d) => s + d['Inversión Est.'], 0),
    'Inversión Real': datosResumen.reduce((s, d) => s + d['Inversión Real'], 0),
    'Ganancia Inv.': datosResumen.reduce((s, d) => s + d['Ganancia Inv.'], 0),
    'Ahorro Est.': datosResumen.reduce((s, d) => s + d['Ahorro Est.'], 0),
    'Ahorro Real': datosResumen.reduce((s, d) => s + d['Ahorro Real'], 0),
    'Desv. Ahorro': datosResumen.reduce((s, d) => s + d['Desv. Ahorro'], 0),
    'Cumplimiento %': (datosResumen.reduce((s, d) => s + d['Cumplimiento %'], 0) / datosResumen.length).toFixed(1)
  };
  
  datosResumen.push(totales);

  const wsResumen = XLSX.utils.json_to_sheet(datosResumen);
  
  // Ajustar ancho de columnas
  wsResumen['!cols'] = [
    { wch: 20 }, // Mes
    { wch: 13 }, { wch: 13 }, { wch: 13 }, // Ingresos
    { wch: 13 }, { wch: 13 }, { wch: 13 }, // Gastos
    { wch: 13 }, { wch: 13 }, { wch: 13 }, // Inversión
    { wch: 13 }, { wch: 13 }, { wch: 13 }, // Ahorro
    { wch: 15 }  // Cumplimiento
  ];

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Mensual');

  // ==================== EXPORTAR ARCHIVO ====================
  const fechaExport = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
  XLSX.writeFile(wb, `Finanzas_Personales_${fechaExport}.xlsx`);
}

