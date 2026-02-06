// ============================================
// ONYX - Data Migrations System (AsyncStorage)
// ============================================

import { storage } from './storage';

export const CURRENT_DATA_VERSION = 1;
const DATA_VERSION_KEY = 'onyx_data_version';

interface Migration {
  version: number;
  name: string;
  up: () => void | Promise<void>;
}

const migrations: Migration[] = [];

export async function getStoredDataVersion(): Promise<number> {
  const v = await storage.getNumber(DATA_VERSION_KEY);
  return v ?? 0;
}

export async function setDataVersion(version: number): Promise<void> {
  await storage.set(DATA_VERSION_KEY, version);
}

const BACKUP_PREFIX = 'onyx_backup_';

export async function createBackup(): Promise<string> {
  const timestamp = Date.now();
  const backupKey = `${BACKUP_PREFIX}${timestamp}`;
  const allKeys = await storage.getAllKeys();
  const onyxKeys = allKeys.filter((k) => k.startsWith('onyx-') || k === 'onyx_data_version');
  const backup: Record<string, string | undefined> = {};
  for (const key of onyxKeys) {
    const val = await storage.getString(key);
    if (val !== undefined) backup[key] = val;
  }
  await storage.set(backupKey, JSON.stringify(backup));
  await storage.set('onyx_last_backup', backupKey);
  await cleanOldBackups();
  return backupKey;
}

export async function restoreBackup(): Promise<boolean> {
  const lastBackupKey = await storage.getString('onyx_last_backup');
  if (!lastBackupKey) return false;
  const backupData = await storage.getString(lastBackupKey);
  if (!backupData) return false;
  try {
    const backup = JSON.parse(backupData);
    for (const [key, value] of Object.entries(backup)) {
      if (value !== undefined) await storage.set(key, value as string);
    }
    return true;
  } catch {
    return false;
  }
}

async function cleanOldBackups(): Promise<void> {
  const allKeys = await storage.getAllKeys();
  const backupKeys = allKeys.filter((k) => k.startsWith(BACKUP_PREFIX)).sort().reverse();
  for (const k of backupKeys.slice(3)) {
    await storage.delete(k);
  }
}

export async function runMigrations(): Promise<{ success: boolean; migrationsRun: string[] }> {
  const storedVersion = await getStoredDataVersion();
  const migrationsRun: string[] = [];

  if (storedVersion >= CURRENT_DATA_VERSION) {
    return { success: true, migrationsRun: [] };
  }

  try {
    await createBackup();
    const pending = migrations.filter((m) => m.version > storedVersion);
    for (const migration of pending) {
      await migration.up();
      migrationsRun.push(migration.name);
      await setDataVersion(migration.version);
    }
    await setDataVersion(CURRENT_DATA_VERSION);
    return { success: true, migrationsRun };
  } catch (error) {
    console.error('[ONYX] Migration failed:', error);
    await restoreBackup();
    return { success: false, migrationsRun };
  }
}

export async function exportAllData(): Promise<string> {
  const allKeys = await storage.getAllKeys();
  const onyxKeys = allKeys.filter((k) => k.startsWith('onyx'));
  const data: Record<string, unknown> = {
    exportDate: new Date().toISOString(),
    dataVersion: await getStoredDataVersion(),
    appVersion: '1.0.0',
    data: {} as Record<string, unknown>,
  };
  for (const key of onyxKeys) {
    const value = await storage.getString(key);
    if (value) {
      try {
        (data.data as Record<string, unknown>)[key] = JSON.parse(value);
      } catch {
        (data.data as Record<string, unknown>)[key] = value;
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonData: string): Promise<boolean> {
  try {
    const imported = JSON.parse(jsonData);
    if (!imported.data) throw new Error('Invalid data format');
    await createBackup();
    for (const [key, value] of Object.entries(imported.data)) {
      if (typeof value === 'string') {
        await storage.set(key, value);
      } else {
        await storage.set(key, JSON.stringify(value));
      }
    }
    return true;
  } catch {
    await restoreBackup();
    return false;
  }
}
