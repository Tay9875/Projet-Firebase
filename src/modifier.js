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
const articleCollection = query(collection(db, 'articles'));
const mainQuery = query(collection(db, 'articles'), where("id_a","==", Number(sessionStorage.getItem('article'))));

onSnapshot(mainQuery, (querySnapshot) => {
    let articles = [];
    querySnapshot.docs.map((doc) => {
      articles.push({ ...doc.data(), id: doc.id });
    });
    showData(articles);
  });

const showData = (articles) => {
    articles.map((article, key) => {
        document.querySelector('#modif').innerHTML = '<div class="center"><h3 style="font-family: "DM Sans";color: #20252d;font-weight: 800;">Modifier</h3><br><label for="img1"><img src="css/images/ajout.png" style="width: 200px;"></label><input type="file" id="img1" name="img1" value="'+article.img1+'"></div><div><label for="titre">Titre</label><input type="text" class="text" id="titre" name="titre" placeholder="Titre" value="'+article.titre+'"><label for="description">Description</label><input type="text" class="text" id="description" name="description" placeholder="Description" value="'+article.description+'"></div><div class="around"><div><label for="etat">Etat</label><br><select class="select" name="etat" id="etat" value="'+article.etat+'"><option value="Satisfaisant">Satisfaisant</option><option value="Très Satisfaisant">Très Satisfaisant</option><option value="Neuf">Neuf</option><option value="Autres">Autres</option></select></div><div><label for="categorie">Catégorie</label><br><select class="select" name="categorie" id="categorie" value="'+article.categorie+'"><option value="Salon">Salon</option><option value="Cuisine">Cuisine</option><option value="Chambre">Chambre</option><option value="Salle de bain">Salle de bain</option><option value="Salle à manger">Salle à manger</option><option value="Jardin">Jardin</option><option value="Autres">Autres</option></select></div><div><label for="marque">Marque</label><input type="text" class="text" id="marque" name="marque" placeholder="Marque" value="'+article.marque+'"></div></div><div class="center"><div><label for="prix">Prix</label><input type="number" class="number" id="prix" name="prix" value="'+article.prix+'"> €<br></div><input type="submit" class="select" style="width: 100%;" id="modifier" value="VALIDER"></div>';
    });
  }

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

//ajoute un utilisateur dans la collection users
document.querySelector("#modif").addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log("Submit new article");
    
    //let img1 = document.querySelector('#img1').value;
    let titre = document.querySelector('#titre').value;
    let description = document.querySelector('#description').value;
    let etat = document.querySelector('#etat').value;
    let categorie = document.querySelector('#categorie').value;
    let marque = document.querySelector('#marque').value;
    let prix = document.querySelector('#prix').value;
    
    //img1 !== "" 
    if (titre !== "" && description !== "" && etat !== "" && categorie !== "" &&  marque !== "" && prix !== "") {
      const artId = await getRealID(); 
      await updateDoc(doc(db, "articles", artId),{
            titre: String(titre),
            description: String(description),
            etat: String(etat),
            categorie: String(categorie),
            marque: String(marque),
            prix: Number(prix),
            //img1: String(recup_img1),
          });

        console.log('Article modifié');
        location.href='compte.html';
    } else {
      alert('Merci de renseiger les champs !');
    }
    
  });
  