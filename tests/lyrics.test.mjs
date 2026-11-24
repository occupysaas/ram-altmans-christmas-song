import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const raw = () => fs.readFileSync('docs/lyrics.txt', 'utf8');
const rows = () => raw().split('\n').map(s => s.trim()).filter(Boolean);
const lines = () => rows().filter(s => !s.startsWith('['));
const sungForms = () => JSON.parse(fs.readFileSync('docs/sung-forms.json', 'utf8'));
export const keyFor = w => w.replace(/[^A-Za-z0-9.']/g, '').replace(/\.+$/, '');
export const tokenFor = (w, forms) => forms[keyFor(w)] ?? keyFor(w).toLowerCase().replace(/[^a-z']/g, '');

test('display lyrics use corrected spelling', () => {
  const t = raw();
  for (const s of ['Jim Carrey', 'Ebenezer Scrooge!', "you're the best", 'He shoved the SSDs', "my school's", 'Ten Xmas Facts'])
    assert.ok(t.includes(s), `missing: ${s}`);
  for (const s of ['Carry ', 'Ebonezer', 'your the best', 'He he', 'my my', '[full stop', '[Full Stop', 'Nocks'])
    assert.ok(!t.includes(s), `should not contain: ${s}`);
});

test('every display word maps to a-z tokens', () => {
  const forms = sungForms();
  for (const l of lines()) for (const w of l.split(/\s+/)) {
    const tok = tokenFor(w, forms);
    assert.match(tok, /^[a-z' ]+$/, `word "${w}" in "${l}" -> "${tok}"`);
    if (/\d/.test(w)) assert.ok(forms[keyFor(w)], `digits need a sung form: ${w}`);
  }
});

test('sections are the nine design sections in order', () => {
  const secs = rows().filter(s => s.startsWith('[')).map(s => s.slice(1, -1));
  assert.deepEqual(secs, ['Intro', 'Verse 1', 'Chorus 1', 'Verse 2', 'Chorus 2', 'Bridge', 'Final Chorus', 'Ending', 'Outro']);
});
