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


//initialisaion de variables générales
let sessionData = null;

const getUser = async (email) => {
    const user = query(collection(db, "users"));
    const querySnapshot = await getDocs(user);
  
    // Utilisation de for...of pour pouvoir "return" correctement
    for (const doc of querySnapshot.docs) {
      const userData = doc.data();
      if (userData.email.valueOf() === email) {
        return userData;
      }
    }
  }

//pusiqu'il n'y a pas de autoincrement
const getLastUser = async () => {
  const user = query(collection(db, "users"));
  const querySnapshot = await getDocs(user);
  let temoin=0;

  querySnapshot.forEach((doc) => {
    const userData=doc.data();
    if(userData.id_u > temoin){
        temoin=userData.id_u;
    }
  });
  return ++temoin;
}

//verifie si l'email existe deja
const getEmail = async (email) => {
    const user = query(collection(db, "users"));
    const querySnapshot = await getDocs(user);
  
    // Utilisation de for...of pour pouvoir "return" correctement
    for (const doc of querySnapshot.docs) {
      const userData = doc.data();
      if (userData.email.valueOf() === email) {
        return true;
      }
    }
    return false;
  }
  

//ajoute un utilisateur dans la collection users
document.querySelector("#addUser").addEventListener('submit', async (event) => {
  event.preventDefault();
  console.log("Submit new user");
  
  let pseudo = document.querySelector('#pseudo').value;
  let email = document.querySelector('#email').value;
  let pwd = document.querySelector('#pwd').value;
  let pwd2 = document.querySelector('#pwd2').value;
  let id = await getLastUser();

  if (pseudo !== "" && email !== "" && pwd !== "" &&  pwd2 !== "") {
    let e = await getEmail(document.querySelector('#email').value);
    if(e == true || (pwd !== pwd2)){
        alert('Entrées Email ou Mots de passe invalide');
    }
    else{
        await addDoc(collection(db, "users"), {
            'id_u': id,
            'pseudo': pseudo,
            'email': email,
            'pwd': pwd,
            'argent_depense': 0,
            'argent_gagne': 0,
            'rue': null,
            'ville': null,
            'codePostal': null,
          });
          sessionData = await getUser(email);
          //établi des objest de session
          sessionStorage.setItem('user', sessionData.id_u);
          sessionStorage.setItem('pseudo', sessionData.pseudo);
          sessionStorage.setItem('email', sessionData.email);
          location.href='index.html';
    }
  } else {
    alert('Merci de renseiger les champs !');
  }
});