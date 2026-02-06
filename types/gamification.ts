// ============================================
// ONYX - Gamification (badges, streaks, niveaux)
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji ou nom
  unlockedAt: string | null;
  xpReward: number;
}

export interface StreakData {
  currentStreak: number; // jours consécutifs avec au moins 1 transaction
  longestStreak: number;
  lastActivityDate: string | null; // ISO
}

export interface LevelData {
  level: number;
  currentXp: number;
  xpForNextLevel: number; // total XP pour atteindre level+1
  totalXp: number;
}

export interface MonthlyChallenge {
  id: string;
  name: string;
  description: string;
  target: number | string; // valeur ou description
  progress: number;
  completed: boolean;
  completedAt?: string;
  xpReward: number;
}
