import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fitText, STILL_W, STILL_H, MIN_FONT, CAPTION_BAND} from '../src/fitText.ts';
import {visibleWords, entryText} from '../src/words.ts';

const lyr = JSON.parse(fs.readFileSync('src/timing/lyrics-aligned.json', 'utf8'));
const shots = JSON.parse(fs.readFileSync('src/shots.json', 'utf8'));

test('visibleWords reveals each word at its aligned start', () => {
  for (const [li, k] of [[0, 0], [4, 6], [22, 5], [37, 7], [52, 5]]) {
    const w = lyr[li].words[k];
    assert.equal(visibleWords(li, w.s - 0.01), k, `line ${li} word ${k} before`);
    assert.equal(visibleWords(li, w.s + 0.01), k + 1, `line ${li} word ${k} after`);
  }
  assert.equal(visibleWords(0, 0), 0);
  assert.equal(visibleWords(0, 259), lyr[0].words.length);
});

test('entryText joins the words of a lyric entry range', () => {
  assert.equal(entryText({line: 4, from: 6, to: 9}), '"is memory! More!');
});

test('fitText keeps every line inside its surface box', () => {
  for (const s of shots) {
    const n = s.lyrics.filter(e => !e.carry).length;
    for (const e of s.lyrics) {
      // in-world entries share their surface; carried lines go to the screen-space caption band
      const box = e.carry ? CAPTION_BAND : {w: e.surface.w * STILL_W, h: e.surface.h * STILL_H / n};
      const r = fitText(entryText(e), box, e.style);
      assert.ok(r.fontSize >= MIN_FONT, `shot ${s.id} line ${e.line}: font ${r.fontSize} < ${MIN_FONT}`);
      assert.ok(r.lines.length * r.fontSize * 1.15 <= box.h + 1e-6, `shot ${s.id} line ${e.line}: ${r.lines.length} lines too tall`);
      for (const l of r.lines) assert.ok(r.estimateWidth(l) <= box.w + 1e-6, `shot ${s.id} line ${e.line}: "${l}" too wide`);
    }
  }
});
