// ============================================
// ONYX - Stores Index
// Export de tous les stores Zustand
// ============================================

export { useAuthStore } from './authStore';
export { useAccountStore } from './accountStore';
export { useTransactionStore } from './transactionStore';
export { useBudgetStore } from './budgetStore';
export { useGoalStore } from './goalStore';
export { useSubscriptionStore } from './subscriptionStore';
export { useSettingsStore } from './settingsStore';
export { useConfigStore } from './configStore';
export { useInsightsStore } from './insightsStore';
export { useMerchantStore } from './merchantStore';
export { useFilterStore } from './filterStore';
export { useTemplateStore } from './templateStore';
export { useAutomationStore } from './automationStore';
export { useGamificationStore } from './gamificationStore';
export { useSplitStore } from './splitStore';
export { useWishlistStore } from './wishlistStore';
export { useReminderStore } from './reminderStore';
export type { 
  CustomCategory, 
  CustomAccountType, 
  QuickExpenseTemplate,
  UserProfile,
} from './configStore';
