/**
 * Enterprise Web Crypto API Vault
 * Implements genuine client-side AES-GCM-256 encryption, PBKDF2 key derivation,
 * SHA-256 integrity verification, and tamper detection for sensitive financial inventory logs.
 */

const SALT = new Uint8Array([73, 110, 100, 117, 115, 116, 114, 105, 97, 108, 65, 117, 100, 105, 116, 50]); // "IndustrialAudit2"

/**
 * Derives an AES-GCM 256-bit CryptoKey using PBKDF2 with 100,000 iterations of SHA-256
 */
export async function deriveVaultKey(passphrase: string = 'AmbatturFabricationSecure2026!'): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Calculates a genuine SHA-256 hex hash for any string payload
 */
export async function calculateSha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = await window.crypto.subtle.digest('SHA-256', enc.encode(text));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface EncryptedVaultPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64
  checksum: string;   // SHA-256 Hex
  timestamp: string;
  version: string;
}

/**
 * Encrypts an object using AES-GCM 256-bit with genuine 12-byte random IV and SHA-256 checksum
 */
export async function encryptVaultData(data: any, key: CryptoKey): Promise<EncryptedVaultPayload> {
  const jsonStr = JSON.stringify(data);
  const checksum = await calculateSha256(jsonStr);
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(jsonStr)
  );

  const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    ciphertext,
    iv: ivBase64,
    checksum,
    timestamp: new Date().toISOString(),
    version: 'AES-GCM-256-v1',
  };
}

/**
 * Decrypts a vault payload, verifying the SHA-256 checksum against tampering
 */
export async function decryptVaultData(payload: EncryptedVaultPayload, key: CryptoKey): Promise<any> {
  const ivBytes = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0));
  const ciphertextBytes = Uint8Array.from(atob(payload.ciphertext), (c) => c.charCodeAt(0));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    ciphertextBytes
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);

  // Verify integrity
  const verifiedChecksum = await calculateSha256(jsonStr);
  if (verifiedChecksum !== payload.checksum) {
    throw new Error('SECURITY ALERT: Cryptographic integrity checksum failed! Potential data tampering detected.');
  }

  return JSON.parse(jsonStr);
}

/**
 * Cryptographically shreds and wipes local storage
 */
export function secureDataShredder(): void {
  // Overwrite keys with noise before removal
  ['p1_stock_items', 'p1_stock_rules', 'p1_audit_logs', 'p1_vault_session'].forEach((key) => {
    try {
      const randomNoise = Array.from(window.crypto.getRandomValues(new Uint8Array(64)))
        .map((b) => b.toString(16))
        .join('');
      localStorage.setItem(key, randomNoise);
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  });
}
