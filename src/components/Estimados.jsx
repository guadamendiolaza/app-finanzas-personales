// Componente para cargar estimados mensuales (diseño tipo maqueta)
import React, { useState, useRef, useEffect } from 'react';

const Estimados = ({ conceptos, estimados, setEstimados }) => {
  const [mes, setMes] = useState('');
  const [ingreso, setIngreso] = useState('');
  const [inversion, setInversion] = useState('');
  const [conceptosMontos, setConceptosMontos] = useState({});
  const [dirty, setDirty] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const lastLoadedMes = useRef('');

  // Al cambiar el mes, cargar datos existentes desde Firestore
  useEffect(() => {
    // Evitar loops: solo cargar si el mes realmente cambió
    if (mes === lastLoadedMes.current) return;
    lastLoadedMes.current = mes;

    if (!mes) {
      setIngreso('');
      setInversion('');
      setConceptosMontos({});
      setDirty(false);
      return;
    }
    
    // Cargar datos del mes seleccionado desde estimados guardados
    const newIngreso = (estimados.ingreso?.mes === mes) ? (estimados.ingreso.monto || '') : '';
    const newInversion = (estimados.inversion?.mes === mes) ? (estimados.inversion.monto || '') : '';
    
    // Cargar montos de conceptos para este mes desde datos guardados
    const montos = {};
    conceptos.forEach(c => {
      montos[c.nombre] = (estimados[c.nombre]?.mes === mes) ? (estimados[c.nombre].monto || '') : '';
    });
    
    // Actualizar todo el estado de una vez
    setIngreso(newIngreso);
    setInversion(newInversion);
    setConceptosMontos(montos);
    setDirty(false);
  }, [mes, estimados]);

  // Cuando cambian los conceptos, agregar los nuevos sin borrar los ya ingresados
  useEffect(() => {
    if (!mes) return; // Solo si ya hay un mes seleccionado
    
    setConceptosMontos(prev => {
      const updated = { ...prev };
      // Agregar conceptos nuevos que no existen en el estado actual
      conceptos.forEach(c => {
        if (!(c.nombre in updated)) {
          // Si está guardado en Firestore para este mes, usar ese valor
          if (estimados[c.nombre]?.mes === mes) {
            updated[c.nombre] = estimados[c.nombre].monto || '';
          } else {
            updated[c.nombre] = '';
          }
        }
      });
      // Limpiar conceptos que ya no existen
      Object.keys(updated).forEach(nombre => {
        if (!conceptos.find(c => c.nombre === nombre)) {
          delete updated[nombre];
        }
      });
      return updated;
    });
  }, [conceptos, mes, estimados]);

  // Guardar estimado general y conceptos
  const guardarEstimado = async () => {
    if (!mes) {
      alert('Por favor, seleccioná un mes primero');
      return;
    }
    
    setGuardando(true);
    try {
      const nuevosEstimados = {
        ...estimados,
        ingreso: { monto: ingreso, mes },
        inversion: { monto: inversion, mes },
      };
      conceptos.forEach(c => {
        nuevosEstimados[c.nombre] = { monto: conceptosMontos[c.nombre] || '', mes };
      });
      await setEstimados(nuevosEstimados);
      // NO resetear dirty - mantener por si el usuario quiere seguir editando
      // setDirty(false); // Comentado para que no se deshabilite el botón
      alert('✓ Estimados guardados correctamente');
      // Marcar como no dirty solo después del alert
      setDirty(false);
    } catch (error) {
      console.error('Error al guardar estimados:', error);
      alert('✗ Error al guardar los datos. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // Manejar cambio de monto por concepto
  const handleConceptoMonto = (nombre, monto) => {
    setConceptosMontos(prev => ({ ...prev, [nombre]: monto }));
    setDirty(true);
  };

  // Manejar cambios en campos generales
  const handleGeneralChange = (setter) => (e) => {
    setter(e.target.value);
    setDirty(true);
  };

  return (
    <div className="component-card">
      <h5 className="mb-3">📈 Estimados del mes</h5>
      <div className="mb-3">
        <label className="form-label fw-semibold">Mes</label>
        <input
          type="month"
          className="form-control"
          value={mes}
          onChange={e => setMes(e.target.value)}
        />
      </div>
      <div className="row g-2 mb-2">
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold">Ingreso estimado</label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              type="number"
              className="form-control"
              placeholder="Ej: 1200000"
              value={ingreso}
              onChange={handleGeneralChange(setIngreso)}
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
              onChange={handleGeneralChange(setInversion)}
              disabled={guardando}
            />
          </div>
        </div>
      </div>
      <div className="divider my-3" />
      <div>
        <h6 className="mb-3 fw-semibold">Conceptos y presupuestos</h6>
        <div className="table-responsive-custom">
          <table className="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {conceptos.length === 0 && (
                <tr><td colSpan={2} className="text-muted text-center py-3">Podés agregar conceptos después.</td></tr>
              )}
              {conceptos.map(c => (
                <tr key={c.nombre}>
                  <td className="fw-semibold">{c.nombre}</td>
                  <td>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        value={conceptosMontos[c.nombre] ?? estimados[c.nombre]?.monto ?? ''}
                        onChange={e => handleConceptoMonto(c.nombre, e.target.value)}
                        placeholder="Monto estimado"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tiny muted mt-2">💡 Consejo: empezá con 5–8 conceptos. Después refinás.</div>
      </div>
      <button
        className="btn btn-gradient w-100 mt-3"
        type="button"
        onClick={guardarEstimado}
        disabled={!dirty || guardando}
      >
        {guardando ? '⏳ Guardando...' : '💾 Guardar estimado'}
      </button>
    </div>
  );
};

export default Estimados;
