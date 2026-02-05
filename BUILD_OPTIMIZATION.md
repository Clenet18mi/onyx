# Optimisation des builds Android - ONYX

Documentation des optimisations appliquees et des bonnes pratiques pour reduire le temps de compilation Android.

---

## Objectifs chiffres

| Scenario | Avant optimisation | Apres optimisation (attendu) |
|----------|--------------------|------------------------------|
| Premier build (full) | ~1h20 | 8–15 min |
| Builds suivants (incrementaux) | ~1h20 | 2–5 min |

---

## Optimisations appliquees

### 1. Plugin `gradle-optimization` (prebuild)

Lors de `expo prebuild --platform android`, le plugin `./plugins/gradle-optimization.js` injecte dans `android/gradle.properties` :

- **Daemon + cache + parallele :** `org.gradle.daemon`, `org.gradle.caching`, `org.gradle.parallel`, `org.gradle.configureondemand`
- **Memoire JVM :** `org.gradle.jvmargs=-Xmx4096m ...` (evite OOM et accelere)
- **Workers :** `org.gradle.workers.max=4`
- **Kotlin incremental :** `kotlin.incremental`, etc.
- **Android :** `android.enableR8.fullMode`, `android.enableBuildCache`, etc.

### 2. expo-build-properties (app.json)

- **Minification / R8 :** `enableMinifyInReleaseBuilds: true`
- **Shrink resources :** `enableShrinkResourcesInReleaseBuilds: true`
- **Packaging :** `pickFirst` pour `libc++_shared.so` (evite conflits de libs natives)
- **ProGuard :** regles keep pour React Native, Hermes, Expo, MMKV + optimisations et suppression des logs en release

### 3. Script de build (`build-android.ps1`)

- Appel Gradle avec : `--build-cache --parallel --max-workers=4`
- Application de secours des optimisations Gradle via `scripts/apply-gradle-optimizations.ps1` si `android/` existe deja

### 4. Scripts npm

- `android:clean` — nettoie le projet Android (`gradlew clean`)
- `android:build` — build release via `build-android.ps1` (prebuild si besoin + assembleRelease)
- `android:build:debug` — build debug
- `android:build:fast` — prebuild si absent puis assembleRelease avec cache et parallele
- `prebuild:clean` — regenere `android/` avec `expo prebuild --platform android --clean`

---

## Quand faire un clean ?

Faire **android:clean** (ou supprimer `android/` et refaire prebuild) seulement si :

- Changement de dependances dans `build.gradle` (ou changement de version Expo/React Native)
- Erreurs de compilation persistantes
- Passage a une autre version majeure du SDK / RN

Pour les builds quotidiens, **ne pas faire clean** pour garder des builds incrementaux rapides.

---

## Commandes recommandees

### Premier build (ou apres clean / changement de config)

```powershell
npm run prebuild:android
npm run android:build
```

Temps attendu : **8–15 minutes** (selon machine et cache froid).

### Builds suivants (incrementaux)

```powershell
npm run android:build
```

Temps attendu : **2–5 minutes**.

### Nettoyage complet (si necessaire)

```powershell
npm run android:clean
npm run android:build
```

### Build EAS (cloud)

```powershell
npm run build:android:eas
```

---

## Contenu recommande pour `android/.gitignore`

Si vous versionnez le dossier `android/` (workflow bare/custom), assurez-vous que `android/.gitignore` contient au minimum :

```
# Build outputs
build/
.gradle/
*.iml
local.properties

# Keystores (NE PAS VERSIONNER)
*.keystore
*.jks
keystore.properties

# Caches
.cxx/
.externalNativeBuild/
```

Dans ce projet, `android/` est genere par prebuild et est liste dans le `.gitignore` racine ; un `.gitignore` dans `android/` est cree par Expo au prebuild.
