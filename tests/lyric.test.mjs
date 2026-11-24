import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {layoutEntry, STILL_W, STILL_H, MIN_LEAD, MIN_LEAD_SMALL, SMALL_CARDS} from '../src/layout.ts';
import {visibleWords, entryText} from '../src/words.ts';
import {IMPACT} from '../src/impact.ts';

const lyr = JSON.parse(fs.readFileSync('src/timing/lyrics-aligned.json', 'utf8'));
const shots = JSON.parse(fs.readFileSync('src/shots.json', 'utf8'));
const boxOf = (s, e) => { const n = e.own ? 1 : s.lyrics.filter(x => !x.own).length; return {w: e.surface.w * STILL_W, h: e.surface.h * STILL_H / n}; };   // split-off (own) boxes stand alone, as in Still

test('visibleWords reveals each word at its aligned start', () => {
  for (const [li, k] of [[0, 0], [4, 6], [22, 5], [37, 7], [52, 5]]) {
    const w = lyr[li].words[k];
    assert.equal(visibleWords(li, w.s - 0.01), k);
    assert.equal(visibleWords(li, w.s + 0.01), k + 1);
  }
});

test('entryText joins the words of a lyric entry range', () => {
  assert.equal(entryText({line: 4, from: 6, to: 9}), '"is memory! More!');
});

test('every lyric line has impact phrases that are exact substrings', () => {
  lyr.forEach((l, i) => {
    assert.ok(IMPACT[i]?.length, `line ${i} has no impact phrase`);
    for (const p of IMPACT[i]) assert.ok(l.text.includes(p), `line ${i}: "${p}" not in "${l.text}"`);
  });
});

test('layout fits every entry in its box at double the old size, impact words bigger', () => {
  for (const s of shots) for (const e of s.lyrics) {
    const box = boxOf(s, e), L = layoutEntry(e, box);
    const min = SMALL_CARDS.includes(s.id) ? MIN_LEAD_SMALL : MIN_LEAD;
    assert.ok(L.leadSize >= min, `shot ${s.id} line ${e.line}: lead ${L.leadSize} < ${min}`);
    assert.ok(L.height <= box.h + 1e-6, `shot ${s.id} line ${e.line}: height ${L.height} > ${box.h}`);
    for (const r of L.rows) assert.ok(r.width <= box.w + 1e-6, `shot ${s.id} line ${e.line}: row too wide`);
    if (L.words.some(w => w.impact)) assert.ok(L.impactSize >= 1.4 * L.leadSize, `shot ${s.id} line ${e.line}: impact not 1.4x`);
  }
});

test('mixed-case acronyms keep their spelling when an impact font uppercases', () => {
  const s = JSON.parse(fs.readFileSync('src/shots.json', 'utf8')).find(x => x.lyrics.some(e => e.line === 19));
  const e = s.lyrics.find(e => e.line === 19);
  const L = layoutEntry(e, {w: e.surface.w * STILL_W, h: e.surface.h * STILL_H / s.lyrics.length});
  assert.ok(L.words.some(w => w.text === 'SSDs'), L.words.map(w => w.text).join(' '));
});
