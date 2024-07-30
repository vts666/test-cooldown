import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

// Ваши конфигурационные данные Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCAsusEVulMVKCmgGdxpRMSto3cG3UBUu4",
  authDomain: "nft-cooldown.firebaseapp.com",
  databaseURL: "https://nft-cooldown-default-rtdb.firebaseio.com",
  projectId: "nft-cooldown",
  storageBucket: "nft-cooldown.appspot.com",
  messagingSenderId: "443582472377",
  appId: "1:443582472377:web:fc2f4910dd0608c7433b68",
  measurementId: "G-0ZEPH2PS1P"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, get };
