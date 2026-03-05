
// App principal de Finanzas Personales

import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';
import Header from './components/Header';
import Estimados from './components/Estimados';
import Reales from './components/Reales';
import Reportes from './components/Reportes';
import { exportarExcel } from './utils/exportarExcel';
import {
  guardarDatosUsuario, obtenerDatosUsuario
} from './services/firestore';

function App() {
  // Estado global de la app
  const [user, setUser] = useState(null); // Usuario logueado
  const [estimados, setEstimados] = useState({}); // Estimados por mes
  const [reales, setReales] = useState({}); // Reales por mes
  const hasLoadedFirestoreData = useRef(false);
  
  // Resetear datos al cerrar sesión
  useEffect(() => {
    if (!user) {
      hasLoadedFirestoreData.current = false;
      setEstimados({});
      setReales({});
    }
  }, [user]);
  
  // Cargar datos del usuario al iniciar sesión
  useEffect(() => {
    if (!user || hasLoadedFirestoreData.current) return;
    hasLoadedFirestoreData.current = true;
    
    obtenerDatosUsuario(user.uid)
      .then((datos) => {
        setEstimados(datos.estimados || {});
        setReales(datos.reales || {});
      })
      .catch(err => console.error('Error al cargar datos:', err));
  }, [user]);
  
  const [vista, setVista] = useState(''); // Sin tab preseleccionada

  // Handler para exportar a Excel
  const handleExportar = () => {
    exportarExcel(estimados, reales);
  };

  // Función para verificar login antes de guardar
  const verificarYGuardar = () => {
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
        alert('👆 Hacé clic en el botón "Ingresar con Google" en la parte superior de la página');
      }
      return;
    }
    guardarTodosDatos();
  };

  // Navegación tipo pills
  const NavTabs = () => (
    <div className="nav-pills-container">
      <button 
        className={`nav-pill ${vista === 'estimados' ? 'active' : ''}`}
        onClick={() => setVista('estimados')}>
        Estimados
      </button>
      <button 
        className={`nav-pill ${vista === 'reales' ? 'active' : ''}`}
        onClick={() => setVista('reales')}>
        Reales
      </button>
      <button 
        className={`nav-pill ${vista === 'reportes' ? 'active' : ''}`}
        onClick={() => setVista('reportes')}>
        Reportes
      </button>
    </div>
  );

  // Guardar todos los datos del usuario en Firestore
  const guardarTodosDatos = async () => {
    if (!user) {
      alert('Debes iniciar sesión para guardar los datos');
      return;
    }
    
    try {
      await guardarDatosUsuario(user.uid, {
        estimados,
        reales
      });
      
      // Mostrar mensaje de éxito temporal
      const toast = document.createElement('div');
      toast.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg';
      toast.style.zIndex = '9999';
      toast.innerHTML = '<strong>✅ Datos guardados exitosamente</strong>';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Error al guardar los datos. Intentá nuevamente.');
    }
  };

  // Panel principal
  const MainPanel = () => (
    <div className="main-card">
      {!vista ? (
        <div className="welcome-section">
          <div className="welcome-hero">
            <div className="welcome-icon">💰</div>
            <h1 className="welcome-title">Finanzas Personales</h1>
            <p className="welcome-subtitle">
              Administrá tus gastos e ingresos de forma simple y efectiva
            </p>
          </div>
          
          {!user ? (
            <div className="welcome-alert">
              <div className="alert alert-info border-0 shadow-sm">
                <div className="d-flex align-items-center gap-3">
                  <div className="fs-3">💡</div>
                  <div>
                    <strong>¡Bienvenido!</strong> Podés explorar la app sin iniciar sesión.
                    <br />
                    Para guardar tus datos y acceder desde cualquier dispositivo,
                    <strong> ingresá con tu cuenta de Google</strong> usando el botón de arriba.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="welcome-alert">
              <div className="alert alert-success border-0 shadow-sm">
                <div className="d-flex align-items-center gap-3">
                  <div className="fs-3">✅</div>
                  <div>
                    <strong>¡Hola, {user.displayName?.split(' ')[0]}!</strong> Tus datos están sincronizados.
                    <br />
                    Recordá hacer clic en "Guardar" después de realizar cambios.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="welcome-cards">
            <div className="feature-card" onClick={() => setVista('estimados')}>
              <div className="feature-icon">📊</div>
              <h3>Estimados</h3>
              <p>Planificá tus gastos e ingresos mensuales</p>
              <button className="btn btn-primary w-100">Comenzar →</button>
            </div>
            
            <div className="feature-card" onClick={() => setVista('reales')}>
              <div className="feature-icon">💵</div>
              <h3>Reales</h3>
              <p>Registrá tus gastos e ingresos reales</p>
              <button className="btn btn-outline-primary w-100">Ver →</button>
            </div>
            
            <div className="feature-card" onClick={() => setVista('reportes')}>
              <div className="feature-icon">📈</div>
              <h3>Reportes</h3>
              <p>Analizá tus finanzas con gráficos</p>
              <button className="btn btn-outline-primary w-100">Analizar →</button>
            </div>
          </div>
        </div>
      ) : vista === 'estimados' ? (
        <Estimados 
          estimados={estimados} 
          setEstimados={setEstimados}
          reales={reales}
          setReales={setReales}
          user={user}
          onGuardar={guardarTodosDatos}
        />
      ) : vista === 'reales' ? (
        <Reales 
          estimados={estimados}
          reales={reales} 
          setReales={setReales}
          user={user}
          onGuardar={guardarTodosDatos}
        />
      ) : vista === 'reportes' ? (
        <Reportes estimados={estimados} reales={reales} />
      ) : null}
    </div>
  );

  return (
    <div className="app-container">
      {/* Header con login */}
      <Header user={user} setUser={setUser} onLogoClick={() => setVista('')} />
      
      {/* Navegación tipo pills */}
      <div style={{ maxWidth: '1800px', margin: '0 auto', padding: '1.5rem 1rem 0' }}>
        <NavTabs />
      </div>
      
      {/* Panel principal */}
      <main style={{ maxWidth: '1800px', margin: '0 auto', padding: '0 1rem 3rem' }}>
        <MainPanel />
      </main>
    </div>
  );
}

export default App;
