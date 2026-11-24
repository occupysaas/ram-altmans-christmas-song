import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {layoutEntry, STILL_W, STILL_H} from '../src/layout.ts';
import {shot40} from '../src/shots/crowd.ts';
import {SLEIGH_CHOREO} from '../src/shots/sleigh.ts';
import {beatBumpScale} from '../src/fx/fxMath.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shots = () => read('src/shots.json');
const shot = id => shots().find(s => s.id === id);
const audioJ = read('src/timing/audio.json');

test('04: tighter line gap keeps "stirred..." inside the display box', () => {
  const s = shot('04'), e = s.lyrics[0];
  assert.equal(e.surface.lineGap, 0.8);
  const box = {w: e.surface.w * STILL_W, h: e.surface.h * STILL_H}, L = layoutEntry(e, box, true);
  assert.equal(L.rows.length, 2);
  for (const r of L.rows) assert.ok(Math.abs(r.height - Math.max(...r.words.map(w => w.size)) * 0.8) < 1e-6);
  assert.ok(L.height <= box.h * 0.95, `text block ${L.height} vs box ${box.h}`);
});

test('05: the lyric box moved right so "not" clears the price tag', () => {
  assert.ok(Math.abs(shot('05').lyrics[0].surface.x - (0.17 + 40 / 1600)) < 1e-6);
});

test('40: the family keeps running until everyone is off the right edge', () => {
  const s = shot('40'), f = Math.round((s.end - 0.05) * 24);
  for (const it of shot40(f / 24, f, s)) assert.ok(it.pose.hip[0] > 1550, `${it.who} stops at ${it.pose.hip[0].toFixed(0)}`);
});

test('46/47/48: RAM sticks tumble off the overloaded sleigh on the beat', () => {
  for (const id of ['46', '47', '48']) {
    const s = shot(id), t = s.start + 0.4 * (s.end - s.start);   // 48: well before the crash at 70%
    const items = SLEIGH_CHOREO[id](t, Math.round(t * 24), s).filter(i => String(i.sprite ?? '').endsWith('ram-stick'));
    assert.ok(items.length >= 2, `shot ${id}: ${items.length} falling sticks at ${t.toFixed(2)}`);
  }
});

test('38: the fan throne bumps on every beat', () => {
  const s = shot('38'); assert.ok(s.fx.includes('beatBump'));
  const b = audioJ.beats.find(x => x > s.start + 0.5);
  assert.ok(beatBumpScale(b + 0.03) > 1.015 && beatBumpScale(b - 0.1) < beatBumpScale(b + 0.03));
});

import {shot39crowd, RAM39, slamTimes} from '../src/shots/townsfolk.ts';

test('39: Ram stands in the middle and the crowd circles him without ever touching him', () => {
  const s = shot('39');
  assert.ok(Math.abs(RAM39.x - 800) < 1 && RAM39.floor === 760);
  let behind = 0, front = 0;
  for (let t = s.start; t < s.end; t += 0.25) for (const r of shot39crowd(t, s)) {
    const d = Math.hypot(r.x - RAM39.x, 2 * (r.y - RAM39.floor));
    assert.ok(d >= 260, `${r.who} at ${t.toFixed(2)} is ${d.toFixed(0)} from Ram`);
    if (r.y < RAM39.floor) behind++; else front++;
  }
  assert.ok(behind > 20 && front > 20, 'they pass both behind and in front of him');
  const t1 = slamTimes(s)[0], spread = q => shot39crowd(q, s).reduce((a, r) => a + Math.hypot(r.x - RAM39.x, 2 * (r.y - RAM39.floor)), 0);
  assert.ok(spread(t1 + 0.25) > spread(t1 - 0.02) * 1.15, 'they burst outward on the slam');
  assert.ok(slamTimes(s).some(q => shot39crowd(q + 0.2, s).some(r => r.flat)), 'one gets flattened');
});

import {shot10, SHELF10} from '../src/shots/ram-side-shots.ts';

test('10: the shelf starts full and loses exactly one item per grab, each grabbed by the hand', () => {
  const s = shot('10'), onShelf = t => shot10(t, Math.round(t * 24), s).filter(i => i.sprite && i.shelf).length;
  assert.equal(SHELF10.length, 6);
  assert.equal(onShelf(s.start + 0.05), 6);
  SHELF10.forEach((it, k) => {
    assert.equal(onShelf(it.at - 0.12), 6 - k, `before grab ${k}`);   // held frames lag real time by up to 0.125 s
    assert.equal(onShelf(it.at + 0.15), 5 - k, `after grab ${k}`);
    let best = 1e9;
    for (let f = Math.floor((it.at - 0.2) * 24); f <= Math.ceil((it.at + 0.2) * 24); f++)
      for (const i of shot10(f / 24, f, s)) if (i.hose) best = Math.min(best, Math.hypot(i.hose.b[0] - it.pos[0], i.hose.b[1] - it.pos[1]));
    assert.ok(best < 20, `hand misses item ${k} by ${best.toFixed(0)}`);
  });
});

import {shot25, vacuum25, shelfLeft} from '../src/shots/ram-side-shots.ts';
import {twos} from '../src/shots/kit.ts';

test('25: the vacuum hose runs from the canister on his back to the nozzle in his hand, every frame', () => {
  const s = shot('25');
  for (let f = Math.round(s.start * 24); f < s.end * 24; f += 2) {
    const items = shot25(f / 24, f, s), g = vacuum25(twos(f), s), hose = items.find(i => i.hose);   // the scene runs on held frames
    assert.ok(hose, `no hose at frame ${f}`);
    assert.ok(Math.hypot(hose.hose.a[0] - g.socket[0], hose.hose.a[1] - g.socket[1]) < 1 && Math.hypot(hose.hose.b[0] - g.wandEnd[0], hose.hose.b[1] - g.wandEnd[1]) < 1, `hose detached at ${f}`);
    const ram = items.find(i => i.who === 'ram-side'), dh = Math.hypot(ram.pose.hands.near[0] - g.grip[0], ram.pose.hands.near[1] - g.grip[1]);
    assert.ok(dh < 2, `hand off the wand by ${dh.toFixed(1)} at ${f}`);
  }
  assert.equal(shelfLeft(s.end - 0.05), 0);
});

test("25: the girl's box is sucked out of her hands on the last beat", () => {
  const s = shot('25'), last = vacuum25(s.start, s).lastBeat;
  const boxNearHer = t => { const it = shot25(t, Math.round(t * 24), s), g = it.find(i => i.who === 'girl');
    return it.some(i => String(i.sprite ?? '').endsWith('ram-box') && Math.hypot(i.at[0] - g.pose.hands.near[0], i.at[1] - g.pose.hands.near[1]) < 90); };
  assert.ok(boxNearHer(last - 0.3), 'she holds a box before');
  assert.ok(!boxNearHer(last + 0.5), 'box gone after');
});

test('3:38: the stray door close-up (old shot 57) is gone; 56 runs into 58 and keeps the knock sounds', () => {
  const ss = shots(), i56 = ss.findIndex(s => s.id === '56');
  assert.ok(!ss.some(s => s.id === '57'), 'shot 57 still present');
  assert.equal(ss[i56 + 1].id, '58');
  assert.equal(ss[i56].end, ss[i56 + 1].start);
  const knocks = read('src/timing/impact.json').knocks;
  assert.deepEqual(ss[i56].sfx.filter(x => x.name === 'knock').map(x => x.t), knocks);
});

import {shot09, shot64} from '../src/shots/faces.ts';
import {shot26} from '../src/shots/ram-side-shots.ts';
import {camAt} from '../src/camera.ts';
const L = () => read('src/timing/lyrics-aligned.json');

test('09: Ram grins, then laughs from "memory!" with HA!s popping', () => {
  const s = shot('09'), memory = L()[4].words.find(w => w.w === 'memory!').s, at = t => shot09(t, Math.round(t * 24), s);
  assert.ok(at(memory - 0.3).some(i => i.layer === '09/grin') && !at(memory - 0.3).some(i => i.layer === '09/laugh'));
  assert.ok(at(memory + 0.3).some(i => i.layer === '09/laugh'));
  assert.ok(at(s.end - 0.3).some(i => i.draw?.text?.startsWith('HA')));
});

test('26: a RAM mountain by the sack; the camera pushes in on his face at the flash, the grin changes, "umm, stash" sits below it', () => {
  const s = shot('26'), stash = read('src/timing/impact.json').stash, at = t => shot26(t, Math.round(t * 24), s);
  assert.ok(at(s.start + 0.5).some(i => String(i.sprite ?? '').endsWith('ram-pile')));
  assert.ok(camAt(s, stash - 0.1).h > 1.6 * camAt(s, stash + 0.4).h, 'push-in');
  assert.equal(at(stash - 0.2).find(i => i.who).pose.head, 'head-grin');
  assert.equal(at(stash + 0.3).find(i => i.who).pose.head, 'head-camera');
  const own = s.lyrics.find(e => e.own), c = camAt(s, stash + 0.4);
  assert.ok(own && L()[own.line].words[own.from].w === 'umm,', 'split entry starts at "umm,"');
  const b = own.surface; assert.ok(b.x > c.cx - c.h && b.x + b.w < c.cx + c.h && b.y > c.cy - c.h && b.y + b.h < c.cy + c.h, 'umm, stash in the close-up');
});

test('64: Ram laughs "HA HA HA" after "Scrooge!"', () => {
  const s = shot('64'), scrooge = L()[52].words.find(w => w.w === 'Scrooge!').s, at = t => shot64(t, Math.round(t * 24), s);
  assert.ok(!at(scrooge - 0.2).some(i => i.layer === '64/face-laugh'));
  const mid = at(scrooge + 0.9);
  assert.ok(mid.some(i => i.layer === '64/face-laugh'));
  assert.ok(mid.filter(i => i.draw?.text === 'HA').length >= 2);
});

import {shot17, skyOffset} from '../src/shots/wink17.ts';

test('17: the sky scrolls past, the arms snap the reins on each beat, and he winks on "wink"', () => {
  const s = shot('17'), at = t => shot17(t, Math.round(t * 24), s);
  assert.ok(Math.abs(skyOffset(s.start + 1) - skyOffset(s.start)) > 300, 'sky moves');
  const sky = at(s.start + 0.5).filter(i => i.sprite === 'plates/17');
  assert.equal(sky.length, 2, 'two tiles for a seamless loop');
  const beats = audioJ.beats.filter(b => b > s.start + 0.2 && b < s.end - 0.4);
  for (const b of beats) {
    const on = at(b + 0.13).find(i => i.layer === '17/arm-near'), off = at(b + 0.42).find(i => i.layer === '17/arm-near');   // held frames lag up to 0.125 s
    assert.ok(Math.abs(on.rot) > Math.abs(off.rot) + 3, `no snap on beat ${b}`);
  }
  const wink = L()[11].words.find(w => w.w.startsWith('wink')).s;
  assert.ok(at(wink + 0.15).some(i => i.layer === '17/ram-wink'));
  assert.ok(!at(wink - 0.3).some(i => i.layer === '17/ram-wink'));
});

import {shot35} from '../src/shots/townsfolk.ts';

test('35: Ram shovels scoop-lift-toss on the beat, RAM arcs into the mouth, and the stuffed mouth spills on each chomp', () => {
  const s = shot('35'), at = t => shot35(t, Math.round(t * 24), s);
  const beats = audioJ.beats.filter(b => b > s.start + 0.2 && b < s.end - 0.5);
  const ramAt = t => at(t).find(i => String(i.layer ?? '').startsWith('35/ram-'))?.layer;
  const seen = new Set(beats.flatMap(b => [ramAt(b + 0.13), ramAt(b + 0.4)]));
  for (const p of ['35/ram-scoop', '35/ram-lift', '35/ram-toss']) assert.ok(seen.has(p), `${p} never shown`);
  const late = beats.at(-1);
  assert.ok(at(late + 0.4).some(i => i.layer === '35/creature-full'), 'mouth stuffed after the tosses');
  assert.ok(at(late + 0.13).filter(i => String(i.sprite ?? '').endsWith('ram-stick')).length >= 3, 'RAM spilling/flying');
  assert.ok(at(s.start + 0.5).some(i => i.layer === '35/cart'));
});

test('tower shots with a cut-out tower draw it over a tower-free plate', () => {
  const layers = read('public/sprites/layers/layers.json'), towers = read('docs/towers.json');
  const cut = shots().filter(s => s.towerCut);
  assert.ok(['20', '23', '52', '54'].every(id => cut.some(s => s.id === id)), `cut-out shots: ${cut.map(s => s.id)}`);
  assert.ok(!cut.some(s => ['01', '02', '06'].includes(s.id)), 'intro towers untouched');
  for (const s of cut) {
    assert.ok(layers[`${s.id}/tower`], `shot ${s.id} has no tower layer`);
    assert.equal(s.plate, `plates/${s.id}.png`, `shot ${s.id} has no tower-free plate`);
    assert.ok(fs.existsSync(`public/${s.plate}`));
    const L = layers[`${s.id}/tower`], [bx, by] = towers[s.id].base;
    assert.ok(bx * 1600 >= L.x - 40 && bx * 1600 <= L.x + L.w + 40 && by * 1200 >= L.y && by * 1200 <= L.y + L.h + 80, `shot ${s.id}: base outside the tower layer`);
  }
});
