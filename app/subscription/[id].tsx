// ============================================
// ONYX - Subscription Detail Screen
// Détail d'un abonnement
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useSubscriptionStore, useAccountStore } from '@/stores';
import { formatCurrency, formatDate } from '@/utils/format';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const subscription = useSubscriptionStore((state) => state.getSubscription(id || ''));
  const { toggleSubscription, deleteSubscription } = useSubscriptionStore();
  const account = useAccountStore((state) => 
    subscription ? state.getAccount(subscription.accountId) : undefined
  );

  if (!subscription) {
    return (
      <LinearGradient
        colors={['#0A0A0B', '#1F1F23', '#0A0A0B']}
        className="flex-1 items-center justify-center"
      >
        <Text className="text-white text-lg">Abonnement non trouvé</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 bg-accent-primary rounded-xl"
        >
          <Text className="text-white font-medium">Retour</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const Icon = (Icons as any)[subscription.icon] || Icons.CreditCard;

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'abonnement',
      `Voulez-vous supprimer "${subscription.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteSubscription(subscription.id);
            router.back();
          },
        },
      ]
    );
  };

  const frequencyLabel = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    yearly: 'Annuel',
  }[subscription.frequency];

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
          <Text className="text-white text-xl font-bold flex-1">{subscription.name}</Text>
        </View>

        <View className="flex-1 px-6">
          <GlassCard variant="light" className="items-center py-8 mb-6">
            <View 
              className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
              style={{ backgroundColor: `${subscription.color}20` }}
            >
              <Icon size={40} color={subscription.color} />
            </View>
            
            <Text className="text-white text-4xl font-bold mb-2">
              {formatCurrency(subscription.amount)}
            </Text>
            <Text className="text-onyx-500 text-lg">
              {frequencyLabel}
            </Text>
            
            <View 
              className={`mt-4 px-4 py-2 rounded-full`}
              style={{ 
                backgroundColor: subscription.isActive 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(239, 68, 68, 0.2)' 
              }}
            >
              <Text 
                className="font-medium"
                style={{ color: subscription.isActive ? '#10B981' : '#EF4444' }}
              >
                {subscription.isActive ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </GlassCard>

          {/* Infos */}
          <GlassCard className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-onyx-500">Prochain prélèvement</Text>
              <Text className="text-white font-medium">
                {formatDate(subscription.nextBillingDate)}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-onyx-500">Compte</Text>
              <Text className="text-white font-medium">
                {account?.name || 'Non défini'}
              </Text>
            </View>
          </GlassCard>

          {/* Actions */}
          <View style={{ gap: 12 }}>
            <Button
              title={subscription.isActive ? 'Désactiver' : 'Activer'}
              variant="secondary"
              fullWidth
              onPress={() => toggleSubscription(subscription.id)}
              icon={subscription.isActive 
                ? <Icons.Pause size={18} color="#fff" /> 
                : <Icons.Play size={18} color="#fff" />
              }
            />
            
            <Button
              title="Supprimer"
              variant="danger"
              fullWidth
              onPress={handleDelete}
              icon={<Icons.Trash2 size={18} color="#fff" />}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
