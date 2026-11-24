import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DUR = 259.6;
const read = n => JSON.parse(fs.readFileSync(`src/timing/${n}.json`, 'utf8'));
const lyricLines = () => {
  const out = []; let sec = '';
  for (const raw of fs.readFileSync('docs/lyrics.txt', 'utf8').split('\n')) {
    const s = raw.trim(); if (!s) continue;
    if (s.startsWith('[')) sec = s.slice(1, -1); else out.push({section: sec, text: s});
  }
  return out;
};
const sectionOf = (name) => read('sections').find(s => s.name === name);

test('sections cover 0..259.6 contiguously in lyric order', () => {
  const ss = read('sections');
  assert.equal(ss[0].start, 0);
  assert.equal(ss.at(-1).end, DUR);
  ss.forEach((s, i) => { assert.ok(s.end > s.start, s.name); if (i) assert.equal(s.start, ss[i - 1].end); });
  assert.deepEqual(ss.map(s => s.name), [...new Set(lyricLines().map(l => l.section))]);
});

test('every lyric line is aligned, monotonic and in bounds', () => {
  const a = read('lyrics-aligned');
  assert.deepEqual(a.map(l => l.text), lyricLines().map(l => l.text));
  let last = 0;
  for (const l of a) {
    assert.equal(l.words.length, l.text.split(/\s+/).length, l.text);
    for (const w of l.words) {
      assert.ok(w.s >= last, `${w.w} ${w.s} < ${last}`);
      assert.ok(w.e >= w.s && w.e <= DUR, JSON.stringify(w));
      last = w.s;
    }
  }
});

test('no word starts before the previous word ends', () => {
  let prev = null;
  for (const l of read('lyrics-aligned')) for (const w of l.words) {
    if (prev) assert.ok(w.s >= prev.e - 0.02, `${prev.w}@${prev.e} overlaps ${w.w}@${w.s}`);
    prev = w;
  }
});

test('non-word tokens align inside their section', () => {
  const a = read('lyrics-aligned');
  for (const tok of ['480p', 'J.P.G.', 'GPUs', 'SSDs', 'VRAM', 'DIMMs', 'Xmas']) {
    const hits = a.flatMap(l => l.words.filter(w => w.w.replace(/[^\w.]/g, '').replace(/\.$/, '') === tok.replace(/\.$/, '')).map(w => ({l, w})));
    assert.ok(hits.length > 0, `no word ${tok}`);
    for (const {l, w} of hits) {
      const s = sectionOf(l.section);
      assert.ok(w.e - w.s > 0.05, `${tok} too short: ${JSON.stringify(w)}`);
      assert.ok(w.s >= s.start && w.e <= s.end, `${tok} outside ${l.section}`);
    }
  }
});

test('spoken and whispered lines sit inside their sections', () => {
  const a = read('lyrics-aligned');
  for (const key of ['umm', 'Oh no', 'Merry Christmas, Mr Sam', 'subscribe', 'Ebenezer']) {
    const l = a.find(x => x.text.includes(key));
    assert.ok(l, key);
    const s = sectionOf(l.section);
    assert.ok(l.start >= s.start && l.end <= s.end, `${key}: ${l.start}-${l.end} not in ${s.name} ${s.start}-${s.end}`);
  }
  assert.ok(a.find(x => x.text.includes('Ebenezer')).end < 256);
});
