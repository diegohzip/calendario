// firebase.js
// Importar módulos do Firebase (modular v11)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuração do Firebase (substitua pelas suas credenciais)
const firebaseConfig = {
  apiKey: "AIzaSyAxap_9PJksXp7RHzjTNV071ecQaXChRf8",
  authDomain: "calendario-75f65.firebaseapp.com",
  projectId: "calendario-75f65",
  storageBucket: "calendario-75f65.firebasestorage.app",
  messagingSenderId: "486189943298",
  appId: "1:486189943298:web:9d9868a9aff7fce6f6f51b",
  measurementId: "G-C1TRLT364B"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exporta o que o script precisa
export { db, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp };
