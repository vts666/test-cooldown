import { initializeApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAnalytics, Analytics } from 'firebase/analytics';

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

const app = initializeApp(firebaseConfig);
const analytics: Analytics | null = typeof window !== 'undefined' ? getAnalytics(app) : null;
const database: Database = getDatabase(app);

export { app, analytics, database };
