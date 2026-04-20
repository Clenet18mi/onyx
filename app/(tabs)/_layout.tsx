// ============================================
// ONYX - Tabs Layout
// Navigation par onglets
// ============================================

import React from 'react';
import { View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  Wallet,
  BarChart3,
  Settings
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface TabIconProps {
  Icon: any;
  focused: boolean;
  color: string;
}

function TabIcon({ Icon, focused, color }: TabIconProps) {
  return (
    <View className="items-center justify-center">
      <Icon 
        size={24} 
        color={color}
        strokeWidth={focused ? 2.5 : 2}
      />
      {focused && (
        <View 
          className="w-1 h-1 rounded-full mt-1"
          style={{ backgroundColor: color }}
        />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const { theme } = useTheme();
  const { colors } = theme;

  const handleTabPress = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <ErrorBoundary>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.background.tertiary,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
        },
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon Icon={LayoutDashboard} focused={focused} color={color} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Comptes',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon Icon={Wallet} focused={focused} color={color} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon Icon={BarChart3} focused={focused} color={color} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Plus',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon Icon={Settings} focused={focused} color={color} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tabs>
    </ErrorBoundary>
  );
}
