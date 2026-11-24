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
  const horns = t => at(t).filter(i => String(i.sprite ?? '').includes('sprites/horn/')).length;
  assert.equal(horns(hits[0] - 0.15), 0, 'not out before the blast run');
  assert.equal(horns(hits[0] + 0.1), 2, 'out on the first blast');
  const verse = read('src/timing/lyrics-aligned.json')[2].start;
  assert.equal(horns(verse - 0.2), 2, 'still out through the intro');
  assert.equal(horns(verse + 0.6), 0, 'gone once the verse starts');
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

import {SCROLL18} from '../src/shots/pass4-scenes.ts';
test('18: the scroll is twice as big, its paper covers the painted tag, and the lyric fills it', () => {
  const tag = read('public/sprites/layers/layers.json')['18/tag'];
  assert.ok(SCROLL18.scale >= 1.2, `scroll scale ${SCROLL18.scale}`);
  const paper = {x0: SCROLL18.x - 560 * SCROLL18.scale, x1: SCROLL18.x + 560 * SCROLL18.scale, y0: SCROLL18.y + (117 - 210) * SCROLL18.scale, y1: SCROLL18.y + (350 - 210) * SCROLL18.scale};
  assert.ok(paper.x0 <= tag.x && paper.x1 >= tag.x + tag.w && paper.y0 <= tag.y + 2 && paper.y1 >= tag.y + tag.h, `paper ${JSON.stringify(paper)} vs tag ${JSON.stringify(tag)}`);
  const s = shot('18').lyrics[0].surface;
  assert.ok(s.w * 1600 >= 800 && s.y * 1200 >= paper.y0 && (s.y + s.h) * 1200 <= paper.y1, 'lyric on the paper, bigger');
});

import {shot25, vacuum25} from '../src/shots/ram-side-shots.ts';
import {hoseControl} from '../src/puppet/geom.ts';
import {twos} from '../src/shots/kit.ts';
test('25: a narrower strapless tank, and the swallowed boxes ride ON the curved hose', () => {
  const s = shot('25');
  let checked = 0;
  for (let f = Math.round(s.start * 24); f < s.end * 24; f++) {
    const items = shot25(f / 24, f, s), can = items.find(i => String(i.sprite ?? '').includes('vacuum/canister'));
    assert.ok(can.sprite.endsWith('canister-nostrap') && can.scale * (can.sx ?? 1) <= 2.75 * 0.5, `tank too wide or strapped`);
    const h = items.find(i => i.hose).hose, c = hoseControl(h.a, h.b, h.L, h.side);
    for (const g of items.filter(i => i.draw?.gulp)) {
      let best = 1e9;
      for (let u = 0; u <= 1; u += 0.01) { const x = (1 - u) ** 2 * h.a[0] + 2 * (1 - u) * u * c[0] + u * u * h.b[0], y = (1 - u) ** 2 * h.a[1] + 2 * (1 - u) * u * c[1] + u * u * h.b[1]; best = Math.min(best, Math.hypot(g.draw.at[0] - x, g.draw.at[1] - y)); }
      assert.ok(best < 12, `gulp ${best.toFixed(0)} px off the hose`); checked++;
    }
  }
  assert.ok(checked > 3, 'some gulps seen');
});
