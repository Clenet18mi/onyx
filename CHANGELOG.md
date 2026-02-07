# Changelog ONYX

Tous les changements notables sont documentés ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [Non publié]

## [1.0.0] - 2026-02-08

### Sécurité
- Hash du code PIN avec SHA-256 (expo-crypto) + salt
- Limitation des tentatives PIN (5 max, blocage 30 s)
- Option effacement des données après 10 échecs PIN (paramétrable)
- Vérification et changement de PIN asynchrones

### Ajouté
- Écran Sécurité : changer PIN, biométrie, option « Effacer après 10 échecs »
- Gestionnaire d’erreurs centralisé (`utils/errorHandler.ts`)
- Validation des données (`utils/validation.ts`)
- Vérification d’intégrité des données (`utils/dataIntegrity.ts`)
- Confirmations pour actions destructives (`utils/confirmations.ts`)
- Hook `useDebounce` pour la recherche
- Composant `LoadingSpinner`
- Haptic feedback (déjà présent, documenté)

### Corrigé
- PIN stocké uniquement sous forme de hash (plus de stockage en clair)
- Réinitialisation complète des données via `wipeAllData()` (tous les stores + storage)

### Technique
- `authStore` : `setupPin`, `validatePin`, `changePin` asynchrones
- `LockScreen` et `SetupPinScreen` adaptés à l’API async
- Export `ValidatePinResult` depuis le store auth

## [0.1.0] - 2026-01-15

### Ajouté
- Version initiale (prototype)
- Gestion multi-comptes, transactions, budgets, objectifs, abonnements
- Export / import JSON, PDF, CSV
- Thème sombre, code PIN, biométrie
