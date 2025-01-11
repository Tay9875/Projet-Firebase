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
  
// Initialisation des collections Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const articleCollection = collection(db, 'articles');
const conversationCollection = collection(db, 'conversations');

console.log(sessionStorage.getItem('article'));
console.log(sessionStorage.getItem('user'));

const getArticle = async () => {
  const articleId = parseInt(sessionStorage.getItem('article'), 10);
  if (isNaN(articleId)) {
    console.log("L'ID de l'article est invalide !");
    return null;
  }
  
  const a = query(articleCollection, where("id_a", "==", articleId));
  const querySnapshot = await getDocs(a);

  // On récupère le premier document trouvé
  const doc = querySnapshot.docs[0];
  return doc.data();
};

const getRealID = async () => {
  const articleId = parseInt(sessionStorage.getItem('article'), 10);
  if (isNaN(articleId)) {
    console.log("L'ID de l'article est invalide !");
    return null;
  }
  
  const a = query(articleCollection, where("id_a", "==", articleId));
  const querySnapshot = await getDocs(a);

  // On récupère le premier document trouvé
  const doc = querySnapshot.docs[0];
  return doc.id;
};


const getLastConv = async () => {
  const conv = query(conversationCollection);
  const querySnapshot = await getDocs(conv);
  let temoin=0;

  querySnapshot.forEach((doc) => {
    const convData=doc.data();//doc.getId()
    if(convData.id_conv > temoin){
        temoin=convData.id_conv;
    }
  });
  return ++temoin;
}

const findConversation = async (article) => {
  const conv = query(conversationCollection);
  const querySnapshot = await getDocs(conv);

  //si un article est séléctionné alors dans la page messagerie on ouvrira la conversation
  for (const doc of querySnapshot.docs) {
    const convData = doc.data();
    if(convData.id_a == Number(article) && convData.id_acheteur == Number(sessionStorage.getItem('user')) && convData.id_vendeur == Number(sessionStorage.getItem('proprietaire'))){
      //console.log(convData);
      sessionStorage.setItem('conversation',Number(convData.id_conv));
      console.log(sessionStorage.getItem('conversation'));
      location.href='messagerie.html';
    }
  }

  //si il n'y pas de conversation existant il faut en créer une
  const id_conv = await getLastConv();
  await addDoc(conversationCollection, {
    'id_a': Number(article),
    'id_acheteur': Number(sessionStorage.getItem('user')),
    'id_conv': id_conv,
    'id_vendeur': Number(sessionStorage.getItem('proprietaire')),
  });
  console.log('la conversation a été ajouté');
  location.href='messagerie.html';
};

const afficherArticle = async () => {
  const article = await getArticle();
  const artId = await getRealID();

  document.querySelector('#content').innerHTML += `<img src="${article.img1}" style="width: 100%;height: 100%;object-fit: cover; border-radius: 15px;">`;
  document.querySelector('#details').innerHTML += `<div style="display: flex; justify-content: space-between;"><div><h3 class="titre">${article.titre}</h3><p>${article.marque}</p><p>${article.categorie}</p></div><div><p>${article.etat}</p></div></div><div><b><p>Description</p></b><p>${article.description}</p></div><div><b><p>Prix</p></b><h4>${article.prix} €</h4><p style="font-size: 12px; color: #8f8989;">${((article.prix / 100) * 9)} € inclut la protection acheteur</p></div>`;
  console.log(article.id_u);
  console.log(sessionStorage.getItem('user'));

  if(article.id_u != sessionStorage.getItem('user')){//si l'article n'appartient pas à l'utilisateur c'est un acheteur
    document.querySelector('#details').innerHTML += `<div class="around"><button id="acheter">Acheter l'article</button></div>`;

    document.querySelector('#acheter').addEventListener('click', async () => {
      sessionStorage.setItem('proprietaire',article.id_u);
      await findConversation(article.id_a);
    });
  }
  else{
    document.querySelector('#details').innerHTML += `<div class="around"><button id="modifier" data-id="${article.id_a}">Modifier l'article</button><button id="supprimer" data-id="${article.id_a}">Supprimer l'article</button></div>`;
    console.log(article.id_a);
    document.querySelector('#modifier').addEventListener('click', async () => {
        sessionStorage.setItem('action',1);
        sessionStorage.setItem('article', document.querySelector('#modifier').getAttribute('data-id'));
        //console.log(sessionStorage.getItem('article'));
        location.href='modifier.html';
    });

    document.querySelector('#supprimer').addEventListener('click', async () => {
      await deleteDoc(doc(db, "articles", artId));
      //delete everyhing that comes with the article
      console.log('article supprimé');
      location.href='compte.html';
    });
  }
};

// Appel de la fonction pour afficher l'article
afficherArticle();
