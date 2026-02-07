// ============================================
// ONYX - Cryptographie & Sécurité
// Hachage PIN avec SHA-256 (expo-crypto)
// ============================================

import * as Crypto from 'expo-crypto';

const PIN_SALT = 'ONYX_2026_SECURE_SALT';

/**
 * Hash le PIN avec SHA-256 + salt (ne jamais stocker le PIN en clair)
 */
export async function hashPin(pin: string): Promise<string> {
  const saltedPin = pin + PIN_SALT;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltedPin,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  return hash;
}

/**
 * Vérifie le PIN entré contre le hash stocké
 */
export async function verifyPin(inputPin: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPin(inputPin);
  return inputHash === storedHash;
}

/**
 * Hash synchrone (legacy) - À utiliser uniquement si appel synchrone requis.
 * Préférer hashPin() async en production.
 */
export function hashPinSync(pin: string): string {
  const salt = 'ONYX_SECURE_SALT_2024';
  const combined = salt + pin + salt.split('').reverse().join('');
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const baseHash = Math.abs(hash).toString(16);
  let finalHash = '';
  for (let i = 0; i < combined.length; i++) {
    finalHash += combined.charCodeAt(i).toString(16);
  }
  return `${baseHash}-${finalHash}`;
}

export function verifyPinSync(inputPin: string, storedHash: string): boolean {
  return hashPinSync(inputPin) === storedHash;
}

/**
 * Génère un ID unique
 */
export function generateId(): string {
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => {
    return Math.floor(Math.random() * 16).toString(16);
  });
}

/**
 * Masque un montant pour l'affichage sécurisé
 */
export function maskAmount(_amount: number): string {
  return '••••••';
}
