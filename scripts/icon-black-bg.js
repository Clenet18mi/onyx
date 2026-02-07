#!/usr/bin/env node
// Pose l'icône ONYX sur un fond noir (remplace la transparence).
const sharp = require('sharp');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ICON = path.join(ROOT, 'assets', 'icon.png');

async function run() {
  const img = sharp(ICON);
  const meta = await img.metadata();
  const w = meta.width || 1024;
  const h = meta.height || 1024;

  const blackBg = Buffer.from(
    require('fs').readFileSync(ICON)
  );

  const out = await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: await img.png().toBuffer(), top: 0, left: 0 }])
    .png()
    .toBuffer();

  require('fs').writeFileSync(path.join(ROOT, 'assets', 'icon.png'), out);
  require('fs').writeFileSync(path.join(ROOT, 'assets', 'adaptive-icon.png'), out);
  console.log('[ONYX] Icon + adaptive-icon updated with black background.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
