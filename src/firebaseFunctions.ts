// src/firebaseFunctions.ts
import { database, ref, set, get } from './firebaseConfig';

// Функция для добавления адреса в список cooldown
export const addToCooldown = async (address: string) => {
    const now = Date.now();
    const cooldownEnd = now + 24 * 60 * 60 * 1000; // Время окончания cooldown через 24 часа
    await set(ref(database, 'cooldown/' + address), {
        cooldownEnd
    });
};

// Функция для проверки, находится ли адрес в cooldown
export const checkCooldown = async (address: string): Promise<boolean> => {
    const snapshot = await get(ref(database, 'cooldown/' + address));
    if (snapshot.exists()) {
        const data = snapshot.val();
        const now = Date.now();
        return now < data.cooldownEnd;
    }
    return false;
};
