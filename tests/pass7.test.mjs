import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot06} from '../src/shots/pass4-scenes.ts';
import {shot07} from '../src/shots/07.ts';
import {shot13b} from '../src/shots/13b.ts';
import {shot25} from '../src/shots/ram-side-shots.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shot = id => read('src/shots.json').find(s => s.id === id);

test('06: the horns are flagged to draw behind the tower', () => {
  const s = shot('06'), it = shot06(28.6, Math.round(28.6 * 24), s).filter(i => String(i.sprite ?? '').includes('sprites/horn/'));
  assert.equal(it.length, 2); assert.ok(it.every(i => i.behind), 'horns not behind the building');
  assert.ok(fs.readFileSync('src/Still.tsx', 'utf8').includes('behind'), 'Still draws behind-items before the tower');
});

test('07: the sleeve ends at the wrist, the hand covers its end, and a cuff band covers the join', () => {
  const s = shot('07'), f = Math.round((s.start + 1) * 24), it = shot07(f / 24, f, s);
  const hose = it.findIndex(i => i.hose), hand = it.findIndex(i => i.layer === '07/hand'), cuff = it.findIndex(i => i.draw?.cuff);
  assert.ok(hose >= 0 && hand > hose && cuff > hand, `order hose ${hose} hand ${hand} cuff ${cuff}`);
});

test('13b: head drawn behind the body; bounce + chuckle never move the head more than 14 px', () => {
  const s = shot('13b'); let restY = null, low = -1e9;
  for (let f = Math.round((s.start + 1.8) * 24); f < s.end * 24; f++) {
    const it = shot13b(f / 24, f, s), head = it.findIndex(i => String(i.sprite).endsWith('ram-back/head')), body = it.findIndex(i => String(i.sprite).endsWith('ram-back/body'));
    assert.ok(head < body, 'head over the body');
    const y = it[head].at[1]; restY = restY === null ? y : Math.min(restY, y); low = Math.max(low, y);
  }
  assert.ok(low - restY <= 14, `head dips ${(low - restY).toFixed(0)} px`);
});

test('23: the town is redrawn in front of the factory', () => {
  assert.ok(shot('23').towerBehind && fs.existsSync('public/plates/23-front.png'));
});

test('25: the strapless tank at full width', () => {
  const s = shot('25'), t = s.start + 1, can = shot25(t, Math.round(t * 24), s).find(i => String(i.sprite ?? '').includes('vacuum/canister'));
  assert.ok(can.sprite.endsWith('canister-nostrap') && (can.sx ?? 1) >= 1);
});

test('28: back to the original painting (Ram pointing at the banner) with the old bump', () => {
  const s = shot('28'); assert.ok(!s.towerCut && !s.plate, 'still on the cut-out tower');
});

test('06: the bumping tower layer is masked to the building only (no sky halo hiding the horns)', () => {
  assert.equal(shot('06').towerMask, 'plates/06-towermask.png');
  assert.ok(fs.existsSync('public/plates/06-towermask.png'));
});

test('60: back to the original painting so Ram stays in the doorway (the cut-out tower had painted him out)', () => {
  const s = shot('60'); assert.ok(!s.towerCut && !s.plate, '60 still on the cut-out tower');
});

test('48: no CRT roll on the cut into the crash (it read as a broken scene swap)', () => {
  assert.ok(!shot('48').fx.includes('vroll'));
});
