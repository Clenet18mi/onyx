// ============================================
// ONYX - Types & Interfaces
// Application de finances personnelles
// ============================================

// ============================================
// COMPTES (Accounts)
// ============================================
export type AccountType = 'checking' | 'savings' | 'cash' | 'investment' | 'crypto';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  currency: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TRANSACTIONS
// ============================================
export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionCategory = 
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'gift'
  | 'refund'
  | 'food'
  | 'transport'
  | 'housing'
  | 'utilities'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'education'
  | 'travel'
  | 'subscriptions'
  | 'insurance'
  | 'taxes'
  | 'savings'
  | 'transfer'
  | 'other';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string;
  // Pour les transferts
  toAccountId?: string;
  // Liaison avec abonnements/goals
  subscriptionId?: string;
  goalId?: string;
  /** URIs des photos de tickets (ex. file:// ou base64) */
  photoUris?: string[];
  /** URI ou base64 de la note vocale */
  voiceNoteUri?: string;
  createdAt: string;
}

// ============================================
// BUDGETS
// ============================================
export interface Budget {
  id: string;
  category: TransactionCategory;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  color: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PROJETS D'ÉPARGNE (Goals)
// ============================================
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  accountId: string; // Compte lié pour l'épargne
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ABONNEMENTS RÉCURRENTS
// ============================================
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  category: TransactionCategory;
  accountId: string;
  frequency: RecurrenceFrequency;
  nextBillingDate: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SÉCURITÉ / AUTHENTIFICATION
// ============================================
export interface AuthState {
  isSetup: boolean;
  pinHash: string | null;
  pinLength: 4 | 6;
  biometricEnabled: boolean;
  lastUnlocked: string | null;
}

// ============================================
// PARAMÈTRES / SETTINGS
// ============================================
export interface Settings {
  currency: string;
  locale: string;
  theme: 'dark' | 'light' | 'system';
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
  /** Alerte doublons avant ajout transaction */
  duplicateAlertEnabled?: boolean;
  /** Signatures "ne plus alerter" (type|catégorie|tranche montant) */
  ignoredDuplicateSignatures?: string[];
}

// ============================================
// CONSTANTES CATÉGORIES
// ============================================
export interface CategoryInfo {
  id: TransactionCategory;
  label: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}

export const CATEGORIES: CategoryInfo[] = [
  // Revenus
  { id: 'salary', label: 'Salaire', icon: 'Briefcase', color: '#10B981', type: 'income' },
  { id: 'freelance', label: 'Freelance', icon: 'Laptop', color: '#06B6D4', type: 'income' },
  { id: 'investment', label: 'Investissement', icon: 'TrendingUp', color: '#8B5CF6', type: 'both' },
  { id: 'gift', label: 'Cadeau', icon: 'Gift', color: '#EC4899', type: 'both' },
  { id: 'refund', label: 'Remboursement', icon: 'RotateCcw', color: '#14B8A6', type: 'income' },
  
  // Dépenses
  { id: 'food', label: 'Alimentation', icon: 'UtensilsCrossed', color: '#F97316', type: 'expense' },
  { id: 'transport', label: 'Transport', icon: 'Car', color: '#3B82F6', type: 'expense' },
  { id: 'housing', label: 'Logement', icon: 'Home', color: '#A855F7', type: 'expense' },
  { id: 'utilities', label: 'Factures', icon: 'Zap', color: '#EAB308', type: 'expense' },
  { id: 'entertainment', label: 'Loisirs', icon: 'Gamepad2', color: '#F43F5E', type: 'expense' },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#E879F9', type: 'expense' },
  { id: 'health', label: 'Santé', icon: 'Heart', color: '#EF4444', type: 'expense' },
  { id: 'education', label: 'Éducation', icon: 'GraduationCap', color: '#6366F1', type: 'expense' },
  { id: 'travel', label: 'Voyage', icon: 'Plane', color: '#0EA5E9', type: 'expense' },
  { id: 'subscriptions', label: 'Abonnements', icon: 'CreditCard', color: '#8B5CF6', type: 'expense' },
  { id: 'insurance', label: 'Assurance', icon: 'Shield', color: '#64748B', type: 'expense' },
  { id: 'taxes', label: 'Impôts', icon: 'FileText', color: '#78716C', type: 'expense' },
  { id: 'savings', label: 'Épargne', icon: 'PiggyBank', color: '#10B981', type: 'both' },
  { id: 'transfer', label: 'Virement', icon: 'ArrowLeftRight', color: '#6366F1', type: 'both' },
  { id: 'other', label: 'Autre', icon: 'MoreHorizontal', color: '#71717A', type: 'both' },
];

// ============================================
// CONSTANTES TYPES DE COMPTES
// ============================================
export interface AccountTypeInfo {
  id: AccountType;
  label: string;
  icon: string;
  defaultColor: string;
}

export const ACCOUNT_TYPES: AccountTypeInfo[] = [
  { id: 'checking', label: 'Compte Courant', icon: 'Wallet', defaultColor: '#3B82F6' },
  { id: 'savings', label: 'Épargne', icon: 'PiggyBank', defaultColor: '#10B981' },
  { id: 'cash', label: 'Espèces', icon: 'Banknote', defaultColor: '#F59E0B' },
  { id: 'investment', label: 'Investissement', icon: 'TrendingUp', defaultColor: '#8B5CF6' },
  { id: 'crypto', label: 'Crypto', icon: 'Bitcoin', defaultColor: '#F97316' },
];

// ============================================
// COULEURS DISPONIBLES
// ============================================
export const AVAILABLE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#A855F7', // Purple
];
