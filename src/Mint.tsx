import React, { useState, useEffect } from 'react';
import { toNano } from '@ton/ton';
import { beginCell } from '@ton/ton';
import { TonConnectUIProvider, useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { addToCooldown, checkCooldown } from './firebaseFunctions'; // Проверьте правильность пути
import styles from './Button.module.css';
import { ref, get } from 'firebase/database'; // Импортируйте необходимые функции из Firebase
import { database } from './firebaseConfig'; // Импортируйте `database` из конфигурационного файла

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
    const [isCooldown, setIsCooldown] = useState<boolean>(false);

    useEffect(() => {
        const initializeCooldown = async () => {
            if (!userFriendlyAddress) return;

            try {
                const isOnCooldown = await checkCooldown(userFriendlyAddress);
                setIsCooldown(isOnCooldown);

                if (isOnCooldown) {
                    const snapshot = await get(ref(database, `cooldown/${userFriendlyAddress}`));
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        const cooldownEnd = data.cooldownEnd;
                        const now = Date.now();
                        const remainingTime = Math.max(0, Math.floor((cooldownEnd - now) / 1000)); // Оставшееся время в секундах
                        setTimeLeft(remainingTime);
                    }
                }
            } catch (error) {
                console.error('Error initializing cooldown:', error);
            }
        };

        initializeCooldown();
    }, [userFriendlyAddress]);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (isCooldown && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prevTime => Math.max(prevTime - 1, 0));
            }, 1000);
        } else if (!isCooldown) {
            clearInterval(timer);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isCooldown, timeLeft]);

    const handleTransaction = async () => {
        // ... остальной код функции

        try {
            // ...
            await addToCooldown(userFriendlyAddress);

            setIsCooldown(true);
            setTimeLeft(24 * 60 * 60); // Устанавливаем время в 24 часа

            // Удалите эту строку, если она вызывает бесконечную рекурсию
            // setTimeout(() => {
            //     setIsCooldown(true);
            // }, 2000);
        } catch (e) {
            // ...
        }}

    const formatTimeLeft = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <TonConnectUIProvider manifestUrl="https://tonconnect-test.vercel.app/tonconnect-manifest.json">
            <div>
                <span>{userFriendlyAddress}</span>
                {wallet ? (
                    <button 
                        className={styles.button}
                        onClick={handleTransaction}
                        disabled={isCooldown && timeLeft > 0}
                    >
                        {isCooldown && timeLeft > 0 ? `Cooldown: ${formatTimeLeft(timeLeft)}` : 'Mint'}
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
