# Diagnostic build Android - ONYX

Checklist systeme et configuration pour des builds Android rapides.

---

## A) Configuration JDK

- **Version requise :** JDK 17 (Expo SDK 54 / React Native 0.81)
- Verifier :
  ```powershell
  java -version
  ```
  Attendu : `openjdk version "17.x.x"` ou equivalent.
- Verifier `JAVA_HOME` :
  ```powershell
  $env:JAVA_HOME
  ```
  Doit pointer vers le repertoire d'installation du JDK 17 (ex. `C:\Program Files\Microsoft\jdk-17.x.x`).

---

## B) Configuration Gradle

- **Wrapper :** La version est dans `android/gradle/wrapper/gradle-wrapper.properties` (apres prebuild).
- Verifier la version Gradle utilisee (dans le fichier wrapper) : typiquement 8.x pour Expo 54.
- **Cache Gradle :** `C:\Users\miloc\.gradle\caches` — s'assurer que l'antivirus n'y scanne pas en temps reel.

---

## C) Ressources systeme

- **RAM :** Minimum 8 Go recommande ; 16 Go pour des builds plus confortables.
- **Espace disque :** Au moins 10 Go libres pour le cache Gradle et les builds.
- **SSD :** Fortement recommande pour le dossier projet et `.gradle`.

---

## D) Antivirus – exclusions recommandées

Ajouter des exclusions (analyse en temps reel / scan) pour :

| Chemin |
|--------|
| `C:\Users\miloc\Desktop\onyx\android` |
| `C:\Users\miloc\.gradle` |
| `C:\Users\miloc\AppData\Local\Android\Sdk` |
| `C:\Users\miloc\Desktop\onyx\node_modules` |

Cela reduit fortement le temps de build.

---

## E) Commandes de verification rapide

```powershell
# JDK
java -version
echo $env:JAVA_HOME

# Node (pour Expo)
node -v
npm -v

# Android SDK (si ANDROID_HOME defini)
echo $env:ANDROID_HOME
# Ou emplacement par defaut : $env:LOCALAPPDATA\Android\Sdk
```

---

## F) En cas de build lent ou echec

1. Nettoyer et reconstruire :
   ```powershell
   npm run android:clean
   npm run android:build
   ```
2. Si le dossier `android` a ete modifie a la main, regenerer :
   ```powershell
   npm run prebuild:clean
   npm run android:build
   ```
3. Verifier qu'aucun processus `java` ou `gradle` ne reste bloque (Gestionnaire des taches).
4. Supprimer le cache Gradle utilisateur en dernier recours :
   ```powershell
   Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches
   ```
   Le prochain build sera un full rebuild (plus long).
