// ============================================
// ONYX - Confirmations actions destructives
// ============================================

import { Alert } from 'react-native';

export function confirmDelete(itemName: string, onConfirm: () => void): void {
  Alert.alert(
    'Confirmer la suppression',
    `Voulez-vous vraiment supprimer "${itemName}" ?\n\nCette action est irréversible.`,
    [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
    ]
  );
}

export function confirmDataWipe(onConfirm: () => void): void {
  Alert.alert(
    'Attention',
    "Vous êtes sur le point d'EFFACER TOUTES vos données.\n\nCette action est DÉFINITIVE et IRRÉVERSIBLE.\n\nVoulez-vous vraiment continuer ?",
    [
      { text: 'Non, annuler', style: 'cancel' },
      {
        text: 'Oui, tout effacer',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Dernière confirmation',
            'Êtes-vous absolument certain ?',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Confirmer', style: 'destructive', onPress: onConfirm },
            ]
          );
        },
      },
    ]
  );
}

export function confirmImport(
  fileDate: string,
  itemCounts: { accounts: number; transactions: number },
  onConfirm: () => void
): void {
  Alert.alert(
    "Confirmer l'import",
    `Cette action va REMPLACER toutes vos données actuelles.\n\n` +
      `Fichier : ${fileDate}\n` +
      `${itemCounts.accounts} compte(s)\n` +
      `${itemCounts.transactions} transaction(s)\n\n` +
      'Continuer ?',
    [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Importer', style: 'destructive', onPress: onConfirm },
    ]
  );
}
