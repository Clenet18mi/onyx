/**
 * Config plugin Expo : injecte les optimisations Gradle dans android/gradle.properties
 * lors du prebuild. Réduit le temps de build Android (cache, parallélisme, mémoire JVM).
 * Compatible Expo SDK 54.
 */

const { withGradleProperties } = require('@expo/config-plugins');

// Propriétés à merger dans android/gradle.properties (clé => valeur)
const GRADLE_OPTIMIZATIONS = {
  // === PERFORMANCES GRADLE ===
  'org.gradle.daemon': 'true',
  'org.gradle.parallel': 'true',
  'org.gradle.configureondemand': 'true',
  'org.gradle.caching': 'true',
  // === MÉMOIRE JVM (CRITIQUE pour éviter OOM et accélérer) ===
  'org.gradle.jvmargs':
    '-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -XX:+UseParallelGC',
  // === WORKERS PARALLÈLES ===
  'org.gradle.workers.max': '4',
  // === KOTLIN INCREMENTAL ===
  'kotlin.incremental': 'true',
  'kotlin.incremental.js': 'true',
  'kotlin.incremental.js.ir': 'true',
  // === ANDROID OPTIMIZATIONS ===
  'android.useAndroidX': 'true',
  'android.enableJetifier': 'true',
  'android.enableR8.fullMode': 'true',
  'android.enableD8': 'true',
  'android.enableBuildCache': 'true',
};

function mergeGradleProperties(propertiesList) {
  const keyToIndex = new Map();
  propertiesList.forEach((item, index) => {
    if (item.type === 'property') keyToIndex.set(item.key, index);
  });

  const result = [...propertiesList];
  for (const [key, value] of Object.entries(GRADLE_OPTIMIZATIONS)) {
    if (keyToIndex.has(key)) {
      result[keyToIndex.get(key)] = { type: 'property', key, value };
    } else {
      result.push({ type: 'property', key, value });
      keyToIndex.set(key, result.length - 1);
    }
  }
  return result;
}

function withGradleOptimization(config) {
  return withGradleProperties(config, (config, { modResults }) => {
    return mergeGradleProperties(modResults);
  });
}

module.exports = withGradleOptimization;
