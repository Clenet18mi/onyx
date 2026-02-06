// ============================================
// ONYX - Config Store
// Configuration personnalisable de l'application
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, persistNow } from '@/utils/storage';
import { generateId } from '@/utils/crypto';

// ============================================
// Types
// ============================================

export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  isHidden: boolean;
  order: number;
}

export interface CustomAccountType {
  id: string;
  label: string;
  icon: string;
  defaultColor: string;
  isDefault: boolean;
  isHidden: boolean;
  order: number;
}

export interface QuickExpenseTemplate {
  id: string;
  name: string;
  categoryId: string;
  defaultAmount?: number;
  icon: string;
  color: string;
  isActive: boolean;
  order: number;
}

export interface UserProfile {
  name: string;
  currency: string;
  locale: string;
  salaryDay?: number; // Jour du mois où le salaire arrive
  defaultSalaryAmount?: number;
  defaultSalaryAccountId?: string;
}

// ============================================
// Default Data
// ============================================

const DEFAULT_CATEGORIES: CustomCategory[] = [
  // Revenus
  { id: 'salary', label: 'Salaire', icon: 'Briefcase', color: '#10B981', type: 'income', isDefault: true, isHidden: false, order: 0 },
  { id: 'freelance', label: 'Freelance', icon: 'Laptop', color: '#06B6D4', type: 'income', isDefault: true, isHidden: false, order: 1 },
  { id: 'investment', label: 'Investissement', icon: 'TrendingUp', color: '#8B5CF6', type: 'both', isDefault: true, isHidden: false, order: 2 },
  { id: 'gift', label: 'Cadeau', icon: 'Gift', color: '#EC4899', type: 'both', isDefault: true, isHidden: false, order: 3 },
  { id: 'refund', label: 'Remboursement', icon: 'RotateCcw', color: '#14B8A6', type: 'income', isDefault: true, isHidden: false, order: 4 },
  // Dépenses
  { id: 'food', label: 'Alimentation', icon: 'UtensilsCrossed', color: '#F97316', type: 'expense', isDefault: true, isHidden: false, order: 5 },
  { id: 'transport', label: 'Transport', icon: 'Car', color: '#3B82F6', type: 'expense', isDefault: true, isHidden: false, order: 6 },
  { id: 'housing', label: 'Logement', icon: 'Home', color: '#A855F7', type: 'expense', isDefault: true, isHidden: false, order: 7 },
  { id: 'utilities', label: 'Factures', icon: 'Zap', color: '#EAB308', type: 'expense', isDefault: true, isHidden: false, order: 8 },
  { id: 'entertainment', label: 'Loisirs', icon: 'Gamepad2', color: '#F43F5E', type: 'expense', isDefault: true, isHidden: false, order: 9 },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#E879F9', type: 'expense', isDefault: true, isHidden: false, order: 10 },
  { id: 'health', label: 'Santé', icon: 'Heart', color: '#EF4444', type: 'expense', isDefault: true, isHidden: false, order: 11 },
  { id: 'education', label: 'Éducation', icon: 'GraduationCap', color: '#6366F1', type: 'expense', isDefault: true, isHidden: false, order: 12 },
  { id: 'travel', label: 'Voyage', icon: 'Plane', color: '#0EA5E9', type: 'expense', isDefault: true, isHidden: false, order: 13 },
  { id: 'subscriptions', label: 'Abonnements', icon: 'CreditCard', color: '#8B5CF6', type: 'expense', isDefault: true, isHidden: false, order: 14 },
  { id: 'insurance', label: 'Assurance', icon: 'Shield', color: '#64748B', type: 'expense', isDefault: true, isHidden: false, order: 15 },
  { id: 'taxes', label: 'Impôts', icon: 'FileText', color: '#78716C', type: 'expense', isDefault: true, isHidden: false, order: 16 },
  { id: 'savings', label: 'Épargne', icon: 'PiggyBank', color: '#10B981', type: 'both', isDefault: true, isHidden: false, order: 17 },
  { id: 'transfer', label: 'Virement', icon: 'ArrowLeftRight', color: '#6366F1', type: 'both', isDefault: true, isHidden: false, order: 18 },
  { id: 'other', label: 'Autre', icon: 'MoreHorizontal', color: '#71717A', type: 'both', isDefault: true, isHidden: false, order: 19 },
];

const DEFAULT_ACCOUNT_TYPES: CustomAccountType[] = [
  { id: 'checking', label: 'Compte Courant', icon: 'Wallet', defaultColor: '#3B82F6', isDefault: true, isHidden: false, order: 0 },
  { id: 'savings', label: 'Épargne', icon: 'PiggyBank', defaultColor: '#10B981', isDefault: true, isHidden: false, order: 1 },
  { id: 'cash', label: 'Espèces', icon: 'Banknote', defaultColor: '#F59E0B', isDefault: true, isHidden: false, order: 2 },
  { id: 'investment', label: 'Investissement', icon: 'TrendingUp', defaultColor: '#8B5CF6', isDefault: true, isHidden: false, order: 3 },
  { id: 'crypto', label: 'Crypto', icon: 'Bitcoin', defaultColor: '#F97316', isDefault: true, isHidden: false, order: 4 },
];

const DEFAULT_QUICK_EXPENSES: QuickExpenseTemplate[] = [
  { id: '1', name: 'Café', categoryId: 'food', defaultAmount: 3.50, icon: 'Coffee', color: '#F97316', isActive: true, order: 0 },
  { id: '2', name: 'Déjeuner', categoryId: 'food', defaultAmount: 12, icon: 'UtensilsCrossed', color: '#F97316', isActive: true, order: 1 },
  { id: '3', name: 'Transport', categoryId: 'transport', defaultAmount: 2.10, icon: 'Train', color: '#3B82F6', isActive: true, order: 2 },
  { id: '4', name: 'Courses', categoryId: 'food', icon: 'ShoppingCart', color: '#10B981', isActive: true, order: 3 },
  { id: '5', name: 'Essence', categoryId: 'transport', icon: 'Fuel', color: '#EF4444', isActive: true, order: 4 },
  { id: '6', name: 'Loisir', categoryId: 'entertainment', icon: 'Ticket', color: '#EC4899', isActive: true, order: 5 },
];

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  currency: 'EUR',
  locale: 'fr-FR',
  salaryDay: undefined,
  defaultSalaryAmount: undefined,
  defaultSalaryAccountId: undefined,
};

// ============================================
// Store
// ============================================

interface ConfigState {
  // Data
  categories: CustomCategory[];
  accountTypes: CustomAccountType[];
  quickExpenses: QuickExpenseTemplate[];
  profile: UserProfile;
  hasHydrated: boolean;
  
  // Category actions
  addCategory: (category: Omit<CustomCategory, 'id' | 'isDefault' | 'order'>) => string;
  updateCategory: (id: string, updates: Partial<CustomCategory>) => void;
  deleteCategory: (id: string) => void;
  toggleCategoryVisibility: (id: string) => void;
  reorderCategories: (categories: CustomCategory[]) => void;
  resetCategoriesToDefault: () => void;
  
  // Account type actions
  addAccountType: (accountType: Omit<CustomAccountType, 'id' | 'isDefault' | 'order'>) => string;
  updateAccountType: (id: string, updates: Partial<CustomAccountType>) => void;
  deleteAccountType: (id: string) => void;
  toggleAccountTypeVisibility: (id: string) => void;
  resetAccountTypesToDefault: () => void;
  
  // Quick expense actions
  addQuickExpense: (template: Omit<QuickExpenseTemplate, 'id' | 'order'>) => string;
  updateQuickExpense: (id: string, updates: Partial<QuickExpenseTemplate>) => void;
  deleteQuickExpense: (id: string) => void;
  toggleQuickExpenseActive: (id: string) => void;
  reorderQuickExpenses: (templates: QuickExpenseTemplate[]) => void;
  resetQuickExpensesToDefault: () => void;
  
  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => void;
  
  // Getters
  getVisibleCategories: (type?: 'income' | 'expense' | 'both') => CustomCategory[];
  getVisibleAccountTypes: () => CustomAccountType[];
  getActiveQuickExpenses: () => QuickExpenseTemplate[];
  getCategoryById: (id: string) => CustomCategory | undefined;
  getAccountTypeById: (id: string) => CustomAccountType | undefined;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      // Initial data
      categories: DEFAULT_CATEGORIES,
      accountTypes: DEFAULT_ACCOUNT_TYPES,
      quickExpenses: DEFAULT_QUICK_EXPENSES,
      profile: DEFAULT_PROFILE,
      hasHydrated: false,

      // ============================================
      // Category Actions
      // ============================================
      
      addCategory: (categoryData) => {
        const id = generateId();
        const maxOrder = Math.max(...get().categories.map(c => c.order), -1);
        
        const newCategory: CustomCategory = {
          ...categoryData,
          id,
          isDefault: false,
          order: maxOrder + 1,
        };
        
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
        persistNow();
        return id;
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat
          ),
        }));
        persistNow();
      },

      deleteCategory: (id) => {
        const category = get().categories.find(c => c.id === id);
        if (category?.isDefault) return; // Cannot delete default categories
        
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        }));
        persistNow();
      },

      toggleCategoryVisibility: (id) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, isHidden: !cat.isHidden } : cat
          ),
        }));
        persistNow();
      },

      reorderCategories: (categories) => {
        set({ categories });
        persistNow();
      },

      resetCategoriesToDefault: () => {
        set({ categories: DEFAULT_CATEGORIES });
        persistNow();
      },

      // ============================================
      // Account Type Actions
      // ============================================
      
      addAccountType: (accountTypeData) => {
        const id = generateId();
        const maxOrder = Math.max(...get().accountTypes.map(a => a.order), -1);
        
        const newAccountType: CustomAccountType = {
          ...accountTypeData,
          id,
          isDefault: false,
          order: maxOrder + 1,
        };
        
        set((state) => ({
          accountTypes: [...state.accountTypes, newAccountType],
        }));
        persistNow();
        return id;
      },

      updateAccountType: (id, updates) => {
        set((state) => ({
          accountTypes: state.accountTypes.map((type) =>
            type.id === id ? { ...type, ...updates } : type
          ),
        }));
        persistNow();
      },

      deleteAccountType: (id) => {
        const accountType = get().accountTypes.find(a => a.id === id);
        if (accountType?.isDefault) return;
        
        set((state) => ({
          accountTypes: state.accountTypes.filter((type) => type.id !== id),
        }));
        persistNow();
      },

      toggleAccountTypeVisibility: (id) => {
        set((state) => ({
          accountTypes: state.accountTypes.map((type) =>
            type.id === id ? { ...type, isHidden: !type.isHidden } : type
          ),
        }));
        persistNow();
      },

      resetAccountTypesToDefault: () => {
        set({ accountTypes: DEFAULT_ACCOUNT_TYPES });
        persistNow();
      },

      // ============================================
      // Quick Expense Actions
      // ============================================
      
      addQuickExpense: (templateData) => {
        const id = generateId();
        const maxOrder = Math.max(...get().quickExpenses.map(q => q.order), -1);
        
        const newTemplate: QuickExpenseTemplate = {
          ...templateData,
          id,
          order: maxOrder + 1,
        };
        
        set((state) => ({
          quickExpenses: [...state.quickExpenses, newTemplate],
        }));
        persistNow();
        return id;
      },

      updateQuickExpense: (id, updates) => {
        set((state) => ({
          quickExpenses: state.quickExpenses.map((template) =>
            template.id === id ? { ...template, ...updates } : template
          ),
        }));
        persistNow();
      },

      deleteQuickExpense: (id) => {
        set((state) => ({
          quickExpenses: state.quickExpenses.filter((template) => template.id !== id),
        }));
        persistNow();
      },

      toggleQuickExpenseActive: (id) => {
        set((state) => ({
          quickExpenses: state.quickExpenses.map((template) =>
            template.id === id ? { ...template, isActive: !template.isActive } : template
          ),
        }));
        persistNow();
      },

      reorderQuickExpenses: (templates) => {
        set({ quickExpenses: templates });
        persistNow();
      },

      resetQuickExpensesToDefault: () => {
        set({ quickExpenses: DEFAULT_QUICK_EXPENSES });
        persistNow();
      },

      // ============================================
      // Profile Actions
      // ============================================
      
      updateProfile: (updates) => {
        set((state) => ({
          profile: { ...state.profile, ...updates },
        }));
        persistNow();
      },

      // ============================================
      // Getters
      // ============================================
      
      getVisibleCategories: (type) => {
        return get()
          .categories
          .filter((cat) => !cat.isHidden && (!type || cat.type === type || cat.type === 'both'))
          .sort((a, b) => a.order - b.order);
      },

      getVisibleAccountTypes: () => {
        return get()
          .accountTypes
          .filter((type) => !type.isHidden)
          .sort((a, b) => a.order - b.order);
      },

      getActiveQuickExpenses: () => {
        return get()
          .quickExpenses
          .filter((template) => template.isActive)
          .sort((a, b) => a.order - b.order);
      },

      getCategoryById: (id) => {
        return get().categories.find((cat) => cat.id === id);
      },

      getAccountTypeById: (id) => {
        return get().accountTypes.find((type) => type.id === id);
      },
    }),
    {
      name: 'onyx-config',
      storage: createJSONStorage(() => zustandStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
        }
      },
    }
  )
);
