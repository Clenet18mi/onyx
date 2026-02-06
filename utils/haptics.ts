// ============================================
// ONYX - Haptic Feedback
// Feedback tactile aux moments clés
// ============================================

import * as Haptics from 'expo-haptics';

/** Bouton pressé, toggle, sélection légère */
export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Validation, montant confirmé */
export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Transaction ajoutée, objectif atteint */
export function hapticHeavy() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Sélection dans une liste (swipe, picker) */
export function hapticSelection() {
  Haptics.selectionAsync();
}

/** Erreur (saisie invalide, échec) */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Succès (sauvegarde, validation) */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Avertissement */
export function hapticWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
