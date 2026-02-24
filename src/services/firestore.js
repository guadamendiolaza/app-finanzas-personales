import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Colección para estimados
const estimadosCollection = collection(db, 'estimados');
// Colección para reales
const realesCollection = collection(db, 'reales');

// Crear un estimado
export const addEstimado = async (data) => {
  return await addDoc(estimadosCollection, data);
};

// Leer todos los estimados
export const getEstimados = async () => {
  const snapshot = await getDocs(estimadosCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Actualizar un estimado
export const updateEstimado = async (id, data) => {
  const estimadoDoc = doc(db, 'estimados', id);
  return await updateDoc(estimadoDoc, data);
};

// Eliminar un estimado
export const deleteEstimado = async (id) => {
  const estimadoDoc = doc(db, 'estimados', id);
  return await deleteDoc(estimadoDoc);
};

// Crear un real
export const addReal = async (data) => {
  return await addDoc(realesCollection, data);
};

// Leer todos los reales
export const getReales = async () => {
  const snapshot = await getDocs(realesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Actualizar un real
export const updateReal = async (id, data) => {
  const realDoc = doc(db, 'reales', id);
  return await updateDoc(realDoc, data);
};

// Eliminar un real
export const deleteReal = async (id) => {
  const realDoc = doc(db, 'reales', id);
  return await deleteDoc(realDoc);
};
