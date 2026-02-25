// Componente de reportes y gráficos rediseñado - FASE 3: Inversión
import React, { useState, useMemo } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { exportarExcel } from '../utils/exportarExcel';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Utilidad para formatear moneda
const formatoMoneda = (valor) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};

// Utilidad para convertir 'YYYY-MM' a nombre de mes sin problemas de zona horaria
const formatearMes = (mesStr, formato = { month: 'long', year: 'numeric' }) => {
  if (!mesStr || typeof mesStr !== 'string') return '';
  const [anio, mes] = mesStr.split('-');
  if (!anio || !mes) return mesStr;
  // Crear fecha con parámetros separados (no string) para evitar problemas de UTC
  const fecha = new Date(parseInt(anio), parseInt(mes) - 1, 1);
  return fecha.toLocaleDateString('es-AR', formato);
};

// Componente KPI Card
const KPICard = ({ icon, label, value, subtitle, color = 'primary', comparacion }) => (
  <div className="card border-0 shadow-sm h-100">
    <div className="card-body">
      <div className="d-flex align-items-center mb-2">
        <div className={`fs-3 me-2`}>{icon}</div>
        <small className="text-muted text-uppercase fw-semibold">{label}</small>
      </div>
      <div className={`fs-3 fw-bold text-${color}`}>{value}</div>
      {subtitle && <small className="text-muted d-block mt-1">{subtitle}</small>}
      {comparacion && <small className={`d-block mt-1 ${comparacion.positivo ? 'text-success' : 'text-danger'}`}>
        {comparacion.texto}
      </small>}
    </div>
  </div>
);

const Reportes = ({ estimados, reales }) => {
  const [tabActiva, setTabActiva] = useState('resumen');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [vistaComparativa, setVistaComparativa] = useState('comparar');

  // Obtener lista de meses con datos (formato YYYY-MM validado)
  const mesesConDatos = useMemo(() => {
    const meses = [...new Set([...Object.keys(estimados), ...Object.keys(reales)])];
    // Filtrar solo claves en formato YYYY-MM válido
    const mesesValidos = meses.filter(m => /^\d{4}-\d{2}$/.test(m));
    return mesesValidos.sort();
  }, [estimados, reales]);

  // Generar todos los meses del año actual para el selector
  const mesesDelAnioActual = useMemo(() => {
    const anioActual = new Date().getFullYear();
    const meses = [];
    for (let mes = 1; mes <= 12; mes++) {
      const mesStr = `${anioActual}-${String(mes).padStart(2, '0')}`;
      meses.push(mesStr);
    }
    return meses;
  }, []);

  // Combinar meses con datos + meses del año actual (sin duplicados)
  const mesesDisponibles = useMemo(() => {
    const todosMeses = [...new Set([...mesesConDatos, ...mesesDelAnioActual])];
    return todosMeses.sort().reverse(); // Más recientes primero
  }, [mesesConDatos, mesesDelAnioActual]);

  // Verificar si un mes tiene datos
  const mesTieneDatos = (mes) => {
    return mesesConDatos.includes(mes);
  };

  if (mesesConDatos.length === 0) {
    return (
      <div className="component-card text-center py-5">
        <div className="fs-1 mb-3">📊</div>
        <h5>Sin datos para reportar</h5>
        <p className="text-muted">Cargá estimados y reales para ver reportes</p>
      </div>
    );
  }

  // Si no hay mes seleccionado, usar el más reciente con datos
  const mesActual = mesSeleccionado || mesesConDatos[mesesConDatos.length - 1];
  const datosEst = estimados[mesActual] || {};
  const datosReal = reales[mesActual] || {};

  // Calcular total de un concepto (sumando gastos detallados)
  const calcularTotalConcepto = (concepto) => {
    if (!concepto.gastos || concepto.gastos.length === 0) return 0;
    return concepto.gastos.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
  };

  // Extraer y calcular datos
  const ingresoEst = Number(datosEst.ingreso || 0);
  const inversionEst = Number(datosEst.inversion || 0);
  const conceptosEst = datosEst.conceptos || [];
  
  const ingresoReal = Number(datosReal.ingreso || 0);
  const inversionReal = Number(datosReal.inversion || 0);
  const ganadoInversion = Number(datosReal.ganadoInversion || 0);
  const conceptosReal = datosReal.conceptos || [];

  const totalGastosEst = conceptosEst.reduce((sum, c) => sum + Number(c.monto || 0), 0);
  const totalGastosReal = conceptosReal.reduce((sum, c) => sum + calcularTotalConcepto(c), 0);
  
  const ahorroEst = ingresoEst - totalGastosEst - inversionEst;
  const ahorroReal = ingresoReal - totalGastosReal - inversionReal + ganadoInversion;

  // KPIs calculados
  const desvio = totalGastosReal - totalGastosEst;
  const desvioPorcentaje = totalGastosEst > 0 ? ((desvio / totalGastosEst) * 100).toFixed(1) : 0;
  const inversionPorcentaje = ingresoReal > 0 ? ((inversionReal / ingresoReal) * 100).toFixed(1) : 0;
  
  // Score de cumplimiento (100 = perfecto, 0 = muy mal)
  const calcularScore = () => {
    if (conceptosEst.length === 0) return 100;
    let sumaDesvios = 0;
    conceptosEst.forEach(est => {
      const real = conceptosReal.find(r => r.nombre === est.nombre);
      const montoReal = real ? calcularTotalConcepto(real) : 0;
      const montoEst = Number(est.monto || 0);
      if (montoEst > 0) {
        const desvioConcepto = Math.abs(montoReal - montoEst) / montoEst;
        sumaDesvios += desvioConcepto;
      }
    });
    const desvioPromedio = sumaDesvios / conceptosEst.length;
    const score = Math.max(0, Math.min(100, 100 - (desvioPromedio * 100)));
    return Math.round(score);
  };
  
  const score = calcularScore();
  const scoreCategoria = score >= 90 ? 'Excelente' : score >= 75 ? 'Bueno' : score >= 50 ? 'Regular' : 'Malo';
  const scoreColor = score >= 75 ? 'success' : score >= 50 ? 'warning' : 'danger';

  // Datos para gráfico comparativo
  const labelsConceptos = conceptosEst.map(c => c.nombre);
  const montosEstimados = conceptosEst.map(c => Number(c.monto || 0));
  const montosReales = labelsConceptos.map(nombre => {
    const concepto = conceptosReal.find(c => c.nombre === nombre);
    return concepto ? calcularTotalConcepto(concepto) : 0;
  });

  const dataBarrasComparativo = {
    labels: labelsConceptos,
    datasets: [
      {
        label: 'Estimado',
        data: montosEstimados,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'Real',
        data: montosReales,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      },
    ],
  };

  const opcionesBarrasComparativo = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: { font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + formatoMoneda(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatoMoneda(value);
          }
        }
      }
    }
  };

  // Datos para gráfico donut (distribución)
  const dataDonut = {
    labels: [...labelsConceptos, 'Inversión', 'Ahorro'],
    datasets: [
      {
        data: [...montosReales, inversionReal, Math.max(0, ahorroReal)],
        backgroundColor: [
          '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
          '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6',
        ],
        borderWidth: 2,
        borderColor: '#fff'
      },
    ],
  };

  const opcionesDonut = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: { 
          font: { size: 11 },
          padding: 10,
          boxWidth: 12
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const porcentaje = ((context.parsed / total) * 100).toFixed(1);
            return context.label + ': ' + formatoMoneda(context.parsed) + ' (' + porcentaje + '%)';
          }
        }
      }
    }
  };

  // ========== CÁLCULOS PARA TAB GASTOS ==========
  
  // Calcular desvíos por concepto (para barras divergentes)
  const desviosPorConcepto = labelsConceptos.map((nombre, idx) => {
    const estimado = montosEstimados[idx];
    const real = montosReales[idx];
    return {
      nombre,
      estimado,
      real,
      desvio: real - estimado,
      desvioPorcentaje: estimado > 0 ? ((real - estimado) / estimado * 100).toFixed(1) : 0
    };
  }).sort((a, b) => Math.abs(b.desvio) - Math.abs(a.desvio)); // Ordenar por mayor desvío absoluto

  // Datos para gráfico de desvíos (barras divergentes)
  const dataDesvios = {
    labels: desviosPorConcepto.map(d => d.nombre),
    datasets: [
      {
        label: 'Desvío (Real - Estimado)',
        data: desviosPorConcepto.map(d => d.desvio),
        backgroundColor: desviosPorConcepto.map(d => 
          d.desvio > 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)'
        ),
        borderColor: desviosPorConcepto.map(d => 
          d.desvio > 0 ? 'rgba(239, 68, 68, 1)' : 'rgba(16, 185, 129, 1)'
        ),
        borderWidth: 1
      }
    ]
  };

  const opcionesDesvios = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const desvio = context.parsed.x;
            const concepto = desviosPorConcepto.find(d => d.nombre === context.label);
            return [
              'Desvío: ' + formatoMoneda(desvio),
              'Estimado: ' + formatoMoneda(concepto.estimado),
              'Real: ' + formatoMoneda(concepto.real)
            ];
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          callback: function(value) {
            return formatoMoneda(value);
          }
        },
        grid: {
          color: function(context) {
            if (context.tick.value === 0) {
              return 'rgba(0, 0, 0, 0.3)';
            }
            return 'rgba(0, 0, 0, 0.05)';
          },
          lineWidth: function(context) {
            return context.tick.value === 0 ? 2 : 1;
          }
        }
      }
    }
  };

  // Calcular evolución mensual de gastos (últimos 6 meses con datos)
  const mesesParaEvolucion = mesesConDatos.slice(-6);
  const gastosEvolucion = mesesParaEvolucion.map(mes => {
    const datosRealesMes = reales[mes] || {};
    const conceptosRealesMes = datosRealesMes.conceptos || [];
    return conceptosRealesMes.reduce((sum, c) => sum + calcularTotalConcepto(c), 0);
  });

  const gastosEstimadosEvolucion = mesesParaEvolucion.map(mes => {
    const datosEstMes = estimados[mes] || {};
    const conceptosEstMes = datosEstMes.conceptos || [];
    return conceptosEstMes.reduce((sum, c) => sum + Number(c.monto || 0), 0);
  });

  const dataEvolucionGastos = {
    labels: mesesParaEvolucion.map(mes => 
      formatearMes(mes, { month: 'short', year: '2-digit' })
    ),
    datasets: [
      {
        label: 'Gasto Estimado',
        data: gastosEstimadosEvolucion,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: false
      },
      {
        label: 'Gasto Real',
        data: gastosEvolucion,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: false
      }
    ]
  };

  const opcionesEvolucionGastos = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + formatoMoneda(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatoMoneda(value);
          }
        }
      }
    }
  };

  const opcionesInteresCompuesto = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + formatoMoneda(context.parsed.y);
          },
          footer: function(tooltipItems) {
            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
            return 'Total: ' + formatoMoneda(total);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatoMoneda(value);
          }
        }
      }
    }
  };

  const opcionesRetornoMensual = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return 'ROI: ' + context.parsed.y + '%';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  // ========== CÁLCULOS PARA TAB INVERSIÓN ==========
  
  // Calcular evolución de capital mes a mes (ACUMULATIVO)
  const evolucionCapital = useMemo(() => {
    let capitalAcumulado = 0;
    let gananciaAcumulada = 0;
    
    return mesesConDatos.map(mes => {
      const datosRealesMes = reales[mes] || {};
      const inversionMes = Number(datosRealesMes.inversion || 0);
      const gananciaMes = Number(datosRealesMes.ganadoInversion || 0);
      
      capitalAcumulado += inversionMes;
      gananciaAcumulada += gananciaMes;
      
      return {
        mes,
        inversionMes,
        gananciaMes,
        capitalAportado: capitalAcumulado,
        gananciaAcumulada,
        capitalTotal: capitalAcumulado + gananciaAcumulada,
        roi: inversionMes > 0 ? ((gananciaMes / inversionMes) * 100).toFixed(2) : 0
      };
    });
  }, [mesesConDatos, reales]);

  // KPIs totales de inversión
  const capitalTotalInvertido = evolucionCapital.length > 0 
    ? evolucionCapital[evolucionCapital.length - 1].capitalAportado 
    : 0;
  const gananciaTotalAcumulada = evolucionCapital.length > 0 
    ? evolucionCapital[evolucionCapital.length - 1].gananciaAcumulada 
    : 0;
  const capitalTotalActual = capitalTotalInvertido + gananciaTotalAcumulada;
  const roiTotal = capitalTotalInvertido > 0 
    ? ((gananciaTotalAcumulada / capitalTotalInvertido) * 100).toFixed(2) 
    : 0;

  // Datos para gráfico de interés compuesto (área apilada)
  const dataInteresCompuesto = {
    labels: evolucionCapital.map(e => 
      formatearMes(e.mes, { month: 'short', year: '2-digit' })
    ),
    datasets: [
      {
        label: 'Capital Aportado',
        data: evolucionCapital.map(e => e.capitalAportado),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      },
      {
        label: 'Ganancia Acumulada',
        data: evolucionCapital.map(e => e.gananciaAcumulada),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }
    ]
  };

  // Datos para gráfico de retorno mensual (%)
  const dataRetornoMensual = {
    labels: evolucionCapital.map(e => 
      formatearMes(e.mes, { month: 'short', year: '2-digit' })
    ),
    datasets: [
      {
        label: 'ROI Mensual (%)',
        data: evolucionCapital.map(e => parseFloat(e.roi)),
        backgroundColor: evolucionCapital.map(e => 
          parseFloat(e.roi) >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'
        ),
        borderColor: evolucionCapital.map(e => 
          parseFloat(e.roi) >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'
        ),
        borderWidth: 1
      }
    ]
  };

  // ========== CÁLCULOS PARA TAB HISTÓRICO ==========
  
  // Evolución histórica mes a mes
  const historico = useMemo(() => {
    return mesesConDatos.map((mes, idx) => {
      const datosEstimados = estimados[mes] || {};
      const datosReales = reales[mes] || {};
      
      const ingresoEstimado = Number(datosEstimados.ingreso || 0);
      const ingresoReal = Number(datosReales.ingreso || 0);
      
      const gastosEstimados = (datosEstimados.conceptos || []).reduce((sum, c) => sum + Number(c.monto || 0), 0);
      const gastosReales = (datosReales.conceptos || []).reduce((sum, c) => {
        const gastosConcepto = (c.gastos || []).reduce((s, g) => s + Number(g.monto || 0), 0);
        return sum + gastosConcepto;
      }, 0);
      
      const inversionEstimada = Number(datosEstimados.inversion || 0);
      const inversionReal = Number(datosReales.inversion || 0);
      
      const ahorroEstimado = ingresoEstimado - gastosEstimados - inversionEstimada;
      const ahorroReal = ingresoReal - gastosReales - inversionReal;
      
      // Cumplimiento de presupuesto (% de gasto real vs estimado)
      const cumplimientoPresupuesto = gastosEstimados > 0 
        ? ((gastosEstimados - gastosReales) / gastosEstimados * 100).toFixed(1)
        : 0;
      
      // Variación vs mes anterior
      let variacionGastos = 0;
      if (idx > 0) {
        const mesAnterior = mesesConDatos[idx - 1];
        const gastosRealesAnt = (reales[mesAnterior]?.conceptos || []).reduce((sum, c) => {
          const gastosConcepto = (c.gastos || []).reduce((s, g) => s + Number(g.monto || 0), 0);
          return sum + gastosConcepto;
        }, 0);
        
        if (gastosRealesAnt > 0) {
          variacionGastos = ((gastosReales - gastosRealesAnt) / gastosRealesAnt * 100).toFixed(1);
        }
      }
      
      return {
        mes,
        ingresoEstimado,
        ingresoReal,
        gastosEstimados,
        gastosReales,
        inversionEstimada,
        inversionReal,
        ahorroEstimado,
        ahorroReal,
        cumplimientoPresupuesto: parseFloat(cumplimientoPresupuesto),
        variacionGastos: parseFloat(variacionGastos),
        desviacionIngreso: ingresoReal - ingresoEstimado,
        desviacionGastos: gastosReales - gastosEstimados,
        desviacionAhorro: ahorroReal - ahorroEstimado
      };
    });
  }, [mesesConDatos, estimados, reales]);

  // KPIs históricos generales
  const promedioAhorroMensual = historico.length > 0 
    ? historico.reduce((sum, h) => sum + h.ahorroReal, 0) / historico.length 
    : 0;
  
  const cumplimientoPromedioPresupuesto = historico.length > 0
    ? historico.reduce((sum, h) => sum + h.cumplimientoPresupuesto, 0) / historico.length
    : 0;
  
  const totalAhorrado = historico.reduce((sum, h) => sum + h.ahorroReal, 0);
  
  const mesesConSuperavit = historico.filter(h => h.ahorroReal > 0).length;
  const porcentajeSuperavit = historico.length > 0 
    ? (mesesConSuperavit / historico.length * 100).toFixed(0)
    : 0;

  // Datos para gráfico de evolución de ahorros
  const dataEvolucionAhorros = {
    labels: historico.map(h => 
      formatearMes(h.mes, { month: 'short', year: '2-digit' })
    ),
    datasets: [
      {
        label: 'Ahorro Estimado',
        data: historico.map(h => h.ahorroEstimado),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.3,
        fill: false
      },
      {
        label: 'Ahorro Real',
        data: historico.map(h => h.ahorroReal),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 3,
        tension: 0.3,
        fill: true
      }
    ]
  };

  const opcionesEvolucionAhorros = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + formatoMoneda(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return formatoMoneda(value);
          }
        },
        grid: {
          color: function(context) {
            if (context.tick.value === 0) {
              return 'rgba(0, 0, 0, 0.2)';
            }
            return 'rgba(0, 0, 0, 0.05)';
          }
        }
      }
    }
  };

  // Datos para gráfico de cumplimiento de presupuesto
  const dataCumplimientoPresupuesto = {
    labels: historico.map(h => 
      formatearMes(h.mes, { month: 'short', year: '2-digit' })
    ),
    datasets: [
      {
        label: 'Cumplimiento de Presupuesto (%)',
        data: historico.map(h => h.cumplimientoPresupuesto),
        backgroundColor: historico.map(h => 
          h.cumplimientoPresupuesto >= 0 
            ? 'rgba(16, 185, 129, 0.7)' 
            : 'rgba(239, 68, 68, 0.7)'
        ),
        borderColor: historico.map(h => 
          h.cumplimientoPresupuesto >= 0 
            ? 'rgba(16, 185, 129, 1)' 
            : 'rgba(239, 68, 68, 1)'
        ),
        borderWidth: 1
      }
    ]
  };

  const opcionesCumplimientoPresupuesto = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const valor = context.parsed.y;
            return valor >= 0 
              ? `Ahorraste ${valor}% del presupuesto` 
              : `Te excediste ${Math.abs(valor)}% del presupuesto`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: function(context) {
            if (context.tick.value === 0) {
              return 'rgba(0, 0, 0, 0.3)';
            }
            return 'rgba(0, 0, 0, 0.05)';
          }
        }
      }
    }
  };

  return (
    <div className="component-card">
      {/* Header con filtros y exportar */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h5 className="mb-0">📊 Reportes Financieros</h5>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <select
            className="form-select form-select-sm"
            style={{ width: '220px' }}
            value={mesActual}
            onChange={(e) => setMesSeleccionado(e.target.value)}
          >
            {mesesDisponibles.map(mes => {
              const tieneDatos = mesTieneDatos(mes);
              const nombreMes = formatearMes(mes);
              return (
                <option key={mes} value={mes}>
                  {tieneDatos ? '✓ ' : '○ '}{nombreMes}
                </option>
              );
            })}
          </select>
          <button 
            className="btn btn-sm btn-outline-primary" 
            title="Exportar a Excel"
            onClick={() => {
              try {
                exportarExcel(estimados, reales, mesesConDatos);
                alert('✅ Excel exportado exitosamente');
              } catch (error) {
                console.error('Error al exportar:', error);
                alert('❌ Error al exportar. Revisa la consola para más detalles.');
              }
            }}
          >
            📥 Exportar
          </button>
        </div>
      </div>

      {/* Tabs de navegación */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${tabActiva === 'resumen' ? 'active' : ''}`}
            onClick={() => setTabActiva('resumen')}
          >
            📋 Resumen
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${tabActiva === 'gastos' ? 'active' : ''}`}
            onClick={() => setTabActiva('gastos')}
          >
            💰 Gastos
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${tabActiva === 'inversion' ? 'active' : ''}`}
            onClick={() => setTabActiva('inversion')}
          >
            📈 Inversión
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${tabActiva === 'historico' ? 'active' : ''}`}
            onClick={() => setTabActiva('historico')}
          >
            📊 Histórico
          </button>
        </li>
      </ul>

      {/* Alerta si el mes seleccionado no tiene datos */}
      {!mesTieneDatos(mesActual) && (
        <div className="alert alert-warning mb-4">
          <strong>⚠️ Sin datos para este mes</strong>
          <p className="mb-0 mt-1">
            El mes seleccionado no tiene información cargada. Ir a las pestañas de <strong>Estimados</strong> y <strong>Reales</strong> para cargar datos.
            {mesesConDatos.length > 0 && (
              <span className="d-block mt-2">
                💡 Meses con datos disponibles: {mesesConDatos.map(m => 
                  formatearMes(m, { month: 'short', year: 'numeric' })
                ).join(', ')}
              </span>
            )}
          </p>
        </div>
      )}

      {/* TAB: RESUMEN */}
      {tabActiva === 'resumen' && (
        <>
          {/* KPIs principales */}
          <div className="row g-3 mb-4">
            <div className="col-lg-3 col-md-6">
              <KPICard
                icon="💰"
                label="Ahorro del Mes"
                value={formatoMoneda(ahorroReal)}
                subtitle={`Estimado: ${formatoMoneda(ahorroEst)}`}
                color={ahorroReal >= 0 ? 'success' : 'danger'}
              />
            </div>
            <div className="col-lg-3 col-md-6">
              <KPICard
                icon="📊"
                label="Desvío Presupuesto"
                value={`${desvioPorcentaje > 0 ? '+' : ''}${desvioPorcentaje}%`}
                subtitle={`${formatoMoneda(Math.abs(desvio))} ${desvio > 0 ? 'de más' : 'ahorrado'}`}
                color={desvio < 0 ? 'success' : 'warning'}
              />
            </div>
            <div className="col-lg-3 col-md-6">
              <KPICard
                icon="💹"
                label="% Inversión"
                value={`${inversionPorcentaje}%`}
                subtitle={`${formatoMoneda(inversionReal)} del ingreso`}
                color="info"
              />
            </div>
            <div className="col-lg-3 col-md-6">
              <KPICard
                icon="🎯"
                label="Score Cumplimiento"
                value={`${score}/100`}
                subtitle={scoreCategoria}
                color={scoreColor}
              />
            </div>
          </div>

          {/* Insights automáticos */}
          {score < 75 && (
            <div className="alert alert-warning mb-4" role="alert">
              <strong>💡 Insight:</strong> Tu cumplimiento del presupuesto está en {score}/100. 
              {desvio > 0 && ` Gastaste ${formatoMoneda(desvio)} más de lo estimado.`}
            </div>
          )}

          {/* Gráficos principales */}
          {labelsConceptos.length > 0 ? (
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title mb-3">📊 Comparativo: Estimado vs Real</h6>
                    <div style={{ height: '350px' }}>
                      <Bar data={dataBarrasComparativo} options={opcionesBarrasComparativo} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title mb-3">🍩 Distribución Real</h6>
                    <div style={{ height: '350px' }}>
                      <Doughnut data={dataDonut} options={opcionesDonut} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              No hay conceptos cargados para este mes.
            </div>
          )}
        </>
      )}

      {/* TAB: GASTOS */}
      {tabActiva === 'gastos' && (
        <>
          {labelsConceptos.length > 0 ? (
            <>
              {/* KPIs específicos de gastos */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <KPICard
                    icon="💸"
                    label="Total Gastado"
                    value={formatoMoneda(totalGastosReal)}
                    subtitle={`Presupuesto: ${formatoMoneda(totalGastosEst)}`}
                    color={totalGastosReal <= totalGastosEst ? 'success' : 'danger'}
                  />
                </div>
                <div className="col-md-4">
                  <KPICard
                    icon="📉"
                    label="Mayor Desvío"
                    value={desviosPorConcepto[0]?.nombre || '-'}
                    subtitle={desviosPorConcepto[0] ? formatoMoneda(Math.abs(desviosPorConcepto[0].desvio)) : '-'}
                    color={desviosPorConcepto[0]?.desvio > 0 ? 'danger' : 'success'}
                  />
                </div>
                <div className="col-md-4">
                  <KPICard
                    icon="📊"
                    label="Conceptos en Presupuesto"
                    value={`${desviosPorConcepto.filter(d => d.real <= d.estimado).length}/${desviosPorConcepto.length}`}
                    subtitle={`${((desviosPorConcepto.filter(d => d.real <= d.estimado).length / desviosPorConcepto.length) * 100).toFixed(0)}% cumplimiento`}
                    color="info"
                  />
                </div>
              </div>

              {/* Insights de gastos */}
              {desviosPorConcepto.filter(d => Math.abs(d.desvio) > totalGastosEst * 0.1).length > 0 && (
                <div className="alert alert-info mb-4">
                  <strong>💡 Insight:</strong> Los conceptos con mayor desvío son:{' '}
                  {desviosPorConcepto
                    .filter(d => Math.abs(d.desvio) > totalGastosEst * 0.05)
                    .slice(0, 2)
                    .map(d => `${d.nombre} (${d.desvio > 0 ? '+' : ''}${formatoMoneda(d.desvio)})`)
                    .join(', ')}
                </div>
              )}

              {/* Gráficos */}
              <div className="row g-4 mb-4">
                {/* Gráfico de desvíos */}
                <div className="col-lg-7">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h6 className="card-title mb-3">📉 Desvío por Concepto (Real - Estimado)</h6>
                      <small className="text-muted d-block mb-3">
                        🟢 Verde = Ahorraste | 🔴 Rojo = Te excediste
                      </small>
                      <div style={{ height: '400px' }}>
                        <Bar data={dataDesvios} options={opcionesDesvios} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distribución (reutilizado del resumen) */}
                <div className="col-lg-5">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h6 className="card-title mb-3">🍩 Distribución de Gastos</h6>
                      <div style={{ height: '400px' }}>
                        <Doughnut data={dataDonut} options={opcionesDonut} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evolución mensual */}
              {mesesParaEvolucion.length >= 2 && (
                <div className="row g-4 mb-4">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="card-title mb-3">📈 Evolución Mensual de Gastos</h6>
                        <div style={{ height: '300px' }}>
                          <Line data={dataEvolucionGastos} options={opcionesEvolucionGastos} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de detalle */}
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="card-title mb-3">📋 Detalle por Concepto</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Concepto</th>
                          <th className="text-end">Estimado</th>
                          <th className="text-end">Real</th>
                          <th className="text-end">Desvío</th>
                          <th className="text-end">%</th>
                          <th className="text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {desviosPorConcepto.map((concepto, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">{concepto.nombre}</td>
                            <td className="text-end">{formatoMoneda(concepto.estimado)}</td>
                            <td className="text-end">{formatoMoneda(concepto.real)}</td>
                            <td className={`text-end ${concepto.desvio > 0 ? 'text-danger' : 'text-success'}`}>
                              {concepto.desvio > 0 ? '+' : ''}{formatoMoneda(concepto.desvio)}
                            </td>
                            <td className={`text-end ${Math.abs(concepto.desvioPorcentaje) > 20 ? 'fw-bold' : ''}`}>
                              {concepto.desvio > 0 ? '+' : ''}{concepto.desvioPorcentaje}%
                            </td>
                            <td className="text-center">
                              {concepto.real <= concepto.estimado ? (
                                <span className="badge bg-success">✓ OK</span>
                              ) : Math.abs(concepto.desvioPorcentaje) < 10 ? (
                                <span className="badge bg-warning">~ Cerca</span>
                              ) : (
                                <span className="badge bg-danger">⚠ Excedido</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="fw-bold border-top-2">
                          <td>TOTAL</td>
                          <td className="text-end">{formatoMoneda(totalGastosEst)}</td>
                          <td className="text-end">{formatoMoneda(totalGastosReal)}</td>
                          <td className={`text-end ${desvio > 0 ? 'text-danger' : 'text-success'}`}>
                            {desvio > 0 ? '+' : ''}{formatoMoneda(desvio)}
                          </td>
                          <td className="text-end">
                            {desvio > 0 ? '+' : ''}{desvioPorcentaje}%
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-info">
              No hay conceptos cargados para este mes.
            </div>
          )}
        </>
      )}

      {/* TAB: INVERSIÓN */}
      {tabActiva === 'inversion' && (
        <>
          {evolucionCapital.length > 0 ? (
            <>
              {/* KPIs de Inversión */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <KPICard
                    icon="💵"
                    label="Capital Invertido"
                    value={formatoMoneda(capitalTotalInvertido)}
                    subtitle="Total aportado acumulado"
                    color="primary"
                  />
                </div>
                <div className="col-md-4">
                  <KPICard
                    icon="💹"
                    label="Ganancia Acumulada"
                    value={formatoMoneda(gananciaTotalAcumulada)}
                    subtitle={`ROI: ${roiTotal}%`}
                    color={gananciaTotalAcumulada >= 0 ? 'success' : 'danger'}
                  />
                </div>
                <div className="col-md-4">
                  <KPICard
                    icon="🏆"
                    label="Capital Total Actual"
                    value={formatoMoneda(capitalTotalActual)}
                    subtitle={`Capital + Ganancias`}
                    color="info"
                  />
                </div>
              </div>

              {/* Insight de inversión */}
              {gananciaTotalAcumulada > 0 && (
                <div className="alert alert-success mb-4">
                  <strong>💡 Excelente:</strong> Ganaste {formatoMoneda(gananciaTotalAcumulada)} extra gracias a tu inversión.
                  {' '}Esto representa un {roiTotal}% de retorno sobre tu capital invertido.
                </div>
              )}

              {/* Gráfico principal: Interés Compuesto */}
              <div className="row g-4 mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h6 className="card-title mb-2">📈 Evolución del Capital con Interés Compuesto</h6>
                      <small className="text-muted d-block mb-3">
                        🔵 Área azul = Capital que aportaste | 🟢 Área verde = Ganancia generada
                      </small>
                      <div style={{ height: '400px' }}>
                        <Line data={dataInteresCompuesto} options={opcionesInteresCompuesto} />
                      </div>
                      <div className="mt-3 p-3 bg-light rounded">
                        <small className="d-block text-muted mb-2">
                          <strong>💡 Interpretación:</strong>
                        </small>
                        <small className="d-block">
                          • La <strong className="text-primary">línea superior</strong> muestra tu capital total actual: {formatoMoneda(capitalTotalActual)}
                        </small>
                        <small className="d-block">
                          • Si NO invertieras, solo tendrías: {formatoMoneda(capitalTotalInvertido)}
                        </small>
                        <small className="d-block text-success">
                          • <strong>Ganaste {formatoMoneda(gananciaTotalAcumulada)} extra (+{roiTotal}%)</strong> gracias a tu estrategia de inversión
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retorno mensual */}
              <div className="row g-4 mb-4">
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h6 className="card-title mb-3">📊 Retorno Mensual (%)</h6>
                      <div style={{ height: '300px' }}>
                        <Bar data={dataRetornoMensual} options={opcionesRetornoMensual} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas adicionales */}
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h6 className="card-title mb-3">📋 Estadísticas de Inversión</h6>
                      <div className="d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                          <div>
                            <small className="text-muted d-block">Promedio de Inversión Mensual</small>
                            <strong className="fs-5">
                              {formatoMoneda(evolucionCapital.length > 0 
                                ? capitalTotalInvertido / evolucionCapital.length 
                                : 0)}
                            </strong>
                          </div>
                          <div className="fs-3">💰</div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                          <div>
                            <small className="text-muted d-block">Promedio de Ganancia Mensual</small>
                            <strong className="fs-5 text-success">
                              {formatoMoneda(evolucionCapital.length > 0 
                                ? gananciaTotalAcumulada / evolucionCapital.length 
                                : 0)}
                            </strong>
                          </div>
                          <div className="fs-3">📈</div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                          <div>
                            <small className="text-muted d-block">Meses Invirtiendo</small>
                            <strong className="fs-5">{evolucionCapital.length}</strong>
                          </div>
                          <div className="fs-3">📅</div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center p-3 bg-success bg-opacity-10 rounded border border-success">
                          <div>
                            <small className="text-success d-block">Retorno Total (ROI)</small>
                            <strong className="fs-4 text-success">{roiTotal}%</strong>
                          </div>
                          <div className="fs-2">🎯</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de evolución mes a mes */}
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="card-title mb-3">📊 Evolución Mes a Mes</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Mes</th>
                          <th className="text-end">Inversión</th>
                          <th className="text-end">Ganancia</th>
                          <th className="text-end">ROI %</th>
                          <th className="text-end">Capital Acum.</th>
                          <th className="text-end">Ganancia Acum.</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evolucionCapital.map((evol, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">
                              {formatearMes(evol.mes)}
                            </td>
                            <td className="text-end">{formatoMoneda(evol.inversionMes)}</td>
                            <td className={`text-end ${evol.gananciaMes >= 0 ? 'text-success' : 'text-danger'}`}>
                              {formatoMoneda(evol.gananciaMes)}
                            </td>
                            <td className={`text-end ${evol.roi >= 0 ? 'text-success' : 'text-danger'}`}>
                              {evol.roi}%
                            </td>
                            <td className="text-end">{formatoMoneda(evol.capitalAportado)}</td>
                            <td className="text-end text-success">{formatoMoneda(evol.gananciaAcumulada)}</td>
                            <td className="text-end fw-bold">{formatoMoneda(evol.capitalTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="fw-bold border-top-2">
                          <td>TOTAL</td>
                          <td className="text-end">{formatoMoneda(capitalTotalInvertido)}</td>
                          <td className="text-end text-success">{formatoMoneda(gananciaTotalAcumulada)}</td>
                          <td className="text-end text-success">{roiTotal}%</td>
                          <td className="text-end">{formatoMoneda(capitalTotalInvertido)}</td>
                          <td className="text-end text-success">{formatoMoneda(gananciaTotalAcumulada)}</td>
                          <td className="text-end">{formatoMoneda(capitalTotalActual)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-info">
              No hay datos de inversión cargados aún. Empezá agregando inversiones en la sección de Reales.
            </div>
          )}
        </>
      )}

      {/* TAB: HISTÓRICO */}
      {tabActiva === 'historico' && (
        <>
          {historico.length > 0 ? (
            <>
              {/* KPIs Históricos */}
              <div className="row g-3 mb-4">
                <div className="col-lg-3 col-md-6">
                  <KPICard
                    icon="💰"
                    label="Total Ahorrado"
                    value={formatoMoneda(totalAhorrado)}
                    subtitle={`En ${historico.length} meses`}
                    color={totalAhorrado >= 0 ? 'success' : 'danger'}
                  />
                </div>
                <div className="col-lg-3 col-md-6">
                  <KPICard
                    icon="📊"
                    label="Promedio Mensual"
                    value={formatoMoneda(promedioAhorroMensual)}
                    subtitle="Ahorro por mes"
                    color="primary"
                  />
                </div>
                <div className="col-lg-3 col-md-6">
                  <KPICard
                    icon="🎯"
                    label="Cumplimiento Presupuesto"
                    value={cumplimientoPromedioPresupuesto.toFixed(1) + '%'}
                    subtitle="Promedio general"
                    color={cumplimientoPromedioPresupuesto >= 0 ? 'success' : 'warning'}
                  />
                </div>
                <div className="col-lg-3 col-md-6">
                  <KPICard
                    icon="✅"
                    label="Meses con Superávit"
                    value={`${mesesConSuperavit}/${historico.length}`}
                    subtitle={`${porcentajeSuperavit}% de los meses`}
                    color="info"
                  />
                </div>
              </div>

              {/* Insights históricos */}
              {porcentajeSuperavit >= 75 && (
                <div className="alert alert-success mb-4">
                  <strong>🎉 Excelente gestión:</strong> Tuviste superávit en {mesesConSuperavit} de {historico.length} meses ({porcentajeSuperavit}%).
                  {' '}Tu promedio de ahorro mensual es de {formatoMoneda(promedioAhorroMensual)}.
                </div>
              )}
              {porcentajeSuperavit < 50 && historico.length >= 3 && (
                <div className="alert alert-warning mb-4">
                  <strong>⚠️ Atención:</strong> Solo tuviste superávit en {mesesConSuperavit} de {historico.length} meses.
                  {' '}Revisá tus gastos para mejorar tu capacidad de ahorro.
                </div>
              )}

              {/* Gráficos principales */}
              <div className="row g-4 mb-4">
                {/* Evolución de ahorros */}
                <div className="col-lg-8">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h6 className="card-title mb-2">📈 Evolución Histórica de Ahorros</h6>
                      <small className="text-muted d-block mb-3">
                        Comparación entre ahorro estimado (planificado) vs ahorro real
                      </small>
                      <div style={{ height: '350px' }}>
                        <Line data={dataEvolucionAhorros} options={opcionesEvolucionAhorros} />
                      </div>
                      <div className="mt-3 p-3 bg-light rounded">
                        <small className="d-block">
                          • <strong className="text-success">Línea sólida verde:</strong> Ahorro que realmente lograste
                        </small>
                        <small className="d-block">
                          • <strong className="text-primary">Línea punteada azul:</strong> Ahorro que planificaste
                        </small>
                        <small className="d-block text-muted mt-2">
                          {totalAhorrado >= 0 
                            ? `💡 En total, ahorraste ${formatoMoneda(totalAhorrado)} durante este período.`
                            : `⚠️ Cuidado: tuviste un déficit acumulado de ${formatoMoneda(Math.abs(totalAhorrado))}.`
                          }
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cumplimiento de presupuesto */}
                <div className="col-lg-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h6 className="card-title mb-3">🎯 Cumplimiento de Presupuesto</h6>
                      <div style={{ height: '350px' }}>
                        <Bar data={dataCumplimientoPresupuesto} options={opcionesCumplimientoPresupuesto} />
                      </div>
                      <div className="mt-3">
                        <small className="d-block text-muted">
                          <strong>Verde:</strong> Gastaste menos de lo planeado<br />
                          <strong>Rojo:</strong> Te excediste del presupuesto
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla detallada mes a mes */}
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="card-title mb-3">📋 Análisis Detallado Mes a Mes</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Mes</th>
                          <th className="text-end">Ingreso</th>
                          <th className="text-end">Gastos</th>
                          <th className="text-end">Inversión</th>
                          <th className="text-end">Ahorro</th>
                          <th className="text-end">Cumplim. %</th>
                          <th className="text-end">Var. Gastos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historico.map((h, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">
                              {formatearMes(h.mes)}
                            </td>
                            <td className="text-end">
                              {formatoMoneda(h.ingresoReal)}
                              {h.desviacionIngreso !== 0 && (
                                <span className={`ms-1 small ${h.desviacionIngreso > 0 ? 'text-success' : 'text-danger'}`}>
                                  ({h.desviacionIngreso > 0 ? '+' : ''}{formatoMoneda(h.desviacionIngreso)})
                                </span>
                              )}
                            </td>
                            <td className="text-end">
                              {formatoMoneda(h.gastosReales)}
                              {h.desviacionGastos !== 0 && (
                                <span className={`ms-1 small ${h.desviacionGastos > 0 ? 'text-danger' : 'text-success'}`}>
                                  ({h.desviacionGastos > 0 ? '+' : ''}{formatoMoneda(h.desviacionGastos)})
                                </span>
                              )}
                            </td>
                            <td className="text-end">{formatoMoneda(h.inversionReal)}</td>
                            <td className={`text-end fw-semibold ${h.ahorroReal >= 0 ? 'text-success' : 'text-danger'}`}>
                              {formatoMoneda(h.ahorroReal)}
                            </td>
                            <td className="text-end">
                              <span className={`badge ${h.cumplimientoPresupuesto >= 0 ? 'bg-success' : 'bg-danger'}`}>
                                {h.cumplimientoPresupuesto > 0 ? '+' : ''}{h.cumplimientoPresupuesto}%
                              </span>
                            </td>
                            <td className="text-end">
                              {idx > 0 ? (
                                <span className={h.variacionGastos > 0 ? 'text-danger' : h.variacionGastos < 0 ? 'text-success' : ''}>
                                  {h.variacionGastos > 0 ? '↑' : h.variacionGastos < 0 ? '↓' : '='}
                                  {' '}{Math.abs(h.variacionGastos)}%
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="fw-bold border-top-2">
                          <td>TOTALES</td>
                          <td className="text-end">
                            {formatoMoneda(historico.reduce((s, h) => s + h.ingresoReal, 0))}
                          </td>
                          <td className="text-end">
                            {formatoMoneda(historico.reduce((s, h) => s + h.gastosReales, 0))}
                          </td>
                          <td className="text-end">
                            {formatoMoneda(historico.reduce((s, h) => s + h.inversionReal, 0))}
                          </td>
                          <td className={`text-end ${totalAhorrado >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatoMoneda(totalAhorrado)}
                          </td>
                          <td className="text-end">
                            <span className={`badge ${cumplimientoPromedioPresupuesto >= 0 ? 'bg-success' : 'bg-danger'}`}>
                              {cumplimientoPromedioPresupuesto.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-end">-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="mt-3 p-3 bg-light rounded">
                    <small className="text-muted">
                      <strong>💡 Cómo leer esta tabla:</strong><br />
                      • <strong>Cumplim. %:</strong> Verde = gastaste menos de lo planeado, Rojo = te excediste<br />
                      • <strong>Var. Gastos:</strong> Cambio porcentual de gastos vs mes anterior (↑ aumentó, ↓ disminuyó)<br />
                      • Los valores entre paréntesis muestran la desviación respecto a lo estimado
                    </small>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-info">
              No hay suficientes datos para generar análisis histórico. Necesitás al menos 1 mes de datos cargados.
            </div>
          )}
        </>
      )}

      {/* Otros tabs (placeholder) */}
      {tabActiva !== 'resumen' && tabActiva !== 'gastos' && tabActiva !== 'inversion' && tabActiva !== 'historico' && (
        <div className="text-center py-5 text-muted">
          <div className="fs-1 mb-3">🚧</div>
          <h5>Próximamente</h5>
          <p>Esta sección estará disponible pronto</p>
        </div>
      )}
    </div>
  );
};

export default Reportes;
