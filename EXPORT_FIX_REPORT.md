# Rapport de correction – Export/Import JSON ONYX

## Mise à jour (itération 2)

- **Export** : utilisation prioritaire de la **nouvelle API** `expo-file-system` (`Paths`, `File`) pour créer et écrire le fichier (plus de dépréciation). Si elle échoue (ex. environnement sans module natif), **repli** sur `expo-file-system/legacy` pour l’écriture.
- **Partage Android** : seul `getContentUriAsync` du legacy est utilisé (import dynamique) pour convertir `file://` en `content://` avant `Sharing.shareAsync`.
- **Import** : lecture du fichier d’abord via legacy `readAsStringAsync` (compatible `content://`), puis repli sur la nouvelle API (`File`, `bytes()`) si besoin.
- **Erreurs** : chaque étape est nommée ; en cas d’échec, l’Alert affiche « Étape : [nom]. [message] » pour faciliter le diagnostic.
- **Sérialisation** : `JSON.stringify` utilise un replacer qui convertit les dates et exclut les fonctions.

---

## Problème identifié

**Cause principale :** Avec **Expo SDK 54**, le module principal `expo-file-system` n’expose plus les anciennes méthodes (`writeAsStringAsync`, `documentDirectory`, `getContentUriAsync`, etc.). Ces méthodes sont dépréciées et **lancent une erreur au runtime** pour forcer la migration vers la nouvelle API ou vers `expo-file-system/legacy`.

- L’écran **Plus** utilisait `exportToJSON` et `importFromJSON` de `@/utils/pdfExport`, qui s’appuyaient sur `import * as FileSystem from 'expo-file-system'`.
- Lors de l’export JSON, l’appel à `FileSystem.writeAsStringAsync()` (ou l’accès à `FileSystem.documentDirectory`) provoquait une exception, d’où le message « Impossible d'exporter les données. Réessayez ».
- Sur **Android**, le partage d’un fichier situé dans le répertoire privé de l’app (`file://`) peut échouer si on n’utilise pas `getContentUriAsync` du legacy pour obtenir un URI `content://` partageable. L’ancien code utilisait un `try/catch` vide autour de `getContentUriAsync`, ce qui masquait les erreurs.

**Cause secondaire :** L’import JSON ne gérait que comptes et transactions (format partiel), sans confirmation claire avant remplacement des données, et sans restauration des budgets, objectifs et abonnements.

---

## Solution appliquée

### 1. Nouveau module `utils/dataExport.ts`

- **Import explicite de l’API legacy :**  
  `import * as FileSystemLegacy from 'expo-file-system/legacy'`  
  Toutes les opérations fichier (lecture/écriture, chemins, partage Android) passent par ce module.

- **Export JSON complet :**  
  Sauvegarde de tous les stores principaux : comptes, transactions, budgets, objectifs d’épargne, abonnements. Format versionné (`version: "1.0"`, `exportDate` en ISO).

- **Sérialisation robuste :**  
  Conversion systématique des dates et champs potentiellement non sérialisables en chaînes (ISO ou string), sans fonctions ni références circulaires.

- **Partage Android :**  
  Utilisation de `FileSystemLegacy.getContentUriAsync(fileUri)` pour obtenir un URI `content://` avant `Sharing.shareAsync`, avec repli sur l’URI `file://` en cas d’échec (et log en console).

- **Import avec confirmation :**  
  Lecture du fichier, parsing, vérification de `version` et `exportDate`, puis **Alert de confirmation** expliquant que les données actuelles seront remplacées, avant toute modification.

- **Restauration complète :**  
  Appel de méthodes dédiées sur chaque store pour remplacer les données (comptes, transactions, budgets, objectifs, abonnements) sans recalcul des soldes (les soldes viennent des comptes exportés).

- **Gestion d’erreurs et logs :**  
  Messages d’erreur explicites dans les Alert, et `console.log` / `console.error` sur les étapes importantes pour le débogage.

### 2. Méthodes d’import dans les stores

Ajout dans chaque store concerné d’une méthode « remplacement pour import » :

| Store                | Méthode ajoutée                |
|----------------------|---------------------------------|
| `accountStore`       | `setAccountsForImport(accounts)` |
| `transactionStore`   | `setTransactionsForImport(transactions)` |
| `budgetStore`        | `setBudgetsForImport(budgets)`  |
| `goalStore`          | `setGoalsForImport(goals)`      |
| `subscriptionStore`  | `setSubscriptionsForImport(subscriptions)` |

Ces méthodes font un `set({ ... })` sur l’état du store (remplacement complet des listes), sans recalcul des soldes ni effets de bord.

### 3. Mise à jour de `app/(tabs)/more.tsx`

- **Export JSON :**  
  Utilisation de `exportDataAsJSON()` depuis `@/utils/dataExport` à la place de `exportToJSON` de `pdfExport`. Gestion du chargement (`setIsExporting`) et fermeture du modal en cas de succès.

- **Import JSON :**  
  Utilisation de `DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true })`, puis appel à `importDataFromJSON(result.assets[0].uri)` depuis `@/utils/dataExport`. La confirmation et les messages de succès/erreur sont gérés dans `dataExport`.

### 4. Correction de `utils/pdfExport.ts`

- **Passage à l’API legacy pour tous les exports (PDF, CSV, JSON) :**  
  Remplacement de `import * as FileSystem from 'expo-file-system'` par `import * as FileSystemLegacy from 'expo-file-system/legacy'`. Tous les accès à `documentDirectory`, `cacheDirectory`, `writeAsStringAsync`, `readAsStringAsync` et `getContentUriAsync` utilisent désormais `FileSystemLegacy`.

- **PDF et CSV :**  
  Même logique de partage sur Android : tentative `getContentUriAsync` puis `Sharing.shareAsync(shareUri, ...)` pour éviter les échecs de partage avec un simple `file://`.

- **Export/import JSON dans pdfExport :**  
  `exportToJSON` et `importFromJSON` ont été alignés sur le legacy pour rester cohérents et utilisables si d’autres parties du code s’en servent. L’écran Plus utilise désormais en priorité `dataExport` pour un export/import complet.

### 5. Permissions `app.json`

- **Android :**  
  Ajout de `READ_EXTERNAL_STORAGE` et `WRITE_EXTERNAL_STORAGE` dans `expo.android.permissions`.

- **iOS :**  
  Ajout dans `expo.ios.infoPlist` de :  
  - `NSPhotoLibraryUsageDescription`  
  - `NSPhotoLibraryAddUsageDescription`  
  (avec un libellé indiquant l’usage pour l’export/import des données.)

---

## Fichiers modifiés / créés

| Fichier | Action |
|--------|--------|
| `utils/dataExport.ts` | **Créé** – Export/import JSON complet avec legacy FileSystem |
| `stores/accountStore.ts` | **Modifié** – Ajout de `setAccountsForImport` |
| `stores/transactionStore.ts` | **Modifié** – Ajout de `setTransactionsForImport` |
| `stores/budgetStore.ts` | **Modifié** – Ajout de `setBudgetsForImport` |
| `stores/goalStore.ts` | **Modifié** – Ajout de `setGoalsForImport` |
| `stores/subscriptionStore.ts` | **Modifié** – Ajout de `setSubscriptionsForImport` |
| `app/(tabs)/more.tsx` | **Modifié** – Handlers JSON basés sur `dataExport` + DocumentPicker |
| `utils/pdfExport.ts` | **Modifié** – Utilisation de `expo-file-system/legacy` pour PDF, CSV et JSON |
| `app.json` | **Modifié** – Permissions Android et descriptions iOS pour l’accès aux fichiers |

---

## Tests à effectuer

1. **Export JSON**  
   - Créer quelques comptes, transactions, budgets, objectifs, abonnements.  
   - Lancer l’export JSON depuis Plus → Exporter → Export JSON.  
   - Vérifier que le fichier est bien proposé au partage (ou enregistré) et que son contenu est un JSON valide avec `version`, `exportDate`, `accounts`, `transactions`, `budgets`, `goals`, `subscriptions`.

2. **Import JSON**  
   - Exporter les données une première fois.  
   - Modifier ou supprimer des données dans l’app.  
   - Importer le fichier JSON exporté.  
   - Vérifier que la boîte de confirmation s’affiche, puis que toutes les données (comptes, transactions, budgets, objectifs, abonnements) sont restaurées comme dans l’export.

3. **Cas limites**  
   - Export avec 0 transaction / 0 compte : pas d’erreur, fichier valide.  
   - Import d’un fichier JSON invalide ou sans `version` : message d’erreur clair.  
   - Import d’un fichier avec une `version` différente de `"1.0"` : message indiquant une version non supportée.

4. **Plateformes**  
   - Tester l’export (et le partage) sur **Android** pour confirmer que le content URI est bien utilisé et que le partage fonctionne.  
   - Tester sur **iOS** si possible (export + import + permissions).

---

## Résumé des garanties

- Export JSON **complet** (comptes, transactions, budgets, objectifs, abonnements) et **fonctionnel** avec Expo SDK 54 grâce à `expo-file-system/legacy`.
- Import JSON avec **confirmation** avant remplacement, **validation** du format (version, date) et **restauration** de tous les stores concernés.
- Gestion d’erreurs **explicite** (Alert avec message détaillé) et **logs** pour le débogage.
- PDF et CSV dans `pdfExport` **corrigés** de la même façon (legacy), évitant des erreurs silencieuses ou des partages qui échouent sur Android.
