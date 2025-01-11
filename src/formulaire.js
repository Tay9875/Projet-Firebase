import { initializeApp } from 'firebase/app';
import { getDatabase } from "firebase/database";
import { getFirestore, onSnapshot, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp,query, update, where, and} from 'firebase/firestore';

console.log('Started with webpack');

  const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
  };
  
//initialisation des collections firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const userCollection = collection(db, 'users');

if(sessionStorage.getItem('pseudo')==null){
  location.href='connexion.html';
}

let rue = document.querySelector('#rue').value;
let ville = document.querySelector('#ville').value;
let codePostal = document.querySelector('#codePostal').value;

const getRealID = async () => {
  const articleId = parseInt(sessionStorage.getItem('user'), 10);
  if (isNaN(articleId)) {
    console.log("L'ID de l'utilisateur est invalide !");
    return null;
  }
  
  const u = query(userCollection, where("id_u", "==", articleId));
  const querySnapshot = await getDocs(u);

  // On récupère le premier document trouvé
  const doc = querySnapshot.docs[0];
  return doc.id;
};


document.querySelector("#getAdress").addEventListener('submit', async (event) => {
  event.preventDefault();
  let rue = document.querySelector('#rue').value;
  let ville = document.querySelector('#ville').value;
  let codePostal = document.querySelector('#codePostal').value;

  console.log(rue+' '+ville+' '+codePostal+' ');

  const userId = await getRealID(); 
  await updateDoc(doc(db, "users", userId),{
    rue: String(rue),
    ville: String(ville),
    codePostal: String(codePostal),
  });

  location.href='compte.html';
  
});