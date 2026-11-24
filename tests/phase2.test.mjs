import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {IDENT, TITLE} from '../src/fx/titles.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shots = () => read('src/shots.json');
const lyr = () => read('src/timing/lyrics-aligned.json');

test('every shot has a motion tier and tier-A shots name their puppets', () => {
  for (const s of shots()) {
    assert.ok(['A', 'B', 'C'].includes(s.tier), `shot ${s.id} tier ${s.tier}`);
    assert.ok(Array.isArray(s.fx), `shot ${s.id} fx`);
    if (s.tier === 'A') {
      assert.ok(s.puppets?.length, `shot ${s.id} has no puppets`);
      assert.equal(s.plate, `plates/${s.id}.png`);
    }
    if (s.tier === 'B') assert.ok(s.fx.length, `tier-B shot ${s.id} has no fx`);
  }
});

test('ident then title play over shot 1 before the first sung word', () => {
  const s1 = shots()[0];
  assert.ok(IDENT.start >= s1.start && IDENT.end < TITLE.start, 'ident before title');
  assert.ok(TITLE.end <= s1.end && TITLE.end < lyr()[0].start, `title ends ${TITLE.end} before first word ${lyr()[0].start}`);
});

import {towerBump, towerGrowth, bumpAmp} from '../src/fx/towerMath.ts';
const audio = () => read('src/timing/audio.json');

test('tower bump is bounded and peaks on kick frames', () => {
  for (const stage of [1, 3, 5]) {
    const max = 0.02 + 0.01 * stage;
    for (let f = 0; f < 6231; f += 3) assert.ok(towerBump(f / 24, stage) <= max + 1e-9, `stage ${stage} frame ${f}`);
    const kicks = audio().kicks.map(k => k[0]).filter((k, i) => i % 9 === 0);
    for (const k of kicks) {
      const f = Math.ceil(k * 24);
      assert.ok(towerBump(f / 24, stage) >= 0.7 * bumpAmp(stage), `kick ${k} at frame ${f}: ${towerBump(f / 24, stage)}`);
    }
  }
  // two kicks 1 frame apart do not stack
  assert.ok(towerBump(10.05, 5, [[10, 1], [10.04, 1]]) <= 0.07 + 1e-9);
});

test('tower growth never decreases before the collapse', () => {
  let last = 0;
  for (let t = 0; t < read('src/timing/impact.json').silence; t += 0.25) {
    const g = towerGrowth(t); assert.ok(g >= last - 1e-12, `growth fell at ${t}`); last = g;
  }
  assert.ok(towerGrowth(0) >= 0 && towerGrowth(250) <= 0.12 + 1e-9);
});

test('every tower shot has a polygon whose base is inside it', () => {
  const towers = read('docs/towers.json');
  const inside = ([x, y], poly) => { let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    } return c; };
  for (const s of shots().filter(s => s.fx.includes('tower'))) {
    const tw = towers[s.id];
    assert.ok(tw, `no tower polygon for shot ${s.id}`);
    assert.ok(tw.poly.length >= 3);
    const near = [tw.base[0], tw.base[1] - 0.01];
    assert.ok(inside(near, tw.poly), `shot ${s.id} base not inside polygon`);
    assert.ok(inside([tw.top[0], tw.top[1] + 0.01], tw.poly), `shot ${s.id} top not inside polygon`);
  }
});
