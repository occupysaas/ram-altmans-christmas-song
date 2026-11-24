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

test('audio features are 24 fps over 6231 frames', () => {
  const a = read('audio');
  assert.equal(a.fps, 24);
  assert.equal(a.duration, DUR);
  for (const [k, env] of Object.entries(a.env)) assert.equal(env.length, 6231, k);
  assert.ok(a.kicks.length > 50 && a.snares.length > 50);
});

test('stops are ordered and inside their sections', () => {
  const i = read('impact'), a = read('lyrics-aligned');
  const v2 = sectionOf('Verse 2');
  assert.ok(i.stash > v2.start && i.stash < v2.end, `stash ${i.stash}`);
  const stashWord = a.flatMap(l => l.words).find(w => w.w.startsWith('stash'));
  assert.ok(i.stash < stashWord.s, 'stop precedes "stash"');
  const merry = a.find(l => l.text.startsWith('Merry Christmas'));
  assert.equal(i.knocks.length, 3);
  assert.ok(i.knocks[0] < i.knocks[1] && i.knocks[1] < i.knocks[2]);
  assert.ok(i.knocks[2] - i.knocks[0] < 2.5);
  assert.ok(i.knocks[2] < merry.start, `knocks ${i.knocks} before ${merry.start}`);
  const lastE = a.at(-1).words.at(-1).e;
  assert.ok(i.silence >= lastE - 0.05 && i.silence < DUR, `silence ${i.silence} vs last word ${lastE}`);
});
