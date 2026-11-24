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

test('poses change on twos', () => {
  for (const k of [0, 7, 500]) assert.equal(onTwos(2 * k), onTwos(2 * k + 1));
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
      for (const p of choreo(t, frame, s)) {
        const sheet = PARTS[p.who];
        assert.ok(sheet, `shot ${id}: unknown puppet ${p.who}`);
        for (const name of ['torso', 'foot-near', 'foot-far', p.pose.head, p.pose.hands.nearPart, p.pose.hands.farPart])
          assert.ok(sheet[name], `shot ${id}: ${p.who} has no part ${name}`);
        assert.ok(fs.existsSync(`public/puppets/${p.who}/${p.pose.head}.png`), `missing png ${p.pose.head}`);
      }
    }
  }
});
