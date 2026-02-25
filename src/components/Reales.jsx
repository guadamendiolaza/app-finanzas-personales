// Componente para cargar datos reales mensuales con desglose detallado
import React, { useState, useEffect } from 'react';

const Reales = ({ estimados, reales, setReales, user, onGuardar }) => {
  const [mes, setMes] = useState('');
  const [ingreso, setIngreso] = useState('');
  const [inversion, setInversion] = useState('');
  const [ganadoInversion, setGanadoInversion] = useState('');
  const [conceptos, setConceptos] = useState([]);
  const [conceptosExpandidos, setConceptosExpandidos] = useState({}); // Track expanded state
  const [guardando, setGuardando] = useState(false);

  // Cargar datos cuando se selecciona un mes
  useEffect(() => {
    if (!mes) {
      setIngreso('');
      setInversion('');
      setGanadoInversion('');
      setConceptos([]);
      setConceptosExpandidos({});
      return;
    }

    // Cargar datos reales si existen
    const datosRealesMes = reales[mes];
    if (datosRealesMes) {
      setIngreso(datosRealesMes.ingreso || '');
      setInversion(datosRealesMes.inversion || '');
      setGanadoInversion(datosRealesMes.ganadoInversion || '');
      setConceptos(datosRealesMes.conceptos || []);
    } else {
      // No hay datos reales, cargar conceptos desde estimados
      const datosEstimadosMes = estimados[mes];
      if (datosEstimadosMes && datosEstimadosMes.conceptos) {
        // Traer los conceptos de estimados con estructura de gastos vacía
        setConceptos(datosEstimadosMes.conceptos.map(c => ({
          nombre: c.nombre,
          gastos: []
        })));
      } else {
        setConceptos([]);
      }
      setIngreso('');
      setInversion('');
      setGanadoInversion('');
    }
  }, [mes, estimados, reales]);

  // Verificar si un concepto tiene monto simple (un solo gasto con nombre = concepto)
  const esMontoSimple = (concepto) => {
    return concepto.gastos?.length === 1 && 
           concepto.gastos[0].detalle === concepto.nombre;
  };

  // Verificar si un concepto tiene items detallados
  const tieneItemsDetallados = (concepto) => {
    if (!concepto.gastos || concepto.gastos.length === 0) return false;
    return concepto.gastos.some(g => g.detalle !== concepto.nombre);
  };

  // Actualizar monto simple de un concepto
  const actualizarMontoSimple = (nombreConcepto, monto) => {
    setConceptos(conceptos.map(c => {
      if (c.nombre === nombreConcepto) {
        if (monto === '') {
          // Si borran el monto, vaciar gastos
          return { ...c, gastos: [] };
        } else {
          // Guardar como un solo gasto con nombre = concepto
          return {
            ...c,
            gastos: [{ detalle: nombreConcepto, monto }]
          };
        }
      }
      return c;
    }));
  };

  // Toggle expandir/colapsar concepto
  const toggleExpandir = (nombreConcepto) => {
    setConceptosExpandidos(prev => ({
      ...prev,
      [nombreConcepto]: !prev[nombreConcepto]
    }));
  };

  // Agregar nuevo item detallado a un concepto
  const agregarGasto = (nombreConcepto) => {
    setConceptos(conceptos.map(c => {
      if (c.nombre === nombreConcepto) {
        return {
          ...c,
          gastos: [...(c.gastos || []), { detalle: '', monto: '' }]
        };
      }
      return c;
    }));
  };

  // Eliminar gasto de un concepto
  const eliminarGasto = (nombreConcepto, indexGasto) => {
    setConceptos(conceptos.map(c => {
      if (c.nombre === nombreConcepto) {
        return {
          ...c,
          gastos: c.gastos.filter((_, idx) => idx !== indexGasto)
        };
      }
      return c;
    }));
  };

  // Actualizar detalle de un gasto
  const actualizarDetalleGasto = (nombreConcepto, indexGasto, detalle) => {
    setConceptos(conceptos.map(c => {
      if (c.nombre === nombreConcepto) {
        const nuevosGastos = [...c.gastos];
        nuevosGastos[indexGasto] = { ...nuevosGastos[indexGasto], detalle };
        return { ...c, gastos: nuevosGastos };
      }
      return c;
    }));
  };

  // Actualizar monto de un gasto
  const actualizarMontoGasto = (nombreConcepto, indexGasto, monto) => {
    setConceptos(conceptos.map(c => {
      if (c.nombre === nombreConcepto) {
        const nuevosGastos = [...c.gastos];
        nuevosGastos[indexGasto] = { ...nuevosGastos[indexGasto], monto };
        return { ...c, gastos: nuevosGastos };
      }
      return c;
    }));
  };

  // Calcular total de gastos de un concepto
  const calcularTotalConcepto = (concepto) => {
    if (!concepto.gastos || concepto.gastos.length === 0) return 0;
    return concepto.gastos.reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
  };

  // Obtener monto estimado de un concepto
  const obtenerMontoEstimado = (nombreConcepto) => {
    const datosEstimadosMes = estimados[mes];
    if (!datosEstimadosMes || !datosEstimadosMes.conceptos) return 0;
    const conceptoEstimado = datosEstimadosMes.conceptos.find(c => c.nombre === nombreConcepto);
    return parseFloat(conceptoEstimado?.monto) || 0;
  };

  // Guardar reales
  const guardarReal = async () => {
    if (!mes) {
      alert('⚠️ Seleccioná un mes primero');
      return;
    }

    if (!user) {
      const confirmLogin = window.confirm(
        '🔒 Debes ingresar con Google para guardar los datos.\n\n' +
        '✅ Beneficios de ingresar:\n' +
        '• Guardá tus datos de forma segura en la nube\n' +
        '• Accedé desde cualquier dispositivo\n' +
        '• Mantené tu historial completo\n\n' +
        '¿Querés ingresar ahora?'
      );
      
      if (confirmLogin) {
        alert('👆 Hacé clic en el botón "Ingresar con Google" en la parte superior');
      }
      return;
    }

    setGuardando(true);
    try {
      const nuevosReales = {
        ...reales,
        [mes]: {
          ingreso,
          inversion,
          ganadoInversion,
          conceptos: conceptos.map(c => ({ 
            nombre: c.nombre, 
            gastos: c.gastos || [] 
          }))
        }
      };
      
      setReales(nuevosReales);
      await onGuardar();
      
      // RESETEAR TODO después de guardar
      setMes('');
      setIngreso('');
      setInversion('');
      setGanadoInversion('');
      setConceptos([]);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Error al guardar. Intentá nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  const hayDatos = ingreso || inversion || ganadoInversion || 
    conceptos.some(c => c.gastos && c.gastos.length > 0);

  return (
    <div className="component-card">
      <h5 className="mb-3">💵 Datos reales del mes</h5>
      
      {/* Selector de mes */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Mes</label>
        <input
          type="month"
          className="form-control"
          value={mes}
          onChange={e => setMes(e.target.value)}
          disabled={guardando}
        />
      </div>

      {mes && (
        <>
          {/* Montos principales */}
          <div className="row g-2 mb-2">
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Ingreso real</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cobrado"
                  value={ingreso}
                  onChange={e => setIngreso(e.target.value)}
                  disabled={guardando}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Inversión real</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Invertido"
                  value={inversion}
                  onChange={e => setInversion(e.target.value)}
                  disabled={guardando}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Ganancia inversión</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ganado"
                  value={ganadoInversion}
                  onChange={e => setGanadoInversion(e.target.value)}
                  disabled={guardando}
                />
              </div>
            </div>
          </div>

          <div className="divider my-3" />

          {/* Conceptos con modo simple o detallado */}
          <div>
            <h6 className="mb-3 fw-semibold">📊 Gastos reales por concepto</h6>
            
            {conceptos.length === 0 ? (
              <div className="text-muted text-center py-3 border rounded">
                {estimados[mes] 
                  ? 'Este mes no tiene conceptos estimados'
                  : 'Primero creá estimados para este mes'}
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {conceptos.map((concepto) => {
                  const totalGastado = calcularTotalConcepto(concepto);
                  const totalEstimado = obtenerMontoEstimado(concepto.nombre);
                  const dentroPresupuesto = totalGastado <= totalEstimado;
                  const modoSimple = esMontoSimple(concepto);
                  const modoDetallado = tieneItemsDetallados(concepto);
                  const expandido = conceptosExpandidos[concepto.nombre];
                  const montoSimple = modoSimple ? concepto.gastos[0]?.monto || '' : '';

                  return (
                    <div key={concepto.nombre} className="border rounded p-3">
                      {/* Fila principal: Concepto + Input/Total + Botón */}
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="fw-semibold" style={{ minWidth: '180px' }}>
                          🏷️ {concepto.nombre}
                        </div>
                        
                        {/* Input simple (solo si NO tiene items detallados) */}
                        {!modoDetallado && (
                          <div className="input-group" style={{ maxWidth: '250px' }}>
                            <span className="input-group-text">$</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Monto total"
                              value={montoSimple}
                              onChange={e => actualizarMontoSimple(concepto.nombre, e.target.value)}
                              disabled={guardando}
                            />
                          </div>
                        )}

                        {/* Mostrar total si está en modo detallado */}
                        {modoDetallado && (
                          <div className="fw-bold">
                            Total: ${totalGastado.toLocaleString('es-AR')}
                          </div>
                        )}

                        <div className="ms-auto d-flex align-items-center gap-2">
                          {/* Comparación con estimado */}
                          {totalGastado > 0 && (
                            <small className={dentroPresupuesto ? 'text-success' : 'text-danger'}>
                              Estimado: ${totalEstimado.toLocaleString('es-AR')}
                              {!dentroPresupuesto && ` (⚠️ +${(totalGastado - totalEstimado).toLocaleString('es-AR')})`}
                            </small>
                          )}

                          {/* Botón Ver detalle / Ocultar */}
                          <button
                            className={`btn btn-sm ${expandido ? 'btn-outline-secondary' : 'btn-outline-primary'}`}
                            onClick={() => toggleExpandir(concepto.nombre)}
                            disabled={modoSimple || guardando}
                            type="button"
                            title={modoSimple ? 'Borrá el monto simple para agregar items detallados' : ''}
                          >
                            {expandido ? '▲ Ocultar' : '📋 Ver detalle'}
                          </button>
                        </div>
                      </div>

                      {/* Mensaje informativo si tiene monto simple */}
                      {modoSimple && !expandido && (
                        <small className="text-muted d-block">
                          Monto único ingresado. Borrá el monto para agregar items detallados.
                        </small>
                      )}

                      {/* Mensaje informativo si NO tiene nada */}
                      {!modoSimple && !modoDetallado && !expandido && (
                        <small className="text-muted d-block">
                          Ingresá un monto único o hacé clic en "📋 Ver detalle" para agregar items específicos.
                        </small>
                      )}

                      {/* Sección expandida con items detallados */}
                      {expandido && (
                        <div className="mt-3 pt-3 border-top">
                          {modoSimple ? (
                            <div className="alert alert-warning mb-0">
                              ⚠️ Ya ingresaste un monto único para este concepto. 
                              Borrá el monto de arriba para poder agregar items detallados.
                            </div>
                          ) : (
                            <>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <small className="text-muted">Items detallados:</small>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => agregarGasto(concepto.nombre)}
                                  disabled={guardando}
                                  type="button"
                                >
                                  ➕ Agregar item
                                </button>
                              </div>

                              {/* Tabla de items detallados */}
                              {concepto.gastos && concepto.gastos.length > 0 ? (
                                <div className="table-responsive">
                                  <table className="table table-sm table-hover align-middle mb-0">
                                    <thead>
                                      <tr>
                                        <th>Detalle del gasto</th>
                                        <th style={{ width: '180px' }}>Monto</th>
                                        <th style={{ width: '50px' }}></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {concepto.gastos.map((gasto, gastoIdx) => (
                                        <tr key={gastoIdx}>
                                          <td>
                                            <input
                                              type="text"
                                              className="form-control form-control-sm"
                                              placeholder="Ej: Salidas a comer"
                                              value={gasto.detalle}
                                              onChange={e => actualizarDetalleGasto(concepto.nombre, gastoIdx, e.target.value)}
                                              disabled={guardando}
                                            />
                                          </td>
                                          <td>
                                            <div className="input-group input-group-sm">
                                              <span className="input-group-text">$</span>
                                              <input
                                                type="number"
                                                className="form-control"
                                                placeholder="0"
                                                value={gasto.monto}
                                                onChange={e => actualizarMontoGasto(concepto.nombre, gastoIdx, e.target.value)}
                                                disabled={guardando}
                                              />
                                            </div>
                                          </td>
                                          <td>
                                            <button
                                              className="btn btn-sm btn-outline-danger"
                                              onClick={() => eliminarGasto(concepto.nombre, gastoIdx)}
                                              disabled={guardando}
                                              type="button"
                                            >
                                              🗑️
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-muted text-center py-2 small border rounded">
                                  Sin items. Hacé clic en "➕ Agregar item" para comenzar
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botón guardar */}
          <button
            className="btn btn-gradient w-100 mt-4"
            onClick={guardarReal}
            disabled={!hayDatos || guardando}
          >
            {guardando ? '⏳ Guardando...' : '💾 Guardar datos reales'}
          </button>
        </>
      )}

      {!mes && (
        <div className="text-center text-muted py-4">
          👆 Seleccioná un mes para comenzar
        </div>
      )}
    </div>
  );
};

export default Reales;
