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

import {shot03, shot06, shot14, shot18} from '../src/shots/pass4-scenes.ts';
import {shot13b} from '../src/shots/13b.ts';
import {shot43} from '../src/shots/ram-34-shots.ts';

test('03: the cat sleeps and breathes; snow only in the window; the data center in the window pulses', () => {
  const s = shot('03'), at = t => shot03(t, Math.round(t * 24), s);
  const keys = new Set(); for (let t = s.start; t < s.end; t += 0.2) for (const i of at(t)) if (String(i.layer ?? '').startsWith('03/cat')) keys.add(i.layer);
  assert.ok(keys.has('03/cat-sleep') && keys.has('03/cat-sleep-b'), 'breathing cycle');
  const flakes = at(s.start + 1).filter(i => i.draw?.kind === 'dot' && i.draw.snow);
  assert.ok(flakes.length >= 10 && flakes.every(f => f.draw.at[0] > 1010 && f.draw.at[0] < 1400 && f.draw.at[1] > 120 && f.draw.at[1] < 520), 'snow inside the window only');
  assert.equal(shot('03').plate, 'plates/03.png');
});

test('06: two horns, one each side of the tower, blasting notes (timing in pass5 test)', () => {
  const s = shot('06'), at = t => shot06(t, Math.round(t * 24), s), t0 = L()[2].start;
  const horns = at(t0 + 0.8).filter(i => String(i.sprite ?? '').includes('sprites/horn/'));
  assert.equal(horns.length, 2);
  assert.ok(horns[0].at[0] < 800 && horns[1].at[0] > 800, 'one each side');
  assert.ok(at(t0 + 0.8).some(i => i.draw?.kind === 'note'), 'notes blasting');
});

test('13 removed: 13b starts at line 8 and Ram rises into frame, then looks out', () => {
  assert.ok(!shots().some(s => s.id === '13'));
  const s = shot('13b'); assert.ok(Math.abs(s.start - L()[8].start) < 0.3 || s.start <= L()[8].words[0].s, `13b starts ${s.start}`);
  assert.ok(s.lyrics.some(e => e.line === 8 && e.from === 0), 'line 8 in this shot');
  const bodyY = t => shot13b(t, Math.round(t * 24), s).find(i => String(i.sprite).endsWith('ram-back/body')).at[1];
  assert.ok(bodyY(s.start + 0.05) > bodyY(s.start + 1.8) + 250, 'rises from below');
});

test('14: the girl blinks every few seconds; 18: the lyric sits on a scroll', () => {
  const s = shot('14'); let blinks = 0, prev = false;
  for (let f = Math.round(s.start * 24); f < s.end * 24; f++) { const b = shot14(f / 24, f, s).some(i => i.layer === '14/girl-blink'); if (b && !prev) blinks++; prev = b; }
  assert.ok(blinks >= 2 && blinks <= 3, `${blinks} blinks`);
  const s18 = shot('18'); assert.ok(shot18(s18.start + 1, Math.round((s18.start + 1) * 24), s18).some(i => String(i.sprite ?? '').endsWith('scroll/scroll')));
  assert.ok(!shot18(s18.start + 1, Math.round((s18.start + 1) * 24), s18).some(i => i.layer === '18/tag'), 'old tag gone');
});

test('43: Ram\'s mouth flaps rapidly in shock and he shakes', () => {
  const s = shot('43'), heads = new Set(), xs = [];
  for (let f = Math.round((s.start + 1) * 24); f < Math.round((s.start + 2) * 24); f++) { const p = shot43(f / 24, f, s).find(i => i.who).pose; heads.add(p.head); xs.push(p.hip[0]); }
  assert.ok(heads.size >= 2, `heads ${[...heads]}`);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 8, 'shakes');
});

import {shot11, shot44} from '../src/shots/pass4-scenes.ts';

test('11: buildings bounce on the beat, eyes squint and open, hands type; lyric at the top', () => {
  const s = shot('11'), at = t => shot11(t, Math.round(t * 24), s), seen = new Set();
  const b = audioJ.beats.find(x => x > s.start + 0.5);
  const sy = t => at(t).find(i => i.layer === '11/buildings').sy ?? 1;
  assert.ok(sy(b + 0.08) > sy(b + 0.45) + 0.015, 'bounce on the beat');
  for (let t = s.start; t < s.end; t += 0.1) for (const i of at(t)) if (i.layer) seen.add(i.layer);
  for (const k of ['11/ram', '11/ram-squint', '11/hands-a', '11/hands-b']) assert.ok(seen.has(k), `never shows ${k}`);
  assert.ok(s.lyrics[0].surface.y + s.lyrics[0].surface.h <= 0.3, 'lyric moved to the top');
});

test('44: Ram\'s mouth flaps open and shut rapidly and he shakes', () => {
  const s = shot('44'), keys = [], dxs = [];
  for (let f = Math.round(s.start * 24); f < Math.round((s.start + 1) * 24); f++) { const r = shot44(f / 24, f, s).find(i => String(i.layer).startsWith('44/ram')); keys.push(r.layer); dxs.push(r.dx ?? 0); }
  let flips = 0; for (let i = 1; i < keys.length; i++) if (keys[i] !== keys[i - 1]) flips++;
  assert.ok(flips >= 6, `${flips} mouth changes in a second`);
  assert.ok(Math.max(...dxs) - Math.min(...dxs) >= 8, 'shakes');
});
