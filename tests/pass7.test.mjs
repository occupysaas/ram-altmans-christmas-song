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

// pass 8: '07: the sleeve ends at the wrist…' removed — the code-drawn arm was replaced by painted arm layers (tests/pass8)
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

import {whipAt} from '../src/fx/whip.ts';
test('47→48: a whip-pan down — the old shot smears up and out, the crash rises in from below, never revealing an edge', () => {
  const a = shot('47'), b = shot('48');
  assert.ok(a.fx.includes('whipOut') && b.fx.includes('whipIn'));
  const out = whipAt(a, a.end - 0.02), inn = whipAt(b, b.start + 0.02);
  assert.ok(out.dy < -0.06 && out.blur > 10, `exit ${JSON.stringify(out)}`);
  assert.ok(inn.dy > 0.06 && inn.blur > 10, `entry ${JSON.stringify(inn)}`);
  for (const w of [out, inn]) assert.ok(w.scale >= 1 + 2 * Math.abs(w.dy) - 1e-9, 'scaled enough to hide the edges');
  assert.deepEqual(whipAt(b, b.start + 0.4), {dy: 0, blur: 0, scale: 1});
  assert.deepEqual(whipAt(a, (a.start + a.end) / 2), {dy: 0, blur: 0, scale: 1});
});

test('63→64: the Ebenezer Scrooge smash cut is a whip-pan too, with no CRT roll', () => {
  const a = shot('63'), b = shot('64');
  assert.ok(!b.fx.includes('vroll') && a.fx.includes('whipOut') && b.fx.includes('whipIn'));
  assert.ok(whipAt(b, b.start + 0.02).blur > 10);
});

import {staticAt} from '../src/fx/crtStatic.ts';
import {BOOM} from '../src/fx/fxMath.ts';
test('CRT snow: short static bursts, frequent on the calmer shots, rare elsewhere, never on the title or the ending', () => {
  const S = read('src/shots.json'), calm = s => s.tier === 'C' || (s.tier === 'B' && s.fx.every(f => f === 'tower'));
  const bursts = (s) => { let n = 0, run = 0, prev = false;
    for (let f = Math.ceil(s.start * 24); f < s.end * 24; f++) { const on = staticAt(s, f / 24).opacity > 0; if (on) { run++; assert.ok(run <= 4, `burst longer than 4 frames in ${s.id}`); } else run = 0; if (on && !prev) n++; prev = on; }
    return n; };
  let calmT = 0, calmN = 0, busyT = 0, busyN = 0;
  for (const s of S) { const n = bursts(s), d = s.end - s.start; if (calm(s)) { calmT += d; calmN += n; } else { busyT += d; busyN += n; } }
  assert.ok(calmN / calmT >= 1 / 5, `calm shots: ${calmN} bursts in ${calmT.toFixed(0)} s`);
  assert.ok(busyN / busyT < calmN / calmT / 2, 'busier shots get fewer');
  for (let t = 0; t < 8; t += 1 / 24) assert.equal(staticAt(S[0], t).opacity, 0, 'title/ident untouched');
  const end = S.at(-1); for (let t = BOOM - 0.5; t < end.end; t += 1 / 24) assert.equal(staticAt(end, t).opacity, 0, 'ending untouched');
});
