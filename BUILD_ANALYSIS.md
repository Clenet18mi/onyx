# Rapport d'analyse - Optimisation build Android ONYX

## 1. Configuration actuelle detectee

- **Stack :** React Native 0.81.5, Expo SDK 54, TypeScript
- **Workflow :** Gestion des projets Expo (prebuild) — le dossier `android/` est genere par `expo prebuild --platform android` et n'est pas versionne.
- **Script de build :** `build-android.ps1` (PowerShell) appelle `gradlew.bat assembleRelease` ou `assembleDebug` apres generation de `android/` et `local.properties` si necessaire.
- **Probleme signale :** Build Android ~1h20 (trop lent).

---

## 2. Problemes identifies

| Probleme | Impact |
|----------|--------|
| Aucune option Gradle de type cache/parallele dans l'appel `gradlew` | Builds non optimises |
| Pas de proprietes JVM/memoire dans `gradle.properties` (fichier genere par prebuild) | Risque OOM, sous-utilisation CPU |
| Pas de daemon/cache/workers configures dans les proprietes Gradle | Chaque build repart sans benefice de cache |
| Minification/shrink resources non explicites dans la config Expo | APK non optimise, R8 peut etre sous-utilise |
| Pas de regles ProGuard/keep pour les libs (RN, Expo, MMKV) | Risque de crash en release si obfuscation agressive |
| Clean non documente / pas de scripts dedies | Utilisateurs font des full rebuild inutiles |

---

## 3. Optimisations appliquees

### 3.1 Plugin Expo `gradle-optimization`

- **Fichier :** `plugins/gradle-optimization.js`
- **Rôle :** Modifie `android/gradle.properties` au prebuild via `withGradleProperties`.
- **Contenu injecte :** daemon, parallel, configureOnDemand, caching, jvmargs (4 Go heap, UseParallelGC), workers.max=4, Kotlin incremental, Android R8/D8/BuildCache.

### 3.2 expo-build-properties (app.json)

- **Rôle :** Minification release, shrink resources, packagingOptions (pickFirst libc++_shared.so), extraProguardRules (keep RN/Expo/MMKV, optimisations, suppression logs).

### 3.3 Scripts

- **build-android.ps1 :** Appel Gradle avec `--build-cache --parallel --max-workers=4` ; application de secours des optimisations Gradle si `android/` existe.
- **scripts/apply-gradle-optimizations.ps1 :** Merge manuel des memes proprietes dans `android/gradle.properties` (secours).
- **package.json :** `android:clean`, `android:build`, `android:build:debug`, `android:build:fast`, `prebuild:clean`.

### 3.4 Documentation

- **DIAGNOSTIC.md :** JDK, Gradle, RAM, antivirus, exclusions, commandes de verification.
- **BUILD_OPTIMIZATION.md :** Objectifs chiffres, quand faire clean, commandes recommandees, contenu recommande pour `android/.gitignore`.
- **docs/proguard-rules.pro.template :** Reference des regles ProGuard (les regles actives sont dans app.json).

---

## 4. Temps de build attendu

| Scenario | Avant | Apres |
|----------|--------|--------|
| Premier build (full) | ~1h20 | 8–15 min |
| Builds suivants (incrementaux) | ~1h20 | 2–5 min |

Les gains viennent du cache Gradle, du build parallele, de la JVM mieux dimensionnee et du fait d'eviter les clean inutiles.

---

## 5. Commandes a executer

### Configuration initiale (une fois)

1. Verifier JDK 17 et JAVA_HOME (voir DIAGNOSTIC.md).
2. Creer/mettre a jour le fichier utilisateur Gradle (optionnel mais recommande) :
   - Fichier : `C:\Users\miloc\.gradle\gradle.properties`
   - Contenu : voir section 6 ci-dessous.
3. Exclusions antivirus pour `onyx\android`, `.gradle`, Android Sdk (voir DIAGNOSTIC.md).

### Build optimise (a chaque fois)

```powershell
# Premier build ou apres changement de deps / prebuild
npm run prebuild:android
npm run android:build

# Builds suivants (incrementaux)
npm run android:build
```

### Troubleshooting

```powershell
# Nettoyer et rebuilder
npm run android:clean
npm run android:build

# Recreer entierement android/
npm run prebuild:clean
npm run android:build
```

---

## 6. Fichier Gradle utilisateur (optionnel)

Creer ou modifier `C:\Users\miloc\.gradle\gradle.properties` :

```properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError
org.gradle.workers.max=4
```

Cela s'applique a tous les projets Gradle de l'utilisateur et renforce les optimisations du projet.

---

## 7. Fichiers modifies ou crees

| Fichier | Action |
|---------|--------|
| `plugins/gradle-optimization.js` | Cree |
| `app.json` | Modifie (plugins gradle-optimization + expo-build-properties) |
| `build-android.ps1` | Modifie (args Gradle + appel apply-gradle-optimizations) |
| `scripts/apply-gradle-optimizations.ps1` | Cree |
| `package.json` | Modifie (scripts android:clean, android:build, etc.) |
| `docs/proguard-rules.pro.template` | Cree |
| `DIAGNOSTIC.md` | Cree |
| `BUILD_OPTIMIZATION.md` | Cree |
| `BUILD_ANALYSIS.md` | Cree (ce fichier) |

---

## 8. Compatibilite

- **Expo SDK 54 :** oui (expo-build-properties ~1.0.10, config-plugins avec withGradleProperties).
- **Windows / PowerShell :** toutes les commandes sont en PowerShell.
- **Signature release :** non modifiee ; si vous aviez une config de signature (keystore) dans `android/`, elle reste geree par le build Gradle genere par prebuild.
