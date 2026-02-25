// Header con login/registro y info de usuario
import React from 'react';
import { auth, provider } from '../services/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

const Header = ({ user, setUser, onLogoClick }) => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error al iniciar sesión con Google');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="app-header">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center py-3">
          <div 
            onClick={onLogoClick}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onLogoClick()}
          >
            <h4 className="mb-0 fw-bold">💰 Finanzas Personales</h4>
          </div>
          
          <div>
            {!user ? (
              <button className="btn btn-primary" onClick={handleLogin}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                  <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
                </svg>
                Ingresar con Google
              </button>
            ) : (
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName} 
                    className="rounded-circle" 
                    width="32" 
                    height="32"
                  />
                  <span className="fw-semibold">{user.displayName}</span>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
