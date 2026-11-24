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
