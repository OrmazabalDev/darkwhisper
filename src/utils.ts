export function generateAnonymousId(): string {
  return `User-${Math.floor(1000 + Math.random() * 9000)}`;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function formatFullTimestamp(timestamp: number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const timestampNumber = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  const today = new Date();
  
  const isToday = 
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  
  if (isToday) return formatTimestamp(timestampNumber);
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month} ${formatTimestamp(timestampNumber)}`;
}

export function isValidNickname(nickname: string): boolean {
  return /^[a-zA-Z0-9\s_-]{1,20}$/.test(nickname.trim());
}

export function setStorageItem(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
}

export function getStorageItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function removeStorageItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export function clearSessionData(): void {
  sessionStorage.removeItem('chatNickname');
  sessionStorage.removeItem('ephemeral_session_id');
}

export function generateEphemeralId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

const ENCRYPTION_KEY_NAME = 'whisperchat_encryption_key';
const ENCRYPTION_ENABLED_KEY = 'whisperchat_encryption_enabled';

export async function deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const FIXED_SALT = 'whisperchat-public-room-salt-v1';
  const salt = encoder.encode(FIXED_SALT);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 310000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

async function importKey(base64Key: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    Uint8Array.from(atob(base64Key), c => c.charCodeAt(0)),
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function storeEncryptionKey(key: CryptoKey): Promise<void> {
  localStorage.setItem(ENCRYPTION_KEY_NAME, await exportKey(key));
}

export async function getStoredEncryptionKey(): Promise<CryptoKey | null> {
  const base64Key = localStorage.getItem(ENCRYPTION_KEY_NAME);
  if (!base64Key) return null;
  
  try {
    return await importKey(base64Key);
  } catch {
    return null;
  }
}

export async function initializeEncryptionKeyFromRoom(roomPassphrase: string): Promise<CryptoKey> {
  const key = await deriveKeyFromPassphrase(roomPassphrase);
  await storeEncryptionKey(key);
  return key;
}

export async function encryptMessage(message: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message)
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptMessage(encryptedMessage: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return new TextDecoder().decode(decrypted);
}

export function isEncryptionEnabled(): boolean {
  const stored = localStorage.getItem(ENCRYPTION_ENABLED_KEY);
  if (stored === null) {
    setEncryptionEnabled(true);
    return true;
  }
  return stored === 'true';
}

export function setEncryptionEnabled(enabled: boolean): void {
  localStorage.setItem(ENCRYPTION_ENABLED_KEY, enabled.toString());
}
