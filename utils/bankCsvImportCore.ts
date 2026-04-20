import type { TransactionCategory, TransactionType } from '@/types';

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

export function suggestBankImportAccountId(accounts: Array<{ id: string; type: string; isArchived?: boolean }>, lastBankImportAccountId?: string | null): string {
  const activeAccounts = accounts.filter((account) => !account.isArchived);
  if (!activeAccounts.length) return '';
  if (lastBankImportAccountId && activeAccounts.some((account) => account.id === lastBankImportAccountId)) return lastBankImportAccountId;
  return activeAccounts.find((account) => account.type === 'checking')?.id ?? activeAccounts[0].id;
}

export function buildBankImportReconciliation(currentBalance: number, importedNet: number, targetBalance?: number) {
  const computedTarget = targetBalance ?? currentBalance;
  return {
    currentBalance,
    importedNet,
    targetBalance: computedTarget,
    adjustment: computedTarget - (currentBalance + importedNet),
  };
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

export function parseBankCsvRaw(raw: string): BankCsvRow[] {
  const cleaned = raw.replace(/^\uFEFF/, '').trim();
  if (!cleaned) throw new Error('Fichier vide');

  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error('CSV vide ou incomplet');

  const headers = splitCsvLine(lines[0]);
  const rows: BankCsvRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    if (cells.length < headers.length) continue;
    const get = (name: string) => cells[headers.findIndex((h) => normalizeKey(h) === normalizeKey(name))] ?? '';
    rows.push({
      accountingDate: get('Date de comptabilisation'),
      simplifiedLabel: get('Libelle simplifie'),
      operationLabel: get('Libelle operation'),
      reference: get('Reference'),
      additionalInfo: get('Informations complementaires'),
      operationType: get('Type operation'),
      category: get('Categorie'),
      subCategory: get('Sous categorie'),
      debit: parseFrenchAmount(get('Debit')),
      credit: parseFrenchAmount(get('Credit')),
      operationDate: get('Date operation'),
      valueDate: get('Date de valeur'),
      pointage: get('Pointage operation'),
    });
  }

  return rows;
}

function mapTransactionType(row: BankCsvRow): TransactionType {
  const operationType = normalizeKey(row.operationType);
  const category = normalizeKey(row.category);
  const subCategory = normalizeKey(row.subCategory);

  if (category.includes('transaction exclue') || subCategory.includes('virement interne') || operationType.includes('virement interne')) {
    return 'transfer';
  }

  if (row.credit > 0) return 'income';
  if (row.debit > 0) return 'expense';
  if (operationType.includes('virement recu') || category.includes('revenus') || category.includes('rentrees')) return 'income';
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

export function summarizeBankRows(rows: BankCsvRow[]) {
  const typeBreakdown: Record<TransactionType, number> = { income: 0, expense: 0, transfer: 0 };
  const categoryAgg = new Map<TransactionCategory, { count: number; amount: number }>();
  const normalizedRows = rows.map((row) => {
    const type = mapTransactionType(row);
    const category = mapCategory(row, type);
    const amount = row.credit > 0 ? row.credit : row.debit > 0 ? row.debit : 0;
    typeBreakdown[type] += 1;
    const entry = categoryAgg.get(category) ?? { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += amount;
    categoryAgg.set(category, entry);
    return { row, type, category, amount };
  });

  return {
    typeBreakdown,
    categoryBreakdown: [...categoryAgg.entries()]
      .map(([category, value]) => ({ category, count: value.count, amount: value.amount }))
      .sort((a, b) => b.count - a.count || b.amount - a.amount),
    normalizedRows,
  };
}
