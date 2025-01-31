// ============================================
// ONYX - Goal Detail Screen
// Détail d'un objectif d'épargne
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useGoalStore } from '@/stores';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const goal = useGoalStore((state) => state.getGoal(id || ''));

  if (!goal) {
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1 items-center justify-center"
      >
        <Text className="text-white text-lg">Objectif non trouvé</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 bg-accent-primary rounded-xl"
        >
          <Text className="text-white font-medium">Retour</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const Icon = (Icons as any)[goal.icon] || Icons.Target;
  const percentage = goal.targetAmount > 0 
    ? (goal.currentAmount / goal.targetAmount) * 100 
    : 0;

  return (
    <LinearGradient
      colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <Icons.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1">{goal.name}</Text>
        </View>

        <View className="flex-1 px-6">
          <GlassCard variant="light" className="items-center py-8">
            <View 
              className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
              style={{ backgroundColor: `${goal.color}20` }}
            >
              <Icon size={40} color={goal.color} />
            </View>
            
            <Text className="text-white text-4xl font-bold mb-2">
              {formatCurrency(goal.currentAmount)}
            </Text>
            <Text className="text-onyx-500 text-lg mb-6">
              sur {formatCurrency(goal.targetAmount)}
            </Text>
            
            {/* Progress */}
            <View className="w-full mb-4">
              <View 
                className="h-6 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <LinearGradient
                  colors={[goal.color, `${goal.color}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </View>
            </View>
            
            <Text 
              className="text-2xl font-bold"
              style={{ color: goal.isCompleted ? '#10B981' : goal.color }}
            >
              {formatPercentage(percentage)}
            </Text>
            
            {goal.isCompleted && (
              <View className="mt-4 flex-row items-center">
                <Icons.CheckCircle size={24} color="#10B981" />
                <Text className="text-accent-success text-lg font-medium ml-2">
                  Objectif atteint! 🎉
                </Text>
              </View>
            )}
          </GlassCard>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
