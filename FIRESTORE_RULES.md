# Reglas de Seguridad de Firestore

## ⚠️ IMPORTANTE: Debes configurar estas reglas en Firebase Console

Para que cada usuario solo pueda acceder a sus propios datos, debes actualizar las reglas de seguridad en Firestore.

### Paso 1: Ve a Firebase Console
1. Abre https://console.firebase.google.com/
2. Selecciona tu proyecto **"Finanzas Personales"**
3. Ve a **Firestore Database** en el menú lateral
4. Haz clic en la pestaña **"Reglas"** (Rules)

### Paso 2: Copia y pega estas reglas

Reemplaza el contenido actual con esto:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Regla para la colección de usuarios
    match /users/{userId} {
      // Solo el usuario autenticado puede leer/escribir sus propios datos
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Denegar acceso a cualquier otra colección
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Paso 3: Publica las reglas

1. Haz clic en **"Publicar"** (Publish)
2. Confirma los cambios

### ✅ ¿Qué hacen estas reglas?

- **Seguridad por usuario**: Cada usuario solo puede ver y modificar sus propios datos
- **Autenticación requerida**: Solo usuarios autenticados con Google pueden guardar datos
- **Protección completa**: No se permite acceso a otras colecciones no definidas

### 🔒 Estructura de datos

Los datos se guardan así en Firestore:

```
users/
  └── {userId}/
      ├── estimados/
      │   ├── "2026-02": { ingreso: 1200000, inversion: 250000, conceptos: [...] }
      │   └── "2026-03": { ingreso: 1300000, inversion: 300000, conceptos: [...] }
      └── reales/
          ├── "2026-02": { ingreso: 1150000, inversion: 240000, ganadoInversion: 15000, conceptos: [...] }
          └── "2026-03": { ingreso: 1280000, inversion: 290000, ganadoInversion: 20000, conceptos: [...] }
```

Cada usuario tiene su propio documento identificado por su `userId` de Google.
Los conceptos son específicos de cada mes, no globales.
