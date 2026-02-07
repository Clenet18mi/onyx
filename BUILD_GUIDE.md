# 🔨 Guide de Build APK - ONYX

Guide complet pour créer ton APK et gérer les mises à jour.

---

## 📋 Prérequis

### 1. Installer les outils

```bash
# Installer Node.js 18+ depuis https://nodejs.org/

# Installer EAS CLI
npm install -g eas-cli

# Vérifier l'installation
eas --version
```

### 2. Créer un compte Expo

1. Va sur https://expo.dev/signup
2. Crée un compte gratuit
3. Connecte-toi :

```bash
eas login
```

---

## 🚀 Build APK - Étapes

### Étape 1 : Installer les dépendances

```bash
cd ~/Onyx
npm install
```

### Étape 2 : Configurer EAS (première fois uniquement)

```bash
eas build:configure
```

Réponds aux questions :
- Platform : Android
- Accepte les valeurs par défaut

### Étape 3 : Lancer le build

```bash
# Build APK de test/preview (recommandé)
npm run build:android:eas

# Ou directement EAS
eas build --platform android --profile preview
```

> **Toutes les commandes npm** (build local, prebuild, changelog, etc.) sont listées dans le **README.md** section « Scripts npm / Commandes ».

### Étape 4 : Attendre et télécharger

- Le build prend **15-20 minutes**
- Tu peux suivre la progression sur https://expo.dev
- Une fois terminé, télécharge l'APK depuis le lien fourni

### Étape 5 : Installer l'APK

1. Transfère l'APK sur ton téléphone
2. Active "Sources inconnues" dans Paramètres > Sécurité
3. Installe l'APK
4. Lance ONYX ! 🎉

---

## 📁 Fichiers de Configuration

### app.json

```json
{
  "expo": {
    "name": "ONYX",
    "slug": "onyx",
    "version": "1.0.0",          // Version affichée
    "android": {
      "package": "com.onyx.finance",
      "versionCode": 1           // INCRÉMENTER à chaque build
    }
  }
}
```

### eas.json

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"        // Génère un APK
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle" // Pour Play Store
      }
    }
  }
}
```

---

## 🔄 Mettre à Jour l'App

### Commandes utiles avant release

```bash
# Mettre à jour le journal des versions (depuis les commits Git)
npm run changelog

# (Optionnel) Appliquer un fond noir à l'icône
npm run icon:black
```

### Workflow pour chaque mise à jour

1. **Modifie** le code
2. **Incrémente** la version dans `app.json` (et `package.json` si besoin) :
   ```json
   "version": "1.0.0" → "1.1.0"
   "versionCode": 1 → 2
   ```
3. **Build** le nouvel APK :
   ```bash
   npm run build:android:eas
   ```
   (Ou build local : `npm run build:android` après `npm run prebuild:android`.)
4. **Installe** par-dessus l'ancienne version
5. **Les données sont préservées !** ✅

### Tableau des versions

| Build | version | versionCode | Notes |
|-------|---------|-------------|-------|
| 1er   | 1.0.0   | 1           | Initial |
| 2ème  | 1.1.0   | 2           | Nouvelles fonctionnalités |
| 3ème  | 1.1.1   | 3           | Corrections de bugs |
| 4ème  | 1.2.0   | 4           | Mise à jour majeure |

---

## 💾 Préserver les Données

### Ce qui préserve les données

| Action | Données |
|--------|---------|
| ✅ Installer mise à jour (même package) | Préservées |
| ✅ Fermer/rouvrir l'app | Préservées |
| ❌ Désinstaller l'app | Perdues |
| ❌ Vider les données (Paramètres Android) | Perdues |
| ❌ Changer le package name | Perdues |

### Système de migrations

Si tu modifies la structure des données :

1. **Ouvre** `utils/migrations.ts`
2. **Incrémente** `CURRENT_DATA_VERSION`
3. **Ajoute** une migration :

```typescript
const migrations: Migration[] = [
  {
    version: 2,
    name: 'Add currency to accounts',
    up: () => {
      const data = storage.getString('onyx-accounts');
      if (data) {
        const parsed = JSON.parse(data);
        parsed.state.accounts = parsed.state.accounts.map((acc: any) => ({
          ...acc,
          currency: acc.currency || 'EUR',
        }));
        storage.set('onyx-accounts', JSON.stringify(parsed));
      }
    },
  },
];
```

---

## 🛠 Commandes Utiles

```bash
# Build APK preview
eas build -p android --profile preview

# Build AAB pour Play Store
eas build -p android --profile production

# Voir les builds en cours
eas build:list

# Annuler un build
eas build:cancel

# Nettoyer le cache
rm -rf node_modules/.cache .expo
npm start -- --clear
```

---

## 🐛 Résolution de Problèmes

### "App not installed"
- Vérifie que le `versionCode` est supérieur à l'ancien
- Vérifie que le package name est identique

### Build échoue
```bash
# Nettoyer et réessayer
rm -rf node_modules
npm install
eas build --clear-cache -p android --profile preview
```

### Données perdues après mise à jour
- As-tu changé le `package` dans app.json ?
- As-tu désinstallé l'app avant de réinstaller ?

---

## ✅ Checklist Avant Release

- [ ] Code testé
- [ ] `version` incrémentée dans app.json
- [ ] `versionCode` incrémenté
- [ ] Migration ajoutée si nécessaire
- [ ] Build lancé
- [ ] APK téléchargé
- [ ] Test d'installation par-dessus ancienne version
- [ ] Données préservées

---

## 📊 Commandes Rapides

```bash
# === BUILD ===
npm run build:android        # APK preview
npm run build:android:prod   # AAB production

# === DÉVELOPPEMENT ===
npm start                    # Démarrer Expo
npm start -- --clear         # Démarrer avec cache nettoyé
```

---

Bonne création d'APK ! 🚀
