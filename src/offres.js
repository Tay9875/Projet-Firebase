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
const mainQuery=query(collection(db, "offres"), where("id_vendeur","==",Number(sessionStorage.getItem('user'))));
const articleCollection = collection(db, 'articles');
const offerCollection = collection(db, 'offres');
const userCollection = collection(db, 'users');


if(sessionStorage.getItem('pseudo')==null){
  location.href='connexion.html';
}

const getRealID = async (id) => {
  const u = query(userCollection, where("id_u", "==", Number(id)));
  const querySnapshot = await getDocs(u);

  // On récupère le premier document trouvé
  const doc = querySnapshot.docs[0];
  return doc.id;
};

const getRealArticleID = async () => {
  const a = query(articleCollection, where("id_a", "==", Number(sessionStorage.getItem('article'))));
  const querySnapshot = await getDocs(a);

  // On récupère le premier document trouvé
  const doc = querySnapshot.docs[0];
  return doc.id;
};

const getRealOfferID = async () => {
    const u = query(offerCollection, where("id_o", "==", Number(sessionStorage.getItem('offre'))));
    const querySnapshot = await getDocs(u);
  
    // On récupère le premier document trouvé
    const doc = querySnapshot.docs[0];
    return doc.id;
};

const getOther = async (id) => {
  const autre = query(collection(db, "users"), where("id_u","==",Number(id)));
  const querySnapshot = await getDocs(autre);

  for (const doc of querySnapshot.docs) {
    const autreData=doc.data();
    return autreData;
  }
}

const acheteurUpdate = async (id, prix) => {
  const acheteur = id;
  //premier utilisateur: acheteur
  const userID = await getRealID(acheteur);
  const user = await getOther(acheteur);
  const total = user.argent_depense + prix;

  await updateDoc(doc(db, "users", userID),{
    argent_depense: Number(total),
  });
};


const vendeurUpdate = async (id, prix) => {
  //deuxieme utilisateur: vendeur
  const userID = await getRealID(id);
  const user = await getOther(id);
  const total = user.argent_gagne + prix;
  
  await updateDoc(doc(db, "users", userID),{
    argent_gagne: Number(total),
  });
};


const getArticle = async (articleId) => {
  const sujet = query(collection(db,"articles"), where("id_a","==",Number(articleId)));
  const querySnapshot = await getDocs(sujet);

  for (const doc of querySnapshot.docs) {
    const sujetData=doc.data();
    return sujetData;
  }
}

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

const creerMessage = async(bool, conv) =>{
  let contenu = null;
  if(bool == true){
    contenu = 'Votre offre a été accepté, vous recevrez le reçu dans votre boîte mail et de quoi annuler si nécéssaire';
  }
  else{
    contenu = 'Désolé, votre offre a été refusé';
  }

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

const achat = async(prix_offre) =>{
    //met a jour l'etat de l'offre
    /*const offer = await getRealOfferID();
    await updateDoc(doc(db, "offres", offer),{
        confirmation: 'Accepté',
    });*/

    //met a jour le prix de l'article
    const article = await getRealArticleID();
    await updateDoc(doc(db, "articles", article),{
        disponibilite: 'Vendu',
        prix: Number(prix_offre),
    });
    await refus();
}

const refus = async() =>{
    const offer = await getRealOfferID();
    await deleteDoc(doc(db, "offres", offer));
}


//AFFICHAGE DES ELEMENTS --------------------------------------------------------------
onSnapshot(mainQuery, (querySnapshot) => {
  let offers = [];
  querySnapshot.docs.map((doc) => {
    offers.push({ ...doc.data(), id: doc.id });
  });

  const isEmpty = offers.length === 0;
  if(isEmpty == true){
    document.getElementById("body").className = "alternative2";
  }
  
  showOffers(offers);
});

const showOffers = async (offres) => {//affichage des offres faites au vendeur
  document.querySelector('#offres').innerHTML = '';
    
  for (let offer of offres) {
    let article = await getArticle(offer.id_a);
    document.querySelector('#offres').innerHTML += '<div class="offre between"><h4>On vous propose une offre pour '+article.titre+' <b>'+offer.prix_offre+' €</b> <s>'+article.prix+' €</s></h4><div class="between" id="buttons"><button class="button borderRight" id="accepter" data-id="'+offer.id_o+'" data-conv="'+offer.id_conv+'" data-prix="'+offer.prix_offre+'" data-article="'+article.id_a+'" data-acheteur="'+offer.id_acheteur+'">Accepter</button><button class="button borderLeft" id="refuser" data-id="'+offer.id_o+'" data-conv="'+offer.id_conv+'" data-prix="'+offer.prix_offre+'" data-article="'+article.id_a+'">Refuser</button></div></div>';
  }

  document.querySelectorAll('#accepter').forEach(element => {
    element.addEventListener('click', async (e) => {
        sessionStorage.setItem('article',e.currentTarget.getAttribute('data-article'));
        sessionStorage.setItem('offre', e.currentTarget.getAttribute('data-id'));
        let dataPrice = e.currentTarget.getAttribute('data-prix');
        sessionStorage.setItem('conversation',e.currentTarget.getAttribute('data-conv'));
        let dataAcheteur = e.currentTarget.getAttribute('data-acheteur');
        let article = await getArticle(sessionStorage.getItem('article'));
        await achat(dataPrice);
        await acheteurUpdate(dataAcheteur,dataPrice);
        await vendeurUpdate(sessionStorage.getItem('user'),dataPrice);
        //await userUpdate(dataPrice);
        await creerMessage(true);
    })
  });

  document.querySelectorAll('#refuser').forEach(element => {
    element.addEventListener('click', async (e) => {
        sessionStorage.setItem('article',e.currentTarget.getAttribute('data-article'));
        sessionStorage.setItem('offre', e.currentTarget.getAttribute('data-id'));
        let dataPrice = e.currentTarget.getAttribute('data-prix');
        sessionStorage.setItem('conversation',e.currentTarget.getAttribute('data-conv'));
        await refus();
        await creerMessage(false);
    })
  });
}