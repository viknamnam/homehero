#!/usr/bin/env node
// Copy lint — fails the build if banned phrases appear in user-facing string files.
// Mirrors Phase0_Copy_Library.md §10. Run: node scripts/copy-lint.js
const fs = require('fs');
const path = require('path');

const BANNED = [
  'you did less', 'lowest contributor', 'behind on', 'unfair', 'owes', 'owed',
  'debt', 'salary', 'payment due', 'failed', 'failure', 'lazy', 'not helping',
  'not contributing', 'who is not', 'falling short', 'underperform', 'catch up',
  'you forgot', "don't forget", 'poor balance', 'bad balance', 'warning',
];

const TARGET = path.join(__dirname, '..', 'app', 'src', 'copy');
let failures = 0;

for (const file of fs.readdirSync(TARGET)) {
  const text = fs.readFileSync(path.join(TARGET, file), 'utf8').toLowerCase();
  for (const phrase of BANNED) {
    let idx = text.indexOf(phrase);
    while (idx !== -1) {
      const line = text.slice(0, idx).split('\n').length;
      console.error(`✗ ${file}:${line} contains banned phrase "${phrase}"`);
      failures++;
      idx = text.indexOf(phrase, idx + 1);
    }
  }
}

if (failures > 0) {
  console.error(`\nCopy lint failed: ${failures} banned phrase(s). See Phase0_Copy_Library.md §10 for use-instead wording.`);
  process.exit(1);
}
console.log('✓ Copy lint passed — all strings clear of banned phrases.');
