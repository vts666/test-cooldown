import React, { useState, useEffect } from 'react';
import { toNano } from '@ton/ton';
import { beginCell } from '@ton/ton';
import { TonConnectUIProvider, useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { addToCooldown, checkCooldown } from './firebaseFunctions'; // Импортируйте функции
import styles from './Button.module.css'; // Импортируйте стили
import { ref, get, database } from './firebaseConfig'; // Импортируйте ref и get

const body = beginCell()
    .storeUint(0, 32)
    .storeStringTail("MintRandom")
    .endCell();

const myTransaction = {
    validUntil: Math.floor(Date.now() / 1000) + 360,
    messages: [
        {
            address: process.env.NEXT_PUBLIC_CONTRACT!,
            amount: toNano(0.15).toString(),
            payload: body.toBoc().toString("base64")
        }
    ]
};

export const Mint: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [tonConnectUi] = useTonConnectUI();
    const [tx] = useState(myTransaction);
    const wallet = useTonWallet();
    const userFriendlyAddress = useTonAddress();

    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const updateTimeLeft = async () => {
            if (!userFriendlyAddress) return;

            try {
                const isOnCooldown = await checkCooldown(userFriendlyAddress);
                if (isOnCooldown) {
                    const now = Date.now();
                    const snapshot = await get(ref(database, 'cooldown/' + userFriendlyAddress));
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        const cooldownEnd = data.cooldownEnd;
                        const timeRemaining = cooldownEnd - now;
                        setTimeLeft(Math.floor(timeRemaining / 1000));
                    }
                } else {
                    setTimeLeft(0);
                }
            } catch (error) {
                console.error("Error checking cooldown:", error);
            }
        };

        // Check cooldown on component mount
        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 1000);

        // Clear interval on component unmount
        return () => clearInterval(interval);
    }, [userFriendlyAddress]);

    const handleTransaction = async () => {
        if (!userFriendlyAddress) return;

        try {
            await tonConnectUi.sendTransaction(tx);
            await addToCooldown(userFriendlyAddress); // Добавить адрес в cooldown
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        }
    };

    const formatTimeLeft = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <TonConnectUIProvider manifestUrl="https://tonconnect-test.vercel.app/tonconnect-manifest.json">
            <div>
                {/* <span>{userFriendlyAddress}</span> */}
                {wallet ? (
                    <button 
                        className={styles.button}
                        onClick={handleTransaction}
                        disabled={timeLeft > 0} // Disable button if in cooldown
                    >
                        {timeLeft > 0 ? `Cooldown: ${formatTimeLeft(timeLeft)}` : 'Mint'}
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
