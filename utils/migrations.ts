// ============================================
// ONYX - Data Migrations System
// Système pour migrer les données locales
// sans jamais les perdre lors des mises à jour
// ============================================

import { storage, mmkvHelpers } from './storage';

// Version actuelle du schéma de données
export const CURRENT_DATA_VERSION = 1;

// Clé pour stocker la version actuelle
const DATA_VERSION_KEY = 'onyx_data_version';

// ============================================
// Types de migration
// ============================================

interface Migration {
  version: number;
  name: string;
  up: () => void;
}

// ============================================
// Liste des migrations
// Chaque migration transforme les données
// de la version N à N+1
// ============================================

const migrations: Migration[] = [
  // Exemple de migration future :
  // {
  //   version: 2,
  //   name: 'Add currency field to accounts',
  //   up: () => {
  //     const accountsData = storage.getString('onyx-accounts');
  //     if (accountsData) {
  //       const parsed = JSON.parse(accountsData);
  //       const accounts = parsed.state.accounts.map((acc: any) => ({
  //         ...acc,
  //         currency: acc.currency || 'EUR',
  //       }));
  //       parsed.state.accounts = accounts;
  //       storage.set('onyx-accounts', JSON.stringify(parsed));
  //     }
  //   },
  // },
];

// ============================================
// Fonctions de migration
// ============================================

/**
 * Récupère la version actuelle des données stockées
 */
export function getStoredDataVersion(): number {
  const version = storage.getNumber(DATA_VERSION_KEY);
  return version ?? 0; // 0 = première installation ou ancienne version
}

/**
 * Sauvegarde la version des données
 */
export function setDataVersion(version: number): void {
  storage.set(DATA_VERSION_KEY, version);
}

/**
 * Exécute toutes les migrations nécessaires
 * Appelé au démarrage de l'app
 */
export function runMigrations(): { success: boolean; migrationsRun: string[] } {
  const storedVersion = getStoredDataVersion();
  const migrationsRun: string[] = [];

  console.log(`[ONYX] Current data version: ${storedVersion}`);
  console.log(`[ONYX] Target data version: ${CURRENT_DATA_VERSION}`);

  if (storedVersion >= CURRENT_DATA_VERSION) {
    console.log('[ONYX] No migrations needed');
    return { success: true, migrationsRun: [] };
  }

  try {
    // Créer une sauvegarde avant migration
    createBackup();

    // Exécuter les migrations dans l'ordre
    const pendingMigrations = migrations.filter(m => m.version > storedVersion);
    
    for (const migration of pendingMigrations) {
      console.log(`[ONYX] Running migration: ${migration.name} (v${migration.version})`);
      migration.up();
      migrationsRun.push(migration.name);
      setDataVersion(migration.version);
    }

    // Mettre à jour à la version actuelle
    setDataVersion(CURRENT_DATA_VERSION);
    console.log('[ONYX] All migrations completed successfully');

    return { success: true, migrationsRun };
  } catch (error) {
    console.error('[ONYX] Migration failed:', error);
    // En cas d'erreur, restaurer la sauvegarde
    restoreBackup();
    return { success: false, migrationsRun };
  }
}

// ============================================
// Système de sauvegarde
// ============================================

const BACKUP_PREFIX = 'onyx_backup_';

/**
 * Crée une sauvegarde complète des données
 */
export function createBackup(): string {
  const timestamp = Date.now();
  const backupKey = `${BACKUP_PREFIX}${timestamp}`;
  
  // Liste des clés à sauvegarder
  const keysToBackup = [
    'onyx-auth',
    'onyx-accounts',
    'onyx-transactions',
    'onyx-budgets',
    'onyx-goals',
    'onyx-subscriptions',
    'onyx-settings',
    'onyx-config',
  ];

  const backup: Record<string, string | undefined> = {};
  
  for (const key of keysToBackup) {
    backup[key] = storage.getString(key);
  }

  storage.set(backupKey, JSON.stringify(backup));
  storage.set('onyx_last_backup', backupKey);
  
  console.log(`[ONYX] Backup created: ${backupKey}`);
  
  // Nettoyer les anciennes sauvegardes (garder les 3 dernières)
  cleanOldBackups();
  
  return backupKey;
}

/**
 * Restaure la dernière sauvegarde
 */
export function restoreBackup(): boolean {
  const lastBackupKey = storage.getString('onyx_last_backup');
  
  if (!lastBackupKey) {
    console.error('[ONYX] No backup found');
    return false;
  }

  const backupData = storage.getString(lastBackupKey);
  
  if (!backupData) {
    console.error('[ONYX] Backup data not found');
    return false;
  }

  try {
    const backup = JSON.parse(backupData);
    
    for (const [key, value] of Object.entries(backup)) {
      if (value !== undefined) {
        storage.set(key, value as string);
      }
    }
    
    console.log('[ONYX] Backup restored successfully');
    return true;
  } catch (error) {
    console.error('[ONYX] Failed to restore backup:', error);
    return false;
  }
}

/**
 * Nettoie les anciennes sauvegardes
 */
function cleanOldBackups(): void {
  const allKeys = storage.getAllKeys();
  const backupKeys = allKeys
    .filter(key => key.startsWith(BACKUP_PREFIX))
    .sort()
    .reverse();

  // Garder les 3 dernières sauvegardes
  const keysToDelete = backupKeys.slice(3);
  
  for (const key of keysToDelete) {
    storage.delete(key);
  }
}

// ============================================
// Export des données (pour debug/support)
// ============================================

/**
 * Exporte toutes les données en JSON
 * Utile pour debug ou support
 */
export function exportAllData(): string {
  const allKeys = storage.getAllKeys();
  const onyxKeys = allKeys.filter(key => key.startsWith('onyx'));
  
  const data: Record<string, any> = {
    exportDate: new Date().toISOString(),
    dataVersion: getStoredDataVersion(),
    appVersion: '1.0.0',
    data: {},
  };

  for (const key of onyxKeys) {
    const value = storage.getString(key);
    if (value) {
      try {
        data.data[key] = JSON.parse(value);
      } catch {
        data.data[key] = value;
      }
    }
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Importe des données depuis un export JSON
 */
export function importData(jsonData: string): boolean {
  try {
    const imported = JSON.parse(jsonData);
    
    if (!imported.data) {
      throw new Error('Invalid data format');
    }

    // Créer une sauvegarde avant import
    createBackup();

    for (const [key, value] of Object.entries(imported.data)) {
      if (typeof value === 'string') {
        storage.set(key, value);
      } else {
        storage.set(key, JSON.stringify(value));
      }
    }

    console.log('[ONYX] Data imported successfully');
    return true;
  } catch (error) {
    console.error('[ONYX] Failed to import data:', error);
    restoreBackup();
    return false;
  }
}
