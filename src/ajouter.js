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

//pusiqu'il n'y a pas de autoincrement
const getLastArticle = async () => {
  const article = query(collection(db, "articles"));
  const querySnapshot = await getDocs(article);
  let temoin=0;

  querySnapshot.forEach((doc) => {
    const articleData=doc.data();
    if(articleData.id_u > temoin){
        temoin=articleData.id_a;
    }
  });
  return ++temoin;
}

//ajoute un utilisateur dans la collection users
document.querySelector("#ajout").addEventListener('submit', async (event) => {
  event.preventDefault();
  console.log("Submit new article");
  
  let img1 = document.querySelector('#img1').value;
  let titre = document.querySelector('#titre').value;
  let description = document.querySelector('#description').value;
  let etat = document.querySelector('#etat').value;
  let categorie = document.querySelector('#categorie').value;
  let marque = document.querySelector('#marque').value;
  let prix = document.querySelector('#prix').value;
  let dispo = 'dispo';
  let id = await getLastArticle();

  if (img1 !== "" && titre !== "" && description !== "" && etat !== "" && categorie !== "" &&  marque !== "" && prix !== "") {
    
        await addDoc(collection(db, "articles"), {
            'id_a': Number(id),
            'id_u': Number(sessionStorage.getItem('user')),
            'titre': titre,
            'description': description,
            'etat': etat,
            'categorie': categorie,
            'marque': marque,
            'prix': Number(prix),
            'img1': String(img1),
            'disponibilite': String(dispo),
          });
          console.log('Article ajoué');
          location.href='compte.html';
  } else {
    alert('Merci de renseiger les champs !');
  }
});