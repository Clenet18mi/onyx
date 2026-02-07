#!/usr/bin/env node
// ============================================
// ONYX - Génère constants/changelog.json depuis l'historique Git
// Usage: node scripts/generate-changelog.js
// ============================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PKG = require(path.join(ROOT, 'package.json'));
const OUT = path.join(ROOT, 'constants', 'changelog.json');

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const appVersion = PKG.version || '1.0.0';
const buildNumber = run('git rev-list --count HEAD') || '0';
const generatedAt = new Date().toISOString();

// Derniers commits : hash court | sujet | date
const logFormat = '%h|%s|%ad';
const raw = run(`git log -n 80 --pretty=format:"${logFormat}" --date=short`);
const lines = raw
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [hash, ...rest] = line.split('|');
    const date = rest.pop() || '';
    const subject = rest.join('|').replace(/^"|"$/g, '').trim();
    return { hash, subject, date };
  });

// Grouper par version : on met tout sous la version actuelle (1.0.0)
// Option future : détecter les tags git (v1.0.0) pour découper
const entries = [
  {
    version: appVersion,
    date: lines[0]?.date || new Date().toISOString().split('T')[0],
    logs: lines.map((l) => l.subject),
  },
];

const data = {
  appVersion,
  buildNumber: String(buildNumber),
  generatedAt,
  entries,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 2), 'utf8');
console.log('[ONYX] Changelog generated:', OUT, '| version', appVersion, '| build', buildNumber);
