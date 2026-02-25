import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

// Guardar todos los datos del usuario (conceptos, estimados, reales)
export const guardarDatosUsuario = async (userId, datos) => {
  const userDocRef = doc(db, 'users', userId);
  await setDoc(userDocRef, datos, { merge: true });
};

// Obtener todos los datos del usuario
export const obtenerDatosUsuario = async (userId) => {
  const userDocRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userDocRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    // Si no existe, intentar migrar datos antiguos
    const datosAntiguos = await migrarDatosAntiguos(userId);
    if (datosAntiguos) {
      return datosAntiguos;
    }
    
    // Si no hay datos antiguos, retornar estructura vacía
    return {
      estimados: {},
      reales: {}
    };
  }
};

// Migrar datos de la estructura antigua a la nueva
const migrarDatosAntiguos = async (userId) => {
  try {
    const estimadosCollection = collection(db, 'estimados');
    const realesCollection = collection(db, 'reales');
    
    const [estimadosSnapshot, realesSnapshot] = await Promise.all([
      getDocs(estimadosCollection),
      getDocs(realesCollection)
    ]);
    
    if (estimadosSnapshot.empty && realesSnapshot.empty) {
      return null; // No hay datos antiguos
    }
    
    // Tomar el primer documento de cada colección (asumiendo que había uno solo)
    const estimadosData = !estimadosSnapshot.empty ? estimadosSnapshot.docs[0].data() : {};
    const realesData = !realesSnapshot.empty ? realesSnapshot.docs[0].data() : {};
    
    const datosAMigrar = {
      estimados: estimadosData,
      reales: realesData
    };
    
    // Guardar en la nueva estructura
    await guardarDatosUsuario(userId, datosAMigrar);
    
    console.log('✅ Datos migrados exitosamente de estructura antigua');
    return datosAMigrar;
  } catch (error) {
    console.error('Error al migrar datos antiguos:', error);
    return null;
  }
};
