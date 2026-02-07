# Checklist release ONYX

## Avant chaque release

### Code
- [ ] Aucun warning TypeScript
- [ ] Pas de `console.log` inutiles (sauf logs d’erreur)
- [ ] Pas de TODO critiques laissés en l’état

### Sécurité
- [ ] PIN uniquement stocké sous forme de hash (SHA-256)
- [ ] Aucune clé ou donnée sensible en clair dans le code

### Documentation
- [ ] `CHANGELOG.md` à jour
- [ ] Version et build incrémentés (`app.json`)

### Tests manuels
- [ ] Test sur un appareil Android réel
- [ ] Export / import JSON
- [ ] Déverrouillage par PIN et (si dispo) biométrie
- [ ] Changer le PIN (Paramètres → Sécurité)

### Assets
- [ ] Icône et splash à jour si besoin
- [ ] Screenshots pour store si publication

## Build release (Android)

```bash
# 1. Nettoyer
cd android
./gradlew clean
cd ..

# 2. Incrémenter version dans app.json (version + versionCode pour Android)

# 3. Build
cd android
./gradlew assembleRelease

# 4. Vérifier l’APK
# Fichier : app/build/outputs/apk/release/app-release.apk
```

## Après la release

- [ ] Tag Git : `git tag v1.0.0`
- [ ] Push du tag : `git push origin v1.0.0`
- [ ] Créer une GitHub Release et y attacher l’APK si besoin

## Note sur le chiffrement stockage

Le projet utilise actuellement AsyncStorage pour la persistance. Un chiffrement au repos (ex. MMKV avec clé dans SecureStore) peut être ajouté dans une version ultérieure pour renforcer encore la sécurité des données.
