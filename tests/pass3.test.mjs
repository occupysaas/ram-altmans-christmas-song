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
  assert.ok(Math.abs(shot('05').lyrics[0].surface.x - (0.17 + 80 / 1600)) < 1e-6);   // pass 4: another 40 px right
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
import {shot39} from '../src/shots/ram-side-shots.ts';

test('39: a packed square that empties out — people flee across and out of frame screaming, never touching Ram, no slam bursts', () => {
  const s = shot('39'), on = r => r.x > 0 && r.x < 1600;
  const at = t => shot39crowd(t, s);
  assert.ok(Math.abs(RAM39.x - 800) < 1 && RAM39.floor === 760);
  assert.ok(at(s.start + 0.2).filter(on).length >= 12, 'starts crowded');
  assert.ok(at(s.end - 0.15).filter(on).length <= 4, 'clears out by the end');
  const first = at(s.start + 0.05), last = at(s.end - 0.05);
  assert.ok(first.some((r, i) => !on(r) && last[i] && at(s.start + 1.5)[i] && on(at(s.start + 1.5)[i])), 'someone enters later');
  assert.ok(first.some((r, i) => on(r) && !on(last[i])), 'people leave');
  for (let t = s.start; t < s.end; t += 0.25) for (const r of at(t)) if (on(r)) assert.ok(Math.hypot(r.x - RAM39.x, 2 * (r.y - RAM39.floor)) >= 260, `${r.who} touches Ram at ${t.toFixed(2)}`);
  first.forEach((r, i) => { const l = last[i], a = Math.atan2(r.vy, r.vx), b = Math.atan2(l.vy, l.vx);
    const d = Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))); assert.ok(d < Math.PI / 3 || r.victim, `runner ${i} turns ${(d * 57).toFixed(0)}° (circling)`); });
  for (const q of slamTimes(s)) { const a = at(q - 1 / 24), b = at(q + 1 / 24);
    a.forEach((r, i) => assert.ok(Math.hypot(b[i].x - r.x, b[i].y - r.y) < 60, `runner ${i} jumps on the slam`)); }
  const items = shot39(s.start + 1, Math.round((s.start + 1) * 24), s);
  assert.ok(items.some(i => /^A+H/.test(i.draw?.text ?? '')), 'screams');
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
      for (const i of shot10(f / 24, f, s)) if (i.hose) best = Math.min(best, Math.hypot(i.hose.b[0] - it.pos[0], i.hose.b[1] - (it.pos[1] - (it.sprite === 'ram-stick' ? 80 : 0))));   // pass 6: sticks 80 up, chip/byte level
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

test('25: a giant bloated vacuum (5x) whose belly bumps on the beat; suction lines stream toward the nozzle; no girl', () => {
  const s = shot('25'), at = t => shot25(t, Math.round(t * 24), s);
  const can = t => at(t).find(i => String(i.sprite ?? '').includes('vacuum/canister'));   // pass 5: strapless, narrower
  assert.ok(can(s.start + 1).scale >= 2.7, `canister scale ${can(s.start + 1).scale}`);
  const b = audioJ.beats.find(x => x > s.start + 0.5);
  assert.ok((can(b + 0.13).sx ?? 1) > (can(b + 0.45).sx ?? 1) * 1.03, 'belly bumps on the beat');
  assert.ok(!at(s.start + 1).some(i => i.who === 'girl'), 'girl removed');
  const g = vacuum25(twos(Math.round((s.start + 1) * 24)), s), lines = at(s.start + 1).filter(i => i.draw?.kind === 'line' && i.draw.size < 20);   // thin suction lines (not the tube)
  assert.ok(lines.length >= 10, `${lines.length} suction lines`);
  for (const l of lines) assert.ok(Math.hypot(l.draw.to[0] - g.mouth[0], l.draw.to[1] - g.mouth[1]) < Math.hypot(l.draw.at[0] - g.mouth[0], l.draw.at[1] - g.mouth[1]), 'lines point at the nozzle');
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
  assert.ok(['20', '23', '54'].every(id => cut.some(s => s.id === id)), `cut-out shots: ${cut.map(s => s.id)}`);   // 52 joins when its elf cut-outs exist
  assert.ok(!cut.some(s => ['01', '02', '06'].includes(s.id)), 'intro towers untouched');
  for (const s of cut) {
    assert.ok(layers[`${s.id}/tower`], `shot ${s.id} has no tower layer`);
    assert.equal(s.plate, `plates/${s.id}.png`, `shot ${s.id} has no tower-free plate`);
    assert.ok(fs.existsSync(`public/${s.plate}`));
    const L = layers[`${s.id}/tower`], [bx, by] = towers[s.id].base;
    assert.ok(bx * 1600 >= L.x - 40 && bx * 1600 <= L.x + L.w + 40 && by * 1200 >= L.y && by * 1200 <= L.y + L.h + 80, `shot ${s.id}: base outside the tower layer`);
  }
});

import {shot50, shot54, ROPE_SNAP, RING54} from '../src/shots/elves-town.ts';

test('50: everyone bobs on the beat; the rope tug snaps on "un-paywalled" and tokens burst', () => {
  const s = shot('50'), at = t => shot50(t, Math.round(t * 24), s);
  assert.ok(Math.abs(ROPE_SNAP - L()[40].words.find(w => w.w === 'un-paywalled').s) < 1e-6);
  const ropes = t => at(t).filter(i => i.hose);
  assert.equal(ropes(ROPE_SNAP - 0.15).length, 1, 'one taut rope before the snap');
  assert.equal(ropes(ROPE_SNAP + 0.3).length, 2, 'two halves after');
  assert.ok(at(ROPE_SNAP + 0.3).filter(i => String(i.sprite ?? '').endsWith('coin')).length >= 8, 'token burst');
  const b = audioJ.beats.find(x => x > ROPE_SNAP + 0.3), dyOf = t => at(t).find(i => i.layer === '50/char2').dy ?? 0;
  assert.ok(Math.abs(dyOf(b + 0.13)) > Math.abs(dyOf(b + 0.45)) + 3, 'bob on the beat');
});

test('54: the town holds hands in a ring around the giant RAM rising out of the snow', () => {
  const s = shot('54'), at = t => shot54(t, Math.round(t * 24), s);
  const early = at(s.start + 0.1), late = at(s.end - 0.2);
  assert.equal(late.filter(i => String(i.sprite ?? '').includes('townsfolk/ring-')).length, 8, 'eight hand-holding pairs');
  const ram = t => at(t).find(i => i.ramGiant);
  assert.ok(ram(s.start + 0.1).at[1] > ram(s.end - 0.2).at[1] + 150, 'the RAM rises');
  const xs = late.filter(i => String(i.sprite ?? '').includes('townsfolk/ring-')).map(i => i.at[0]);
  assert.ok(Math.min(...xs) < RING54.cx - 250 && Math.max(...xs) > RING54.cx + 250, 'ring goes around the RAM');
  assert.ok(late.findIndex(i => i.ramGiant) > late.findIndex(i => String(i.sprite ?? '').includes('ring-back')) &&
    late.findIndex(i => i.ramGiant) < late.findIndex(i => String(i.sprite ?? '').includes('ring-front')), 'back half behind it, front half in front');
});

import {shot56} from '../src/shots/energy56.ts';

test('56: house windows black out one by one (with flickers) and the water flows', () => {
  const s = shot('56'), at = t => shot56(t, Math.round(t * 24), s), out = t => at(t).filter(i => i.draw?.kind === 'rect').length;
  const n = read('docs/fx-regions.json')['56'].windows.length;
  assert.ok(n >= 12, `${n} windows`);
  assert.equal(out(s.start + 0.05), 0);
  assert.ok(out(s.start + 0.5 * (s.end - s.start)) < out(s.end - 0.1), 'more go dark over time');
  assert.ok(out(s.end - 0.1) >= 0.6 * n, 'most of the town is dark by the end');
  assert.ok(at(s.start + 1).filter(i => i.draw?.kind === 'line').length >= 5, 'water streaming');
});

import {shot51, shot52, shot53, POP53, SLAP51} from '../src/shots/elves-town.ts';

test('51-53: every cut-out character is drawn and bobs on the beat', () => {
  const layers = read('public/sprites/layers/layers.json');
  for (const [id, fn] of [['51', shot51], ['52', shot52], ['53', shot53]]) {
    const s = shot(id), chars = Object.keys(layers).filter(k => k.startsWith(`${id}/char`));
    const b = audioJ.beats.find(x => x > s.start + 0.3 && x < s.end - 0.6), at = t => fn(t, Math.round(t * 24), s);
    for (const k of chars) {
      const on = at(b + 0.13).find(i => i.layer === k), off = at(b + 0.45).find(i => i.layer === k);
      assert.ok(on && off, `shot ${id} misses ${k}`);
      assert.ok((on.dy ?? 0) < (off.dy ?? 0) - 2, `shot ${id} ${k} does not bob`);
    }
    assert.equal(s.plate, `plates/${id}.png`);
  }
});

test('51: band-aid slapped on "patched" with sparks; 53: everyone jumps when the balloon pops on "popped"', () => {
  assert.ok(Math.abs(SLAP51 - L()[40].words.find(w => w.w === 'patched').s) < 1e-6);
  const s51 = shot('51'), sparks = shot51(SLAP51 + 0.06, Math.round((SLAP51 + 0.06) * 24), s51).filter(i => i.draw?.kind === 'line').length;
  assert.ok(sparks >= 6, `${sparks} sparks`);
  const s53 = shot('53'), at = t => shot53(t, Math.round(t * 24), s53);
  assert.ok(Math.abs(POP53 - L()[42].words.find(w => w.w === 'popped').s) < 1e-6);
  const dy = (t, k) => at(t).find(i => i.layer === `53/char${k}`).dy ?? 0;
  for (const k of [1, 2, 3, 4, 5, 6]) assert.ok(dy(POP53 + 0.2, k) < dy(POP53 - 0.2, k) - 25, `char${k} doesn't jump`);
  const balloon = t => at(t).find(i => i.layer === '53/balloon');
  assert.ok(!balloon(POP53 - 0.2) || (balloon(POP53 - 0.2).opacity ?? 1) === 0, 'balloon only bursts on the pop');
  assert.ok(balloon(POP53 + 0.1), 'burst shown on the pop');
});

test('56: the windmill rotors turn; remaining tower shots use the cut-out tower', () => {
  const s = shot('56'), rot = t => shot56(t, Math.round(t * 24), s).filter(i => String(i.sprite ?? '').endsWith('windmill/rotor'));
  assert.equal(rot(s.start + 1).length, 3);
  assert.notEqual(rot(s.start + 1)[0].rot, rot(s.start + 1.3)[0].rot);
  for (const id of ['49', '52', '56', '60', '62', '65']) assert.ok(shot(id).towerCut   /* 28 reverted in pass 7 */, `shot ${id} still on the old tower bump`);
});

test('56: the outage is calm (only a few single blinks) and chimneys smoke', () => {
  const s = shot('56'), n = read('docs/fx-regions.json')['56'].windows.length;
  let toggles = 0, prev = null;
  for (let f = Math.round(s.start * 24); f < s.end * 24; f++) {
    const dark = new Set(shot56(f / 24, f, s).filter(i => i.draw?.kind === 'rect').map(i => i.draw.at.join(',')));
    if (prev) for (const k of prev) if (!dark.has(k)) toggles++;   // a window that relit
    prev = dark;
  }
  assert.ok(toggles <= n / 3, `${toggles} relights for ${n} windows`);
  assert.ok(s.fx.includes('chimneySmoke') && read('docs/fx-regions.json')['56'].chimneySmoke.length >= 4);
});

import {execFileSync} from 'node:child_process';
const MOOD = ['07', '10', '18', '19', '24', '25', '26', '36', '51', '54', '60', '62'];

test('mood shots: darkened around their own lights, with a glow map per shot', () => {
  for (const id of MOOD) {
    const s = shot(id);
    assert.ok(s.mood && s.mood.dark >= 0.2 && s.mood.dark <= 0.32, `shot ${id} mood ${JSON.stringify(s.mood)}`);   // pass 4: dialled back
    for (const f of [`public/light/${id}-glow.png`, `public/light/${id}-dark.png`]) assert.ok(fs.existsSync(f), `missing ${f}`);
  }
  assert.ok(!shot('56').mood, '56 has its own blackout, no glow map');
  assert.ok(!['01', '02', '03', '04', '05', '06'].some(id => shot(id).mood), 'intro untouched');
  const stats = JSON.parse(execFileSync('.venv/bin/python', ['-I', 'scripts/make_lightmaps.py', '--stats'], {encoding: 'utf8'}));
  for (const id of MOOD) assert.ok(stats[id].lit > 0.002 && stats[id].lit < 0.35, `shot ${id}: lit fraction ${stats[id].lit}`);
});

test('finish: a highlights-only bloom runs on the programme before the CRT pass', () => {
  const f = execFileSync('.venv/bin/python', ['-I', '-c', "import sys; sys.path.insert(0, 'scripts'); import finish; print(finish.video_filter(1, 1, 10, 10, 5, 5))"], {encoding: 'utf8'});
  const bloom = f.indexOf('[hl]'), crt = f.indexOf('scale=480:360');
  assert.ok(bloom > 0 && bloom < crt, 'bloom before the CRT downscale');
  assert.match(f, /curves=all='0\/0 0\.6[0-9]*\/0/);
});

import {shot33} from '../src/shots/register33.ts';

test('33: typewriter-register — keys clack as each word is sung, $ flags pop on the tiles, $ float up, ding on "year!"', () => {
  const s = shot('33'), at = t => shot33(t, Math.round(t * 24), s), words = L()[25].words;
  assert.ok(!s.fx.includes('register'), 'old drawer jolt (glitchy) removed');
  const pressed = t => at(t).filter(i => i.draw?.kind === 'ellipse' && i.draw.pressed).length;
  for (const w of words.slice(0, -1)) assert.ok(pressed(w.s + 0.07) >= 1, `no key down for "${w.w}"`);
  const flags = t => at(t).filter(i => i.draw?.text === '$' && i.draw.tile).length;
  assert.ok(flags(words[0].s + 0.15) >= 1 && flags(words[5].s + 0.15) > flags(words[1].s + 0.15), 'flags pop up word by word');
  assert.ok(at(words[3].s + 0.2).some(i => i.draw?.text === '$' && !i.draw.tile), 'dollar signs float up');
  const year = words.at(-1).s;
  assert.ok(s.sfx.some(x => x.name === 'ding' && Math.abs(x.t - year) < 0.05), 'register ding on "year!"');
});
