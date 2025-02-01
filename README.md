# 💎 ONYX - Finances Personnelles

> **L'application de finances personnelles ultime, 100% Offline (Local First)**

![ONYX Banner](https://via.placeholder.com/800x400/0A0A0B/6366F1?text=ONYX)

## ✨ Fonctionnalités

### 🔐 Sécurité
- **Code PIN** (4 ou 6 chiffres) au premier lancement
- **Biométrie** (Face ID / Touch ID) optionnelle
- **Verrouillage automatique** à chaque ouverture
- **Données 100% locales** - Rien ne quitte votre appareil

### 💰 Gestion Multi-Comptes
- Créez autant de comptes que vous voulez
- Types: Courant, Épargne, Cash, Investissement, Crypto
- Couleurs et icônes personnalisables
- Vue globale du **patrimoine total**

### 📊 Dashboard Intelligent
- Graphiques interactifs (Cashflow entrées/sorties)
- Filtrage par période (Semaine/Mois)
- Aperçu rapide de vos comptes
- Transactions récentes

### 💸 Transactions & Virements
- Ajout rapide de revenus/dépenses
- Catégorisation automatique
- **Virements visuels** entre comptes
- Historique complet par compte

### 📈 Budgets
- Définissez des limites par catégorie
- Jauges de progression visuelles
- Alertes de dépassement
- Périodes: Semaine, Mois, Année

### 🎯 Objectifs d'Épargne
- Créez des projets (PS5, Voyage, etc.)
- Barre de progression visuelle
- Ajoutez des fonds depuis n'importe quel compte
- Célébration quand l'objectif est atteint 🎉

### 🔄 Abonnements Récurrents
- Gérez Netflix, Spotify, etc.
- Calcul du coût mensuel total
- Génération automatique des transactions
- Activation/désactivation rapide

### 📤 Export de Données
- Export complet en **CSV**
- Compatible Excel, Google Sheets
- Vos données vous appartiennent

---

## 🛠 Stack Technique

| Technologie | Rôle |
|-------------|------|
| **React Native** | Framework mobile |
| **Expo SDK 52** | Plateforme de développement |
| **TypeScript** | Typage statique |
| **NativeWind** | Style (Tailwind CSS) |
| **Expo Router** | Navigation |
| **Zustand** | State management |
| **MMKV** | Stockage local ultra-rapide |
| **react-native-gifted-charts** | Graphiques |
| **Lucide Icons** | Icônes |

---

## 🚀 Installation & Développement

### Prérequis

- Node.js 18+ installé
- npm ou yarn
- Compte Expo (gratuit) : https://expo.dev

### 1. Cloner et installer

```bash
cd Onyx
npm install
```

### 2. Démarrer en développement

```bash
# Démarrer le serveur de développement
npx expo start

# Scanner le QR code avec l'app Expo Go sur votre téléphone
# Ou appuyer sur 'a' pour lancer l'émulateur Android
```

### 3. Tester sur un appareil physique

Téléchargez **Expo Go** depuis le Play Store ou App Store, puis scannez le QR code affiché dans le terminal.

---

## 📱 Build Android (APK)

### Méthode 1: Build Cloud avec EAS (Recommandé)

#### 1. Installer EAS CLI

```bash
npm install -g eas-cli
```

#### 2. Se connecter à Expo

```bash
eas login
```

#### 3. Configurer le projet

```bash
eas build:configure
```

#### 4. Lancer le build APK

```bash
# Build de prévisualisation (APK installable directement)
eas build --platform android --profile preview

# OU build de production (AAB pour Play Store)
eas build --platform android --profile production
```

#### 5. Télécharger l'APK

Une fois le build terminé, un lien de téléchargement sera affiché. Vous pouvez aussi le récupérer sur https://expo.dev

### Méthode 2: Build Local

#### Prérequis

- Android Studio installé
- SDK Android configuré
- Variables d'environnement ANDROID_HOME

```bash
# Générer le projet natif
npx expo prebuild --platform android

# Build APK de debug
cd android
./gradlew assembleDebug

# L'APK sera dans: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📁 Structure du Projet

```
Onyx/
├── app/                    # Écrans (Expo Router)
│   ├── (tabs)/            # Navigation par onglets
│   │   ├── index.tsx      # Dashboard
│   │   ├── accounts.tsx   # Comptes
│   │   ├── goals.tsx      # Objectifs
│   │   ├── budgets.tsx    # Budgets
│   │   └── more.tsx       # Plus (Abonnements, Paramètres)
│   ├── account/[id].tsx   # Détail compte
│   ├── transaction/add.tsx # Nouvelle transaction
│   ├── transfer.tsx       # Virements
│   └── settings.tsx       # Paramètres
├── components/            # Composants réutilisables
│   ├── auth/             # PIN, Lock Screen
│   ├── dashboard/        # Cartes, Graphiques
│   └── ui/               # Boutons, Cards
├── stores/               # Zustand stores
│   ├── authStore.ts      # Authentification
│   ├── accountStore.ts   # Comptes
│   ├── transactionStore.ts # Transactions
│   ├── budgetStore.ts    # Budgets
│   ├── goalStore.ts      # Objectifs
│   └── subscriptionStore.ts # Abonnements
├── types/                # TypeScript types
├── utils/                # Utilitaires
│   ├── storage.ts        # MMKV config
│   ├── crypto.ts         # Hash PIN
│   └── format.ts         # Formatage
├── app.json              # Config Expo
├── eas.json              # Config EAS Build
└── tailwind.config.js    # Config NativeWind
```

---

## 🎨 Design System

### Palette de Couleurs

| Couleur | Hex | Usage |
|---------|-----|-------|
| Onyx (fond) | `#0A0A0B` | Background principal |
| Onyx 100 | `#1F1F23` | Cards, surfaces |
| Onyx 500 | `#71717A` | Texte secondaire |
| Accent Primary | `#6366F1` | Actions principales |
| Success | `#10B981` | Revenus, positif |
| Danger | `#EF4444` | Dépenses, erreurs |
| Warning | `#F59E0B` | Alertes |

### Glassmorphism

Les cartes utilisent un effet de verre subtil avec :
- Dégradé transparent
- Bordure légère
- Blur en arrière-plan

---

## 🔒 Sécurité & Confidentialité

- **Aucune donnée n'est envoyée sur Internet**
- Stockage local avec **MMKV** (chiffré)
- PIN hashé localement
- Biométrie gérée par le système

---

## 📝 Roadmap

- [ ] Mode sombre/clair
- [ ] Widgets iOS/Android
- [ ] Notifications de rappel
- [ ] Import depuis autres apps
- [ ] Graphiques avancés
- [ ] Multi-devise
- [ ] Backup iCloud/Google Drive (chiffré)

---

## 📄 Licence

MIT - Utilisez, modifiez, distribuez librement.

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou une PR.

---

<p align="center">
  <b>ONYX</b> - Vos finances, votre contrôle, votre vie privée.
</p>
