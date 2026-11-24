import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DUR = 259.6;
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shots = () => read('src/shots.json');
const byId = id => shots().find(x => x.id === id);
const lyr = () => read('src/timing/lyrics-aligned.json');
const impact = () => read('src/timing/impact.json');

test('64 shots (57 removed in pass 3) plus sub-shot 13b tile 0..259.6 with no gaps', () => {
  const s = shots();
  const expected = Array.from({length: 65}, (_, i) => String(i + 1).padStart(2, '0')).filter(id => id !== '57');
  expected.splice(13, 0, '13b');
  assert.deepEqual(s.map(x => x.id), expected);
  assert.equal(s[0].start, 0);
  assert.equal(s.at(-1).end, DUR);
  s.forEach((x, i) => {
    assert.ok(x.end - x.start >= 0.5, `shot ${x.id} too short: ${x.end - x.start}`);
    if (i) assert.equal(x.start, s[i - 1].end);
  });
});

test('every lyric line is assigned to a shot that contains its start', () => {
  const s = shots();
  lyr().forEach((l, i) => {
    const owner = s.find(x => x.lyrics.some(e => e.line === i && e.from === 0));
    assert.ok(owner, `line ${i} unassigned`);
    assert.ok(l.start >= owner.start && l.start < owner.end, `line ${i} start ${l.start} outside shot ${owner.id}`);
  });
});

test('every word of every line appears in the shot playing when it is sung', () => {
  const s = shots();
  lyr().forEach((l, i) => l.words.forEach((w, k) => {
    const shot = s.find(x => w.s >= x.start && w.s < x.end);
    assert.ok(shot.lyrics.some(e => e.line === i && e.from <= k && k < e.to), `line ${i} word ${k} "${w.w}" missing from shot ${shot.id}`);
  }));
});

test('no lyric is repeated as a bottom caption (user: no CC-style duplicates)', () => {
  for (const x of shots()) for (const e of x.lyrics) assert.ok(!e.carry, `shot ${x.id} has a carried caption for line ${e.line}`);
});

test('every lyric entry has a text tone matched to the art under it', () => {
  for (const x of shots()) for (const e of x.lyrics) assert.ok(['light', 'dark'].includes(e.tone), `shot ${x.id} tone ${e.tone}`);
});

test('no two consecutive shots share a still or an identical camera', () => {
  // (13b is a new angle of shot 13 with its own plate)
  const s = shots();
  for (let i = 1; i < s.length; i++) {
    assert.notEqual(s[i].still, s[i - 1].still);
    assert.notDeepEqual(s[i].camera, s[i - 1].camera);
  }
});

test('camera view stays inside the still', () => {
  for (const x of shots()) for (const k of ['from', 'to']) {
    const c = x.camera[k], h = 0.5 / c.zoom;
    assert.ok(c.zoom >= 1, `shot ${x.id} zoom`);
    assert.ok(c.x - h >= -1e-6 && c.x + h <= 1 + 1e-6 && c.y - h >= -1e-6 && c.y + h <= 1 + 1e-6, `shot ${x.id} ${k} view leaves still`);
  }
});

test('lyric surfaces are inside the still', () => {
  for (const x of shots()) for (const e of x.lyrics) {
    const b = e.surface;
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 1 && b.y + b.h <= 1, `shot ${x.id} surface ${JSON.stringify(b)}`);
    assert.ok(['narration', 'hook', 'tech', 'aside'].includes(e.style));
  }
});

test('star shot 32 has a glass-break sfx after its line ends', () => {
  const s = byId('32'); const star = lyr().find(l => l.text.startsWith('The star on the tree'));
  const g = s.sfx.find(x => x.name === 'glass-break');
  assert.ok(g && g.t > star.end && g.t < s.end, JSON.stringify(s.sfx));
});

test('shot 65 starts at impact.silence (the knocks now play under shot 56)', () => {
  const i = impact();
  assert.equal(byId('65').start, i.silence);
});

test('towerStage never decreases across shots that have one', () => {
  let last = 0;
  for (const x of shots()) if (x.towerStage != null) {
    assert.ok(x.towerStage >= last, `shot ${x.id} stage ${x.towerStage} < ${last}`);
    last = x.towerStage;
  }
});

test('lyric surfaces stay in camera view for the whole shot', () => {
  for (const x of shots()) for (const e of x.lyrics) for (const k of (e.own && x.camera.push ? ['push'] : ['from', 'to'])) {   // a split-off box only shows after the push-in
    const c = x.camera[k], h = 0.5 / c.zoom, b = e.surface;
    assert.ok(b.x >= c.x - h - 1e-6 && b.x + b.w <= c.x + h + 1e-6 && b.y >= c.y - h - 1e-6 && b.y + b.h <= c.y + h + 1e-6,
      `shot ${x.id} line ${e.line} surface out of view at ${k}`);
  }
});
