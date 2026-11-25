import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot06, shot18, SCROLL18} from '../src/shots/pass4-scenes.ts';
import {shot07} from '../src/shots/07.ts';
import {shot10, SHELF10, shot25, vacuum25} from '../src/shots/ram-side-shots.ts';
import {SLEIGH_CHOREO} from '../src/shots/sleigh.ts';
import {hoseControl} from '../src/puppet/geom.ts';
import {twos} from '../src/shots/kit.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shot = id => read('src/shots.json').find(s => s.id === id);
const horns = (s, t) => shot06(t, Math.round(t * 24), s).filter(i => String(i.sprite ?? '').includes('sprites/horn/')).length;

test('06: horns follow the 8-hit horn bar (28.3-29.3 s), not the violin run before it, and stay to the end of the shot', () => {
  const s = shot('06'), hits = read('src/timing/horns.json');
  assert.equal(hits.length, 8);
  assert.ok(hits[0] > 28.2 && hits[0] < 28.4 && hits[7] < 29.4, `hits ${hits}`);
  assert.equal(horns(s, 27.0), 0, 'not out during the violin run');
  assert.equal(horns(s, hits[0] + 0.1), 2);
  assert.equal(horns(s, s.end - 0.2), 2, 'still out at the end of the tower shot');
});

// pass 8: the arm-dip test was removed — the code-drawn arm was replaced by painted arm layers (tests/pass8)
test('10: the chip and the byte are grabbed at their own height; the sticks 80 px up', () => {
  const s = shot('10');
  for (const it of SHELF10) {
    const lift = it.sprite === 'ram-stick' ? 80 : 0;
    let best = 1e9;
    for (let f = Math.floor((it.at - 0.2) * 24); f <= Math.ceil((it.at + 0.2) * 24); f++)
      for (const i of shot10(f / 24, f, s)) if (i.hose) best = Math.min(best, Math.hypot(i.hose.b[0] - it.pos[0], i.hose.b[1] - (it.pos[1] - lift)));
    assert.ok(best < 20, `${it.sprite} grab off by ${best.toFixed(0)}`);
  }
});

test('18: the scroll is narrower (taller than before relative to width) and the words never overlap a character', () => {
  assert.ok(SCROLL18.sx <= 0.86 && SCROLL18.scale >= 1.2);
  const s = shot('18'), b = s.lyrics[0].surface, L = read('public/sprites/layers/layers.json');
  const box = {x0: b.x * 1600, x1: (b.x + b.w) * 1600, y0: b.y * 1200, y1: (b.y + b.h) * 1200};
  for (const k of ['dad', 'mum', 'kid1', 'kid2']) {
    const c = L[`18/${k}`], hit = box.x0 < c.x + c.w && box.x1 > c.x && box.y0 < c.y + c.h && box.y1 > c.y;
    assert.ok(!hit, `words overlap ${k}`);
  }
  const it = shot18(s.start + 1, Math.round((s.start + 1) * 24), s).find(i => String(i.sprite ?? '').endsWith('scroll/scroll'));
  assert.ok(Math.abs((it.sx ?? 1) - SCROLL18.sx) < 1e-6);
});

test('21/22: the SOLD signs are drawn under the sleigh', () => {
  for (const id of ['21', '22']) {
    const s = shot(id), it = SLEIGH_CHOREO[id](s.end - 0.2, Math.round((s.end - 0.2) * 24), s);
    const team = it.findIndex(i => i.sleighTeam), sold = it.map((i, k) => i.draw?.text === 'SOLD' ? k : -1).filter(k => k >= 0);
    assert.ok(sold.length && sold.every(k => k < team), `shot ${id}: SOLD over the sleigh`);
  }
});

test('25: tank back to its original size; the blower tube is half as long and twice as thick', () => {
  const s = shot('25'), t = s.start + 1, f = Math.round(t * 24), it = shot25(t, f, s), g = vacuum25(twos(f), s);
  const can = it.find(i => String(i.sprite ?? '').includes('vacuum/canister'));
  assert.ok(can.sprite.includes('vacuum/canister') && (can.sx ?? 1) >= 1, 'original-size tank (strapless since pass 7)');
  const tube = it.filter(i => i.draw?.kind === 'line' && i.draw.size >= 100);
  assert.ok(tube.length, 'thick tube');
  const len = Math.abs(g.wandEnd[0] - g.mouth[0]);   // horizontal reach (the tube tilts toward the shelf row)
  assert.ok(len <= 330 * 1.6 / 2 + 2, `tube length ${len.toFixed(0)}`);
  const mouth = it.find(i => i.draw?.mouth); assert.ok(mouth.draw.h >= 150);
});

test('32: star text another 40 still px left and 16 down', () => {
  const b = shot('32').lyrics[0].surface;
  assert.ok(Math.abs(b.x - (0.22 - 40 / 1600)) < 1e-3 && Math.abs(b.y - (0.51283 + 16 / 1200)) < 1e-3);
});

import {layoutEntry} from '../src/layout.ts';
test('32: "is" starts the second line — "is a PREMIUM TIER,"', () => {
  const s = shot('32'), e = s.lyrics[0], L = layoutEntry(e, {w: e.surface.w * 1600, h: e.surface.h * 1200});
  assert.deepEqual(L.rows.map(r => r.words.map(w => w.text.toLowerCase())), [['the', 'star', 'on', 'the', 'tree'], ['is', 'a', 'premium', 'tier,']]);
});

import {SLEIGH_PATHS} from '../src/shots/sleigh.ts';
test('46/47/48: the sleigh stays loaded with RAM through the crash shot', () => {
  for (const id of ['46', '47', '48']) { const s = shot(id); for (const k of [0.1, 0.5, 0.9]) assert.ok(SLEIGH_PATHS[id](s.start + k * (s.end - s.start), s).sag, `shot ${id} sleigh empty at ${k}`); }
});
