// ============================================
// ONYX - Merchant Store
// Analyse des dépenses par commerçant (extrait des notes/description)
// ============================================

import { create } from 'zustand';
import { useTransactionStore } from './transactionStore';
import { startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from 'date-fns';

export interface MerchantStats {
  /** Nom normalisé du commerçant */
  name: string;
  /** Total dépensé (toutes périodes) */
  total: number;
  /** Nombre de transactions */
  count: number;
  /** Montant moyen par visite */
  average: number;
  /** Dernière date d'achat (ISO) */
  lastDate: string;
  /** Total ce mois */
  thisMonth: number;
  /** Total mois dernier */
  lastMonth: number;
  /** Variation % ce mois vs dernier */
  variationPercent: number;
}

/** Extrait un nom de commerçant depuis description (premier mot ou phrase avant chiffres) */
function extractMerchantName(description: string): string {
  const trimmed = (description || '').trim();
  if (!trimmed) return 'Sans nom';
  // Enlever les motifs type "CB 1234" ou "PAIEMENT"
  let name = trimmed
    .replace(/\s*(CB|PAIEMENT|CARTE)\s*\d*/gi, '')
    .replace(/\s+\d{4,}$/, '') // chiffres en fin
    .trim();
  // Prendre les premiers mots (max 3) pour le nom
  const words = name.split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return trimmed.slice(0, 20);
  return words.slice(0, 3).join(' ');
}

/** Normalise pour regrouper (minuscules, sans accents pour comparaison) */
function normalizeForGrouping(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

/** Dictionnaire d'alias utilisateur (commerçant affiché -> clé de regroupement) */
const DEFAULT_ALIASES: Record<string, string> = {
  mcdo: "mcdonald's",
  'carrefour market': 'carrefour',
  'carrefour city': 'carrefour',
  leclerc: 'e.leclerc',
  auchan: 'auchan',
};

function getMerchantKey(displayName: string, aliases: Record<string, string>): string {
  const normalized = normalizeForGrouping(displayName);
  return aliases[normalized] ?? normalized;
}

interface MerchantState {
  /** Alias personnalisés (normalizedKey -> displayName) */
  aliases: Record<string, string>;
  setAlias: (normalizedKey: string, displayName: string) => void;
  /** Stats par commerçant pour la période demandée */
  getMerchantsStats: (options?: { thisMonthOnly?: boolean }) => MerchantStats[];
  /** Top N commerçants du mois */
  getTopMerchants: (n: number) => MerchantStats[];
}

export const useMerchantStore = create<MerchantState>((set, get) => ({
  aliases: {},

  setAlias: (normalizedKey, displayName) => {
    set((state) => ({
      aliases: { ...state.aliases, [normalizedKey]: displayName },
    }));
  },

  getMerchantsStats: (options = {}) => {
    const transactions = useTransactionStore.getState().transactions;
    const expenses = transactions.filter((t) => t.type === 'expense' && t.description);
    const aliases = { ...DEFAULT_ALIASES, ...get().aliases };

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const byKey: Record<
      string,
      { displayName: string; amounts: number[]; dates: string[]; thisMonth: number; lastMonth: number }
    > = {};

    expenses.forEach((t) => {
      const displayName = extractMerchantName(t.description!);
      const key = getMerchantKey(displayName, aliases);
      if (!byKey[key]) {
        byKey[key] = {
          displayName: aliases[key] ?? displayName,
          amounts: [],
          dates: [],
          thisMonth: 0,
          lastMonth: 0,
        };
      }
      byKey[key].amounts.push(t.amount);
      byKey[key].dates.push(t.date);
      const d = parseISO(t.date);
      if (isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd })) {
        byKey[key].thisMonth += t.amount;
      }
      if (isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd })) {
        byKey[key].lastMonth += t.amount;
      }
    });

    const stats: MerchantStats[] = Object.entries(byKey).map(([key, data]) => {
      const total = data.amounts.reduce((a, b) => a + b, 0);
      const count = data.amounts.length;
      const lastDate = data.dates.sort()[data.dates.length - 1] ?? '';
      const variation =
        data.lastMonth === 0
          ? (data.thisMonth > 0 ? 100 : 0)
          : ((data.thisMonth - data.lastMonth) / data.lastMonth) * 100;

      return {
        name: data.displayName,
        total,
        count,
        average: count > 0 ? total / count : 0,
        lastDate,
        thisMonth: data.thisMonth,
        lastMonth: data.lastMonth,
        variationPercent: variation,
      };
    });

    const sorted = stats.sort((a, b) => b.thisMonth - a.thisMonth);
    return options.thisMonthOnly ? sorted.filter((s) => s.thisMonth > 0) : sorted;
  },

  getTopMerchants: (n) => {
    return get().getMerchantsStats({ thisMonthOnly: true }).slice(0, n);
  },
}));
