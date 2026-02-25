// Componente para mostrar y gestionar conceptos globales (diseño tipo maqueta)
import React, { useState } from 'react';

const Conceptos = ({ conceptos, setConceptos }) => {
  const [nuevo, setNuevo] = useState('');

  const agregarConcepto = () => {
    if (nuevo.trim()) {
      const nuevos = [...conceptos, { nombre: nuevo }];
      setConceptos(nuevos);
      setNuevo('');
    }
  };

  const eliminarConcepto = (nombre) => {
    const nuevos = conceptos.filter(c => c.nombre !== nombre);
    setConceptos(nuevos);
  };

  return (
    <div className="component-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-semibold">🏷️ Gestionar Conceptos</h6>
        <span className="badge bg-light text-muted">No guardado</span>
      </div>
      <div className="d-flex align-items-center mb-3 gap-2">
        <input
          className="form-control"
          value={nuevo}
          onChange={e => setNuevo(e.target.value)}
          placeholder="Ej: Comida / Salidas / Emergencia"
          onKeyPress={(e) => e.key === 'Enter' && agregarConcepto()}
        />
        <button className="btn btn-primary px-3" type="button" onClick={agregarConcepto}>
          ➕
        </button>
      </div>
      <div className="table-responsive-custom">
        <table className="table table-sm table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Concepto</th>
              <th className="text-end">Acción</th>
            </tr>
          </thead>
          <tbody>
            {conceptos.length === 0 && (
              <tr><td colSpan={2} className="text-muted text-center py-3">Todavía no agregaste conceptos.</td></tr>
            )}
            {conceptos.map(c => (
              <tr key={c.nombre}>
                <td className="fw-semibold">{c.nombre}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarConcepto(c.nombre)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tiny muted mt-2">Total conceptos: {conceptos.length}</div>
    </div>
  );
};

export default Conceptos;
