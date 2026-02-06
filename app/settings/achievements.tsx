// ============================================
// ONYX - Réalisations (badges + défis)
// ============================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGamificationStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AchievementsScreen() {
  const router = useRouter();
  const achievements = useGamificationStore((s) => s.achievements);
  const streak = useGamificationStore((s) => s.streak);
  const levelData = useGamificationStore((s) => s.levelData);
  const getMonthlyChallenges = useGamificationStore((s) => s.getMonthlyChallenges);
  const challenges = getMonthlyChallenges();

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Icons.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Réalisations</Text>
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
          <GlassCard style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#71717A', fontSize: 12 }}>Niveau</Text>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>{levelData.level}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#71717A', fontSize: 12 }}>Série</Text>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>🔥 {streak.currentStreak}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#71717A', fontSize: 12 }}>Record</Text>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>{streak.longestStreak}j</Text>
              </View>
            </View>
            <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  width: `${(levelData.currentXp / levelData.xpForNextLevel) * 100}%`,
                  backgroundColor: '#6366F1',
                  borderRadius: 4,
                }}
              />
            </View>
            <Text style={{ color: '#71717A', fontSize: 11, marginTop: 4 }}>
              {levelData.currentXp} / {levelData.xpForNextLevel} XP
            </Text>
          </GlassCard>

          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Défis du mois</Text>
          {challenges.map((c) => (
            <GlassCard key={c.id} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>{c.name}</Text>
                  <Text style={{ color: '#71717A', fontSize: 12 }}>{c.description}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {typeof c.target === 'number' ? (
                    <Text style={{ color: '#6366F1' }}>
                      {c.progress} / {c.target}
                    </Text>
                  ) : (
                    <Text style={{ color: '#6366F1' }}>{c.target}</Text>
                  )}
                  {c.completed && <Text style={{ color: '#10B981', fontSize: 12 }}>✓ Complété</Text>}
                </View>
              </View>
            </GlassCard>
          ))}

          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 12 }}>Badges</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 32 }}>
            {achievements.map((a) => (
              <View
                key={a.id}
                style={{
                  width: '30%',
                  aspectRatio: 1,
                  borderRadius: 16,
                  backgroundColor: a.unlockedAt ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 4 }}>{a.icon}</Text>
                <Text style={{ color: a.unlockedAt ? '#fff' : '#52525B', fontSize: 11, textAlign: 'center' }} numberOfLines={2}>
                  {a.name}
                </Text>
                {a.unlockedAt && (
                  <Text style={{ color: '#71717A', fontSize: 9 }}>{format(new Date(a.unlockedAt), 'd MMM', { locale: fr })}</Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
