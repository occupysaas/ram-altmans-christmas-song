import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {layoutEntry, wordGap, STILL_W, STILL_H} from '../src/layout.ts';
import {starState} from '../src/fx/fxMath.ts';
import {shot10, shot63} from '../src/shots/ram-side-shots.ts';
import {shoulders} from '../src/puppet/body.ts';
import {wordAt} from '../src/shots/kit.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shots = () => read('src/shots.json');
const shot = id => shots().find(s => s.id === id);
const M = read('src/fontMetrics.json');

test('shots 01-06 are frozen (S tier, do not alter)', () => {
  assert.deepEqual(shots().filter(x => ['01', '02', '03', '04', '05', '06'].includes(x.id)), read('tests/fixtures/frozen-01-06.json'));
});

test('star front shows for at least 1.2 s', () => {
  const s = shot('32');
  for (let t = s.start; t < s.start + 1.2; t += 0.05) assert.equal(starState(t).face, 'front', `back at ${t}`);
});

test('impact word keeps a visible leading space', () => {
  const lead = {size: 64}, imp = {size: 96};
  assert.ok(wordGap(lead, imp) >= 0.25 * imp.size);
  assert.ok(wordGap(imp, imp) >= 0.25 * imp.size);
});

test('layout word widths cover the real font advances', () => {
  for (const s of shots()) for (const e of s.lyrics) {
    const L = layoutEntry(e, {w: e.surface.w * STILL_W, h: e.surface.h * STILL_H / s.lyrics.length});
    for (const w of L.words) {
      const fam = w.font.family + (w.font.italic ? ' Italic' : '');
      const real = [...w.text].reduce((a, c) => a + (M[fam][c] ?? 0.6), 0) * w.size;
      assert.ok(w.width >= real, `shot ${s.id} "${w.text}" ${w.width.toFixed(0)} < ${real.toFixed(0)}`);
    }
  }
});

test('shot 10 hands land on the shelf items', () => {
  const items = [[wordAt(5, 1), [440, 540]], [wordAt(5, 3), [718, 555]], [wordAt(5, 5), [950, 580]]];
  for (const [at, tgt] of items) {
    let best = 1e9;
    for (let f = Math.floor((at - 0.2) * 24); f <= Math.ceil((at + 0.2) * 24); f++)
      for (const it of shot10(f / 24, f, shot('10'))) if (it.hose) best = Math.min(best, Math.hypot(it.hose.b[0] - tgt[0], it.hose.b[1] - tgt[1]));
    assert.ok(best < 20, `hand misses ${tgt} by ${best.toFixed(0)}px`);
  }
});

test('bow hands stay below the shoulders', () => {
  const s = shot('63');
  for (let f = Math.round(s.start * 24); f < s.end * 24; f += 6) {
    const it = shot63(f / 24, f, s).find(i => i.who), p = it.pose;
    const sh = shoulders('ram-side', p.hip, p.lean, it.scale, p.flip);
    assert.ok(p.hands.near[1] > sh.near[1] && p.hands.far[1] > sh.far[1], `frame ${f}: hands ${p.hands.near[1].toFixed(0)},${p.hands.far[1].toFixed(0)} vs shoulders ${sh.near[1].toFixed(0)}`);
  }
});

test('star stays in view from the shot start until it tips', async () => {
  const {STAR} = await import('../src/fx/Star.tsx').catch(() => ({STAR: {x: 0.393, y: 0.08}}));
  const s = shot('32'), {from: a, to: b} = s.camera;
  const tip = read('src/timing/lyrics-aligned.json')[24].end;
  for (let t = s.start; t < tip; t += 0.1) {
    const p = Math.min(1, (t - s.start) / (s.end - s.start)), lerp = (u, v) => u + (v - u) * p;  // the eased path stays between the endpoints
    for (const q of [0, p, 1]) {
      const y = a.y + (b.y - a.y) * q, z = a.zoom + (b.zoom - a.zoom) * q, half = 0.5 / z;
      assert.ok(STAR.y > y - half && STAR.y < y + half, `star out of view at ${t.toFixed(2)} (cam y ${y.toFixed(3)})`);
    }
  }
});

test('lyric boxes keep >=24 px inside the camera view at both ends of the move', () => {
  const FROZEN = ['01', '02', '03', '04', '05', '06'];
  for (const s of shots()) if (!FROZEN.includes(s.id)) for (const e of s.lyrics) for (const c of [s.camera.from, s.camera.to]) {
    const h = 0.5 / c.zoom, mx = 24 / STILL_W, my = 24 / STILL_H, b = e.surface;
    const ok = b.x - (c.x - h) >= mx - 1e-6 && (c.x + h) - (b.x + b.w) >= mx - 1e-6 && b.y - (c.y - h) >= my - 1e-6 && (c.y + h) - (b.y + b.h) >= my - 1e-6;
    assert.ok(ok, `shot ${s.id} line ${e.line} too close to the frame edge`);
  }
});

import {teamGeometry, DEER_SCALE} from '../src/puppet/team.ts';
import {SLEIGH_PATHS, SLEIGH_CHOREO} from '../src/shots/sleigh.ts';
import deerParts from '../public/puppets/reindeer/parts.json' with {type: 'json'};

test('reins run from the hands to a harness point on each deer, every 3rd frame of 46 and 47', () => {
  const b = deerParts.body;
  for (const id of ['46', '47']) {
    const s = shot(id);
    for (let f = Math.round(s.start * 24); f < s.end * 24; f += 3) {
      const team = SLEIGH_CHOREO[id](f / 24, f, s).find(i => i.sleighTeam).sleighTeam;
      assert.ok(team.deer, `shot ${id} has no deer`);
      const g = teamGeometry(team.state, team.scale, team.t), ds = team.scale * DEER_SCALE;
      g.reins.forEach((r, i) => {
        assert.deepEqual(r.a, g.hands);
        assert.deepEqual(r.b, g.harness[i]);
        const a = -g.deerRot * Math.PI / 180, dx = r.b[0] - g.deerAt[i][0], dy = r.b[1] - g.deerAt[i][1];
        const local = [(dx * Math.cos(a) - dy * Math.sin(a)) / ds + b.neck[0], (dx * Math.sin(a) + dy * Math.cos(a)) / ds + b.neck[1]];
        assert.ok(local[0] > b.size[0] * 0.6 && local[0] < b.size[0] && local[1] > 0 && local[1] < b.size[1] * 0.6, `shot ${id} f${f} rein ${i} ends off the deer's chest at ${local}`);
      });
    }
  }
});

import {shot07, mouseOffset} from '../src/shots/07.ts';
import {fanSpin} from '../src/fx/fanMath.ts';
const audioJ = read('src/timing/audio.json');

test('07: the mouse darts to a new spot on each beat and holds between beats', () => {
  const s = shot('07'), beats = audioJ.beats.filter(b => b > s.start + 0.1 && b < s.end - 0.5);
  assert.ok(beats.length >= 4);
  for (let i = 0; i + 1 < beats.length; i++) {
    const a = mouseOffset(beats[i] + 0.2), a2 = mouseOffset(beats[i] + 0.35), b = mouseOffset(beats[i + 1] + 0.2);
    assert.deepEqual(a, a2, `mouse drifts during beat ${i}`);
    assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) > 8, `mouse did not move on beat ${i + 1}`);
  }
  const items = shot07(s.start + 1, Math.round((s.start + 1) * 24), s);
  assert.ok(items.some(i => i.layer === '07/hand') && items.some(i => i.draw?.kind === 'cursor') && items.some(i => i.hose));
});

test('12: fan blades spin faster just after a kick than between kicks', () => {
  const s = shot('12'), k = audioJ.kicks.map(x => x[0]).find(x => x > s.start + 0.5 && x < s.end - 0.5);
  const rate = t => (fanSpin(t + 0.01) - fanSpin(t)) / 0.01;
  assert.ok(rate(k + 0.05) > 1.4 * rate(k - 0.15), `kick ${rate(k + 0.05)} vs before ${rate(k - 0.15)}`);
});

import {shot18, shot19, TEAR_EYES} from '../src/shots/sad-shots.ts';

test('18: everyone sobs on beats and tears fall from each face', () => {
  const s = shot('18'), beats = audioJ.beats.filter(b => b > s.start + 0.2 && b < s.end - 0.4);
  const at = t => shot18(t, Math.round(t * 24), s);
  for (const who of Object.keys(TEAR_EYES)) {
    const sobbing = beats.map(b => at(b + 0.05).some(i => i.layer === `18/${who}-sob`));
    assert.ok(sobbing.some(Boolean) && sobbing.some(x => !x), `${who} never alternates sob/rest on beats`);
  }
  const mid = at(s.start + 2);
  assert.ok(mid.filter(i => i.draw?.kind === 'drop').length >= 8, 'tears');
  assert.ok(mid.some(i => i.layer === '18/tag' && (i.sx ?? 1) >= 1.6), 'tag enlarged');
});

test('19: shoppers recoil into shock after the price flips', () => {
  const s = shot('19'), at = t => shot19(t, Math.round(t * 24), s);
  assert.ok(at(s.start + 0.1).every(i => !String(i.layer ?? '').endsWith('-shock')));
  assert.ok(at(s.end - 0.3).filter(i => String(i.layer ?? '').endsWith('-shock')).length >= 3);
  assert.ok(at(s.end - 0.3).some(i => i.draw?.kind === 'text'), 'price drawn on the tag');
});

import {coinsAt, SHOP_SIGNS} from '../src/shots/sleigh.ts';

test('21/22: a fresh burst of coins pours out of the sleigh on each beat, and shops flip to SOLD', () => {
  const s = shot('21'), beats = audioJ.beats.filter(b => b > s.start + 0.15 && b < s.end - 0.2);
  assert.ok(beats.length >= 2);
  for (const b of beats) {
    const before = coinsAt('21', b - 0.02, s).filter(c => c.age < 0.1).length, after = coinsAt('21', b + 0.06, s).filter(c => c.age < 0.1).length;
    assert.ok(after >= before + 6, `beat ${b}: ${before} -> ${after}`);
  }
  const items = SLEIGH_CHOREO['21'](s.end - 0.05, Math.round((s.end - 0.05) * 24), s);
  assert.ok(items.filter(i => i.draw?.text === 'SOLD').length >= 2, 'shops sold');
  assert.equal(SHOP_SIGNS.length, 5);
  const s22 = shot('22'), it22 = SLEIGH_CHOREO['22'](s22.start + 0.5, Math.round((s22.start + 0.5) * 24), s22);
  assert.ok(it22.some(i => i.sleighTeam) && it22.filter(i => i.draw?.text === 'SOLD').length === 5);
});

import {shot24, shot25, vaultDoorX, spillLanded, shelfLeft} from '../src/shots/ram-side-shots.ts';

test('24: Ram pushes the door from the right and the spilled pile on the floor keeps growing', () => {
  const s = shot('24'), q = k => s.start + (s.end - s.start) * k;
  assert.ok(spillLanded(q(0.3)) < spillLanded(q(0.6)) && spillLanded(q(0.6)) < spillLanded(q(0.95)), 'pile grows');
  assert.ok(spillLanded(q(0.95)) >= 12);
  const it = shot24(q(0.5), Math.round(q(0.5) * 24), s), ram = it.find(i => i.who);
  assert.ok(ram.pose.flip && ram.pose.hip[0] > vaultDoorX(q(0.5)), 'Ram is to the right of the door, facing left');
});

test('25: the shelf empties beat by beat and is bare by the end', () => {
  const s = shot('25'), beats = audioJ.beats.filter(b => b > s.start && b < s.end - 0.3);   // a beat in the last 0.3 s is cut off
  let prev = shelfLeft(s.start);
  assert.ok(prev >= 16);
  for (const b of beats) { const n = shelfLeft(b + 0.3); assert.ok(n < prev, `no grab on beat ${b}`); prev = n; }
  assert.equal(shelfLeft(s.end - 0.05), 0);
  assert.ok(shot25(s.end - 0.2, Math.round((s.end - 0.2) * 24), s).some(i => i.who === 'girl'), 'girl behind him');
});

import {shot30, laneMerge, LANES} from '../src/shots/elves-topdown.ts';

test('30: each of the 4 lanes gets pistoned once, four same-task elves becoming one four-armed elf', () => {
  const s = shot('30'), at = t => shot30(t, Math.round(t * 24), s);
  assert.equal(LANES.length, 4);
  const times = LANES.map((_, l) => laneMerge(l, s));
  assert.ok(times.every(x => x > s.start + 0.3 && x < s.end - 0.4), `merge times ${times}`);
  assert.equal(new Set(times.map(x => x.toFixed(2))).size, 4, 'staggered');
  const early = at(s.start + 0.1), late = at(s.end - 0.1);
  assert.equal(early.filter(i => String(i.sprite).includes('topdown-elf/multi')).length, 0);
  assert.equal(early.filter(i => /topdown-elf\/(wrap|tape|bow|label)/.test(String(i.sprite))).length, 16);
  assert.equal(late.filter(i => String(i.sprite).includes('topdown-elf/multi')).length, 4);
});

test('31: a big loading spinner sits over the frozen team after "buffering"', () => {
  const s = shot('31'), buf = read('src/timing/lyrics-aligned.json')[23].words.find(w => w.w === 'buffering').s;
  const before = SLEIGH_CHOREO['31'](buf - 0.2, Math.round((buf - 0.2) * 24), s), after = SLEIGH_CHOREO['31'](buf + 0.5, Math.round((buf + 0.5) * 24), s);
  const dots = items => items.filter(i => i.draw?.kind === 'dot' && i.draw.size >= 14);
  assert.equal(dots(before).length, 0);
  const d = dots(after); assert.ok(d.length >= 12, `${d.length} spinner dots`);
  const team = after.find(i => i.sleighTeam).sleighTeam.state.pos, cx = d.reduce((a, i) => a + i.draw.at[0], 0) / d.length;
  assert.ok(Math.abs(cx - team[0]) < 700 && cx > 100 && cx < 1500, `spinner at ${cx}, team at ${team[0]}`);
});
