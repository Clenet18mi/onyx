// ============================================
// ONYX - Journal des versions (changelog)
// Données générées par scripts/generate-changelog.js
// ============================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/useTheme';

// Données générées par node scripts/generate-changelog.js
const changelogData = require('@/constants/changelog.json') as {
  appVersion: string;
  buildNumber: string;
  generatedAt: string;
  entries: { version: string; date: string; logs: string[] }[];
};

function formatLabel(msg: string): string {
  const m = msg.trim();
  if (!m) return m;
  const lower = m.toLowerCase();
  if (lower.startsWith('feat')) return m.replace(/^feat(\([^)]+\))?:\s*/i, '✨ ');
  if (lower.startsWith('fix')) return m.replace(/^fix(\([^)]+\))?:\s*/i, '🐛 ');
  if (lower.startsWith('chore')) return m.replace(/^chore(\([^)]+\))?:\s*/i, '🔧 ');
  if (lower.startsWith('docs')) return m.replace(/^docs(\([^)]+\))?:\s*/i, '📄 ');
  if (lower.startsWith('refactor')) return m.replace(/^refactor(\([^)]+\))?:\s*/i, '♻️ ');
  return '• ' + m;
}

export default function ChangelogScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { colors } = theme;
  const { appVersion, buildNumber, entries } = changelogData;

  return (
    <LinearGradient colors={colors.gradients.card} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Icons.ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={{ color: colors.text.primary, fontSize: 20, fontWeight: '700' }}>Journal des versions</Text>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
          <GlassCard variant="light" style={{ marginBottom: 20, alignItems: 'center', paddingVertical: 20 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: `${colors.accent.primary}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Icons.GitBranch size={28} color={colors.accent.primary} />
            </View>
            <Text style={{ color: colors.text.primary, fontSize: 24, fontWeight: '700' }}>ONYX {appVersion}</Text>
            <Text style={{ color: colors.text.secondary, fontSize: 14, marginTop: 4 }}>Build {buildNumber}</Text>
          </GlassCard>

          {entries.map((entry, idx) => (
            <View key={idx} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 }}>
                <Text style={{ color: colors.accent.primary, fontWeight: '700', fontSize: 16 }}>v{entry.version}</Text>
                <Text style={{ color: colors.text.secondary, fontSize: 13, marginLeft: 8 }}>{entry.date}</Text>
              </View>
              <GlassCard noPadding>
                <View style={{ padding: 16 }}>
                  {entry.logs.map((log, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        marginBottom: i < entry.logs.length - 1 ? 10 : 0,
                      }}
                    >
                        <Text style={{ color: colors.text.secondary, fontSize: 12, marginRight: 8, marginTop: 2 }}>•</Text>
                        <Text style={{ color: colors.text.primary, fontSize: 14, flex: 1 }}>{formatLabel(log)}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
