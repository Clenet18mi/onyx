# 💎 ONYX - Finances Personnelles

Application de finances personnelles **100% Offline** (Local First) avec une interface moderne et épurée.

## ✨ Fonctionnalités

### 🔐 Sécurité
- Code PIN à 4 ou 6 chiffres
- Déverrouillage biométrique (Face ID / Touch ID)
- Données chiffrées localement avec MMKV

### 💰 Gestion Multi-Comptes
- Comptes Courant, Épargne, Cash, Investissement
- Couleurs et icônes personnalisables
- Vue globale du patrimoine total

### 📊 Dashboard Intelligent
- Graphique Cashflow (Entrées vs Sorties)
- Statistiques mensuelles
- Tendances de dépenses
- Flux de transactions en temps réel

### 🎯 Fonctionnalités Avancées
- **Budgets** : Limites de dépenses par catégorie avec jauges visuelles
- **Projets d'Épargne** : Objectifs avec barre de progression
- **Abonnements Récurrents** : Génération automatique des transactions
- **Dépenses Rapides** : Boutons pour ajouter café, transport, etc.
- **Payday** : Ajout rapide du salaire

### 📱 Personnalisation Complète
- Catégories de dépenses personnalisables
- Types de comptes configurables
- Templates de dépenses rapides
- Profil utilisateur avec configuration salaire

### 📤 Export de Données
- Export PDF mensuel élégant
- Export CSV
- Sauvegarde/Restauration des données

## 🛠 Stack Technique

| Technologie | Usage |
|-------------|-------|
| React Native | Framework mobile |
| Expo SDK 54 | Build et développement |
| TypeScript | Typage statique |
| NativeWind | Tailwind CSS pour RN |
| Expo Router | Navigation file-based |
| Zustand | State management |
| MMKV | Stockage local rapide |
| Lucide React Native | Icônes |

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Expo (gratuit) : https://expo.dev/signup
- EAS CLI installé globalement

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter
eas login
```

### Installation du projet

```bash
# Cloner ou télécharger le projet
cd Onyx

# Installer les dépendances
npm install

# Configurer EAS (première fois)
eas build:configure
```

## 📜 Scripts npm / Commandes

| Commande | Description |
|----------|-------------|
| `npm start` | Lance le serveur de développement Expo |
| `npm run android` | Lance l'app sur Android (émulateur ou appareil connecté) |
| `npm run ios` | Lance l'app sur iOS (Mac uniquement) |
| `npm run web` | Lance l'app en mode web |
| **Build Android (local)** | |
| `npm run build:android` | Build APK release (PowerShell, projet natif `android/`) |
| `npm run build:android:debug` | Build APK debug |
| `npm run android:build` | Alias de `build:android` |
| `npm run android:build:fast` | Build release rapide (cache Gradle, sans prebuild si déjà fait) |
| **Prebuild & natif** | |
| `npm run prebuild` | Génère le projet natif (expo prebuild --clean) |
| `npm run prebuild:android` | Prebuild Android uniquement |
| `npm run prebuild:android:clean` | Prebuild Android avec nettoyage |
| `npm run android:unlock` | Déverrouille les fichiers Gradle (Windows) avant prebuild |
| `npm run prebuild:android:fresh` | Unlock + prebuild Android propre |
| **Build EAS (cloud)** | |
| `npm run build:android:eas` | Build APK via EAS (profil preview) |
| `npm run build:android:prod` | Build AAB production pour Play Store |
| **Utilitaires** | |
| `npm run changelog` | Génère `constants/changelog.json` depuis l'historique Git |
| `npm run icon:black` | Applique un fond noir à l'icône (assets/icon.png, adaptive-icon.png) |
| `npm run android:clean` | Nettoie le build Gradle (dossier `android/`) |
| `npm run android:config` | Configure `local.properties` pour Android |
| `npm run android:logcat` | Affiche les logs Android (crash, etc.) |

## 📱 Créer l'APK

### Build APK (Preview)

```bash
# Via npm (recommandé)
npm run build:android:eas

# Ou directement EAS
eas build --platform android --profile preview
```

Le build prend environ **15-20 minutes**. Une fois terminé, tu recevras un lien pour télécharger l'APK.

### Build Android en local (APK release)

```bash
# Générer le projet natif puis builder (Windows PowerShell)
npm run prebuild:android
npm run build:android

# Ou en une fois (prebuild propre + build)
npm run prebuild:android:fresh
npm run build:android
```

### Build Production (Play Store)

```bash
npm run build:android:prod
# ou
eas build --platform android --profile production
```

## 📂 Structure du Projet

```
Onyx/
├── app/                    # Écrans (Expo Router)
│   ├── (tabs)/            # Navigation par onglets
│   │   ├── index.tsx      # Dashboard
│   │   ├── accounts.tsx   # Gestion des comptes
│   │   ├── budgets.tsx    # Budgets
│   │   ├── goals.tsx      # Objectifs d'épargne
│   │   └── more.tsx       # Plus (abonnements, export)
│   ├── settings/          # Paramètres
│   ├── account/[id].tsx   # Détail compte
│   ├── transaction/add.tsx # Ajouter transaction
│   └── transfer.tsx       # Virements
├── components/            # Composants réutilisables
│   ├── auth/             # PIN, Lock Screen
│   ├── dashboard/        # Composants dashboard
│   └── ui/               # Boutons, Cards
├── stores/               # Zustand stores
├── types/                # Types TypeScript
├── utils/                # Utilitaires
└── assets/               # Images, icônes
```

## 🔄 Mises à Jour

Pour mettre à jour l'app sans perdre les données :

1. **Incrémenter** la version dans `app.json`
2. **Incrémenter** le `versionCode` dans `app.json`
3. Si changement de structure de données → ajouter une migration
4. **Build** le nouvel APK
5. **Installer** par-dessus l'ancienne version

Voir `BUILD_GUIDE.md` pour plus de détails.

## 🎨 Design

- Style **Glassmorphism** léger avec dégradés subtils
- Palette sombre et élégante
- Couleurs d'accent indigo/violet
- Interface **100% en français**

## 📄 Licence

Projet personnel - Tous droits réservés.

---

**ONYX** - Vos finances, simplement. 💎
