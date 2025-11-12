// Importar módulos do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuração do Firebase (coloque as suas credenciais)
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

// Exporta o banco para uso no script.js
export { db, collection, addDoc, getDocs, deleteDoc, doc };
