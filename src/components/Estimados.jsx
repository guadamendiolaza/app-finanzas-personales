// Componente para cargar estimados mensuales con conceptos por mes
import React, { useState, useEffect } from 'react';

const Estimados = ({ estimados, setEstimados, user, onGuardar }) => {
  const [mes, setMes] = useState('');
  const [ingreso, setIngreso] = useState('');
  const [inversion, setInversion] = useState('');
  const [conceptos, setConceptos] = useState([]);
  const [nuevoConcepto, setNuevoConcepto] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cargar datos cuando se selecciona un mes
  useEffect(() => {
    if (!mes) {
      // Sin mes seleccionado, limpiar todo
      setIngreso('');
      setInversion('');
      setConceptos([]);
      return;
    }

    // Cargar datos del mes si existen
    const datosMes = estimados[mes];
    if (datosMes) {
      setIngreso(datosMes.ingreso || '');
      setInversion(datosMes.inversion || '');
      setConceptos(datosMes.conceptos || []);
    } else {
      // Mes nuevo, limpiar datos pero mantener el mes seleccionado
      setIngreso('');
      setInversion('');
      setConceptos([]);
    }
  }, [mes, estimados]);

  // Agregar nuevo concepto
  const agregarConcepto = () => {
    if (!mes) {
      alert('⚠️ Primero seleccioná un mes');
      return;
    }
    
    if (!nuevoConcepto.trim()) {
      alert('⚠️ Ingresá el nombre del concepto');
      return;
    }

    if (conceptos.find(c => c.nombre === nuevoConcepto)) {
      alert('⚠️ Este concepto ya existe');
      return;
    }

    setConceptos([...conceptos, { nombre: nuevoConcepto, monto: '' }]);
    setNuevoConcepto('');
  };

  // Eliminar concepto
  const eliminarConcepto = (nombre) => {
    setConceptos(conceptos.filter(c => c.nombre !== nombre));
  };

  // Actualizar monto de un concepto
  const actualizarMonto = (nombre, monto) => {
    setConceptos(conceptos.map(c => 
      c.nombre === nombre ? { ...c, monto } : c
    ));
  };

  // Guardar estimados
  const guardarEstimado = async () => {
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
      const nuevosEstimados = {
        ...estimados,
        [mes]: {
          ingreso,
          inversion,
          conceptos: conceptos.map(c => ({ nombre: c.nombre, monto: c.monto }))
        }
      };
      
      setEstimados(nuevosEstimados);
      await onGuardar();
      
      // RESETEAR TODO después de guardar
      setMes('');
      setIngreso('');
      setInversion('');
      setConceptos([]);
      setNuevoConcepto('');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Error al guardar. Intentá nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  const hayDatos = ingreso || inversion || conceptos.length > 0;

  return (
    <div className="component-card">
      <h5 className="mb-3">📈 Estimados del mes</h5>
      
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
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Ingreso estimado</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ej: 1200000"
                  value={ingreso}
                  onChange={e => setIngreso(e.target.value)}
                  disabled={guardando}
                />
              </div>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Inversión estimada</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ej: 250000"
                  value={inversion}
                  onChange={e => setInversion(e.target.value)}
                  disabled={guardando}
                />
              </div>
            </div>
          </div>

          <div className="divider my-3" />

          {/* Conceptos */}
          <div>
            <h6 className="mb-3 fw-semibold">🏷️ Conceptos y presupuestos</h6>
            
            {/* Agregar nuevo concepto */}
            <div className="d-flex align-items-center mb-3 gap-2">
              <input
                className="form-control"
                value={nuevoConcepto}
                onChange={e => setNuevoConcepto(e.target.value)}
                placeholder="Ej: Comida / Transporte / Salidas"
                onKeyPress={(e) => e.key === 'Enter' && agregarConcepto()}
                disabled={guardando}
              />
              <button 
                className="btn btn-primary px-3" 
                onClick={agregarConcepto}
                disabled={guardando}
              >
                ➕
              </button>
            </div>

            {/* Lista de conceptos */}
            <div className="table-responsive-custom">
              <table className="table table-sm table-hover align-middle">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th className="text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {conceptos.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-muted text-center py-3">
                        Agregá conceptos para este mes
                      </td>
                    </tr>
                  )}
                  {conceptos.map(c => (
                    <tr key={c.nombre}>
                      <td className="fw-semibold">{c.nombre}</td>
                      <td>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            className="form-control"
                            value={c.monto}
                            onChange={e => actualizarMonto(c.nombre, e.target.value)}
                            placeholder="Monto"
                            disabled={guardando}
                          />
                        </div>
                      </td>
                      <td className="text-end">
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminarConcepto(c.nombre)}
                          disabled={guardando}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tiny muted mt-2">
              💡 Los conceptos se asocian a este mes específico
            </div>
          </div>

          {/* Botón guardar */}
          <button
            className="btn btn-gradient w-100 mt-4"
            onClick={guardarEstimado}
            disabled={!hayDatos || guardando}
          >
            {guardando ? '⏳ Guardando...' : '💾 Guardar estimados'}
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

export default Estimados;

