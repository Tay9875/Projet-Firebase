import { initializeApp } from 'firebase/app';
import { getDatabase } from "firebase/database";
import { getFirestore, onSnapshot, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp,query, update, where, and, or, orderBy} from 'firebase/firestore';

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
const mainQuery=query(collection(db, "conversations"), or(where("id_acheteur","==",Number(sessionStorage.getItem('user'))), where("id_vendeur","==",Number(sessionStorage.getItem('user')))));
const secondQuery=query(collection(db, "messages"), orderBy('id_m', 'asc'));//and(where("id_conv","==",Number(sessionStorage.getItem('conversation'))), orderBy('id_m', 'asc')));
const conversationCollection = collection(db, 'conversations');
const messagesCollection = collection(db, 'messages');
const offerCollection = collection(db, 'offres');
const articleCollection = collection(db, 'articles');
const userCollection = collection(db, 'users');

//console.log(sessionStorage.getItem('article'));

if(sessionStorage.getItem('pseudo')==null){
  location.href='connexion.html';
}

//FONCTIONS DE RECHERCHE
const getLastMessage = async () => {
  const message = query(collection(db, "messages"));
  const querySnapshot = await getDocs(message);
  let temoin=0;

  querySnapshot.forEach((doc) => {
    const messageData=doc.data();
    if(messageData.id_m > temoin){
        temoin=messageData.id_m;
    }
  });
  return ++temoin;
}

const getLastOffer = async () => {
  const offres = query(collection(db, "offres"));
  const querySnapshot = await getDocs(offres);
  let temoin=0;

  querySnapshot.forEach((doc) => {
    const offreData=doc.data();
    if(offreData.id_o > temoin){
        temoin=offreData.id_o;
    }
  });
  return ++temoin;
}

const getBuyer = async () => {
  const conv = query(conversationCollection, where("id_conv","==",Number(sessionStorage.getItem('conversation'))));
  const querySnapshot = await getDocs(conv);

  querySnapshot.forEach((doc) => {
    const convData=doc.data();
    console.log(convData.id_acheteur);
    sessionStorage.setItem('temoin',convData.id_acheteur);
  });
}

const getOther = async (id) => {
  const autre = query(collection(db, "users"), where("id_u","==",Number(id)));
  const querySnapshot = await getDocs(autre);

  for (const doc of querySnapshot.docs) {
    const autreData=doc.data();
    return autreData;
  }
}

const getArticle = async (id) => {
  const sujet = query(collection(db,"articles"), where("id_a","==",Number(id)));
  const querySnapshot = await getDocs(sujet);

  for (const doc of querySnapshot.docs) {
    const sujetData=doc.data();
    return sujetData;
  }
}

const findOffer = async(id, vendeur, acheteur) =>{
  const sujet = query(collection(db,"offres"), where("id_a","==",Number(id)));
  const querySnapshot = await getDocs(sujet);
  for (const doc of querySnapshot.docs) {
    const sujetData=doc.data();
    if(sujetData.id_vendeur == Number(vendeur) && sujetData.id_acheteur == Number(acheteur)){
      return doc.id;
    }
  }
  return false;
}

const checkAdress = async () => {
  const user = await getOther(sessionStorage.getItem('user'));
  if(user.rue == null || user.ville == null || user.codePostal == null){
    return false;
  }

  return true;
}

const getOffer = async(id, vendeur, acheteur) =>{
  const sujet = query(collection(db,"offres"), where("id_a","==",Number(id)));
  const querySnapshot = await getDocs(sujet);
  for (const doc of querySnapshot.docs) {
    const sujetData=doc.data();
    if(sujetData.id_vendeur == Number(vendeur) && sujetData.id_acheteur == Number(acheteur)){
      //console.log(sujetData);
      return sujetData;
    }
  }
  return false;
}

const createOffer = async(prix, article, vendeur, acheteur) => {
  const offer = await findOffer(article, vendeur, acheteur);//si on trouve l'offre alors on la met à jour sinon on la créée
  const id = await getLastOffer();
  if(offer==false){//si pas trouvé alors
    await addDoc(collection(db, "offres"), {
      'id_o': Number(id),
      'prix_offre': prix,
      'id_a': article,
      'id_conv': Number(sessionStorage.getItem('conversation')),
      'id_vendeur': Number(vendeur),
      'id_acheteur': Number(acheteur),
      'confirmation': null,
    });
  }
  else{//on update l'offre déjà existant
    await updateDoc(doc(db, "offres", offer),{
      prix_offre: Number(prix),
    });
  }

  document.querySelector('#exit').style.display = "none";
  document.querySelector('#proposition').style.display = "none";//on "retire" le form
}

const getRealArticleID = async () => {
  const a = query(articleCollection, where("id_a", "==", Number(sessionStorage.getItem('article'))));
  const querySnapshot = await getDocs(a);

  // On récupère le premier document trouvé
  const doc = querySnapshot.docs[0];
  return doc.id;
};

const getRealID = async (id) => {
  const u = query(userCollection, where("id_u", "==", Number(id)));
  const querySnapshot = await getDocs(u);

  // On récupère le premier document trouvé
  const doc = querySnapshot.docs[0];
  return doc.id;
};


const acheteurUpdate = async (id, prix) => {
  //premier utilisateur: acheteur
  const userID = await getRealID(id);
  const user = await getOther(id);
  const total = user.argent_depense + prix;

  await updateDoc(doc(db, "users", userID),{
    argent_depense: Number(total),
  });
};


const vendeurUpdate = async (id, prix) => {
  //deuxieme utilisateur: vendeur
  const vendeur = id;
  const userID = await getRealID(vendeur);
  const user = await getOther(vendeur);
  const total = user.argent_gagne + prix;
  
  await updateDoc(doc(db, "users", userID),{
    argent_gagne: Number(total),
  });
};


const achat = async(prix_offre) =>{
    //met a jour le prix de l'article
    const article = await getRealArticleID();
    await updateDoc(doc(db, "articles", article),{
        disponibilite: 'Vendu',
        prix: Number(prix_offre),
    });
}

const creerMessage = async(conv) =>{
  let contenu = 'Le paiement a été validé, vous recevrez le reçu dans votre boîte mail ainsi que les instructions pour annuler la commande si jamais nécessaire (VALIDER UNE ADRESSE SOUS RESERVE DE VOIR CE ACAHA ANNULE)';
  let id = await getLastMessage();
  const now = new Date();
  let hours = now.getHours();      // Heure (0-23)
  let minutes = now.getMinutes();  // Minutes (0-59)
  let time = hours+":"+minutes;

  await addDoc(collection(db, "messages"), {
    'id_m': Number(id),
    'contenu': contenu,
    'date': time,
    'id_appartenance': Number(sessionStorage.getItem('user')),
    'id_conv': Number(sessionStorage.getItem('conversation')),
  });
}

//AFFICHAGE DES ELEMENTS --------------------------------------------------------------
//AFFICHAGE PRINCIPAL
onSnapshot(mainQuery, (querySnapshot) => {
  let conversations = [];
  querySnapshot.docs.map((doc) => {
    conversations.push({ ...doc.data(), id: doc.id });
  });
  //console.log(sessionStorage.getItem('user'),sessionStorage.getItem('pseudo'),sessionStorage.getItem('email'));
  showConversations(conversations);
});

//appeler dans conversations il sert à afficher les messages de la conversation
//la query n'a pas voulu fonctionner en specifiant id_conv donc cela a été fait directement dans la fonction
const showMessages = async (messages) => {//affichage des infos de l'article dans la conversation (messagerie)
  document.querySelector('#article').innerHTML = '';
  let article = await getArticle(sessionStorage.getItem('article'));//on reprend l'article de la conversation
  document.querySelector('#article').innerHTML = '<div class="between"><img src="'+article.img1+'" style="width: 100px;"><div style="padding-left: 10px; text-align: left;"><h4 class="titre">'+article.titre+'</h4><div><p>'+article.marque+'</p><p>'+article.categorie+'</p></div> </div></div><div><p>Prix: </p><h3>'+article.prix+' €</h3><div class="between" id="buttons"></div></div>';
  
  if(article.id_u != Number(sessionStorage.getItem('user')) && article.disponibilite == 'dispo'){//si l'utilisateur n'est pas le propriétaire de l'article alors on peut lui proposer de faire une offre ou d'acheter
    document.querySelector('#buttons').innerHTML += '<button class="button borderRight" id="offre">Faire une offre</button><button class="button borderLeft" id="buy">Acheter</button>';
    
    document.querySelector('#offre').addEventListener('click', async (event) => {
      event.preventDefault();
      //ajoute dans partie article?
      document.querySelector('#messages').innerHTML += '<button id="exit" class="exit" onclick="fermer()">&#10005</button><form id="proposition"><p>Quel prix souhaiteriez vous proposer au vendeur ?</p><div><input type="number" id="prix_offre"><input type="submit" class="button"></div></form>';
      document.querySelector('#proposition').addEventListener('submit', async (event) => {
        event.preventDefault();
        const prix = document.querySelector('#prix_offre').value;
        await createOffer(prix, article.id_a, article.id_u, sessionStorage.getItem('user'));
      });
    });

    document.querySelector('#buy').addEventListener('click', async (event) => {//si on achète sans faire d'offre
      event.preventDefault();
      if(await checkAdress() == false){
        location.href='formulaire.html';
      }
      await achat(article.prix);
      await acheteurUpdate(sessionStorage.getItem('user'),article.prix);
      await vendeurUpdate(article.id_u, article.prix);
      await creerMessage(sessionStorage.getItem('conversation'));
      //location.href = 'compte.html';
    });
  }
  else if(article.id_u != Number(sessionStorage.getItem('user')) && article.disponibilite != 'dispo'){
    document.querySelector('#buttons').innerHTML += "<p>L'article n'est plus disponible</p>";
  }

  //l'affichage des messages de la conversation
  document.querySelector('#messages').innerHTML = '';
  messages.map((message, key) => {
    if(message.id_conv == Number(sessionStorage.getItem('conversation'))){
      if(message.id_appartenance == sessionStorage.getItem('user')){//si l'utilisateur à le même id que l'acheteur
        document.querySelector('#messages').innerHTML += "<div class='envoi'><small>"+message.date+"</small><p>"+message.contenu+"</p></div>";
      }
      else{
        document.querySelector('#messages').innerHTML += "<div class='recois'><small>"+message.date+"</small><p>"+message.contenu+"</p></div>";
      }
    }
  });
}

//fonction d'affichage conversations
const showConversations = async (conversations) => {
  document.querySelector('#conversations').innerHTML = '';
  
  // Utilisation de map pour itérer sur les conversations
  for (let conversation of conversations) {
    let article = await getArticle(conversation.id_a);//on reprend l'article de la conversation
    if(conversation.id_acheteur==sessionStorage.getItem('user')){
      let autre = await getOther(conversation.id_vendeur);
      document.querySelector('#conversations').innerHTML += "<button class='sidebar-element' data-id='"+conversation.id_conv+"' data-article='"+conversation.id_a+"'><b><p3>"+autre.pseudo+"</p3></b><p>"+article.titre+"</p></button>";
    }
    else if(conversation.id_vendeur==sessionStorage.getItem('user')){
      let autre = await getOther(conversation.id_acheteur);
      document.querySelector('#conversations').innerHTML += "<button class='sidebar-element' data-id='"+conversation.id_conv+"' data-article='"+conversation.id_a+"'><b><p3>"+autre.pseudo+"</p3></b><p>"+article.titre+"</p></button>";
    }
  }

  // Pour chaque élément de la classe sidebar-element, ajouter un événement de clic
  document.querySelectorAll('.sidebar-element').forEach(element => {
    element.addEventListener('click', async (e) => {
      sessionStorage.setItem('conversation', e.currentTarget.getAttribute('data-id'));
      sessionStorage.setItem('article', e.currentTarget.getAttribute('data-article'));
      //console.log(sessionStorage.getItem('article'));

      onSnapshot(secondQuery, (querySnapshot) => {
        let messages = [];
        querySnapshot.docs.map((doc) => {
          messages.push({ ...doc.data(), id: doc.id });
        });
        showMessages(messages);  // Affichage des messages
      });
    });
  });
};

//l'utilisateur ajoute un message
document.querySelector("#messagerie").addEventListener('submit', async (event) => {
  event.preventDefault();
  console.log("Submit new message");
  
  let contenu = document.querySelector('#contenu').value;
  let id = await getLastMessage();

  const now = new Date();
  let hours = now.getHours();      // Heure (0-23)
  let minutes = now.getMinutes();  // Minutes (0-59)
  let time = hours+":"+minutes;

  if (contenu !== "") {
    await addDoc(collection(db, "messages"), {
      'id_m': Number(id),
      'contenu': contenu,
      'date': time,
      'id_appartenance': Number(sessionStorage.getItem('user')),
      'id_conv': Number(sessionStorage.getItem('conversation')),
    });
    document.querySelector('#contenu').value='';
  }
});
