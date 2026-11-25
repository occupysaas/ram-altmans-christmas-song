import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot07} from '../src/shots/07.ts';
import {shot61} from '../src/shots/crowd.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shot = id => read('src/shots.json').find(s => s.id === id);

test('07: the arm is an upper arm down to an elbow at desk height, then a forearm lying flat along the desk', () => {
  const s = shot('07');
  for (let f = Math.round(s.start * 24); f < s.end * 24; f += 2) {
    const hoses = shot07(f / 24, f, s).filter(i => i.hose).map(i => i.hose);
    assert.equal(hoses.length, 2, 'upper arm + forearm');
    const [upper, fore] = hoses;
    assert.ok(upper.b[1] - upper.a[1] >= 60, 'elbow well below the shoulder');
    const ang = Math.abs(Math.atan2(fore.b[1] - fore.a[1], fore.b[0] - fore.a[0]) * 180 / Math.PI);
    assert.ok(ang <= 20, `forearm tilted ${ang.toFixed(0)}°, not lying on the desk`);
  }
});

test('61: the elves\' hands stay above the conveyor belt (nothing reaches behind it)', () => {
  const s = shot('61'), BELT = 930;
  for (let f = Math.round(s.start * 24); f < s.end * 24; f += 3)
    for (const it of shot61(f / 24, f, s).filter(i => i.who === 'elf'))
      for (const h of [it.pose.hands.near, it.pose.hands.far]) assert.ok(h[1] <= BELT - 10, `elf hand at y ${h[1].toFixed(0)} behind the belt`);
});
