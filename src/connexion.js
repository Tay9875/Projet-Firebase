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


//il faut peut-etre le modifier
document.querySelector("#connectUser").addEventListener('submit', async (event) => {
    event.preventDefault();
    //console.log("Try to connect user");

    //on recupere les valeurs du formulaire dans la page connexion
    let email=document.querySelector('#email').value;
    let pwd=document.querySelector('#pwd').value;

    //ici on va faire en sorte que les champs de l'email et du mot de passe ne son pas vides
    if (email !== "" && pwd !== "") {
        //console.log('Les champs ne sont pas vides');
        //recherche un document a partir de l'email et le mot de passe
        const user = query(collection(db, "users"), and(where('email', '==', email),where('pwd','==',pwd)));
        const querySnapshot = await getDocs(user);
        
        for (const doc of querySnapshot.docs) {
            const userData = doc.data();
            //établi des objest de session
            sessionStorage.setItem('user', userData.id_u);
            sessionStorage.setItem('pseudo', userData.pseudo);
            sessionStorage.setItem('email', userData.email);
            location.href='index.html';
          }
        
        document.querySelector('#email').value="";
        document.querySelector('#pwd').value="";
    }else {
        alert('Merci de renseiger les champs !');
    }
  });
