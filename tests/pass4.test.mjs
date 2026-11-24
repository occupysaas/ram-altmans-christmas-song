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

import {shot07, mouseOffset} from '../src/shots/07.ts';
import {twos} from '../src/shots/kit.ts';
import {execFileSync} from 'node:child_process';

test('07: hand and mouse stay on the desk (painted spot) and the sleeve ends on the wrist, over the hand', () => {
  const s = shot('07');
  for (let f = Math.round(s.start * 24); f < s.end * 24; f += 3) {
    const items = shot07(f / 24, f, s), m = mouseOffset(twos(f));
    const hand = items.find(i => i.layer === '07/hand'), hose = items.find(i => i.hose);
    assert.ok(Math.abs((hand.dy ?? 0) - m[1]) <= 2, `hand lifted off the desk (dy ${hand.dy})`);
    const wrist = [943 + (hand.dx ?? 0), 837 + (hand.dy ?? 0)];
    assert.ok(Math.hypot(hose.hose.b[0] - wrist[0], hose.hose.b[1] - wrist[1]) < 16, `sleeve misses the wrist by ${Math.hypot(hose.hose.b[0] - wrist[0], hose.hose.b[1] - wrist[1]).toFixed(0)}`);
    assert.ok(items.indexOf(hose) > items.indexOf(hand), 'cuff drawn over the hand');
  }
});

test('mood: darkness dialled back; tree bulbs of every colour glow; 29 glows without darkening', () => {
  for (const s of shots().filter(x => x.mood)) assert.ok(s.mood.dark >= 0 && s.mood.dark <= 0.32, `shot ${s.id} dark ${s.mood.dark}`);
  assert.equal(shot('29').mood.dark, 0);
  const hues = JSON.parse(execFileSync('.venv/bin/python', ['-I', 'scripts/make_lightmaps.py', '--hues', '18'], {encoding: 'utf8'}));
  for (const h of ['red', 'green', 'blue', 'yellow']) assert.ok(hues[h] > 0, `no ${h} bulbs detected on the tree`);
});

import {shot25, vacuum25} from '../src/shots/ram-side-shots.ts';
test('25: a leaf-blower tube with its round opening facing left at the shelf (no floor nozzle)', () => {
  const s = shot('25'), t = s.start + 1, items = shot25(t, Math.round(t * 24), s), g = vacuum25(twos(Math.round(t * 24)), s);
  assert.ok(!items.some(i => String(i.sprite ?? '').endsWith('vacuum/nozzle')), 'old nozzle gone');
  const mouth = items.find(i => i.draw?.kind === 'ellipse' && i.draw.mouth);
  assert.ok(mouth && mouth.draw.at[0] < g.wandEnd[0] - 200, 'opening on the left end');
  assert.ok(mouth.draw.h > mouth.draw.w, 'opening seen end-on (taller than wide), facing left');
});

test('29: the animated receipt lines are gone', () => assert.ok(!shot('29').fx.includes('receipt')));

test('54: the town is redrawn over the tower so the mansion sits behind it', () => {
  assert.ok(shot('54').towerBehind && fs.existsSync('public/plates/54-front.png'));
});
