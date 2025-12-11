import { getRedisClient } from "./redisClient";

export async function setValue(key: string, value: string | number, ttl?: number) {
    const client = await getRedisClient();

    if (ttl) {
        return client.set(key, value.toString(), { EX: ttl });
    }

    return client.set(key, value.toString());
}

export async function getValue(key: string) {
    const client = await getRedisClient();
    return client.get(key);
}

/* ============ OBJECT ============ */
export async function setObject<T>(key: string, value: T, ttl?: number) {
    const client = await getRedisClient();
    const jsonString = JSON.stringify(value);
    
    return client.set(key, jsonString, ttl ? { EX: ttl } : undefined);
}

export async function getObject<T>(key: string): Promise<T | null> {
    const client = await getRedisClient();
    const data = await client.get(key);
    
    if (!data) return null;
    try {
        return JSON.parse(data) as T;
    } catch (e) {
        return null;
    }
}

/* ============ ARRAY ============ */

export async function setArray<T>(key: string, arr: T[], ttl?: number) {
    const client = await getRedisClient();
    return client.set(key, JSON.stringify(arr), ttl ? { EX: ttl } : undefined);
}

export async function getArray<T>(key: string): Promise<T[] | null> {
    const client = await getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
}


/* ============ DELETE ============ */
export async function deleteKey(key: string) {
    const client = await getRedisClient();
    return client.del(key);
}
