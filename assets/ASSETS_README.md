# Assets ONYX

## Fichiers requis

Vous devez créer les fichiers suivants pour le build :

### `icon.png`
- Taille : 1024x1024 pixels
- Format : PNG (sans transparence pour Android)
- Usage : Icône de l'app

### `adaptive-icon.png`
- Taille : 1024x1024 pixels
- Format : PNG avec transparence
- Usage : Icône adaptative Android (foreground)

### `splash.png`
- Taille : 1284x2778 pixels (iPhone 14 Pro Max)
- Format : PNG
- Usage : Écran de chargement

### `favicon.png`
- Taille : 48x48 pixels
- Format : PNG
- Usage : Version web

## Créer des placeholders

Pour tester rapidement, vous pouvez créer des images temporaires :

```bash
# Avec ImageMagick installé
convert -size 1024x1024 xc:#0A0A0B icon.png
convert -size 1024x1024 xc:#0A0A0B adaptive-icon.png
convert -size 1284x2778 xc:#0A0A0B splash.png
convert -size 48x48 xc:#0A0A0B favicon.png
```

Ou téléchargez des images placeholders depuis un générateur en ligne.

## Recommandations de design

- Couleur de fond : `#0A0A0B` (Onyx Black)
- Couleur d'accent : `#6366F1` (Indigo)
- Style : Minimaliste, forme de diamant/shield
