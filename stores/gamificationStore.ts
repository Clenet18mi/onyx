// ============================================
// ONYX - Gamification Store
// Badges, streaks, niveaux, challenges
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { generateId } from '@/utils/crypto';
import type { Achievement, StreakData, LevelData, MonthlyChallenge } from '@/types/gamification';
import { startOfMonth, endOfMonth, parseISO, differenceInDays, format } from 'date-fns';
import { useTransactionStore } from './transactionStore';

const XP_PER_LEVEL_BASE = 100;
const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'welcome', name: 'Bienvenue', description: 'Première transaction', icon: '👋', xpReward: 10 },
  { id: 'organised', name: 'Organisé', description: 'Premier compte créé', icon: '📁', xpReward: 20 },
  { id: 'goal_setter', name: 'Objectif', description: 'Premier objectif créé', icon: '🎯', xpReward: 30 },
  { id: 'budgeter', name: 'Budgétaire', description: 'Premier budget défini', icon: '📊', xpReward: 25 },
  { id: 'assidu', name: 'Assidu', description: '7 jours consécutifs avec transaction', icon: '🔥', xpReward: 70 },
  { id: 'marathon', name: 'Marathonien', description: '30 jours consécutifs', icon: '🏃', xpReward: 150 },
  { id: 'saver', name: 'Épargneur', description: 'Objectif atteint', icon: '💰', xpReward: 100 },
  { id: 'beginner', name: 'Débutant', description: '10 transactions', icon: '⭐', xpReward: 20 },
  { id: 'intermediate', name: 'Intermédiaire', description: '100 transactions', icon: '🌟🌟', xpReward: 50 },
  { id: 'expert', name: 'Expert', description: '500 transactions', icon: '🌟🌟🌟', xpReward: 100 },
];

function xpForLevel(level: number): number {
  return XP_PER_LEVEL_BASE + level * 50;
}

interface GamificationState {
  achievements: Achievement[];
  streak: StreakData;
  levelData: LevelData;
  hasHydrated: boolean;
  addXp: (amount: number, source?: string) => void;
  unlockAchievement: (achievementId: string) => void;
  updateStreak: () => void;
  getAchievement: (id: string) => Achievement | undefined;
  getMonthlyChallenges: () => MonthlyChallenge[];
}

const defaultStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
};

const defaultLevel: LevelData = {
  level: 1,
  currentXp: 0,
  xpForNextLevel: XP_PER_LEVEL_BASE,
  totalXp: 0,
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      achievements: ACHIEVEMENT_DEFS.map((a) => ({ ...a, unlockedAt: null })),
      streak: defaultStreak,
      levelData: defaultLevel,
      hasHydrated: false,

      addXp: (amount, _source) => {
        set((state) => {
          let { level, currentXp, totalXp } = state.levelData;
          totalXp += amount;
          currentXp += amount;
          let xpForNext = xpForLevel(level);
          while (currentXp >= xpForNext) {
            currentXp -= xpForNext;
            level += 1;
            xpForNext = xpForLevel(level);
          }
          return {
            levelData: {
              level,
              currentXp,
              xpForNextLevel: xpForNext,
              totalXp,
            },
          };
        });
      },

      unlockAchievement: (achievementId) => {
        const ach = get().achievements.find((a) => a.id === achievementId);
        if (!ach || ach.unlockedAt) return;
        const now = new Date().toISOString();
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === achievementId ? { ...a, unlockedAt: now } : a
          ),
        }));
        get().addXp(ach.xpReward);
      },

      updateStreak: () => {
        const transactions = useTransactionStore.getState().transactions;
        const today = format(new Date(), 'yyyy-MM-dd');
        const dates = [...new Set(transactions.map((t) => format(parseISO(t.date), 'yyyy-MM-dd')))].sort();

        let current = 0;
        let longest = get().streak.longestStreak;
        const lastDate = dates[dates.length - 1];
        if (!lastDate) {
          set((state) => ({ streak: { ...state.streak, currentStreak: 0 } }));
          return;
        }

        const last = parseISO(lastDate);
        const todayDate = new Date();
        if (differenceInDays(todayDate, last) > 1) {
          set((state) => ({ streak: { ...state.streak, currentStreak: 0, lastActivityDate: lastDate } }));
          return;
        }

        for (let i = dates.length - 1; i >= 0; i--) {
          const d = parseISO(dates[i]);
          const prev = i > 0 ? parseISO(dates[i - 1]) : null;
          if (prev && differenceInDays(d, prev) !== 1) break;
          current++;
        }
        if (current > longest) longest = current;
        set((state) => ({
          streak: {
            currentStreak: current,
            longestStreak: longest,
            lastActivityDate: lastDate,
          },
        }));
      },

      getAchievement: (id) => get().achievements.find((a) => a.id === id),

      getMonthlyChallenges: () => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const txStore = useTransactionStore.getState();
        const transactions = txStore.transactions.filter((t) => {
          const d = parseISO(t.date);
          return d >= monthStart && d <= monthEnd;
        });
        const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const saved = income - expenses;

        return [
          {
            id: 'no_resto_week',
            name: 'Pas de resto 1 semaine',
            description: 'Zéro dépense restaurant pendant 7 jours',
            target: '7 jours',
            progress: 0,
            completed: false,
            xpReward: 50,
          },
          {
            id: 'save_100',
            name: 'Économiser 100€',
            description: 'Épargner au moins 100€ ce mois',
            target: 100,
            progress: Math.min(saved, 100),
            completed: saved >= 100,
            xpReward: 80,
          },
          {
            id: 'under_budget',
            name: 'Sous budget',
            description: 'Rester sous budget partout',
            target: 1,
            progress: 0,
            completed: false,
            xpReward: 100,
          },
        ];
      },
    }),
    {
      name: 'onyx-gamification',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
