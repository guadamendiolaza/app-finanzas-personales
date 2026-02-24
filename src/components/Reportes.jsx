// Componente de reportes y gráficos
import React from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { exportarExcel } from '../utils/exportarExcel';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reportes = ({ conceptos, estimados, reales }) => {
  // Handler para exportar a Excel
  const handleExportar = () => {
    exportarExcel(estimados, reales);
  };

  // Cálculos de KPIs
  const labels = conceptos.map(c => c.nombre);
  const estimadosData = labels.map(l => Number(estimados[l]?.monto || 0));
  const realesData = labels.map(l => Number(reales[l]?.monto || 0));
  const totalEst = estimadosData.reduce((a, b) => a + b, 0);
  const totalReal = realesData.reduce((a, b) => a + b, 0);
  
  const ingresoEst = Number(estimados.ingreso?.monto || 0);
  const ingresoReal = Number(reales.ingreso?.monto || 0);
  const inversionEst = Number(estimados.inversion?.monto || 0);
  const inversionReal = Number(reales.inversion?.monto || 0);
  const ganadoInversion = Number(reales.ganadoInversion?.monto || 0);
  
  const ahorro = ingresoEst - totalEst - inversionEst;
  const ahorroReal = ingresoReal - totalReal - inversionReal + ganadoInversion;
  const cumplimiento = totalEst ? Math.round((totalReal / totalEst) * 100) : 0;
  const inversionSobreIngreso = ingresoEst ? Math.round((inversionEst / ingresoEst) * 100) : 0;
  const diferencia = ahorroReal - ahorro;

  // Tabs internas
  const [tab, setTab] = React.useState('resumen');

  // Configuración de gráfico de barras comparativo
  const barChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Estimado',
        data: estimadosData,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Real',
        data: realesData,
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Comparación Estimado vs Real por Concepto',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return context.dataset.label + ': $' + context.parsed.y.toLocaleString('es-AR');
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => '$' + value.toLocaleString('es-AR'),
        },
      },
    },
  };

  // Configuración de gráfico de torta para distribución de gastos
  const pieChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Gasto Real',
        data: realesData,
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Distribución de Gastos Reales',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return label + ': $' + value.toLocaleString('es-AR') + ' (' + percentage + '%)';
          },
        },
      },
    },
  };

  return (
    <div className="reportes-module">
      {/* Header con título y botón exportar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">📊 Reportes y Análisis</h4>
          <p className="text-muted small mb-0">Resumen de tu situación financiera</p>
        </div>
        <button className="btn btn-outline-primary" onClick={handleExportar}>
          📥 Exportar a Excel
        </button>
      </div>

      {/* KPIs principales */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="kpi-card text-center" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
            <div className="small mb-1 opacity-75">💰 Ingreso Real</div>
            <div className="fw-bold fs-4">$ {ingresoReal.toLocaleString('es-AR')}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="kpi-card text-center" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white'}}>
            <div className="small mb-1 opacity-75">💸 Gastos Reales</div>
            <div className="fw-bold fs-4">$ {totalReal.toLocaleString('es-AR')}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="kpi-card text-center" style={{background: diferencia >= 0 ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white'}}>
            <div className="small mb-1 opacity-75">💎 Ahorro Real</div>
            <div className="fw-bold fs-4">$ {ahorroReal.toLocaleString('es-AR')}</div>
            <div className="tiny mt-1">
              {diferencia >= 0 ? '▲' : '▼'} ${Math.abs(diferencia).toLocaleString('es-AR')} vs estimado
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="kpi-card text-center" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white'}}>
            <div className="small mb-1 opacity-75">📈 Inversión</div>
            <div className="fw-bold fs-4">{inversionSobreIngreso}%</div>
            <div className="tiny mt-1">de ingresos invertidos</div>
          </div>
        </div>
      </div>

      {/* Indicadores adicionales */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="component-card">
            <h6 className="mb-3">📋 Resumen del Presupuesto</h6>
            <div className="d-flex justify-content-between mb-2">
              <span>Gastos Estimados:</span>
              <strong>$ {totalEst.toLocaleString('es-AR')}</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Gastos Reales:</span>
              <strong className={totalReal > totalEst ? 'text-danger' : 'text-success'}>
                $ {totalReal.toLocaleString('es-AR')}
              </strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Diferencia:</span>
              <strong className={totalReal > totalEst ? 'text-danger' : 'text-success'}>
                {totalReal > totalEst ? '+' : '-'} $ {Math.abs(totalReal - totalEst).toLocaleString('es-AR')}
              </strong>
            </div>
            <div className="progress mt-3" style={{height: '25px'}}>
              <div 
                className={`progress-bar ${cumplimiento > 100 ? 'bg-danger' : cumplimiento > 80 ? 'bg-warning' : 'bg-success'}`}
                role="progressbar" 
                style={{width: `${Math.min(cumplimiento, 100)}%`}}
              >
                {cumplimiento}%
              </div>
            </div>
            <div className="text-center mt-2 small text-muted">
              {cumplimiento > 100 && '⚠️ Te pasaste del presupuesto'}
              {cumplimiento <= 100 && cumplimiento > 80 && '👍 Estás cerca del límite'}
              {cumplimiento <= 80 && '✅ Dentro del presupuesto'}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="component-card">
            <h6 className="mb-3">💼 Inversiones y Rendimiento</h6>
            <div className="d-flex justify-content-between mb-2">
              <span>Inversión Estimada:</span>
              <strong>$ {inversionEst.toLocaleString('es-AR')}</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Inversión Real:</span>
              <strong>$ {inversionReal.toLocaleString('es-AR')}</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Ganado de Inversión:</span>
              <strong className="text-success">+ $ {ganadoInversion.toLocaleString('es-AR')}</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>% sobre ingreso:</span>
              <strong>{inversionSobreIngreso}%</strong>
            </div>
            <div className="mt-3 p-2 rounded" style={{background: '#f0fdf4', border: '1px solid #86efac'}}>
              <div className="small text-center">
                <strong className="text-success">
                  {ganadoInversion > 0 ? `🎉 Ganaste $${ganadoInversion.toLocaleString('es-AR')} con tus inversiones` : '💡 Registra tus ganancias de inversión'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link${tab === 'resumen' ? ' active' : ''}`} onClick={() => setTab('resumen')}>
            📊 Resumen Visual
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link${tab === 'detalles' ? ' active' : ''}`} onClick={() => setTab('detalles')}>
            📋 Detalles por Concepto
          </button>
        </li>
      </ul>

      {/* Contenido de tabs */}
      <div className="tab-content">
        {tab === 'resumen' && (
          <div className="tab-pane active">
            <div className="row g-4">
              <div className="col-12 col-lg-8">
                <div className="component-card">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>
              <div className="col-12 col-lg-4">
                <div className="component-card">
                  <Doughnut data={pieChartData} options={pieChartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {tab === 'detalles' && (
          <div className="tab-pane active">
            <div className="component-card">
              <h6 className="mb-3">📋 Análisis Detallado por Concepto</h6>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th className="text-end">Estimado</th>
                      <th className="text-end">Real</th>
                      <th className="text-end">Diferencia</th>
                      <th className="text-end">% Cumplimiento</th>
                      <th className="text-end">% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labels.map((label, idx) => {
                      const est = estimadosData[idx];
                      const real = realesData[idx];
                      const diff = real - est;
                      const cumple = est > 0 ? Math.round((real / est) * 100) : 0;
                      const porcentajeTotal = totalReal > 0 ? ((real / totalReal) * 100).toFixed(1) : 0;
                      
                      return (
                        <tr key={label}>
                          <td className="fw-semibold">{label}</td>
                          <td className="text-end">$ {est.toLocaleString('es-AR')}</td>
                          <td className="text-end">$ {real.toLocaleString('es-AR')}</td>
                          <td className={`text-end ${diff > 0 ? 'text-danger' : 'text-success'}`}>
                            {diff > 0 ? '+' : ''} $ {diff.toLocaleString('es-AR')}
                          </td>
                          <td className="text-end">
                            <span className={`badge ${cumple > 100 ? 'bg-danger' : cumple > 80 ? 'bg-warning' : 'bg-success'}`}>
                              {cumple}%
                            </span>
                          </td>
                          <td className="text-end">{porcentajeTotal}%</td>
                        </tr>
                      );
                    })}
                    <tr className="table-active fw-bold">
                      <td>TOTAL</td>
                      <td className="text-end">$ {totalEst.toLocaleString('es-AR')}</td>
                      <td className="text-end">$ {totalReal.toLocaleString('es-AR')}</td>
                      <td className={`text-end ${totalReal > totalEst ? 'text-danger' : 'text-success'}`}>
                        {totalReal > totalEst ? '+' : ''} $ {(totalReal - totalEst).toLocaleString('es-AR')}
                      </td>
                      <td className="text-end">
                        <span className={`badge ${cumplimiento > 100 ? 'bg-danger' : cumplimiento > 80 ? 'bg-warning' : 'bg-success'}`}>
                          {cumplimiento}%
                        </span>
                      </td>
                      <td className="text-end">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Insights */}
              <div className="mt-4">
                <h6 className="mb-3">💡 Insights y Recomendaciones</h6>
                <div className="row g-3">
                  {/* Concepto con mayor desvío */}
                  {(() => {
                    const desvios = labels.map((label, idx) => ({
                      nombre: label,
                      desvio: Math.abs(realesData[idx] - estimadosData[idx]),
                      porcentaje: estimadosData[idx] > 0 ? ((realesData[idx] - estimadosData[idx]) / estimadosData[idx] * 100).toFixed(1) : 0,
                      realMayorQueEst: realesData[idx] > estimadosData[idx]
                    })).filter(d => d.desvio > 0).sort((a, b) => b.desvio - a.desvio);
                    
                    const mayorDesvio = desvios[0];
                    const conceptoMasCaro = labels.reduce((max, label, idx) => 
                      realesData[idx] > realesData[max] ? idx : max, 0);
                    
                    return (
                      <>
                        {mayorDesvio && (
                          <div className="col-md-6">
                            <div className="alert alert-warning mb-0">
                              <strong>⚠️ Mayor Desvío:</strong> <strong>{mayorDesvio.nombre}</strong> tuvo un desvío de 
                              ${mayorDesvio.desvio.toLocaleString('es-AR')} 
                              ({mayorDesvio.realMayorQueEst ? '+' : ''}{mayorDesvio.porcentaje}% del estimado)
                            </div>
                          </div>
                        )}
                        <div className="col-md-6">
                          <div className="alert alert-info mb-0">
                            <strong>📊 Mayor Gasto:</strong> <strong>{labels[conceptoMasCaro]}</strong> representa el 
                            {((realesData[conceptoMasCaro] / totalReal) * 100).toFixed(1)}% de tus gastos totales
                          </div>
                        </div>
                        {cumplimiento <= 90 && (
                          <div className="col-12">
                            <div className="alert alert-success mb-0">
                              <strong>🎉 ¡Bien hecho!</strong> Te mantuviste dentro del presupuesto. 
                              Ahorraste ${(totalEst - totalReal).toLocaleString('es-AR')} más de lo planeado.
                            </div>
                          </div>
                        )}
                        {cumplimiento > 100 && (
                          <div className="col-12">
                            <div className="alert alert-danger mb-0">
                              <strong>🚨 Atención:</strong> Superaste tu presupuesto por 
                              ${(totalReal - totalEst).toLocaleString('es-AR')}. 
                              Revisa tus gastos en {mayorDesvio?.nombre || 'los conceptos con mayor desvío'}.
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;
