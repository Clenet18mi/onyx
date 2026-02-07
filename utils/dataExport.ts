// ============================================
// ONYX - Export / Import JSON (sauvegarde complète)
// Utilise la nouvelle API FileSystem (SDK 54) + legacy uniquement pour partage Android
// ============================================

import { Platform, Alert } from 'react-native';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAccountStore } from '@/stores/accountStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useGoalStore } from '@/stores/goalStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { usePlannedTransactionStore } from '@/stores/plannedTransactionStore';
import type { Account, Transaction, Budget, SavingsGoal, Subscription, PlannedTransaction } from '@/types';

const EXPORT_VERSION = '1.0';

export interface ExportData {
  version: string;
  exportDate: string;
  accounts: SerializedAccount[];
  transactions: SerializedTransaction[];
  budgets: SerializedBudget[];
  goals: SerializedGoal[];
  subscriptions: SerializedSubscription[];
  plannedTransactions: SerializedPlannedTransaction[];
}

interface SerializedPlannedTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  accountId: string;
  plannedDate: string;
  description: string;
  note?: string;
  status: string;
  realizedTransactionId?: string;
  realizedDate?: string;
  isRecurring?: boolean;
  recurrence?: { frequency: string; interval: number; endDate?: string; count?: number };
  createdAt: string;
  updatedAt: string;
}

interface SerializedAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  icon: string;
  currency: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SerializedTransaction {
  id: string;
  accountId: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  toAccountId?: string;
  subscriptionId?: string;
  goalId?: string;
  photoUris?: string[];
  voiceNoteUri?: string;
  createdAt: string;
}

interface SerializedBudget {
  id: string;
  category: string;
  limit: number;
  period: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface SerializedGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  accountId: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SerializedSubscription {
  id: string;
  name: string;
  amount: number;
  category: string;
  accountId: string;
  frequency: string;
  nextBillingDate: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function ensureString(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'toISOString' in value && typeof (value as Date).toISOString === 'function') {
    return (value as Date).toISOString();
  }
  return String(value);
}

/** Replacer pour JSON.stringify : exclut les fonctions et convertit les dates */
function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'function') return undefined;
  if (value instanceof Date) return value.toISOString();
  if (value !== null && typeof value === 'object' && 'toISOString' in value && typeof (value as Date).toISOString === 'function') {
    return (value as Date).toISOString();
  }
  return value;
}

function cleanAccounts(accounts: Account[]): SerializedAccount[] {
  return accounts.map((a) => ({
    id: String(a.id),
    name: String(a.name),
    type: String(a.type),
    balance: Number(a.balance),
    color: String(a.color),
    icon: String(a.icon),
    currency: String(a.currency),
    isArchived: Boolean(a.isArchived),
    createdAt: ensureString(a.createdAt),
    updatedAt: ensureString(a.updatedAt),
  }));
}

function cleanTransactions(transactions: Transaction[]): SerializedTransaction[] {
  return transactions.map((t) => ({
    id: String(t.id),
    accountId: String(t.accountId),
    type: String(t.type),
    category: String(t.category),
    amount: Number(t.amount),
    description: String(t.description ?? ''),
    date: ensureString(t.date),
    toAccountId: t.toAccountId,
    subscriptionId: t.subscriptionId,
    goalId: t.goalId,
    photoUris: t.photoUris,
    voiceNoteUri: t.voiceNoteUri,
    createdAt: ensureString(t.createdAt),
  }));
}

function cleanBudgets(budgets: Budget[]): SerializedBudget[] {
  return budgets.map((b) => ({
    id: String(b.id),
    category: String(b.category),
    limit: Number(b.limit),
    period: String(b.period),
    color: String(b.color),
    createdAt: ensureString(b.createdAt),
    updatedAt: ensureString(b.updatedAt),
  }));
}

function cleanGoals(goals: SavingsGoal[]): SerializedGoal[] {
  return goals.map((g) => ({
    id: String(g.id),
    name: String(g.name),
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
    deadline: g.deadline,
    icon: String(g.icon),
    color: String(g.color),
    accountId: String(g.accountId),
    isCompleted: Boolean(g.isCompleted),
    createdAt: ensureString(g.createdAt),
    updatedAt: ensureString(g.updatedAt),
  }));
}

function cleanSubscriptions(subs: Subscription[]): SerializedSubscription[] {
  return subs.map((s) => ({
    id: String(s.id),
    name: String(s.name),
    amount: Number(s.amount),
    category: String(s.category),
    accountId: String(s.accountId),
    frequency: String(s.frequency),
    nextBillingDate: ensureString(s.nextBillingDate),
    icon: String(s.icon),
    color: String(s.color),
    isActive: Boolean(s.isActive),
    createdAt: ensureString(s.createdAt),
    updatedAt: ensureString(s.updatedAt),
  }));
}

function cleanPlannedTransactions(list: PlannedTransaction[]): SerializedPlannedTransaction[] {
  return (list ?? []).map((p) => ({
    id: String(p.id),
    type: String(p.type),
    amount: Number(p.amount),
    category: String(p.category),
    accountId: String(p.accountId),
    plannedDate: ensureString(p.plannedDate),
    description: String(p.description ?? ''),
    note: p.note,
    status: String(p.status),
    realizedTransactionId: p.realizedTransactionId,
    realizedDate: p.realizedDate,
    isRecurring: p.isRecurring,
    recurrence: p.recurrence,
    createdAt: ensureString(p.createdAt),
    updatedAt: ensureString(p.updatedAt),
  }));
}

function prepareDataForExport(): ExportData {
  let accounts: Account[] = [];
  let transactions: Transaction[] = [];
  let budgets: Budget[] = [];
  let goals: SavingsGoal[] = [];
  let subscriptions: Subscription[] = [];
  let plannedTransactions: PlannedTransaction[] = [];

  try {
    accounts = useAccountStore.getState().accounts ?? [];
  } catch (e) {
    console.warn('[dataExport] accountStore.getState()', e);
  }
  try {
    transactions = useTransactionStore.getState().transactions ?? [];
  } catch (e) {
    console.warn('[dataExport] transactionStore.getState()', e);
  }
  try {
    budgets = useBudgetStore.getState().budgets ?? [];
  } catch (e) {
    console.warn('[dataExport] budgetStore.getState()', e);
  }
  try {
    goals = useGoalStore.getState().goals ?? [];
  } catch (e) {
    console.warn('[dataExport] goalStore.getState()', e);
  }
  try {
    subscriptions = useSubscriptionStore.getState().subscriptions ?? [];
  } catch (e) {
    console.warn('[dataExport] subscriptionStore.getState()', e);
  }
  try {
    plannedTransactions = usePlannedTransactionStore.getState().plannedTransactions ?? [];
  } catch (e) {
    console.warn('[dataExport] plannedTransactionStore.getState()', e);
  }

  return {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    accounts: cleanAccounts(accounts),
    transactions: cleanTransactions(transactions),
    budgets: cleanBudgets(budgets),
    goals: cleanGoals(goals),
    subscriptions: cleanSubscriptions(subscriptions),
    plannedTransactions: cleanPlannedTransactions(plannedTransactions),
  };
}

function toDateString(v: unknown): string {
  if (v == null || v === '') return new Date().toISOString();
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && !Number.isNaN(v)) return new Date(v).toISOString();
  return new Date().toISOString();
}

function restoreAccounts(rows: SerializedAccount[]): Account[] {
  return (Array.isArray(rows) ? rows : []).filter(Boolean).map((a) => ({
    id: String(a?.id ?? ''),
    name: String(a?.name ?? 'Compte'),
    type: (a?.type || 'checking') as Account['type'],
    balance: Number(a?.balance) || 0,
    color: String(a?.color || '#6366F1'),
    icon: String(a?.icon || 'Wallet'),
    currency: String(a?.currency || 'EUR'),
    isArchived: Boolean(a?.isArchived),
    createdAt: toDateString(a?.createdAt),
    updatedAt: toDateString(a?.updatedAt),
  }));
}

function restoreTransactions(rows: SerializedTransaction[]): Transaction[] {
  return (Array.isArray(rows) ? rows : []).filter(Boolean).map((t) => ({
    id: String(t?.id ?? ''),
    accountId: String(t?.accountId ?? ''),
    type: (t?.type || 'expense') as Transaction['type'],
    category: (t?.category || 'other') as Transaction['category'],
    amount: Number(t?.amount) || 0,
    description: String(t?.description ?? ''),
    date: toDateString(t?.date),
    toAccountId: t?.toAccountId,
    subscriptionId: t?.subscriptionId,
    goalId: t?.goalId,
    photoUris: Array.isArray(t?.photoUris) ? t.photoUris : undefined,
    voiceNoteUri: t?.voiceNoteUri,
    createdAt: toDateString(t?.createdAt),
  }));
}

function restoreBudgets(rows: SerializedBudget[]): Budget[] {
  return (Array.isArray(rows) ? rows : []).filter(Boolean).map((b) => ({
    id: String(b?.id ?? ''),
    category: (b?.category || 'other') as Budget['category'],
    limit: Number(b?.limit) || 0,
    period: (b?.period || 'monthly') as Budget['period'],
    color: String(b?.color ?? ''),
    createdAt: toDateString(b?.createdAt),
    updatedAt: toDateString(b?.updatedAt),
  }));
}

function restoreGoals(rows: SerializedGoal[]): SavingsGoal[] {
  return (Array.isArray(rows) ? rows : []).filter(Boolean).map((g) => ({
    id: String(g?.id ?? ''),
    name: String(g?.name ?? 'Objectif'),
    targetAmount: Number(g?.targetAmount) || 0,
    currentAmount: Number(g?.currentAmount) || 0,
    deadline: g?.deadline,
    icon: String(g?.icon || 'PiggyBank'),
    color: String(g?.color || '#10B981'),
    accountId: String(g?.accountId ?? ''),
    isCompleted: Boolean(g?.isCompleted),
    createdAt: toDateString(g?.createdAt),
    updatedAt: toDateString(g?.updatedAt),
  }));
}

function restoreSubscriptions(rows: SerializedSubscription[]): Subscription[] {
  return (Array.isArray(rows) ? rows : []).filter(Boolean).map((s) => ({
    id: String(s?.id ?? ''),
    name: String(s?.name ?? ''),
    amount: Number(s?.amount) || 0,
    category: (s?.category || 'subscriptions') as Subscription['category'],
    accountId: String(s?.accountId ?? ''),
    frequency: (s?.frequency || 'monthly') as Subscription['frequency'],
    nextBillingDate: toDateString(s?.nextBillingDate),
    icon: String(s?.icon || 'CreditCard'),
    color: String(s?.color || '#8B5CF6'),
    isActive: Boolean(s?.isActive),
    createdAt: toDateString(s?.createdAt),
    updatedAt: toDateString(s?.updatedAt),
  }));
}

function restorePlannedTransactions(rows: SerializedPlannedTransaction[]): PlannedTransaction[] {
  return (Array.isArray(rows) ? rows : []).filter(Boolean).map((p) => ({
    id: String(p?.id ?? ''),
    type: (p?.type || 'expense') as PlannedTransaction['type'],
    amount: Number(p?.amount) || 0,
    category: (p?.category || 'other') as PlannedTransaction['category'],
    accountId: String(p?.accountId ?? ''),
    plannedDate: toDateString(p?.plannedDate),
    description: String(p?.description ?? ''),
    note: p?.note,
    status: (p?.status || 'pending') as PlannedTransaction['status'],
    realizedTransactionId: p?.realizedTransactionId,
    realizedDate: p?.realizedDate,
    isRecurring: Boolean(p?.isRecurring),
    recurrence: p?.recurrence as PlannedTransaction['recurrence'],
    createdAt: toDateString(p?.createdAt),
    updatedAt: toDateString(p?.updatedAt),
  }));
}

/**
 * Sur Android, convertit un file:// en content:// pour le partage.
 */
async function getShareableUri(fileUri: string): Promise<string> {
  if (Platform.OS !== 'android') return fileUri;
  try {
    const legacy = await import('expo-file-system/legacy');
    if (typeof legacy.getContentUriAsync === 'function') {
      return await legacy.getContentUriAsync(fileUri);
    }
  } catch (e) {
    console.warn('[dataExport] getContentUriAsync non disponible:', e);
  }
  return fileUri;
}

/** Format NDJSON : une ligne = un objet JSON. Plus simple et robuste qu'un gros JSON. */
function buildNDJSON(data: ExportData): string {
  const lines: string[] = [];
  const push = (obj: Record<string, unknown>) => {
    lines.push(JSON.stringify(obj, jsonReplacer));
  };
  push({ _: 'meta', version: data.version, exportDate: data.exportDate } as unknown as Record<string, unknown>);
  data.accounts.forEach((a) => push({ _: 'account', ...a } as unknown as Record<string, unknown>));
  data.transactions.forEach((t) => push({ _: 'transaction', ...t } as unknown as Record<string, unknown>));
  data.budgets.forEach((b) => push({ _: 'budget', ...b } as unknown as Record<string, unknown>));
  data.goals.forEach((g) => push({ _: 'goal', ...g } as unknown as Record<string, unknown>));
  data.subscriptions.forEach((s) => push({ _: 'subscription', ...s } as unknown as Record<string, unknown>));
  data.plannedTransactions.forEach((p) => push({ _: 'planned', ...p } as unknown as Record<string, unknown>));
  return lines.join('\n');
}

/** Parse un fichier NDJSON (une ligne = un objet) vers ExportData. */
function parseNDJSON(content: string): ExportData {
  const accounts: SerializedAccount[] = [];
  const transactions: SerializedTransaction[] = [];
  const budgets: SerializedBudget[] = [];
  const goals: SerializedGoal[] = [];
  const subscriptions: SerializedSubscription[] = [];
  const plannedTransactions: SerializedPlannedTransaction[] = [];
  let version = '1.0';
  let exportDate = new Date().toISOString();

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      const type = obj._ as string;
      if (type === 'meta') {
        version = (obj.version as string) ?? version;
        exportDate = (obj.exportDate as string) ?? exportDate;
        continue;
      }
      const { _, ...rest } = obj;
      if (type === 'account') accounts.push(rest as unknown as SerializedAccount);
      else if (type === 'transaction') transactions.push(rest as unknown as SerializedTransaction);
      else if (type === 'budget') budgets.push(rest as unknown as SerializedBudget);
      else if (type === 'goal') goals.push(rest as unknown as SerializedGoal);
      else if (type === 'subscription') subscriptions.push(rest as unknown as SerializedSubscription);
      else if (type === 'planned') plannedTransactions.push(rest as unknown as SerializedPlannedTransaction);
    } catch {
      // ignorer les lignes invalides
    }
  }

  return { version, exportDate, accounts, transactions, budgets, goals, subscriptions, plannedTransactions };
}

/**
 * Exporte toutes les données en NDJSON (format simple : une ligne = un enregistrement) et ouvre le partage.
 */
export async function exportDataAsJSON(): Promise<void> {
  const step = { current: '' };
  try {
    step.current = 'préparation des données';
    const data = prepareDataForExport();

    step.current = 'génération du fichier';
    const content = buildNDJSON(data);
    if (!content || content.length === 0) {
      throw new Error('Contenu vide');
    }

    step.current = 'création du fichier';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `onyx-backup-${timestamp}.ndjson`;
    let fileUri: string;

    try {
      const file = new File(Paths.cache, filename);
      file.create({ overwrite: true, intermediates: true });
      file.write(content);
      fileUri = file.uri;
    } catch {
      const legacy = await import('expo-file-system/legacy');
      const dir = legacy.cacheDirectory ?? legacy.documentDirectory;
      if (!dir) throw new Error('Aucun répertoire disponible (cache/document)');
      fileUri = dir.endsWith('/') ? `${dir}${filename}` : `${dir}/${filename}`;
      await legacy.writeAsStringAsync(fileUri, content, { encoding: legacy.EncodingType?.UTF8 ?? 'utf8' });
    }

    if (!fileUri) {
      throw new Error('URI du fichier indisponible');
    }

    step.current = 'partage';
    const shareUri = await getShareableUri(fileUri);
    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
      await Sharing.shareAsync(shareUri, {
        mimeType: 'application/x-ndjson',
        dialogTitle: 'Sauvegarde ONYX',
        UTI: 'public.json',
      });
    } else {
      Alert.alert(
        'Export réussi',
        `Fichier créé : ${fileUri}`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const detail = `Étape : ${step.current}. ${message}`;
    console.error('[exportDataAsJSON]', detail, error);
    Alert.alert(
      'Erreur d\'export',
      `Impossible d'exporter les données.\n\n${detail}`,
      [{ text: 'OK' }]
    );
    throw error;
  }
}

/**
 * Lit le contenu d'un fichier (file:// ou content://). Sur Android content:// on copie d'abord en cache.
 */
async function readFileContent(fileUri: string): Promise<string> {
  const legacy = await import('expo-file-system/legacy');
  try {
    return await legacy.readAsStringAsync(fileUri, { encoding: legacy.EncodingType?.UTF8 ?? 'utf8' });
  } catch {
    const dir = legacy.cacheDirectory ?? legacy.documentDirectory;
    if (dir && (fileUri.startsWith('content://') || fileUri.startsWith('file://'))) {
      const tempPath = `${dir.endsWith('/') ? dir : dir + '/'}onyx-import-temp-${Date.now()}.ndjson`;
      try {
        await legacy.copyAsync({ from: fileUri, to: tempPath });
        const out = await legacy.readAsStringAsync(tempPath, { encoding: legacy.EncodingType?.UTF8 ?? 'utf8' });
        await legacy.deleteAsync(tempPath, { idempotent: true });
        return out;
      } catch (e2) {
        console.warn('[dataExport] copyAsync fallback failed', e2);
      }
    }
    const file = new File(fileUri);
    if (file.exists) {
      const bytes = await file.bytes();
      return new TextDecoder('utf-8').decode(bytes);
    }
    throw new Error('Impossible de lire le fichier (vérifiez les permissions)');
  }
}

/**
 * Importe des données depuis un fichier JSON ou NDJSON (avec confirmation).
 */
export async function importDataFromJSON(fileUri: string): Promise<void> {
  const step = { current: '' };
  try {
    step.current = 'lecture du fichier';
    let raw = await readFileContent(fileUri);
    const jsonString = raw.replace(/^\uFEFF/, '').trim();
    if (!jsonString || jsonString.length === 0) {
      throw new Error('Fichier vide');
    }

    step.current = 'analyse du fichier';
    let data: ExportData;
    try {
      let isNDJSON = false;
      const firstLine = jsonString.split(/\r?\n/)[0]?.trim();
      if (firstLine?.startsWith('{') && firstLine.endsWith('}')) {
        try {
          const first = JSON.parse(firstLine) as Record<string, unknown>;
          if (first._ === 'meta') isNDJSON = true;
        } catch {
          /* pas du NDJSON */
        }
      }
      if (isNDJSON) {
        data = parseNDJSON(jsonString);
      } else {
        const parsed = JSON.parse(jsonString) as Record<string, unknown>;
        const exportDate = (parsed.exportDate ?? parsed.exportedAt) as string | undefined;
        const version = parsed.version as string | undefined;
        data = {
          version: version ?? '1.0',
          exportDate: exportDate ?? new Date().toISOString(),
          accounts: Array.isArray(parsed.accounts) ? (parsed.accounts as SerializedAccount[]) : [],
          transactions: Array.isArray(parsed.transactions) ? (parsed.transactions as SerializedTransaction[]) : [],
          budgets: Array.isArray(parsed.budgets) ? (parsed.budgets as SerializedBudget[]) : [],
          goals: Array.isArray(parsed.goals) ? (parsed.goals as SerializedGoal[]) : [],
          subscriptions: Array.isArray(parsed.subscriptions) ? (parsed.subscriptions as SerializedSubscription[]) : [],
          plannedTransactions: Array.isArray(parsed.plannedTransactions) ? (parsed.plannedTransactions as SerializedPlannedTransaction[]) : [],
        };
      }
    } catch (parseErr) {
      console.error('[importDataFromJSON] parse error', parseErr);
      throw new Error('Fichier invalide (JSON ou NDJSON attendu)');
    }

    if (!data.accounts?.length && !data.transactions?.length) {
      throw new Error('Le fichier ne contient ni comptes ni transactions.');
    }

    const exportDateLabel = new Date(data.exportDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    Alert.alert(
      'Confirmer l\'import',
      `Remplacer toutes les données actuelles par celles du fichier (export du ${exportDateLabel}) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Importer',
          style: 'destructive',
          onPress: () => {
            (async () => {
              try {
                if (data.accounts?.length) {
                  const accounts = restoreAccounts(data.accounts).filter((a) => a.id);
                  if (accounts.length) useAccountStore.getState().setAccountsForImport(accounts);
                }
                if (data.transactions?.length) {
                  const transactions = restoreTransactions(data.transactions).filter((t) => t.id && t.accountId);
                  if (transactions.length) useTransactionStore.getState().setTransactionsForImport(transactions);
                }
                if (data.budgets?.length) {
                  const budgets = restoreBudgets(data.budgets).filter((b) => b.id);
                  if (budgets.length) useBudgetStore.getState().setBudgetsForImport(budgets);
                }
                if (data.goals?.length) {
                  const goals = restoreGoals(data.goals).filter((g) => g.id && g.accountId);
                  if (goals.length) useGoalStore.getState().setGoalsForImport(goals);
                }
                if (data.subscriptions?.length) {
                  const subscriptions = restoreSubscriptions(data.subscriptions).filter((s) => s.id && s.accountId);
                  if (subscriptions.length) useSubscriptionStore.getState().setSubscriptionsForImport(subscriptions);
                }
                if (data.plannedTransactions?.length) {
                  const planned = restorePlannedTransactions(data.plannedTransactions).filter((p) => p.id && p.accountId);
                  if (planned.length) usePlannedTransactionStore.getState().setPlannedTransactionsForImport(planned);
                }
                Alert.alert('Import réussi', 'Vos données ont été restaurées.', [{ text: 'OK' }]);
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error('[importDataFromJSON] Restauration:', err);
                Alert.alert('Erreur', `Restauration impossible : ${msg}`, [{ text: 'OK' }]);
              }
            })();
          },
        },
      ]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const detail = `Étape : ${step.current}. ${message}`;
    console.error('[importDataFromJSON]', detail, error);
    Alert.alert(
      'Erreur d\'import',
      `Impossible d'importer les données.\n\n${detail}`,
      [{ text: 'OK' }]
    );
    throw error;
  }
}
