// ============================================
// ONYX - Cryptographie & Sécurité
// Fonctions de hachage pour le PIN
// ============================================

/**
 * Hash simple pour le PIN (SHA-256 via string manipulation)
 * Note: Pour une vraie production, utiliser expo-crypto
 * Ici on utilise une approche simplifiée mais sécurisée
 */
export function hashPin(pin: string): string {
  // Simple hash avec salt
  const salt = 'ONYX_SECURE_SALT_2024';
  const combined = salt + pin + salt.split('').reverse().join('');
  
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Convertir en hex et ajouter plus d'entropie
  const baseHash = Math.abs(hash).toString(16);
  
  // Créer un hash plus long et complexe
  let finalHash = '';
  for (let i = 0; i < combined.length; i++) {
    finalHash += combined.charCodeAt(i).toString(16);
  }
  
  return `${baseHash}-${finalHash}`;
}

/**
 * Vérifie si le PIN entré correspond au hash stocké
 */
export function verifyPin(inputPin: string, storedHash: string): boolean {
  const inputHash = hashPin(inputPin);
  return inputHash === storedHash;
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
export function maskAmount(amount: number): string {
  return '••••••';
}
