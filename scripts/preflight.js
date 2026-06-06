#!/usr/bin/env node
// Pre-zip guard (build plan §12.5): refuses to ship a drop whose manifest
// drifted from the locked stack. Born from the SDK-downgrade incident (Gaps #22).
const fs = require('fs');
const path = require('path');

const LOCKED = {
  expo: '^56.0.8',
  react: '19.2.3',
  'react-native': '0.85.3',
  main: 'index.ts',
};

const appDir = path.join(__dirname, '..', 'app');
const pkg = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8'));
const errors = [];

if (pkg.main !== LOCKED.main) {
  errors.push(`main is "${pkg.main}" — locked stack requires "${LOCKED.main}"`);
}
for (const dep of ['expo', 'react', 'react-native']) {
  const got = pkg.dependencies?.[dep];
  if (got !== LOCKED[dep]) {
    errors.push(`${dep} is "${got}" — locked stack requires "${LOCKED[dep]}"`);
  }
}
if (!fs.existsSync(path.join(appDir, 'index.ts'))) {
  errors.push('index.ts entry file is missing');
}
if (fs.existsSync(path.join(appDir, 'app.json'))) {
  const appJson = JSON.parse(fs.readFileSync(path.join(appDir, 'app.json'), 'utf8'));
  if (appJson.expo?.sdkVersion) {
    errors.push(`app.json pins sdkVersion "${appJson.expo.sdkVersion}" — must not be pinned`);
  }
}

// Phantom-dependency scan: every non-relative import in the app must exist in
// package.json. (Born from the safe-area-context incident — a package that worked
// only as someone else's transitive dependency until a clean install pruned it.)
const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const importRe = /(?:from|import)\s+['"]([^'".][^'"]*)['"]/g;
function scanFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = importRe.exec(src)) !== null) {
    const spec = m[1];
    const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
    if (!allDeps[name]) errors.push(`${path.relative(appDir, file)} imports "${name}" — not in package.json`);
  }
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) scanFile(full);
  }
}
walk(path.join(appDir, 'src'));
['App.tsx', 'index.ts'].forEach((f) => scanFile(path.join(appDir, f)));

if (errors.length) {
  console.error('✗ PREFLIGHT FAILED — do not ship this zip:');
  errors.forEach((e) => console.error('  · ' + e));
  process.exit(1);
}
console.log('✓ Preflight passed — manifest matches the locked stack (SDK 56).');
