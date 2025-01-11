import { initializeApp } from 'firebase/app';
import { getDatabase } from "firebase/database";
import { getFirestore, onSnapshot, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp,query, and, update} from 'firebase/firestore';

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
let articles = [];
let modif = 0;
let mainQuery = query(collection(db, 'articles')); // Initialisation de la requête
let favorisCollection = collection(db, 'favoris'); // Initialisation de la requête

console.log(sessionStorage.getItem('pseudo'));
console.log(sessionStorage.getItem('user'));

// Exécution de la requête et écoute des résultats
onSnapshot(mainQuery, (querySnapshot) => {
  let articles = [];
  querySnapshot.docs.map((doc) => {
    articles.push({ ...doc.data(), id: doc.id });
  });
  showArticles(articles);
});

const getRealID = async (article) => {
  const a = query(favorisCollection, and(where("id_a", "==", article), where("id_u", "==", Number(sessionStorage.getItem('user')))));
  const querySnapshot = await getDocs(a);

  // On récupère le premier document trouvé
  const doc = querySnapshot.docs[0];
  return doc.id;
};

const existeFavoris = async(article) => {
  const fave = query(favorisCollection);
  const querySnapshot = await getDocs(fave);
  for (const doc of querySnapshot.docs) {
    const faveData = doc.data();
    if(faveData.id_a == Number(article) && faveData.id_u == Number(sessionStorage.getItem('user'))){
      return doc.id;
    }
  }
  return false;
} 

const ajoutFavoris = async(article) => {
  if(await existeFavoris(article) == false){
    await addDoc(collection(db, "favoris"), {
      'id_u': Number(sessionStorage.getItem('user')),
      'id_a': Number(article),
    });
  }
} 

const retireFavoris = async(article) => {
  const artId = await existeFavoris(article);
  if(artId != false){
    await deleteDoc(doc(db, "favoris", artId));
  }
}

const showArticles = (articles) => {
  document.querySelector('#articles').innerHTML = '';

  articles.map((article, key) => {
    if(article.id_u != Number(sessionStorage.getItem('user')) && article.disponibilite == 'dispo'){
      document.querySelector('#articles').innerHTML += "<div class='col-md-3' style='padding: 10px;'><button class='card w' data-id='"+article.id_a+"'><img src="+article.img1+"><br><div class='align'><p>"+article.prix+" €<br><small>Inclut la protection de l'acheteur</small></p><p><input class='checkbox' type='checkbox' id='heart' data-id='"+article.id_a+"'><label class='heart' for='heart'></label></p></div><h4 class='titre3'>"+article.titre+"</h4></button></div>";
    }
  });
  
  //pour chaque element de la classe card (c'est à dire les boutons article affichés) on récupère leur id si récupéré
  document.querySelectorAll('.card').forEach(element => {
    element.addEventListener('click', async (e) => {
      if (e.target && e.target.classList.contains('checkbox') || e.target && e.target.classList.contains('heart')) {
        return; // Ne rien faire si c'est le checkbox
      }

      sessionStorage.setItem('article', e.currentTarget.getAttribute('data-id'));//console.log(sessionStorage.getItem('article'));
      location.href='article.html';//on redirige vers la page qui contient les détails de l'article
    })
  });

  document.querySelectorAll('.checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      if(sessionStorage.getItem('user') == null){
        location.href ='connexion.html';
      }
      else{
        const articleId = e.target.getAttribute('data-id');
        console.log()
        if (e.target.checked) {
          ajoutFavoris(articleId); // Ajouter aux favoris
        } else {
          retireFavoris(articleId); // Retirer des favoris
        }
      }
    });
  });
}