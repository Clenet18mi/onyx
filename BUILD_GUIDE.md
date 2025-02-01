# 🔨 Guide de Build APK - ONYX

Ce guide t'explique comment créer un APK et mettre à jour ton application sans jamais perdre les données utilisateur.

## 📋 Prérequis

```bash
# 1. Installer Node.js (v18+)
# https://nodejs.org/

# 2. Installer EAS CLI globalement
npm install -g eas-cli

# 3. Créer un compte Expo (gratuit)
# https://expo.dev/signup

# 4. Se connecter
eas login
```

## 🚀 Build APK (Première fois)

### Option 1 : Build dans le Cloud (Recommandé)

```bash
# Dans le dossier du projet
cd /home/mclenet/Onyx

# Installer les dépendances
npm install

# Configurer le projet (première fois uniquement)
eas build:configure

# Lancer le build APK
eas build --platform android --profile preview
```

Le build prend ~15-20 minutes. Tu recevras un lien pour télécharger l'APK.

### Option 2 : Build Local (Plus rapide après config)

```bash
# Installer les outils Android
# - Android Studio avec SDK 33+
# - Java JDK 17

# Build local
eas build --platform android --profile preview --local
```

L'APK sera dans le dossier `build/`.

## 📱 Installer l'APK

1. Transfère l'APK sur ton téléphone
2. Active "Sources inconnues" dans les paramètres
3. Installe l'APK
4. Lance ONYX !

---

## 🔄 Mettre à Jour sans Perdre les Données

### Comment ça marche ?

ONYX utilise **MMKV** pour stocker les données localement. Ces données sont stockées dans un espace privé de l'application qui **persiste entre les mises à jour** tant que :

1. ✅ Tu installes une **mise à jour** (même package name)
2. ✅ Tu ne **désinstalles** pas l'app
3. ✅ Tu ne **vides** pas les données de l'app

### Workflow de Mise à Jour

```bash
# 1. Fais tes modifications dans le code

# 2. Incrémente la version dans app.json
#    "version": "1.0.0" → "1.1.0"
#    "android.versionCode": 1 → 2

# 3. Si tu changes la structure des données, ajoute une migration
#    (voir section Migrations ci-dessous)

# 4. Build le nouvel APK
eas build --platform android --profile preview

# 5. Installe par-dessus l'ancienne version
#    → Les données sont préservées !
```

### ⚠️ Règles Importantes

| Action | Données |
|--------|---------|
| Installer mise à jour | ✅ Préservées |
| Désinstaller l'app | ❌ Perdues |
| Vider les données (Paramètres Android) | ❌ Perdues |
| Changer le package name | ❌ Perdues |

---

## 🔧 Système de Migrations

Quand tu modifies la structure des données (ajouter un champ, renommer, etc.), tu dois créer une migration.

### Exemple : Ajouter un champ "currency" aux comptes

1. **Ouvre** `utils/migrations.ts`

2. **Incrémente** `CURRENT_DATA_VERSION` :
```typescript
export const CURRENT_DATA_VERSION = 2; // était 1
```

3. **Ajoute** la migration dans le tableau :
```typescript
const migrations: Migration[] = [
  {
    version: 2,
    name: 'Add currency field to accounts',
    up: () => {
      const accountsData = storage.getString('onyx-accounts');
      if (accountsData) {
        const parsed = JSON.parse(accountsData);
        const accounts = parsed.state.accounts.map((acc: any) => ({
          ...acc,
          currency: acc.currency || 'EUR', // Valeur par défaut
        }));
        parsed.state.accounts = accounts;
        storage.set('onyx-accounts', JSON.stringify(parsed));
      }
    },
  },
];
```

4. **Mets à jour** les types dans `types/index.ts` :
```typescript
export interface Account {
  // ... existant
  currency: string; // Nouveau champ
}
```

5. **Build** et installe la mise à jour

Les utilisateurs existants auront automatiquement leurs données migrées !

---

## 💾 Sauvegardes Automatiques

ONYX crée automatiquement des sauvegardes :
- Avant chaque migration
- Les 3 dernières sauvegardes sont conservées

### Restaurer manuellement (Debug)

```typescript
import { restoreBackup, exportAllData } from '@/utils/migrations';

// Exporter toutes les données (pour debug)
const jsonData = exportAllData();
console.log(jsonData);

// Restaurer la dernière sauvegarde
restoreBackup();
```

---

## 📊 Versions et Changelog

### app.json - Gestion des versions

```json
{
  "expo": {
    "version": "1.2.0",        // Version affichée (semver)
    "android": {
      "versionCode": 3         // DOIT être incrémenté à chaque build
    }
  }
}
```

| Build | version | versionCode |
|-------|---------|-------------|
| 1er   | 1.0.0   | 1           |
| 2ème  | 1.1.0   | 2           |
| 3ème  | 1.2.0   | 3           |

---

## 🐛 Troubleshooting

### "App not installed"
- Vérifie que le versionCode est supérieur à l'ancien
- Vérifie que le package name est identique

### Données perdues après mise à jour
- As-tu changé le package name dans app.json ?
- As-tu désinstallé l'app avant de réinstaller ?

### Build échoue
```bash
# Nettoyer le cache
npx expo start --clear
eas build --clear-cache --platform android --profile preview
```

---

## 📁 Structure des Builds

```
eas.json
├── development    # Pour développement avec Expo Go
├── preview        # APK pour tests (ce qu'on utilise)
└── production     # AAB pour Play Store
```

### Commandes Utiles

```bash
# Build APK de test
eas build -p android --profile preview

# Build pour Play Store (AAB)
eas build -p android --profile production

# Voir les builds en cours
eas build:list

# Annuler un build
eas build:cancel
```

---

## ✅ Checklist Avant Chaque Release

- [ ] Code testé localement
- [ ] Version incrémentée dans app.json
- [ ] versionCode incrémenté
- [ ] Migration ajoutée si structure de données modifiée
- [ ] CURRENT_DATA_VERSION mis à jour si migration ajoutée
- [ ] Commit Git avec tag de version
- [ ] Build APK
- [ ] Test d'installation par-dessus ancienne version
- [ ] Vérifier que les données sont préservées

---

Bonne continuation avec ONYX ! 🚀
