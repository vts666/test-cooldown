import { ref, set, get, DatabaseReference } from 'firebase/database';
import { database } from './firebaseConfig';

const COOLDOWN_PATH = 'cooldown/';

export const addToCooldown = async (address: string): Promise<void> => {
    const now = Date.now();
    const cooldownEnd = now + 24 * 60 * 60 * 1000; // 24 часа
    const cooldownRef: DatabaseReference = ref(database, `${COOLDOWN_PATH}${address}`);

    try {
        console.log(`Setting cooldown for address ${address} to ${cooldownEnd}`);
        await set(cooldownRef, { cooldownEnd });
        console.log(`Address ${address} added to cooldown.`);
    } catch (error) {
        console.error('Error adding to cooldown:', error);
    }
};

export const checkCooldown = async (address: string): Promise<boolean> => {
    const cooldownRef: DatabaseReference = ref(database, `${COOLDOWN_PATH}${address}`);

    try {
        const snapshot = await get(cooldownRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            const cooldownEnd = data.cooldownEnd;
            const now = Date.now();
            return now < cooldownEnd;
        }
        return false;
    } catch (error) {
        console.error('Error checking cooldown:', error);
        return false;
    }
};
