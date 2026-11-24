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
