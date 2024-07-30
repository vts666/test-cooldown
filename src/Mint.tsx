import React, { useState } from 'react';
import { toNano } from '@ton/ton';
import { beginCell } from '@ton/ton';
import { TonConnectUIProvider, useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import styles from './Button.module.css'; // Import button styles

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDcN5h7CooowPipnW6H0VjWBQ4aiWKdQQ",
    authDomain: "cex-db-test.firebaseapp.com",
    databaseURL: "https://cex-db-test-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cex-db-test",
    storageBucket: "cex-db-test.appspot.com",
    messagingSenderId: "578234316757",
    appId: "1:578234316757:web:a98ed9ef3b8863f588ef5c",
    measurementId: "G-7ZREEHQ9HM"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const body = beginCell()
  .storeUint(0, 32) // write 32 zero bits to indicate that a text comment will follow
  .storeStringTail("MintRandom") // write our text comment
  .endCell();

const myTransaction = {
  validUntil: Math.floor(Date.now() / 1000) + 360,
  messages: [
    {
      address: process.env.NEXT_PUBLIC_CONTRACT,
      amount: toNano(0.15).toString(),
      payload: body.toBoc().toString("base64") // payload with comment in body
    }
  ]
};

export const Mint = () => {
  const [error, setError] = useState(null); // Add state for errors
  const [tonConnectUi] = useTonConnectUI();
  const [tx] = useState(myTransaction);
  const wallet = useTonWallet();
  const userFriendlyAddress = useTonAddress();

  const handleTransaction = async () => {
    addAddressToCooldown(userFriendlyAddress); // Add address to cooldown immediately

    try {
      await tonConnectUi.sendTransaction(tx);
    } catch (e) {
      setError(e.message); // Set the error message
    }
  };

  // Function to add address to Firebase
  const addAddressToCooldown = (address) => {
    const addressRef = ref(database, `cooldown/${address}`);
    set(addressRef, {
      timestamp: Date.now()
    }).then(() => {
      console.log('Address added to cooldown');
    }).catch((error) => {
      console.error('Error adding address to cooldown:', error);
    });
  };

  return (
    <TonConnectUIProvider manifestUrl="https://tonconnect-test.vercel.app/tonconnect-manifest.json">
      <div>
        {wallet ? (
          <button 
            className={styles.button}
            onClick={handleTransaction}
          >
            Mint
          </button>
        ) : (
          <button 
            className={styles.button}
            onClick={() => tonConnectUi.openModal()}
          >
            Connect Wallet
          </button>
        )}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </TonConnectUIProvider>
  );
};
