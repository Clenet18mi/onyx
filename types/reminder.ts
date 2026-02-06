// ============================================
// ONYX - Rappels personnalisés
// ============================================

export type ReminderRecurrence = 'once' | 'daily' | 'weekly' | 'monthly';

export interface Reminder {
  id: string;
  title: string;
  scheduledAt: string; // ISO date-time
  recurrence: ReminderRecurrence;
  /** Jour du mois (1-31) si monthly, jour de la semaine (0-6) si weekly */
  recurrenceValue?: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
