import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot07} from '../src/shots/07.ts';
import {shot61} from '../src/shots/crowd.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shot = id => read('src/shots.json').find(s => s.id === id);

test('07: layered scene -> Sam -> his painted arm with the mouse -> chair back; no code-drawn arm tubes', () => {
  const s = shot('07'); let clicks = 0; const rots = new Set();
  for (let f = Math.round(s.start * 24); f < s.end * 24; f += 2) {
    const it = shot07(f / 24, f, s), idx = k => it.findIndex(i => String(i.layer ?? '').startsWith(k));
    assert.ok(!it.some(i => i.hose), 'no tube arms');
    assert.ok(idx('07/sam-noarms') >= 0 && idx('07/arm-left') > idx('07/sam-noarms') && idx('07/arm-mouse') > idx('07/sam-noarms') && idx('07/chair-back') > idx('07/arm-mouse') && idx('07/chair-back') > idx('07/arm-left'), `order at ${f}`);
    const arm = it[idx('07/arm-mouse')]; rots.add(Math.round((arm.rot ?? 0) * 10)); if (arm.layer.endsWith('click')) clicks++;
  }
  assert.ok(rots.size >= 3, 'the arm pivots with the mouse');
  assert.ok(clicks >= 1, 'clicks shown');
});

test('61: the elves\' hands stay above the conveyor belt (nothing reaches behind it)', () => {
  const s = shot('61'), BELT = 860;   // the belt's top rail
  for (let f = Math.round(s.start * 24); f < s.end * 24; f += 3)
    for (const it of shot61(f / 24, f, s).filter(i => i.who === 'elf'))
      for (const h of [it.pose.hands.near, it.pose.hands.far]) assert.ok(h[1] <= BELT - 10, `elf hand at y ${h[1].toFixed(0)} behind the belt`);
  const front = shot61(s.start + 1, Math.round((s.start + 1) * 24), s).find(i => i.front);
  assert.ok(front.front.y <= BELT, 'belt redrawn from its top rail, so no legs show on it');
});
