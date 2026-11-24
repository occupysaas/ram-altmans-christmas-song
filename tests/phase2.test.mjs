import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {IDENT, TITLE} from '../src/fx/titles.ts';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const shots = () => read('src/shots.json');
const lyr = () => read('src/timing/lyrics-aligned.json');

test('every shot has a motion tier and tier-A shots name their puppets', () => {
  for (const s of shots()) {
    assert.ok(['A', 'B', 'C'].includes(s.tier), `shot ${s.id} tier ${s.tier}`);
    assert.ok(Array.isArray(s.fx), `shot ${s.id} fx`);
    if (s.tier === 'A') {
      assert.ok(s.puppets?.length, `shot ${s.id} has no puppets`);
      assert.equal(s.plate, `plates/${s.id}.png`);
    }
    if (s.tier === 'B') assert.ok(s.fx.length, `tier-B shot ${s.id} has no fx`);
  }
});

test('ident then title play over shot 1 before the first sung word', () => {
  const s1 = shots()[0];
  assert.ok(IDENT.start >= s1.start && IDENT.end < TITLE.start, 'ident before title');
  assert.ok(TITLE.end <= s1.end && TITLE.end < lyr()[0].start, `title ends ${TITLE.end} before first word ${lyr()[0].start}`);
});
