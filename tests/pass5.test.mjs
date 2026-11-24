import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot06} from '../src/shots/pass4-scenes.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shots = () => read('src/shots.json');
const shot = id => shots().find(s => s.id === id);

test('06: the horns are out for the intro blast run and blast on every horn hit', () => {
  const s = shot('06'), hits = read('src/timing/horns.json'), at = t => shot06(t, Math.round(t * 24), s);
  assert.ok(hits.length >= 7 && hits[0] < 26.5 && hits.at(-1) < 28.6);
  assert.equal(at(hits[0] - 0.05).filter(i => String(i.sprite ?? '').includes('sprites/horn/')).length, 2, 'out before the first blast');
  for (const h of hits) {
    let blasted = false;
    for (let f = Math.round(h * 24); f <= Math.round((h + 0.06) * 24) + 3; f++) if (shot06(f / 24, f, s).some(i => String(i.sprite ?? '').endsWith('horn-b'))) blasted = true;
    assert.ok(blasted, `no blast on the hit at ${h}`);
  }
});

import {shot10, SHELF10} from '../src/shots/ram-side-shots.ts';
test('10: the hands grab 80 px higher on each item (its middle), and the item hangs from the hand', () => {
  const s = shot('10');
  for (const it of SHELF10) {
    let best = 1e9;
    for (let f = Math.floor((it.at - 0.2) * 24); f <= Math.ceil((it.at + 0.2) * 24); f++)
      for (const i of shot10(f / 24, f, s)) if (i.hose) best = Math.min(best, Math.hypot(i.hose.b[0] - it.pos[0], i.hose.b[1] - (it.pos[1] - 80)));
    assert.ok(best < 20, `hand misses the raised grab point by ${best.toFixed(0)}`);
  }
});

test('17 text 25% smaller; 32 text 15% smaller and 40 px left', () => {
  const a = shot('17').lyrics[0].surface, b = shot('32').lyrics[0].surface;
  assert.ok(Math.abs(a.w - 0.69 * 0.75) < 1e-3 && Math.abs(a.h - 0.36 * 0.75) < 1e-3);
  assert.ok(Math.abs(b.w - 0.6 * 0.85) < 1e-3 && Math.abs(b.x + b.w / 2 - (0.5 - 40 / 1600)) < 1e-3);
});
