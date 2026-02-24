
// App principal de Finanzas Personales

import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';
import Login from './components/Login';
import Conceptos from './components/Conceptos';
import Estimados from './components/Estimados';
import Reales from './components/Reales';
import Reportes from './components/Reportes';
import { exportarExcel } from './utils/exportarExcel';
import {
  addEstimado, getEstimados, updateEstimado, addReal, getReales, updateReal
} from './services/firestore';

function App() {
  // Estado global de la app
  const [user, setUser] = useState(null); // Usuario logueado
  const [conceptos, setConceptos] = useState([]); // Conceptos globales
  const [estimados, setEstimados] = useState({}); // Estimados por concepto
  const [reales, setReales] = useState({}); // Reales por concepto
  const [estimadosId, setEstimadosId] = useState(null); // ID Firestore estimados
  const [realesId, setRealesId] = useState(null); // ID Firestore reales
  const hasLoadedFirestoreData = useRef(false);
  
  // Resetear flag al cambiar de usuario
  useEffect(() => {
    if (!user) {
      hasLoadedFirestoreData.current = false;
    }
  }, [user]);
  
  // Cargar datos de Firestore al iniciar sesión (solo una vez)
  useEffect(() => {
    if (!user || hasLoadedFirestoreData.current) return;
    hasLoadedFirestoreData.current = true;
    
    // Cargar estimados
    getEstimados().then((docs) => {
      if (docs.length > 0) {
        const docData = docs[0];
        const { id, ...data } = docData;
        setEstimados(data);
        setEstimadosId(id);
      }
    }).catch(err => console.error('Error al cargar estimados:', err));
    
    // Cargar reales
    getReales().then((docs) => {
      if (docs.length > 0) {
        const docData = docs[0];
        const { id, ...data } = docData;
        setReales(data);
        setRealesId(id);
      }
    }).catch(err => console.error('Error al cargar reales:', err));
  }, [user]);
  
  const [vista, setVista] = useState(''); // Sin tab preseleccionada

  // Handler para exportar a Excel
  const handleExportar = () => {
    exportarExcel(estimados, reales);
  };

  // Overlay de login (bloquea la app hasta iniciar sesión)
  const Overlay = () => (
    <div className="login-overlay">
      <div className="login-card">
        <h4>Primero iniciá sesión</h4>
        <p>Para usar la app necesitás iniciar sesión con Google.<br />Así se habilitan las pestañas y el guardado de datos.</p>
        <Login setUser={setUser} />
      </div>
    </div>
  );

  // Navegación tipo pills
  const NavTabs = () => (
    <div className="nav-pills-container">
      <button 
        className={`nav-pill ${vista === 'estimados' ? 'active' : ''}`}
        onClick={() => setVista('estimados')} 
        disabled={!user}>
        Estimados
      </button>
      <button 
        className={`nav-pill ${vista === 'reales' ? 'active' : ''}`}
        onClick={() => setVista('reales')} 
        disabled={!user}>
        Reales
      </button>
      <button 
        className={`nav-pill ${vista === 'reportes' ? 'active' : ''}`}
        onClick={() => setVista('reportes')} 
        disabled={!user}>
        Reportes
      </button>
    </div>
  );

  // Guardar estimados en Firestore
  const guardarEstimadosFirestore = async (data) => {
    if (estimadosId) {
      await updateEstimado(estimadosId, data);
    } else {
      const docRef = await addEstimado(data);
      setEstimadosId(docRef.id);
    }
    setEstimados(data);
  };

  // Guardar reales en Firestore
  const guardarRealesFirestore = async (data) => {
    if (realesId) {
      await updateReal(realesId, data);
    } else {
      const docRef = await addReal(data);
      setRealesId(docRef.id);
    }
    setReales(data);
  };

  // Panel principal
  const MainPanel = () => (
    <div className="main-card">
      {!user ? (
        <div className="text-center text-muted">
          <h4>Iniciá sesión con Google para usar la app</h4>
        </div>
      ) : !vista ? (
        <div className="text-center">
          <h5 className="mb-4">Elegí una pestaña para continuar</h5>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <button className="btn btn-primary btn-lg" onClick={() => setVista('estimados')}>
              Ir a Estimados
            </button>
            <button className="btn btn-outline-secondary btn-lg" onClick={() => setVista('reportes')}>
              Ver Reportes
            </button>
          </div>
        </div>
      ) : vista === 'estimados' ? (
        <div className="row g-4">
          <div className="col-12 col-xl-7">
            <Estimados conceptos={conceptos} estimados={estimados} setEstimados={guardarEstimadosFirestore} />
          </div>
          <div className="col-12 col-xl-5">
            <Conceptos conceptos={conceptos} setConceptos={setConceptos} />
          </div>
        </div>
      ) : vista === 'reales' ? (
        <Reales conceptos={conceptos} reales={reales} setReales={guardarRealesFirestore} />
      ) : vista === 'reportes' ? (
        <Reportes conceptos={conceptos} estimados={estimados} reales={reales} />
      ) : null}
    </div>
  );

  return (
    <div className="app-container">
      {/* Topbar */}
      <nav className="navbar navbar-expand-lg px-3 px-lg-4 py-3">
        <div className="container-fluid" style={{ maxWidth: '1800px', margin: '0 auto' }}>
          <span className="navbar-brand">
            💰 Finanzas personales
          </span>
          {user && (
            <div className="user-info ms-auto">
              <img src={user.photoURL} alt="avatar" width={32} height={32} />
              <span className="d-none d-sm-inline">{user.displayName}</span>
            </div>
          )}
        </div>
      </nav>
      {/* Navegación tipo pills */}
      <div style={{ maxWidth: '1800px', margin: '0 auto', padding: '0 1rem' }}>
        <NavTabs />
      </div>
      {/* Panel principal */}
      <main style={{ maxWidth: '1800px', margin: '0 auto', padding: '0 1rem 3rem' }}>
        <MainPanel />
      </main>
      {/* Overlay de login */}
      {!user && <Overlay />}
    </div>
  );
}

export default App;
