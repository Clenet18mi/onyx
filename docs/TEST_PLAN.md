# Plan de tests ONYX

## Tests fonctionnels

### Authentification
- [ ] Créer un PIN à 4 chiffres
- [ ] Créer un PIN à 6 chiffres
- [ ] Déverrouiller avec le bon PIN
- [ ] Refus avec un mauvais PIN
- [ ] Blocage après 5 tentatives (attendre le délai ou vérifier le message)
- [ ] Déverrouillage biométrique (si disponible)
- [ ] Changer le PIN (Paramètres → Sécurité)
- [ ] Option « Effacer après 10 échecs » : activation + avertissement

### Comptes
- [ ] Créer un compte (chaque type)
- [ ] Modifier un compte
- [ ] Supprimer un compte vide
- [ ] Vérifier que le solde se met à jour après une transaction

### Transactions
- [ ] Ajouter une dépense
- [ ] Ajouter un revenu
- [ ] Modifier / supprimer une transaction
- [ ] Vérifier la cohérence du solde
- [ ] Créer un virement entre deux comptes

### Budgets et objectifs
- [ ] Créer un budget
- [ ] Alerte en cas de dépassement
- [ ] Créer un objectif d’épargne et suivre la progression

### Export / import
- [ ] Exporter en JSON
- [ ] Importer un JSON et vérifier les données
- [ ] Exporter en CSV / PDF (si disponible)

## Tests sécurité

- [ ] Vérifier qu’aucun PIN en clair n’est stocké (hash uniquement)
- [ ] Limitation des tentatives PIN (5 → blocage)
- [ ] Message clair en cas de blocage (temps restant)

## Tests de performance

- [ ] Scroll fluide avec un grand nombre de transactions (ex. 500+)
- [ ] Export rapide pour un volume raisonnable (ex. &lt; 5 s pour 1000 transactions)
- [ ] Pas de freeze de l’interface lors des calculs (stats, graphiques)

## Cas limites

- [ ] Aucun compte : message adapté
- [ ] Aucune transaction : vues vides correctes
- [ ] Import d’un fichier JSON invalide : message d’erreur
- [ ] Montant 0 ou négatif : refus ou message clair
- [ ] Dates extrêmes (très anciennes / très futures) : validation ou message

## Intégrité des données

- [ ] Après import : pas de transactions orphelines (compte supprimé)
- [ ] Soldes des comptes cohérents avec la somme des transactions (optionnel, voir `checkDataIntegrity`)
