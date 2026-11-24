import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {snowDensity} from '../src/fx/snowRule.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shots = () => read('src/shots.json');
const shot = id => shots().find(s => s.id === id);
const L = () => read('src/timing/lyrics-aligned.json');
const audioJ = read('src/timing/audio.json');
const near = (a, b) => Math.abs(a - b) < 1e-3;

const INDOOR = ['03', '07', '10', '11', '12', '13b', '14', '18', '24', '25', '30', '33', '35', '38', '40', '41', '42', '43', '44', '45', '50', '51', '55', '61', '63', '64'];

test('indoor shots have no snow; outdoor shots keep it', () => {
  for (const s of shots()) {
    if (INDOOR.includes(s.id)) assert.equal(snowDensity(s), 0, `snow indoors in ${s.id}`);
    else assert.ok(snowDensity(s) > 0, `no snow outdoors in ${s.id}`);
  }
});

test('lyric nudges land where the notes asked (on-screen px x1.6 in still px)', () => {
  const surf = id => shot(id).lyrics[0].surface;
  assert.ok(near(surf('04').y, 0.4 - 40 / 1200), '04 up');
  assert.ok(near(surf('05').x, 0.195 + 40 / 1600), '05 right');
  assert.ok(near(surf('06').w, 0.77 * 0.8) && near(surf('06').h, 0.25 * 0.8) && surf('06').y > 0.59, '06 smaller and lower');
  assert.ok(near(surf('12').y, 0.07 + 120 / 1200), '12 down');
  assert.ok(near(surf('19').y, 0.385 + 40 / 1200), '19 down');
  assert.ok(near(surf('29').y, 0.1 + 160 / 1200), '29 down');
  assert.ok(surf('30').y >= 0.45 && surf('30').y + surf('30').h <= 0.58, '30 on the middle belts');
  assert.ok(near(surf('32').y, 0.56 - 80 / 1200), '32 up');
  assert.ok(surf('33').w <= 0.7 * 0.8 + 1e-6 && surf('33').h <= 0.22 * 0.8 + 1e-6, '33 smaller');
});
