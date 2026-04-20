import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import type { Transaction, BankImportMetadata } from '@/types';
import { generateId } from '@/utils/crypto';
import { useAccountStore, useTransactionStore } from '@/stores';
import { safeParseISO } from '@/utils/format';
import {
  parseBankCsvRaw,
  summarizeBankRows,
  suggestBankImportAccountId,
  buildBankImportReconciliation,
  type BankCsvRow,
} from './bankCsvImportCore';

export { parseBankCsvRaw, summarizeBankRows, suggestBankImportAccountId, buildBankImportReconciliation, type BankCsvRow };

export interface BankImportPreview {
  fileName: string;
  accountId: string;
  accountName: string;
  totalRows: number;
  newRows: number;
  duplicateRows: number;
  ignoredRows: number;
  typeBreakdown: Record<'income' | 'expense' | 'transfer', number>;
  categoryBreakdown: Array<{ category: string; count: number; amount: number }>;
  sampleRows: Array<{
    date: string;
    label: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    category: string;
    status: 'new' | 'duplicate' | 'ignored';
  }>;
}

export interface BankImportBatch {
  transactions: Transaction[];
  preview: BankImportPreview;
}

function normalizeText(value: string | undefined | null): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

async function hashRowSignature(signature: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, signature, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

async function readTextFile(fileUri: string): Promise<string> {
  try {
    const file = new File(fileUri);
    return await file.text();
  } catch {
    throw new Error('Impossible de lire le fichier CSV');
  }
}

function transactionIdentity(tx: Transaction): string {
  const importMeta = tx.bankImport;
  if (importMeta?.rowHash) return `${tx.accountId}|${importMeta.rowHash}`;
  return [
    tx.accountId,
    normalizeText(tx.date).toLowerCase(),
    tx.type,
    tx.category,
    tx.amount.toFixed(2),
    normalizeText(tx.description).toLowerCase(),
    normalizeText(tx.toAccountId).toLowerCase(),
  ].join('|');
}

function rowToTransaction(row: BankCsvRow, accountId: string, fileName: string, rowHash: string): Transaction | null {
  const type = row.credit > 0 ? 'income' : row.debit > 0 ? 'expense' : row.operationType.toLowerCase().includes('virement') ? 'transfer' : 'expense';
  const category = type === 'transfer'
    ? 'transfer'
    : row.category.toLowerCase().includes('alimentation')
      ? 'food'
      : row.category.toLowerCase().includes('transport')
        ? 'transport'
        : row.category.toLowerCase().includes('sante')
          ? 'health'
          : row.category.toLowerCase().includes('revenus') || row.category.toLowerCase().includes('rentrees')
            ? 'salary'
            : 'other';
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
  const raw = (await readTextFile(fileUri)).replace(/^\uFEFF/, '').trim();
  const rows = parseBankCsvRaw(raw);
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
  const summary = summarizeBankRows(rows);
  const sampleRows: BankImportPreview['sampleRows'] = [];

  for (const { row, type, category, amount } of summary.normalizedRows) {
    const signature = [
      accountId,
      row.reference,
      row.operationDate,
      row.valueDate,
      row.operationType,
      row.category,
      row.subCategory,
      row.simplifiedLabel,
      row.operationLabel,
      row.debit.toFixed(2),
      row.credit.toFixed(2),
    ].join('|');
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
    if (sampleRows.length < 20) {
      sampleRows.push({
        date: tx.date,
        label: tx.description,
        amount,
        type,
        category,
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
      typeBreakdown: summary.typeBreakdown,
      categoryBreakdown: summary.categoryBreakdown,
      sampleRows,
    },
  };
}

export async function importBankCsv(fileUri: string, accountId: string, fileName = 'releve.csv', options?: { targetBalance?: number; createReconciliationTransaction?: boolean }): Promise<BankImportPreview> {
  const { transactions, preview } = await previewBankCsvImport(fileUri, accountId, fileName);
  const balanceBeforeImport = useAccountStore.getState().getAccount(accountId)?.balance ?? 0;
  if (transactions.length) {
    useTransactionStore.getState().addTransactionsForImport(transactions, { applyBalanceChanges: true });
  }

  const shouldReconcile = Boolean(options?.createReconciliationTransaction && Number.isFinite(options?.targetBalance));
  if (shouldReconcile) {
    const importedNet = preview.typeBreakdown.income - preview.typeBreakdown.expense;
    const reconciliation = buildBankImportReconciliation(balanceBeforeImport, importedNet, options?.targetBalance);
    if (Math.abs(reconciliation.adjustment) >= 0.005) {
      useTransactionStore.getState().addTransactionsForImport([
        {
          id: generateId(),
          accountId,
          type: reconciliation.adjustment > 0 ? 'income' : 'expense',
          category: 'other',
          amount: Math.abs(reconciliation.adjustment),
          description: 'Réconciliation de solde',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          bankImport: {
            source: 'caisse-epargne-csv',
            accountId,
            rowHash: `reconciliation:${preview.fileName}:${Date.now()}`,
            additionalInfo: `target=${options?.targetBalance ?? ''}`,
            direction: reconciliation.adjustment > 0 ? 'in' : 'out',
            fileName: preview.fileName,
          },
        },
      ], { applyBalanceChanges: true });
    }
  }
  return preview;
}
