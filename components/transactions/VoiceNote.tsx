// ============================================
// ONYX - Note vocale (enregistrement)
// ============================================

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as Icons from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

export interface VoiceNoteProps {
  onRecordingDone: (uri: string) => void;
  onCancel: () => void;
  maxDurationSeconds?: number;
}

export function VoiceNote({ onRecordingDone, onCancel, maxDurationSeconds = 30 }: VoiceNoteProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const [permission, setPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (recording) {
      interval = setInterval(() => {
        setDuration((d) => {
          if (d >= maxDurationSeconds - 1) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording]);

  const startRecording = async () => {
    if (permission === false) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setDuration(0);
    } catch (e) {
      console.warn('VoiceNote start failed', e);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) onRecordingDone(uri);
    } catch (e) {
      console.warn('VoiceNote stop failed', e);
    }
  };

  if (permission === false) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#71717A', marginBottom: 12 }}>
          Autorisez l'accès au micro dans les paramètres pour enregistrer une note vocale.
        </Text>
        <Button title="Fermer" variant="ghost" onPress={onCancel} />
      </View>
    );
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
        Note vocale
      </Text>
      <Text style={{ color: '#71717A', fontSize: 13, marginBottom: 16 }}>
        {duration}s / {maxDurationSeconds}s max
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        {!recording ? (
          <TouchableOpacity
            onPress={startRecording}
            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icons.Mic size={28} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={stopRecording}
            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icons.Square size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <Text style={{ color: '#fff' }}>{recording ? 'Enregistrement...' : 'Appuyez pour enregistrer'}</Text>
      </View>
      <Button title="Annuler" variant="ghost" fullWidth onPress={onCancel} />
    </View>
  );
}
