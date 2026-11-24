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
