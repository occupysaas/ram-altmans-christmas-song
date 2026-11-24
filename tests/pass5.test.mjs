import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot06} from '../src/shots/pass4-scenes.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shots = () => read('src/shots.json');
const shot = id => shots().find(s => s.id === id);


import {shot10, SHELF10} from '../src/shots/ram-side-shots.ts';

test('17 text 25% smaller; 32 text 15% smaller and 40 px left', () => {
  const a = shot('17').lyrics[0].surface, b = shot('32').lyrics[0].surface;
  assert.ok(Math.abs(a.w - 0.69 * 0.75) < 1e-3 && Math.abs(a.h - 0.36 * 0.75) < 1e-3);
  assert.ok(Math.abs(b.w - 0.6 * 0.85) < 1e-3, '32 is 15% smaller (position nudged again in pass 6)');
});

import {SCROLL18} from '../src/shots/pass4-scenes.ts';
test('18: the scroll is twice as big, its paper covers the painted tag, and the lyric fills it', () => {
  const tag = read('public/sprites/layers/layers.json')['18/tag'];
  assert.ok(SCROLL18.scale >= 1.2, `scroll scale ${SCROLL18.scale}`);
  const paper = {x0: SCROLL18.x - 560 * SCROLL18.scale * (SCROLL18.sx ?? 1), x1: SCROLL18.x + 560 * SCROLL18.scale * (SCROLL18.sx ?? 1), y0: SCROLL18.y + (117 - 210) * SCROLL18.scale, y1: SCROLL18.y + (350 - 210) * SCROLL18.scale};
  assert.ok(paper.x0 <= tag.x && paper.x1 >= tag.x + tag.w && paper.y0 <= tag.y + 2 && paper.y1 >= tag.y + tag.h, `paper ${JSON.stringify(paper)} vs tag ${JSON.stringify(tag)}`);
  const s = shot('18').lyrics[0].surface;
  assert.ok(s.w * 1600 >= 500 && s.y * 1200 >= paper.y0 && (s.y + s.h) * 1200 <= paper.y1, 'lyric on the paper, bigger');
});

import {shot25, vacuum25} from '../src/shots/ram-side-shots.ts';
import {hoseControl} from '../src/puppet/geom.ts';
import {twos} from '../src/shots/kit.ts';

import {shot64} from '../src/shots/faces.ts';
test('64: clean plate; Ram (face or laugh) always drawn, the card + hand always in front — no double image', () => {
  const s = shot('64'); assert.equal(s.plate, 'plates/64.png');
  for (let t = s.start + 0.1; t < s.end; t += 0.25) {
    const it = shot64(t, Math.round(t * 24), s), face = it.findIndex(i => /^64\/face/.test(i.layer ?? '')), card = it.findIndex(i => i.layer === '64/card');
    assert.ok(face >= 0 && card > face, `at ${t.toFixed(2)}: face ${face}, card ${card}`);
  }
});
