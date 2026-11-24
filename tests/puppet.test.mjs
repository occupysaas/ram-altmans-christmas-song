import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hoseControl, onTwos, followThrough} from '../src/puppet/geom.ts';
import {walkCycle} from '../src/puppet/walk.ts';

const W = {t0: 0, x0: 100, dist: 600, steps: 6, stepDur: 0.31, floor: 1000, lift: 60, dir: 1};
const at = t => walkCycle({...W, t});

test('planted foot does not slide during stance', () => {
  // near foot stance windows are [2kD, (2k+1)D)
  for (let k = 0; k < 3; k++) {
    const a = 2 * k * W.stepDur + 0.01, b = (2 * k + 1) * W.stepDur - 0.01;
    const xa = at(a).feet.near[0];
    for (let t = a; t < b; t += 0.02) assert.ok(Math.abs(at(t).feet.near[0] - xa) < 0.5, `slid at ${t}`);
    for (let t = a; t < b; t += 0.02) assert.equal(at(t).feet.near[1], W.floor);
  }
});

test('walk ends with both feet planted on the floor', () => {
  const end = at(W.steps * W.stepDur + 0.5);
  assert.ok(end.stopped);
  assert.equal(end.feet.near[1], W.floor);
  assert.equal(end.feet.far[1], W.floor);
  const later = at(W.steps * W.stepDur + 2);
  assert.deepEqual(later.feet, end.feet);
});

test('arms swing opposite to the same-side leg', () => {
  for (const t of [0.05, 0.31 * 2 + 0.05, 0.31 * 4 + 0.05]) {
    const s = at(t), rel = (s.feet.near[0] - s.x) * W.dir;
    assert.ok(rel > 0, 'near foot ahead just after landing');
    assert.ok(s.swing.near < 0, `near arm should be back when near foot is ahead (t=${t})`);
    assert.ok(s.swing.far > 0, 'far arm forward');
  }
});

test('body overshoots after the feet stop, then settles', () => {
  assert.equal(followThrough(-0.1, 30, 11, 4.5), 0);
  assert.ok(Math.abs(followThrough(0.12, 30, 11, 4.5)) > 5);
  assert.ok(Math.abs(followThrough(1.5, 30, 11, 4.5)) < 1);
});


test('hose keeps its length without elbows', () => {
  const L = 200;
  for (const d of [0.4, 0.6, 0.8, 1.0].map(f => f * L)) {
    const a = [0, 0], b = [d, 0], c = hoseControl(a, b, L, 1);
    let len = 0, prev = a;
    for (let i = 1; i <= 200; i++) {
      const u = i / 200, x = (1 - u) ** 2 * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], y = (1 - u) ** 2 * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1];
      len += Math.hypot(x - prev[0], y - prev[1]); prev = [x, y];
    }
    assert.ok(Math.abs(len - L) / L < 0.08, `d=${d}: arc ${len.toFixed(1)} vs ${L}`);
  }
});

import {CHOREO} from '../src/shots/index.ts';
import {PARTS} from '../src/puppet/parts.ts';
import fs from 'node:fs';

test('every part a choreography references exists in its parts.json', () => {
  const shots = JSON.parse(fs.readFileSync('src/shots.json', 'utf8'));
  for (const [id, choreo] of Object.entries(CHOREO)) {
    const s = shots.find(x => x.id === id);
    for (let k = 0; k <= 12; k++) {
      const t = s.start + (s.end - s.start) * k / 12, frame = Math.floor(t * 24);
      for (const p of choreo(t, frame, s).filter(i => i.who)) {
        const sheet = PARTS[p.who];
        assert.ok(sheet, `shot ${id}: unknown puppet ${p.who}`);
        for (const name of ['torso', 'foot-near', 'foot-far', p.pose.head, p.pose.hands.nearPart, p.pose.hands.farPart])
          assert.ok(sheet[name], `shot ${id}: ${p.who} has no part ${name}`);
        assert.ok(fs.existsSync(`public/puppets/${p.who}/${p.pose.head}.png`), `missing png ${p.pose.head}`);
      }
    }
  }
});

import {groove, DOWNBEAT_OFFSET} from '../src/puppet/groove.ts';
const audioJ = JSON.parse(fs.readFileSync('src/timing/audio.json', 'utf8'));
const sections = JSON.parse(fs.readFileSync('src/timing/sections.json', 'utf8'));

test('bob peaks on each beat (tick) and is lowest just before the next', () => {
  const v1 = sections.find(s => s.name === 'Verse 1');
  const beats = audioJ.beats.filter(b => b > v1.start + 2 && b < v1.end - 2).slice(0, 8);
  for (let i = 0; i < beats.length - 1; i++) {
    const at = groove(beats[i] + 0.01).bob, before = groove(beats[i + 1] - 0.02).bob;
    assert.ok(at > 0.8, `bob at beat ${beats[i]}: ${at}`);
    assert.ok(before < 0.15, `bob before next beat: ${before}`);
  }
});

test('sway changes direction every 4 beats, on the bar', () => {
  const v1 = sections.find(s => s.name === 'Verse 1');
  const idx = audioJ.beats.map((b, i) => [b, i]).filter(([b, i]) => b > v1.start + 2 && b < v1.end - 6 && (i - DOWNBEAT_OFFSET) % 4 === 0);
  for (const [b] of idx.slice(0, 4)) {
    const mid1 = groove(b + 0.9).sway, mid2 = groove(b + 0.9 + 4 * 0.535).sway;   // ~2 beats into this bar vs the next
    assert.ok(Math.sign(mid1) !== Math.sign(mid2) && Math.abs(mid1) > 0.5, `bar at ${b}: ${mid1} vs ${mid2}`);
  }
});

test('groove is on in verses and the bridge, off in the choruses', () => {
  const mid = n => { const s = sections.find(x => x.name === n); return (s.start + s.end) / 2; };
  for (const n of ['Verse 1', 'Verse 2', 'Bridge']) assert.ok(groove(mid(n)).active, n);
  for (const n of ['Chorus 1', 'Chorus 2']) assert.ok(!groove(mid(n)).active, n);
  assert.ok(groove(mid('Chorus 1'), true).active, 'per-shot override switches it on');
});

import {holdFrame} from '../src/puppet/geom.ts';

test('animation holds each drawing 2 frames, with an occasional 3-frame hold (Cuphead-style)', () => {
  const runs = []; let cur = holdFrame(0), n = 0;
  for (let f = 0; f < 600; f++) {
    const h = holdFrame(f);
    assert.ok(h <= f && f - h <= 2, `frame ${f} shows ${h}`);
    if (h !== cur) { runs.push(n); cur = h; n = 0; }
    n++;
  }
  assert.ok(runs.every(r => r === 2 || r === 3), `hold lengths ${[...new Set(runs)]}`);
  assert.ok(runs.filter(r => r === 3).length > 10, 'some 3-frame holds');
  assert.ok(runs.filter(r => r === 2).length > runs.length * 0.6, 'mostly twos');
});
