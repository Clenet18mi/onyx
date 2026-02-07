// ============================================
// ONYX - Rappels personnalisés
// ============================================

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReminderStore } from '@/stores';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ReminderRecurrence } from '@/types/reminder';
import {
  requestReminderPermissions,
  getReminderPermissionStatus,
  scheduleReminderNotification,
  cancelReminderNotification,
} from '@/utils/reminderNotifications';

const RECURRENCE_OPTIONS: { value: ReminderRecurrence; label: string }[] = [
  { value: 'once', label: 'Une fois' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
];

export default function RemindersScreen() {
  const router = useRouter();
  const addReminder = useReminderStore((s) => s.addReminder);
  const deleteReminder = useReminderStore((s) => s.deleteReminder);
  const getUpcoming = useReminderStore((s) => s.getUpcoming);
  const completeReminder = useReminderStore((s) => s.completeReminder);
  const upcoming = getUpcoming(20);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('09:00');
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>('once');
  const [notificationDenied, setNotificationDenied] = useState(false);

  useEffect(() => {
    getReminderPermissionStatus().then((status) => {
      setNotificationDenied(status === 'denied');
    });
    requestReminderPermissions().then((granted) => {
      setNotificationDenied(!granted);
    });
  }, []);

  const openAdd = () => {
    const d = new Date();
    setTitle('');
    setDateStr(format(d, 'yyyy-MM-dd'));
    setTimeStr(format(d, 'HH:mm'));
    setRecurrence('once');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Titre requis');
      return;
    }
    let scheduledAt: string;
    if (dateStr && timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(dateStr);
      d.setHours(h, m, 0, 0);
      scheduledAt = d.toISOString();
    } else {
      scheduledAt = new Date().toISOString();
    }

    const granted = await requestReminderPermissions();
    setNotificationDenied(!granted);

    const id = addReminder({ title: title.trim(), scheduledAt, recurrence, completed: false });
    if (granted) {
      await scheduleReminderNotification(id, title.trim(), scheduledAt).catch((e) =>
        console.warn('[Rappels] schedule notification', e)
      );
    } else {
      Alert.alert(
        'Notifications désactivées',
        'Pour recevoir les rappels à l\'heure, activez les notifications dans les paramètres.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Ouvrir les paramètres', onPress: () => Linking.openSettings() },
        ]
      );
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer ce rappel ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          cancelReminderNotification(id).catch(() => {});
          deleteReminder(id);
        },
      },
    ]);
  };

  const handleComplete = (id: string) => {
    cancelReminderNotification(id).catch(() => {});
    completeReminder(id);
  };

  return (
    <LinearGradient colors={['#0A0A0B', '#1F1F23']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Icons.ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Rappels</Text>
        </View>
        {notificationDenied && (
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            style={{
              marginHorizontal: 24,
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Icons.BellOff size={20} color="#EF4444" style={{ marginRight: 10 }} />
            <Text style={{ color: '#FCA5A5', fontSize: 14, flex: 1 }}>
              Notifications désactivées. Touchez pour les activer.
            </Text>
            <Icons.ChevronRight size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
          {upcoming.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: '#71717A', textAlign: 'center' }}>
                Aucun rappel à venir. Ajoutez-en pour ne rien oublier.
              </Text>
              <Button title="Créer un rappel" variant="primary" onPress={openAdd} style={{ marginTop: 16 }} />
            </View>
          ) : (
            <>
              {upcoming.map((r) => (
                <GlassCard key={r.id} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>{r.title}</Text>
                      <Text style={{ color: '#71717A', fontSize: 12 }}>
                        {format(new Date(r.scheduledAt), "d MMM yyyy, HH:mm", { locale: fr })} • {RECURRENCE_OPTIONS.find((o) => o.value === r.recurrence)?.label}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity onPress={() => handleComplete(r.id)}>
                        <Icons.Check size={22} color="#10B981" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(r.id)}>
                        <Icons.Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassCard>
              ))}
              <Button title="Créer un rappel" variant="secondary" fullWidth onPress={openAdd} style={{ marginTop: 8, marginBottom: 32 }} />
            </>
          )}
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#13131A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Nouveau rappel</Text>
              <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Titre</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Payer le loyer"
                placeholderTextColor="#52525B"
                style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 16 }}
              />
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Date (AAAA-MM-JJ)</Text>
                  <TextInput
                    value={dateStr}
                    onChangeText={setDateStr}
                    placeholder="2025-02-15"
                    placeholderTextColor="#52525B"
                    style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff' }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Heure</Text>
                  <TextInput
                    value={timeStr}
                    onChangeText={setTimeStr}
                    placeholder="09:00"
                    placeholderTextColor="#52525B"
                    style={{ backgroundColor: '#1A1A24', borderRadius: 12, padding: 14, color: '#fff' }}
                  />
                </View>
              </View>
              <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 8 }}>Récurrence</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {RECURRENCE_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.value}
                    onPress={() => setRecurrence(o.value)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      backgroundColor: recurrence === o.value ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 14 }}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button title="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                <Button title="Créer" variant="primary" style={{ flex: 1 }} onPress={handleSave} />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
