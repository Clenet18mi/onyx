# Rapport d'audit ONYX

**Date :** Février 2025  
**Objectifs :** Audit qualité, correction export/import JSON, implémentation des transactions prévues.

---

## 1. Export / Import JSON

### État actuel
- **Fichier :** `utils/dataExport.ts`
- **Format :** NDJSON (une ligne = un enregistrement) + support import JSON complet
- **Stores inclus :** accounts, transactions, budgets, goals, subscriptions, **plannedTransactions**, config (profil)
- **Sérialisation :** `cleanForJSON` / restauration avec reconversion des dates (champs `*Date`, `createdAt`, `updatedAt`)
- **Partage :** `expo-sharing` + `expo-file-system` (Paths/File pour SDK 54)
- **Import :** DocumentPicker (JSON/NDJSON), confirmation utilisateur avant écrasement, repli `copyToCacheDirectory` pour URIs `content://`

### Vérifications effectuées
- Tous les types sérialisables (pas de fonctions, dates en ISO)
- `plannedTransactions` inclus dans l’export et restauré via `setPlannedTransactionsForImport`
- Anciens backups sans `plannedTransactions` gérés (tableau vide par défaut)

### Utilisation
- **More** : section « Sauvegarde & restauration » → `exportDataAsJSON()` et `importDataFromJSON()`

---

## 2. Transactions prévues (dépenses / revenus futurs)

### Implémenté
| Élément | Fichier / lieu |
|--------|-----------------|
| Types | `types/index.ts` : `PlannedTransaction`, `PlannedTransactionRecurrence`, statuts |
| Store | `stores/plannedTransactionStore.ts` : CRUD, `realizePlannedTransaction`, `getUpcoming`, `getOverdue`, `getByAccount`, récurrence |
| Écran d’ajout | `app/planned-transaction/add.tsx` : type, montant, date (Aujourd’hui / Demain / +7j / +30j), compte, catégorie, description, note, récurrence (hebdo/mensuel) |
| Carte | `components/planned/PlannedTransactionCard.tsx` : affichage, actions « Réaliser » et « Annuler » |
| Dashboard | `app/(tabs)/index.tsx` : bloc « En retard », « Prochaines 7 jours », bouton « Prévoir une transaction » |
| Prévision de solde | `components/dashboard/BalanceForecast.tsx` : prise en compte des transactions prévues (pending) dans la courbe 30 jours |
| Export/Import | `utils/dataExport.ts` : `plannedTransactions` inclus et restaurés |

### Comportement
- **Réaliser :** crée une transaction réelle, marque la prévue en `realized`, optionnellement crée la prochaine occurrence si récurrente
- **Annuler :** statut `cancelled`
- **Prévision :** pour chaque jour de la courbe, les prévus du jour (pending) sont appliqués au solde projeté

---

## 3. Points d’attention (audit rapide)

- **Sécurité :** Données 100 % offline (MMKV/Zustand persist). Aucune clé ou donnée sensible envoyée en clair.
- **Stores :** Setters d’import présents (ou équivalent) pour tous les stores utilisés dans l’export (accounts, transactions, budgets, goals, subscriptions, plannedTransactions, config).
- **Dates :** Cohérence ISO string dans les types et la persistance ; conversion Date → string à l’export et string → Date à l’import là où nécessaire.
- **UX :** Confirmation avant import (écrasement des données), messages d’erreur sur échec d’export/import.

---

## 4. Tests recommandés

- [ ] Créer une transaction prévue (dépense puis revenu)
- [ ] Créer une transaction prévue récurrente (mensuelle)
- [ ] Réaliser une transaction prévue (vérifier création dans l’historique)
- [ ] Annuler une transaction prévue
- [ ] Vérifier l’affichage « En retard » et « Prochaines 7 jours » sur le dashboard
- [ ] Exporter les données (JSON/NDJSON) et vérifier la présence de `plannedTransactions`
- [ ] Importer un backup contenant des transactions prévues et vérifier la liste
- [ ] Vérifier que la courbe « Prévision de solde » réagit aux transactions prévues

---

## 5. Livrables

- **Partie A (audit / export-import) :** Export/import opérationnel, avec `plannedTransactions` et rapport ci-dessus.
- **Partie B (transactions prévues) :** Types, store, écran d’ajout, carte, intégration dashboard et prévision de solde, inclusion dans l’export/import.
