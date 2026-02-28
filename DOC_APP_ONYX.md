# 📘 ONYX – Documentation complète de l’application

Document de référence pour une autre IA ou un développeur qui reprend le projet. Ce fichier décrit l’ensemble des fonctionnalités, la stack, la structure du code, les stores, les flux principaux et les points techniques importants.

---

## 1. Vue d’ensemble

**ONYX** est une application de **finances personnelles 100 % offline** (Local First) pour mobile (React Native / Expo). Aucune donnée n’est envoyée sur un serveur : tout est stocké localement sur l’appareil (AsyncStorage via Zustand persist).

- **Framework** : React Native avec Expo SDK 54  
- **Langage** : TypeScript  
- **Navigation** : Expo Router (file-based)  
- **State** : Zustand avec persistance  
- **UI** : NativeWind (Tailwind), Lucide icons, style sombre / glassmorphism  
- **Cible** : Android (APK/AAB), iOS possible, interface en français  

---

## 2. Stack technique détaillée

| Technologie | Rôle |
|-------------|------|
| **Expo SDK 54** | Build, dev, modules natifs (file-system, sharing, notifications, etc.) |
| **React Native 0.81** | UI mobile |
| **Expo Router 6** | Navigation par fichiers (`app/**/*.tsx`) |
| **Zustand 4** | State global + `persist` avec stockage async |
| **AsyncStorage** | Persistance (via `utils/storage.ts`, préfixe `@onyx_`) |
| **NativeWind 4** | Classes type Tailwind (`className="..."`) |
| **date-fns** | Dates (format, intervalles, locale fr) |
| **lucide-react-native** | Icônes |
| **expo-linear-gradient** | Dégradés |
| **expo-notifications** | Rappels / notifications locales |
| **expo-secure-store** | Stockage sécurisé (PIN hash) |
| **expo-local-authentication** | Biométrie (Face ID / Touch ID) |
| **expo-file-system** (legacy + nouvelle API) | Export fichiers, partage |
| **expo-document-picker** | Import JSON |
| **expo-sharing** | Partage de fichiers (export) |
| **react-native-gifted-charts** | Graphiques (stats, bar charts) |
| **react-native-reanimated** | Animations |

---

## 3. Structure des dossiers

```
onyx/
├── app/                          # Écrans (Expo Router)
│   ├── _layout.tsx               # Layout racine (tabs + auth lock)
│   ├── (tabs)/                   # Onglets principaux
│   │   ├── _layout.tsx           # Tab navigator (Dashboard, Comptes, Budgets, Objectifs, Plus)
│   │   ├── index.tsx             # Dashboard (accueil)
│   │   ├── accounts.tsx          # Liste des comptes
│   │   ├── budgets.tsx           # Budgets par catégorie
│   │   ├── goals.tsx             # Objectifs d’épargne
│   │   ├── stats.tsx             # Statistiques / graphiques
│   │   └── more.tsx              # Plus : abonnements, paramètres, etc.
│   ├── account/[id].tsx          # Détail d’un compte + transactions
│   ├── transaction/
│   │   ├── add.tsx               # Ajout transaction (revenu/dépense/virement)
│   │   └── [id].tsx              # Détail / édition transaction
│   ├── planned-transaction/add.tsx  # Ajout transaction prévue
│   ├── transfer.tsx              # Virement entre comptes
│   ├── goal/[id].tsx             # Détail objectif
│   ├── subscription/[id].tsx     # Détail abonnement
│   ├── settings/                 # Paramètres
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Liste des paramètres
│   │   ├── profile.tsx           # Profil (salaire, jour de paie, etc.)
│   │   ├── categories.tsx        # Catégories personnalisées
│   │   ├── account-types.tsx     # Types de comptes
│   │   ├── quick-expenses.tsx    # Dépenses rapides (boutons dashboard)
│   │   ├── reminders.tsx         # Rappels
│   │   ├── templates.tsx         # Templates de transactions
│   │   ├── automation-rules.tsx  # Règles auto (note → catégorie)
│   │   ├── data.tsx              # Gestion des données : backup, export, import
│   │   ├── security.tsx          # PIN, biométrie
│   │   ├── changelog.tsx
│   │   ├── achievements.tsx
│   │   └── wishlist.tsx
│   ├── period-comparator.tsx
│   └── scenarios.tsx
├── components/
│   ├── auth/                     # Verrouillage, PIN
│   ├── dashboard/                # Composants du dashboard
│   │   ├── BalanceCard.tsx
│   │   ├── CashflowChart.tsx
│   │   ├── QuickAccounts.tsx
│   │   ├── QuickExpenses.tsx
│   │   ├── QuickActions.tsx
│   │   ├── TransactionFeed.tsx
│   │   ├── RecentTransactions.tsx
│   │   ├── SmartInsights.tsx
│   │   ├── FinancialInsights.tsx
│   │   ├── BalanceForecast.tsx
│   │   ├── MerchantAnalysis.tsx
│   │   └── PaydayModal.tsx
│   ├── budgets/
│   │   └── BudgetAssistant.tsx   # Suggestions de budgets (3 mois)
│   ├── insights/
│   │   └── FinancialInsights.tsx
│   ├── planned/
│   │   └── PlannedTransactionCard.tsx
│   ├── transactions/
│   │   └── DuplicateAlertModal.tsx
│   └── ui/
│       ├── GlassCard.tsx
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── EmptyState.tsx
├── stores/                       # Zustand stores (voir section 5)
├── types/                        # Types TypeScript globaux
│   ├── index.ts                  # Account, Transaction, Budget, Goal, Subscription, CATEGORIES, etc.
│   ├── automation.ts
│   └── template.ts
├── utils/
│   ├── storage.ts                # AsyncStorage wrapper (Zustand + migrations)
│   ├── migrations.ts             # Versions de données, backup/restore
│   ├── crypto.ts                 # generateId, hash PIN
│   ├── format.ts                 # formatCurrency, formatDate, formatPercentage
│   ├── pdfExport.ts              # Export PDF/CSV/JSON (relevé, partage)
│   ├── dataExport.ts             # Export/import NDJSON complet (tous les stores)
│   └── duplicateDetector.ts      # Détection doublons avant ajout transaction
├── constants/
│   └── changelog.json            # Généré par `npm run changelog`
├── assets/
├── scripts/                       # generate-changelog, icon-black, unlock-android, etc.
├── app.json
├── eas.json
├── package.json
├── README.md
├── BUILD_GUIDE.md
└── DOC_APP_ONYX.md               # Ce fichier
```

---

## 4. Fonctionnalités par domaine

### 4.1 Sécurité

- **PIN** : 4 ou 6 chiffres, hash stocké (expo-secure-store).
- **Biométrie** : optionnelle pour déverrouiller (Face ID / Touch ID).
- **Verrouillage** : écran de verrou après mise en arrière-plan ou via « Verrouiller » dans Plus.
- **Stores concernés** : `authStore` (pinHash, biometricEnabled, lock).

### 4.2 Comptes

- Création, édition, archivage, suppression.
- Types : courant, épargne, espèces, investissement, crypto (définis dans `configStore` + types par défaut dans `types/index.ts`).
- Couleur, icône, devise (EUR par défaut).
- Solde mis à jour par les transactions et les virements.
- **Important** : pour obtenir la liste des comptes actifs (non archivés), utiliser  
  `useAccountStore((s) => s.accounts.filter((a) => !a.isArchived))`  
  et **pas** `getActiveAccounts()` comme valeur directe dans un `.map()` (c’est une fonction). Même principe partout où on a besoin du tableau de comptes.

### 4.3 Transactions

- **Types** : `income`, `expense`, `transfer`.
- **Catégories** : soit les IDs de `CATEGORIES` (types/index.ts), soit des catégories personnalisées du `configStore`. Le type TypeScript `TransactionCategory` inclut `(string & {})` pour accepter les IDs personnalisés.
- **Affichage des libellés** : partout utiliser `useConfigStore((s) => s.getCategoryById(transaction.category))` pour obtenir `{ label, icon, color }` au lieu de `CATEGORIES.find(c => c.id === ...)` afin d’afficher les catégories personnalisées.
- Champs : montant, description, date, compte, catégorie ; optionnel : `toAccountId` (virement), `subscriptionId`, `goalId`, `photoUris`, `voiceNoteUri`.
- **Doublons** : alerte possible avant ajout (paramètre dans settings + `DuplicateAlertModal` + `utils/duplicateDetector.ts`).

### 4.4 Virements

- Écran dédié `app/transfer.tsx`.
- Sélection compte source / compte destination ; si la liste des comptes change et que la sélection n’existe plus, elle est réinitialisée (premier / deuxième compte actif) via `useEffect` sur `accounts`.

### 4.5 Budgets

- Budget par catégorie de dépense, avec limite et période (hebdo / mensuel / annuel).
- Jauges d’utilisation (pourcentage, dépassement).
- **Catégories** : utiliser `getVisibleCategories('expense')` du configStore pour la liste (création/édition) et `getCategoryById(budget.category)` pour l’affichage.
- Store : `budgetStore`. Calcul des dépenses réelles sur la période dans le store (`getAllBudgetsProgress`).
- **BudgetAssistant** : suggestions de budgets à partir des 3 derniers mois (moyenne + 10 %).

### 4.6 Objectifs d’épargne (Goals)

- Objectif avec montant cible, compte lié, échéance optionnelle, progression.
- Store : `goalStore`.

### 4.7 Abonnements

- Abonnements récurrents (nom, montant, fréquence, compte, prochaine date de facturation).
- **Sans compte** : si `accounts.length === 0`, le bouton d’ajout d’abonnement est désactivé et un message invite à créer un compte.
- Traitement automatique : `processSubscriptions()` (création des transactions à la date de facturation) ; appelé au refresh du dashboard.
- Store : `subscriptionStore`.

### 4.8 Transactions prévues (Planned)

- Transactions futures (dépense ou revenu), optionnellement récurrentes.
- Statuts : pending, realized, cancelled.
- Store : `plannedTransactionStore` ; écran d’ajout `app/planned-transaction/add.tsx`.

### 4.9 Rappels (Reminders)

- Rappels avec date/heure, liés à une transaction ou indépendants.
- Notifications locales via `expo-notifications`.
- Store : `reminderStore`. Synchronisation des notifications : `syncReminderNotifications()` (à appeler au démarrage / après modification). Pour les rappels récurrents (quotidien / hebdo / mensuel), une seule notification est planifiée à `scheduledAt` ; une évolution possible serait de replanifier la prochaine occurrence au démarrage ou en arrière-plan.

### 4.10 Paramètres / Configuration

- **Profil** : nom, devise, locale, jour de paie, montant/compte par défaut pour le salaire (Payday).
- **Catégories** : ajout, modification, masquage, réordre ; catégories par défaut non supprimables. Stockées dans `configStore.categories`.
- **Types de comptes** : idem, dans `configStore.accountTypes`.
- **Dépenses rapides** : boutons du dashboard (café, transport, etc.) ; `configStore.quickExpenses`.
- **Templates** : modèles de transactions réutilisables ; `templateStore`.
- **Règles d’automatisation** : si la note contient un texte → attribuer une catégorie ; `automationStore`.
- **Sécurité** : PIN, biométrie ; `authStore`, `settingsStore`.
- **Données** : backup interne, export JSON (migrations + dataExport), import JSON ; écran `app/settings/data.tsx`. Après export, l’alerte de succès affiche le nom du fichier.

### 4.11 Export / Import

- **Export** :  
  - Depuis **Paramètres > Gestion des données** : export complet (migrations `exportAllData`) → fichier `onyx_backup_YYYY-MM-DD_HH-mm.json` ; alerte avec nom du fichier.  
  - `utils/dataExport.ts` : export NDJSON (`exportDataAsJSON`) → `onyx-backup-YYYY-MM-DD.ndjson` ; alerte avec nom du fichier.
- **Import** : sélection de fichier (DocumentPicker) puis import des données (dataExport ou migrations selon le flux). Gestion des conflits (comptes/transactions existants).
- **PDF / CSV** : `utils/pdfExport.ts` — `exportToPDF`, `exportToCSV` (optionnel `getCategoryLabel` pour les catégories personnalisées). Non utilisés dans l’UI actuelle mais disponibles.

### 4.12 Gamification / Succès

- Store `gamificationStore` (série de connexion, niveaux, etc.) ; écran paramètres achievements.

### 4.13 Statistiques

- Écran `app/(tabs)/stats.tsx` : revenus / dépenses / solde par mois, graphiques par catégorie (dépenses et revenus), détail des transactions par catégorie. Utilise `getCategoryById` pour les libellés et couleurs des catégories (y compris personnalisées).

---

## 5. Stores Zustand (détail)

Tous les stores sont exportés depuis `stores/index.ts` et persistés via `zustandStorage` (AsyncStorage, préfixe `@onyx_`). Chaque store a une clé de persistance (ex. `onyx-accounts`, `onyx-config`).

| Store | Clé persist | Rôle principal |
|-------|-------------|----------------|
| **authStore** | onyx-auth | PIN, biométrie, verrouillage |
| **accountStore** | onyx-accounts | Comptes (CRUD, solde, archivage) |
| **transactionStore** | onyx-transactions | Transactions, virements, liaison abonnements/goals |
| **budgetStore** | onyx-budgets | Budgets par catégorie, période, limite |
| **goalStore** | onyx-goals | Objectifs d’épargne |
| **subscriptionStore** | onyx-subscriptions | Abonnements récurrents |
| **plannedTransactionStore** | onyx-planned-transactions | Transactions prévues |
| **reminderStore** | onyx-reminders | Rappels + notifications |
| **configStore** | onyx-config | Catégories, types de comptes, quick expenses, profil |
| **settingsStore** | onyx-settings | Devise, thème, haptic, notifications, alerte doublons |
| **templateStore** | onyx-templates | Templates de transactions |
| **automationStore** | onyx-automation | Règles note → catégorie |
| **insightsStore** | (calculs à la volée) | Prédictions, tendances (pas de persist) |
| **merchantStore** | onyx-merchants | Marchands (analyse) |
| **filterStore** | onyx-filters | Filtres (liste) |
| **gamificationStore** | onyx-gamification | Série, niveau |
| **splitStore** | onyx-splits | Splits de transactions |
| **wishlistStore** | onyx-wishlist | Liste de souhaits |

**ConfigStore – getters importants :**

- `getVisibleCategories(type?: 'income' | 'expense' | 'both')` : catégories visibles (non masquées), filtrées par type, triées par ordre. À utiliser pour les listes déroulantes (ajout transaction, budget, etc.).
- `getCategoryById(id)` : retourne `{ id, label, icon, color, type, ... }` ou `undefined`. À utiliser partout pour afficher le libellé/icône/couleur d’une catégorie (y compris personnalisée).
- `getVisibleAccountTypes()`, `getActiveQuickExpenses()`, `getAccountTypeById(id)`.

**AccountStore – attention :**

- `getActiveAccounts()` est une **fonction** qui retourne le tableau. Dans les composants, préférer un sélecteur qui retourne directement le tableau, par exemple :  
  `useAccountStore((s) => s.accounts.filter((a) => !a.isArchived))`  
  pour éviter d’appeler `.map()` sur une fonction.

---

## 6. Types principaux (`types/index.ts`)

- **Account** : id, name, type, balance, color, icon, currency, isArchived, createdAt, updatedAt.
- **Transaction** : id, accountId, type, category (TransactionCategory), amount, description, date, toAccountId?, subscriptionId?, goalId?, photoUris?, voiceNoteUri?, createdAt.
- **TransactionCategory** : littéraux (salary, food, …) + `(string & {})` pour IDs personnalisés.
- **Budget** : id, category, limit, period ('weekly'|'monthly'|'yearly'), color, createdAt, updatedAt.
- **SavingsGoal** : id, name, targetAmount, currentAmount, deadline?, icon, color, accountId, isCompleted, …
- **Subscription** : id, name, amount, category, accountId, frequency, nextBillingDate, icon, color, isActive, …
- **PlannedTransaction** : type, amount, category, accountId, plannedDate, status, isRecurring, recurrence?, …
- **CATEGORIES** : liste fixe de `CategoryInfo` (id, label, icon, color, type). Les catégories personnalisées sont dans `configStore.categories` ; l’affichage doit passer par `getCategoryById`.

---

## 7. Persistance et migrations

- **Persistance** : Zustand `persist` avec `createJSONStorage(() => zustandStorage)` dans `utils/storage.ts`. Clés AsyncStorage : `@onyx_` + nom du store (ex. `@onyx_onyx-accounts`).
- **Migrations** : `utils/migrations.ts` — `CURRENT_DATA_VERSION`, `getStoredDataVersion()`, `runMigrations()`. En cas de changement de schéma, incrémenter la version et ajouter une migration dans le tableau `migrations`. Backup automatique avant migration.
- **Backup / Restore** : `createBackup()` / `restoreBackup()` (migrations) — sauvegarde toutes les clés `onyx-*` et `onyx_data_version` dans une clé de backup, restauration depuis la dernière sauvegarde.

---

## 8. Scripts npm (résumé)

| Commande | Description |
|----------|-------------|
| `npm start` | Démarrer Expo |
| `npm run android` | Lancer sur Android |
| `npm run changelog` | Générer `constants/changelog.json` depuis Git |
| `npm run icon:black` | Fond noir pour l’icône (assets) |
| `npm run prebuild` / `prebuild:android` | Générer le projet natif |
| `npm run build:android` | Build APK release (local) |
| `npm run build:android:eas` | Build APK via EAS (preview) |
| `npm run build:android:prod` | Build AAB production |
| `npm run android:clean` | Nettoyer Gradle |
| `npm run android:config` | Configurer local.properties |
| `npm run android:logcat` | Logs Android (crash) |

Détails complets dans `README.md` et `BUILD_GUIDE.md`.

---

## 9. Points techniques à respecter

1. **Liste des comptes** : utiliser `state.accounts.filter((a) => !a.isArchived)` (ou équivalent) dans les sélecteurs, pas `getActiveAccounts` comme valeur à mapper.
2. **Libellés de catégories** : utiliser `getCategoryById(id)` du configStore partout (écrans, composants, export PDF/CSV si on passe un `getCategoryLabel`).
3. **Listes de catégories pour formulaires** : utiliser `getVisibleCategories('expense')` ou `getVisibleCategories('income')` selon le type de transaction.
4. **Abonnements** : désactiver l’ajout si aucun compte actif et afficher un message explicite.
5. **Virements** : réinitialiser from/to si les comptes sélectionnés ne sont plus dans la liste (useEffect sur `accounts`).
6. **Export** : après export, afficher le nom du fichier dans l’alerte de succès (déjà fait pour data.tsx et dataExport).
7. **Rappels** : `syncReminderNotifications()` à appeler après modification des rappels ; pour la récurrence, une seule notification est planifiée à ce jour.

---

## 10. Fichiers clés par thème

- **Auth / verrouillage** : `stores/authStore.ts`, `app/_layout.tsx`, `components/auth/*`
- **Comptes** : `stores/accountStore.ts`, `app/(tabs)/accounts.tsx`, `app/account/[id].tsx`
- **Transactions** : `stores/transactionStore.ts`, `app/transaction/add.tsx`, `app/transaction/[id].tsx`, `app/transfer.tsx`
- **Catégories** : `stores/configStore.ts`, `types/index.ts` (CATEGORIES), `app/settings/categories.tsx`
- **Budgets** : `stores/budgetStore.ts`, `app/(tabs)/budgets.tsx`, `components/budgets/BudgetAssistant.tsx`
- **Objectifs** : `stores/goalStore.ts`, `app/(tabs)/goals.tsx`, `app/goal/[id].tsx`
- **Abonnements** : `stores/subscriptionStore.ts`, `app/(tabs)/more.tsx`, `app/subscription/[id].tsx`
- **Rappels** : `stores/reminderStore.ts`, `app/settings/reminders.tsx`
- **Export / Import** : `utils/migrations.ts`, `utils/dataExport.ts`, `utils/pdfExport.ts`, `app/settings/data.tsx`
- **Persistance** : `utils/storage.ts`, chaque store avec `persist(..., { name: 'onyx-...', storage: createJSONStorage(() => zustandStorage) })`

---

## 11. Conventions de commit (recommandé)

- Faire un **commit à chaque changement logique** (une feature, un fix, un refactor).
- Messages en français ou anglais, par ex. :  
  `fix: affichage catégories personnalisées partout (getCategoryById)`  
  `ux: afficher le nom du fichier dans l'alerte après export`

---

Cette documentation couvre l’essentiel pour comprendre et faire évoluer ONYX. Pour le détail des composants UI ou des écrans spécifiques, se référer aux fichiers listés dans la section 3 et 10.
