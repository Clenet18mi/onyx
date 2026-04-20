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

export function suggestBankImportAccountId(accounts: Array<{ id: string; type: string; bankLabel?: string; bank?: string; isArchived?: boolean }>, lastBankImportAccountId?: string | null): string {
  const activeAccounts = accounts.filter((account) => !account.isArchived);
  if (!activeAccounts.length) return '';
  if (lastBankImportAccountId && activeAccounts.some((account) => account.id === lastBankImportAccountId)) return lastBankImportAccountId;
  return activeAccounts.find((account) => account.type === 'checking' && (account.bankLabel || account.bank))?.id
    ?? activeAccounts.find((account) => account.type === 'checking')?.id
    ?? activeAccounts.find((account) => account.bankLabel || account.bank)?.id
    ?? activeAccounts[0].id;
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
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalizedHeaders = headers.map((header) => normalizeKey(header));
  for (const alias of aliases) {
    const index = normalizedHeaders.findIndex((header) => header === normalizeKey(alias));
    if (index >= 0) return index;
  }
  return -1;
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
  const text = normalizeText(raw)
    .replace(/\u00A0/g, ' ')
    .replace(/\+/g, '')
    .replace(/€/g, '')
    .replace(/\(/g, '-');

  if (!text) return 0;

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');

  let normalized = text.replace(/\s/g, '').replace(/[^0-9,.-]/g, '');

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = normalized.replace(new RegExp(`\\${thousandSeparator}`, 'g'), '');
    normalized = normalized.replace(decimalSeparator, '.');
  } else if (hasComma) {
    normalized = normalized.replace(/,/g, '.');
  } else if (hasDot) {
    const dotMatches = normalized.match(/\./g)?.length ?? 0;
    if (dotMatches > 1) {
      normalized = normalized.replace(/\./g, '');
    }
  }

  normalized = normalized.replace(/(?!^)-/g, '');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

function parseCsvDate(raw: string | undefined): string {
  const value = normalizeText(raw);
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return value;

  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).toISOString();
}

export function parseBankCsvRaw(raw: string): BankCsvRow[] {
  const cleaned = raw.replace(/^\uFEFF/, '').trim();
  if (!cleaned) throw new Error('Fichier vide');

  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error('CSV vide ou incomplet');

  const headers = splitCsvLine(lines[0]);
  const accountingDateIdx = findColumnIndex(headers, ['Date de comptabilisation', 'Date comptabilisation', 'Date compta', 'Comptabilisation']);
  const simplifiedLabelIdx = findColumnIndex(headers, ['Libelle simplifie', 'Libellé simplifié', 'Libellé simplifie', 'Libelle simplifié']);
  const operationLabelIdx = findColumnIndex(headers, ['Libelle operation', 'Libellé opération', 'Libelle opération']);
  const referenceIdx = findColumnIndex(headers, ['Reference', 'Référence']);
  const additionalInfoIdx = findColumnIndex(headers, ['Informations complementaires', 'Informations complémentaires', 'Complementaires']);
  const operationTypeIdx = findColumnIndex(headers, ['Type operation', 'Type opération', 'Type']);
  const categoryIdx = findColumnIndex(headers, ['Categorie', 'Catégorie']);
  const subCategoryIdx = findColumnIndex(headers, ['Sous categorie', 'Sous-categorie', 'Sous catégorie']);
  const debitIdx = findColumnIndex(headers, ['Debit', 'Débit']);
  const creditIdx = findColumnIndex(headers, ['Credit', 'Crédit']);
  const operationDateIdx = findColumnIndex(headers, ['Date operation', 'Date opération', 'Date']);
  const valueDateIdx = findColumnIndex(headers, ['Date de valeur', 'Valeur']);
  const pointageIdx = findColumnIndex(headers, ['Pointage operation', 'Pointage opération', 'Pointage']);
  const rows: BankCsvRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    if (cells.length < headers.length) continue;
    rows.push({
      accountingDate: parseCsvDate(cells[accountingDateIdx] ?? ''),
      simplifiedLabel: cells[simplifiedLabelIdx] ?? '',
      operationLabel: cells[operationLabelIdx] ?? '',
      reference: cells[referenceIdx] ?? '',
      additionalInfo: cells[additionalInfoIdx] ?? '',
      operationType: cells[operationTypeIdx] ?? '',
      category: cells[categoryIdx] ?? '',
      subCategory: cells[subCategoryIdx] ?? '',
      debit: parseFrenchAmount(cells[debitIdx] ?? ''),
      credit: parseFrenchAmount(cells[creditIdx] ?? ''),
      operationDate: parseCsvDate(cells[operationDateIdx] ?? ''),
      valueDate: parseCsvDate(cells[valueDateIdx] ?? ''),
      pointage: cells[pointageIdx] ?? '',
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
  if (row.debit < 0 && operationType.includes('virement')) return 'transfer';
  if (row.debit > 0) return 'expense';
  if (operationType.includes('virement recu') || category.includes('revenus') || category.includes('rentrees')) return 'income';
  if (operationType.includes('virement')) return 'transfer';
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
  const typeAmountBreakdown: Record<TransactionType, number> = { income: 0, expense: 0, transfer: 0 };
  const categoryAgg = new Map<TransactionCategory, { count: number; amount: number }>();
  const normalizedRows = rows.map((row) => {
    const type = mapTransactionType(row);
    const category = mapCategory(row, type);
    const amount = row.credit > 0 ? row.credit : row.debit < 0 ? Math.abs(row.debit) : row.debit > 0 ? row.debit : 0;
    typeBreakdown[type] += 1;
    typeAmountBreakdown[type] += amount;
    const entry = categoryAgg.get(category) ?? { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += amount;
    categoryAgg.set(category, entry);
    return { row, type, category, amount };
  });

  return {
    typeBreakdown,
    typeAmountBreakdown,
    categoryBreakdown: [...categoryAgg.entries()]
      .map(([category, value]) => ({ category, count: value.count, amount: value.amount }))
      .sort((a, b) => b.count - a.count || b.amount - a.amount),
    normalizedRows,
  };
}
