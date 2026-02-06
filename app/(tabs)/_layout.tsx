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
  Target, 
  Receipt, 
  BarChart3,
  Settings 
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';

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

  const handleTabPress = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0B',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#71717A',
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
        name="goals"
        options={{
          title: 'Objectifs',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon Icon={Target} focused={focused} color={color} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon Icon={Receipt} focused={focused} color={color} />
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
  );
}
