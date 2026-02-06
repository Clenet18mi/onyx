// ============================================
// ONYX - Scan de ticket (capture photo)
// Photo attachée à la transaction (OCR optionnel plus tard)
// ============================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Icons from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

export interface ReceiptScannerProps {
  onPhotoTaken?: (uri: string) => void;
  onPhotosTaken?: (uris: string[]) => void;
  onCancel: () => void;
  maxPhotos?: number;
}

export function ReceiptScanner({ onPhotoTaken, onPhotosTaken, onCancel, maxPhotos = 3 }: ReceiptScannerProps) {
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire pour photographier un ticket.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const ok = await requestPermission();
    if (!ok) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (photoUris.length < maxPhotos) {
        setPhotoUris((prev) => [...prev, uri]);
      }
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0] && photoUris.length < maxPhotos) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (photoUris.length > 0) {
      if (onPhotosTaken) onPhotosTaken(photoUris);
      else if (onPhotoTaken) onPhotoTaken(photoUris[0]);
    }
    onCancel();
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
        Photo du ticket
      </Text>
      <Text style={{ color: '#71717A', fontSize: 13, marginBottom: 16 }}>
        Prenez une photo ou choisissez depuis la galerie. Le montant pourra être saisi manuellement.
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <Button title="Prendre une photo" variant="primary" onPress={takePhoto} icon={<Icons.Camera size={18} color="#fff" />} />
        <Button title="Galerie" variant="secondary" onPress={pickFromGallery} icon={<Icons.Image size={18} color="#fff" />} />
      </View>
      {photoUris.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          {photoUris.map((uri, i) => (
            <View key={uri} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Image source={{ uri }} style={{ width: 60, height: 80, borderRadius: 8 }} />
              <TouchableOpacity onPress={() => removePhoto(i)} style={{ marginLeft: 12 }}>
                <Icons.Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          <Button title="Utiliser cette photo" variant="primary" fullWidth onPress={handleConfirm} />
        </View>
      )}
      <Button title="Annuler" variant="ghost" fullWidth onPress={onCancel} />
    </View>
  );
}
