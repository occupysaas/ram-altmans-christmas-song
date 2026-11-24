import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DUR = 259.6;
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shots = () => read('src/shots.json');
const lyr = () => read('src/timing/lyrics-aligned.json');
const impact = () => read('src/timing/impact.json');

test('65 shots tile 0..259.6 with no gaps', () => {
  const s = shots();
  assert.equal(s.length, 65);
  assert.equal(s[0].start, 0);
  assert.equal(s.at(-1).end, DUR);
  s.forEach((x, i) => {
    assert.equal(x.id, String(i + 1).padStart(2, '0'));
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
  const s = shots()[31]; const star = lyr().find(l => l.text.startsWith('The star on the tree'));
  const g = s.sfx.find(x => x.name === 'glass-break');
  assert.ok(g && g.t > star.end && g.t < s.end, JSON.stringify(s.sfx));
});

test('shot 57 starts at the first knock and shot 65 at impact.silence', () => {
  const s = shots(); const i = impact();
  assert.equal(s[56].start, i.knocks[0]);
  assert.equal(s[64].start, i.silence);
  assert.deepEqual(s[56].sfx.filter(x => x.name === 'knock').map(x => x.t), i.knocks);
});

test('towerStage never decreases across shots that have one', () => {
  let last = 0;
  for (const x of shots()) if (x.towerStage != null) {
    assert.ok(x.towerStage >= last, `shot ${x.id} stage ${x.towerStage} < ${last}`);
    last = x.towerStage;
  }
});

test('lyric surfaces stay in camera view for the whole shot', () => {
  for (const x of shots()) for (const e of x.lyrics) for (const k of ['from', 'to']) {
    const c = x.camera[k], h = 0.5 / c.zoom, b = e.surface;
    assert.ok(b.x >= c.x - h - 1e-6 && b.x + b.w <= c.x + h + 1e-6 && b.y >= c.y - h - 1e-6 && b.y + b.h <= c.y + h + 1e-6,
      `shot ${x.id} line ${e.line} surface out of view at ${k}`);
  }
});
