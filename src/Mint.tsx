import React, { useState, useEffect } from 'react';
import { toNano } from '@ton/ton';
import { beginCell } from '@ton/ton';
import { TonConnectUIProvider, useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import styles from './Button.module.css'; // Import button styles
import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase
const supabaseUrl = 'https://qltpbstrintmzowwfxgd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdHBic3RyaW50bXpvd3dmeGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI0MjQxMDAsImV4cCI6MjAzODAwMDEwMH0.rfikL2jIwBXv02JCHBs0cnbZWO-curokiJ8j4QqgOEk';
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Функция для получения текущего Unix Time
const getUnixTime = () => Math.floor(Date.now() / 1000);

// Функция для форматирования времени
const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
};

// Функция для конвертации строки в Unix Time
const parseUnixTime = (timestamp) => parseInt(timestamp, 10);

export const Mint = () => {
    const [error, setError] = useState(null); // Add state for errors
    const [tonConnectUi] = useTonConnectUI();
    const [tx] = useState(myTransaction);
    const [isCooldown, setIsCooldown] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [cooldownEndTime, setCooldownEndTime] = useState(0); // Track the end time of cooldown
    const [loading, setLoading] = useState(true); // Track loading state
    const wallet = useTonWallet();
    const userFriendlyAddress = useTonAddress();

    useEffect(() => {
        if (userFriendlyAddress) {
            fetchCooldownData(userFriendlyAddress);
        }
    }, [userFriendlyAddress]);

    useEffect(() => {
        // Update the timer every second if there is an active cooldown
        let intervalId;

        if (isCooldown) {
            intervalId = setInterval(() => {
                const currentTime = getUnixTime();
                const remainingTime = Math.max(cooldownEndTime - currentTime, 0);
                setTimeLeft(remainingTime);

                if (remainingTime <= 0) {
                    setIsCooldown(false);
                    setCooldownEndTime(0);
                    clearInterval(intervalId);
                }
            }, 1000); // Update every second
        }

        return () => clearInterval(intervalId);
    }, [isCooldown, cooldownEndTime]);

    const handleTransaction = async () => {
        try {
            // Send the transaction
            await tonConnectUi.sendTransaction(tx);

            // After successful transaction, add address to cooldown
            await addAddressToCooldown(userFriendlyAddress);
        } catch (e) {
            setError(e.message); // Set the error message
        }
    };

    // Function to add or update address in Supabase
    const addAddressToCooldown = async (address) => {
        const currentTime = getUnixTime();
        const cooldownPeriod = 24 * 60 * 60; // 24 hours in seconds
        const endTime = currentTime + cooldownPeriod;

        const { error } = await supabase
            .from('cooldown')
            .upsert([{ address: address, end_timestamp: endTime.toString() }], { onConflict: 'address' });

        if (error) {
            console.error('Error adding address to cooldown:', error.message);
        } else {
            console.log('Address added to cooldown');
            fetchCooldownData(address); // Refresh cooldown status after insertion
        }
    };

    // Function to fetch cooldown status from Supabase
    const fetchCooldownData = async (address) => {
        setLoading(true); // Set loading state to true while fetching data
        const { data, error } = await supabase
            .from('cooldown')
            .select('end_timestamp')
            .eq('address', address)
            .single();

        if (error) {
            console.error('Error checking cooldown:', error.message);
            setIsCooldown(false);
            setCooldownEndTime(0);
        } else {
            const cooldownEndTimestamp = data?.end_timestamp;
            if (cooldownEndTimestamp) {
                const cooldownEndTime = parseUnixTime(cooldownEndTimestamp);
                const currentTime = getUnixTime();
                
                if (currentTime < cooldownEndTime) {
                    setIsCooldown(true);
                    setCooldownEndTime(cooldownEndTime);
                } else {
                    setIsCooldown(false);
                    setCooldownEndTime(0);
                }
            } else {
                setIsCooldown(false); // No cooldown if address not found
                setCooldownEndTime(0);
            }
        }
        setLoading(false); // Set loading state to false after fetching data
    };

    return (
        <TonConnectUIProvider manifestUrl="https://tonconnect-test.vercel.app/tonconnect-manifest.json">
            <div>
                {wallet ? (
                    <button 
                        className={styles.button}
                        onClick={handleTransaction}
                        disabled={isCooldown || loading} // Disable the button during loading or cooldown
                    >
                        {loading ? 'Loading...' : isCooldown ? `Cooldown: ${formatTime(timeLeft)}` : 'Mint'}
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
