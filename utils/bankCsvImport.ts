import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import type { Transaction, TransactionCategory, TransactionType, BankImportMetadata } from '@/types';
import { generateId } from '@/utils/crypto';
import { useAccountStore, useConfigStore, useTransactionStore } from '@/stores';
import { safeParseISO } from '@/utils/format';

export interface BankCsvRow {
  accountingDate: string;
  simplifiedLabel: string;
  operationLabel: string;
  reference: string;
  additionalInfo: string;
  operationType: string;
  category: string;
  subCategory: string;
  debit: number;
  credit: number;
  operationDate: string;
  valueDate: string;
  pointage: string;
}

export interface BankImportPreview {
  fileName: string;
  accountId: string;
  accountName: string;
  totalRows: number;
  newRows: number;
  duplicateRows: number;
  ignoredRows: number;
  typeBreakdown: Record<TransactionType, number>;
  categoryBreakdown: Array<{ category: TransactionCategory; count: number; amount: number }>;
  sampleRows: Array<{
    date: string;
    label: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    status: 'new' | 'duplicate' | 'ignored';
  }>;
}

export interface BankImportBatch {
  transactions: Transaction[];
  preview: BankImportPreview;
}

export interface BankImportReconciliation {
  currentBalance: number;
  importedNet: number;
  targetBalance: number;
  adjustment: number;
}

function normalizeText(value: string | undefined | null): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value: string | undefined | null): string {
  return normalizeText(value).toLowerCase();
}

function splitCsvLine(line: string, separator = ';'): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === separator && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.replace(/^\uFEFF/, '').trim());
}

function parseFrenchAmount(raw: string | undefined): number {
  const normalized = normalizeText(raw).replace(/\s/g, '').replace(/\+/g, '').replace(/€/g, '').replace(/\./g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

function mapTransactionType(row: BankCsvRow): TransactionType {
  const operationType = normalizeKey(row.operationType);
  const category = normalizeKey(row.category);
  const subCategory = normalizeKey(row.subCategory);

  if (category.includes('transaction exclue') || subCategory.includes('virement interne') || operationType.includes('virement interne')) {
    return 'transfer';
  }

  if (row.credit > 0) {
    return 'income';
  }

  if (row.debit > 0) {
    return 'expense';
  }

  if (operationType.includes('virement recu') || category.includes('revenus') || category.includes('rentrees')) {
    return 'income';
  }

  return 'expense';
}

function mapCategory(row: BankCsvRow, type: TransactionType): TransactionCategory {
  const category = normalizeKey(row.category);
  const subCategory = normalizeKey(row.subCategory);
  const operationType = normalizeKey(row.operationType);

  if (type === 'transfer') return 'transfer';

  if (category.includes('alimentation')) return 'food';
  if (category.includes('transport')) return 'transport';
  if (category.includes('sante')) return 'health';
  if (category.includes('education') || category.includes('famille')) return 'education';
  if (category.includes('shopping')) return 'shopping';
  if (category.includes('loisirs') || category.includes('vacances')) return 'travel';
  if (category.includes('logement')) return 'housing';
  if (category.includes('banque') || category.includes('assurance')) return 'insurance';
  if (category.includes('revenus') || category.includes('rentrees')) return 'salary';

  if (subCategory.includes('carburant')) return 'transport';
  if (subCategory.includes('train') || subCategory.includes('avion') || subCategory.includes('ferry')) return 'travel';
  if (subCategory.includes('restaurant') || subCategory.includes('restauration')) return 'food';
  if (subCategory.includes('cinema') || subCategory.includes('bar')) return 'entertainment';
  if (subCategory.includes('virement recu') && operationType.includes('virement')) return 'salary';

  return 'other';
}

function buildRowSignature(row: BankCsvRow, accountId: string): string {
  return [
    accountId,
    normalizeKey(row.reference),
    normalizeKey(row.operationDate),
    normalizeKey(row.valueDate),
    normalizeKey(row.operationType),
    normalizeKey(row.category),
    normalizeKey(row.subCategory),
    normalizeKey(row.simplifiedLabel),
    normalizeKey(row.operationLabel),
    row.debit.toFixed(2),
    row.credit.toFixed(2),
  ].join('|');
}

async function hashRowSignature(signature: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, signature, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

async function readTextFile(fileUri: string): Promise<string> {
  try {
    const file = new File(fileUri);
    const text = await file.text();
    return text;
  } catch {
    throw new Error('Impossible de lire le fichier CSV');
  }
}

export async function readBankCsv(fileUri: string): Promise<{ rows: BankCsvRow[]; raw: string }> {
  const raw = (await readTextFile(fileUri)).replace(/^\uFEFF/, '').trim();
  if (!raw) throw new Error('Fichier vide');

  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error('CSV vide ou incomplet');

  const headers = splitCsvLine(lines[0]);
  const rows: BankCsvRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    if (cells.length < headers.length) continue;
    const get = (name: string) => cells[headers.findIndex((h) => normalizeKey(h) === normalizeKey(name))] ?? '';
    const debit = parseFrenchAmount(get('Debit'));
    const credit = parseFrenchAmount(get('Credit'));
    rows.push({
      accountingDate: get('Date de comptabilisation'),
      simplifiedLabel: get('Libelle simplifie'),
      operationLabel: get('Libelle operation'),
      reference: get('Reference'),
      additionalInfo: get('Informations complementaires'),
      operationType: get('Type operation'),
      category: get('Categorie'),
      subCategory: get('Sous categorie'),
      debit,
      credit,
      operationDate: get('Date operation'),
      valueDate: get('Date de valeur'),
      pointage: get('Pointage operation'),
    });
  }

  return { rows, raw };
}

function transactionIdentity(tx: Transaction): string {
  const importMeta = tx.bankImport;
  if (importMeta?.rowHash) return `${tx.accountId}|${importMeta.rowHash}`;
  return [
    tx.accountId,
    normalizeKey(tx.date),
    tx.type,
    tx.category,
    tx.amount.toFixed(2),
    normalizeKey(tx.description),
    normalizeKey(tx.toAccountId),
  ].join('|');
}

export function buildBankImportReconciliation(currentBalance: number, importedNet: number, targetBalance?: number): BankImportReconciliation {
  const computedTarget = targetBalance ?? currentBalance;
  return {
    currentBalance,
    importedNet,
    targetBalance: computedTarget,
    adjustment: computedTarget - (currentBalance + importedNet),
  };
}

function rowToTransaction(row: BankCsvRow, accountId: string, fileName: string, rowHash: string): Transaction | null {
  const type = mapTransactionType(row);
  const category = mapCategory(row, type);
  const amount = row.credit > 0 ? row.credit : row.debit > 0 ? row.debit : 0;
  if (!amount || amount <= 0) return null;

  const date = row.operationDate || row.accountingDate || row.valueDate || new Date().toISOString();
  const description = normalizeText(row.simplifiedLabel || row.operationLabel || row.reference || 'Opération bancaire') || 'Opération bancaire';
  const now = new Date().toISOString();
  const bankImport: BankImportMetadata = {
    source: 'caisse-epargne-csv',
    accountId,
    rowHash,
    reference: normalizeText(row.reference) || undefined,
    accountingDate: normalizeText(row.accountingDate) || undefined,
    operationDate: normalizeText(row.operationDate) || undefined,
    valueDate: normalizeText(row.valueDate) || undefined,
    pointage: normalizeText(row.pointage) || undefined,
    bankCategory: normalizeText(row.category) || undefined,
    bankSubCategory: normalizeText(row.subCategory) || undefined,
    rawLabel: normalizeText(row.simplifiedLabel) || undefined,
    detailedLabel: normalizeText(row.operationLabel) || undefined,
    additionalInfo: normalizeText(row.additionalInfo) || undefined,
    typeOperation: normalizeText(row.operationType) || undefined,
    direction: row.credit > 0 ? 'in' : 'out',
    fileName,
  };

  return {
    id: generateId(),
    accountId,
    type,
    category,
    amount,
    description,
    date,
    createdAt: now,
    bankImport,
  };
}

export async function previewBankCsvImport(fileUri: string, accountId: string, fileName = 'releve.csv'): Promise<BankImportBatch> {
  const { rows } = await readBankCsv(fileUri);
  const account = useAccountStore.getState().getAccount(accountId);
  if (!account) throw new Error('Compte cible introuvable');

  const existing = useTransactionStore.getState().getTransactionsByAccount(accountId);
  const existingIds = new Set(existing.map(transactionIdentity));
  const existingHashes = new Set(
    existing
      .map((tx) => tx.bankImport?.rowHash)
      .filter((value): value is string => Boolean(value))
      .map((value) => `${accountId}|${value}`)
  );

  const seenInFile = new Set<string>();
  const transactions: Transaction[] = [];
  let duplicateRows = 0;
  let ignoredRows = 0;
  const typeBreakdown: Record<TransactionType, number> = { income: 0, expense: 0, transfer: 0 };
  const categoryAgg = new Map<TransactionCategory, { count: number; amount: number }>();
  const sampleRows: BankImportPreview['sampleRows'] = [];

  for (const row of rows) {
    const signature = buildRowSignature(row, accountId);
    const rowHash = await hashRowSignature(signature);
    const key = `${accountId}|${rowHash}`;
    const tx = rowToTransaction(row, accountId, fileName, rowHash);

    if (!tx) {
      ignoredRows += 1;
      if (sampleRows.length < 20) {
        sampleRows.push({
          date: row.operationDate || row.accountingDate || row.valueDate || '',
          label: normalizeText(row.simplifiedLabel || row.operationLabel || row.reference || 'Opération bancaire'),
          amount: 0,
          type: 'expense',
          category: 'other',
          status: 'ignored',
        });
      }
      continue;
    }

    const isDuplicate = seenInFile.has(key) || existingIds.has(transactionIdentity(tx)) || existingHashes.has(key);
    if (isDuplicate) {
      duplicateRows += 1;
      if (sampleRows.length < 20) {
        sampleRows.push({
          date: tx.date,
          label: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          status: 'duplicate',
        });
      }
      continue;
    }

    seenInFile.add(key);
    transactions.push(tx);
    typeBreakdown[tx.type] += 1;
    const entry = categoryAgg.get(tx.category) ?? { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += tx.amount;
    categoryAgg.set(tx.category, entry);
    if (sampleRows.length < 20) {
      sampleRows.push({
        date: tx.date,
        label: tx.description,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        status: 'new',
      });
    }
  }

  transactions.sort((a, b) => {
    const ta = safeParseISO(a.date)?.getTime() ?? 0;
    const tb = safeParseISO(b.date)?.getTime() ?? 0;
    return ta - tb;
  });

  return {
    transactions,
    preview: {
      fileName,
      accountId,
      accountName: account.name,
      totalRows: rows.length,
      newRows: transactions.length,
      duplicateRows,
      ignoredRows,
      typeBreakdown,
      categoryBreakdown: [...categoryAgg.entries()]
        .map(([category, value]) => ({ category, count: value.count, amount: value.amount }))
        .sort((a, b) => b.count - a.count || b.amount - a.amount),
      sampleRows,
    },
  };
}

export async function importBankCsv(fileUri: string, accountId: string, fileName = 'releve.csv'): Promise<BankImportPreview> {
  const { transactions, preview } = await previewBankCsvImport(fileUri, accountId, fileName);
  if (transactions.length) {
    useTransactionStore.getState().addTransactionsForImport(transactions, { applyBalanceChanges: true });
  }
  return preview;
}
