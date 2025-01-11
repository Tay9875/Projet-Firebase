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
const userCollection = collection(db, "users");
const mainQuery = query(collection(db, 'articles'),where("id_u","==",Number(sessionStorage.getItem('user'))));
const secondQuery = query(collection(db, 'articles'));
const favoriteQuery = query(collection(db, 'favoris'),where("id_u","==",Number(sessionStorage.getItem('user'))));
let articles = [];
let favorites = [];
let myFavorites = [];
let otherArticles = [];

if(sessionStorage.getItem('pseudo')==null){
  location.href='connexion.html';
}

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

onSnapshot(collection(db, 'users'), (snapshot) => {
  afficherCompte();
});

const getRealID = async () => {
  const Id = parseInt(sessionStorage.getItem('user'), 10);
  if (isNaN(Id)) {
    console.log("L'ID de l'utilisateur est invalide !");
    return null;
  }
  
  const u = query(userCollection, where("id_u", "==", Id));
  const querySnapshot = await getDocs(u);

  // On récupère le premier document trouvé
  const doc = querySnapshot.docs[0];
  return doc.id;
};

const modifierPseudo = async() => {
  let pseudo = document.querySelector('#pseudo').value; 
  const userId = await getRealID(); 

  await updateDoc(doc(db, "users", userId),{
    pseudo: String(pseudo),
  });
}

const existeFavoris = async(article) => {
  const fave = favoriteQuery;
  const querySnapshot = await getDocs(fave);
  for (const doc of querySnapshot.docs) {
    const faveData = doc.data();
    if(faveData.id_a == Number(article)){
      return doc.id;
    }
  }
  return false;
} 

const retireFavoris = async(article) => {
  const artId = await existeFavoris(article);
  if(artId != false){
    await deleteDoc(doc(db, "favoris", artId));
  }
} 

const afficherCompte = async() => {
  document.querySelector('#info').innerHTML = '';
  const user = await getUser(sessionStorage.getItem('email'));
  if(user.rue == null || user.ville == null || user.codePostal == null){
    document.querySelector('#info').innerHTML += '<div id="modify1"><b><p>'+user.pseudo+' <img src="css/images/modif.png" style="width: 25px;" id="modify-pseudo"></p></b></div><div id="modify2"><b><p>'+user.email+' <img src="css/images/modif.png" style="width: 25px;" id="modify-email" onclick="furtherModif()"></p></b></div><div id="modify3"><p>Mot de passe <img src="css/images/modif.png" style="width: 25px;" id="modify-p" onclick="furtherModif()"></p></div><div><b><p>Aucune adresse confirmée <img src="css/images/modif.png" style="width: 25px;" id="modify-adresse"></p></b></div><div><p>Argent dépensé</p><b><p>'+user.argent_depense+' €</p></b></div><div><p>Argent gagné</p><b><p>'+user.argent_gagne+' €</p></b></div>';
  }
  else{
    document.querySelector('#info').innerHTML += '<div id="modify1"><b><p>'+user.pseudo+' <img src="css/images/modif.png" style="width: 25px;" id="modify-pseudo"></p></b></div><div id="modify2"><b><p>'+user.email+' <img src="css/images/modif.png" style="width: 25px;" id="modify-email" onclick="furtherModif()"></p></b></div><div id="modify3"><p>Mot de passe <img src="css/images/modif.png" style="width: 25px;" id="modify-p" onclick="furtherModif()"></p></div><div><b><p>'+user.rue+' '+user.ville+' '+user.codePostal+' <img src="css/images/modif.png" style="width: 25px;" id="modify-adresse"></p></b></div><div><p>Argent dépensé</p><b><p>'+user.argent_depense+' €</p></b></div><div><p>Argent gagné</p><b><p>'+user.argent_gagne+' €</p></b></div>';
  } 
  //modifier pseudo de l'utilisateur
  document.querySelector('#modify-pseudo').addEventListener('click', async (event) => {
    event.preventDefault();
    document.querySelector('#modify1').innerHTML += '<form id="form-pseudo"><input type="text" id="pseudo" placeholder="Votre pseudo"><div class="between"><input type="submit" class="button borderRight" id="valider" value="Ok"><input type="submit" class="button borderLeft" id="annuler" value="Annuler"></div></form>';
    document.querySelector('#valider').addEventListener('click', async (event) => {
      event.preventDefault();
      await modifierPseudo();
    });

    document.querySelector('#annuler').addEventListener('click', async (event) => {
      event.preventDefault();
      document.querySelector('#form-pseudo').style.display = "none";//on "retire" le form
    });
  });

  //modifier adresse de l'utilisateur
  document.querySelector('#modify-adresse').addEventListener('click', async (event) => {
    event.preventDefault();
    location.href='formulaire.html';
  });

  onSnapshot(mainQuery, (querySnapshot) => {
    querySnapshot.docs.map((doc) => {
      articles.push({ ...doc.data(), id: doc.id });
    });
    showArticles(articles);
  });

  onSnapshot(secondQuery, (querySnapshot) => {
    querySnapshot.docs.map((doc) => {
      otherArticles.push({ ...doc.data(), id: doc.id });
    });
  });

  onSnapshot(favoriteQuery, (querySnapshot) => {
    querySnapshot.docs.map((doc) => {
      favorites.push({ ...doc.data(), id: doc.id });
    });
    makeFavorites(otherArticles,favorites);
    showFavorites(myFavorites);
  });
}

const makeFavorites = async (articles, favorites) => {
  const isEmpty = favorites.length === 0;
  
  if (isEmpty === false) {
    favorites.forEach((favorite) => {
      articles.forEach((article) => {
        if (article.id_a === favorite.id_a) {
          // Vérifie si l'article est déjà dans myFavorites avant de l'ajouter
          const isAlreadyFavorite = myFavorites.some(myfave => myfave.id_a === article.id_a);
          if (!isAlreadyFavorite) {
            myFavorites.push(article);
          }
        }
      });
    });
  }
  /*
  myFavorites.forEach((myfave) => {
    console.log(myfave);
  });
  */
};


const showArticles = (articles) => {
  document.querySelector('#articles').innerHTML = '';
  articles.map((article, key) => {
    document.querySelector('#articles').innerHTML += "<div class='col-md-3' style='padding: 10px;'><button class='card w' data-id='"+article.id_a+"'><img src="+article.img1+"><br><div class='align'><p>"+article.prix+" €<br></p></div><h4 class='titre3'>"+article.titre+"</h4></button></div>";
  });
  
  //pour chaque element de la classe card (c'est à dire les boutons article affichés) on récupère leur id si récupéré
  document.querySelectorAll('.card').forEach(element => {
    element.addEventListener('click', async (e) => {
      sessionStorage.setItem('article', e.currentTarget.getAttribute('data-id'));
      //console.log(sessionStorage.getItem('article'));
      location.href='article.html';//on redirige vers la page qui contient les détails de l'article
    })
  });
}

const showFavorites = (articles) => {
  document.querySelector('#articles-favoris').innerHTML = '';
  articles.map((article, key) => {
    document.querySelector('#articles-favoris').innerHTML += "<div class='col-md-3' style='padding: 10px;'><button class='card w' data-id='"+article.id_a+"'><img src="+article.img1+"><br><div class='align'><p>"+article.prix+" €<br><small>Inclut la protection de l'acheteur</small></p><p><input class='checkbox' type='checkbox' id='heart' data-id='"+article.id_a+"' checked><label class='heart' for='heart'></label></p></div><h4 class='titre3'>"+article.titre+"</h4></button></div>";
    //document.querySelector('#articles-favoris').innerHTML += "<div class='col-md-3' style='padding: 10px;'><button class='card w' data-id='"+article.id_a+"'><img src="+article.img1+"><br><div class='align between'><p>"+article.prix+" €<br></p><input class='checkbox' type='checkbox' id='heart' data-id='"+article.id_a+"' checked></div><h4 class='titre3'>"+article.titre+"</h4></button></div>";//<label class='heart' for='heart'></label>
  });

  //pour chaque element de la classe card (c'est à dire les boutons article affichés) on récupère leur id si récupéré
  document.querySelectorAll('.card').forEach(element => {
    element.addEventListener('click', async (e) => {
      if (e.target && e.target.classList.contains('checkbox')) {// || e.target && e.target.classList.contains('heart')) {
        return; // Ne rien faire si c'est le checkbox
      }

      sessionStorage.setItem('article', e.currentTarget.getAttribute('data-id'));
      //console.log(sessionStorage.getItem('article'));
      location.href='article.html';//on redirige vers la page qui contient les détails de l'article
    })
  });

  document.querySelectorAll('.checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const articleId = e.target.getAttribute('data-id');
      retireFavoris(articleId); // Retirer des favoris
    });
  });
}