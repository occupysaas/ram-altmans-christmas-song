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

test('shot 13 cuts to the 13b back shot on "down below"', () => {
  const s13 = shots().find(x => x.id === '13'), b = shots().find(x => x.id === '13b');
  const down = lyr()[8].words.find(w => w.w === 'down');
  assert.equal(s13.end, b.start);
  assert.ok(Math.abs(b.start - (down.s - 0.25)) < 1e-6, `13b starts ${b.start}`);
  assert.equal(b.plate, 'plates/13b.png');
});

test('ident then title play over shot 1 before the first sung word', () => {
  const s1 = shots()[0];
  assert.ok(IDENT.start >= s1.start && IDENT.end < TITLE.start, 'ident before title');
  assert.ok(TITLE.end <= s1.end && TITLE.end < lyr()[0].start, `title ends ${TITLE.end} before first word ${lyr()[0].start}`);
});

import {towerBump, towerGrowth, bumpAmp} from '../src/fx/towerMath.ts';
const audio = () => read('src/timing/audio.json');

test('tower bump is bounded and peaks on kick frames', () => {
  for (const stage of [1, 3, 5]) {
    const max = 0.02 + 0.01 * stage;
    for (let f = 0; f < 6231; f += 3) assert.ok(towerBump(f / 24, stage) <= max + 1e-9, `stage ${stage} frame ${f}`);
    const kicks = audio().kicks.map(k => k[0]).filter((k, i) => i % 9 === 0);
    for (const k of kicks) {
      const f = Math.ceil(k * 24);
      assert.ok(towerBump(f / 24, stage) >= 0.7 * bumpAmp(stage), `kick ${k} at frame ${f}: ${towerBump(f / 24, stage)}`);
    }
  }
  // two kicks 1 frame apart do not stack
  assert.ok(towerBump(10.05, 5, [[10, 1], [10.04, 1]]) <= 0.07 + 1e-9);
});

test('tower growth never decreases before the collapse', () => {
  let last = 0;
  for (let t = 0; t < read('src/timing/impact.json').silence; t += 0.25) {
    const g = towerGrowth(t); assert.ok(g >= last - 1e-12, `growth fell at ${t}`); last = g;
  }
  assert.ok(towerGrowth(0) >= 0 && towerGrowth(250) <= 0.12 + 1e-9);
});

test('every tower shot has a polygon whose base is inside it', () => {
  const towers = read('docs/towers.json');
  const inside = ([x, y], poly) => { let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    } return c; };
  for (const s of shots().filter(s => s.fx.includes('tower'))) {
    const tw = towers[s.id];
    assert.ok(tw, `no tower polygon for shot ${s.id}`);
    assert.ok(tw.poly.length >= 3);
    const near = [tw.base[0], tw.base[1] - 0.01];
    assert.ok(inside(near, tw.poly), `shot ${s.id} base not inside polygon`);
    assert.ok(inside([tw.top[0], tw.top[1] + 0.01], tw.poly), `shot ${s.id} top not inside polygon`);
  }
});

import {starState, collapse, TV_OFF} from '../src/fx/fxMath.ts';

test('star shatters on the glass-break frame', () => {
  const s32 = shots().find(x => x.id === '32'), g = s32.sfx.find(x => x.name === 'glass-break').t;
  let first = null;
  for (let f = Math.round(s32.start * 24); f < Math.round(s32.end * 24); f++) if (starState(f / 24).phase === 'shatter') { first = f; break; }
  assert.ok(first !== null, 'never shatters');
  assert.ok(Math.abs(first - g * 24) <= 1, `shatter frame ${first} vs glass ${g * 24}`);
});

test('star shows its pixelated back during the spin', () => {
  const premium = lyr()[24].words.find(w => w.w === 'premium');
  const states = [];
  for (let t = premium.s; t < lyr()[24].end; t += 1 / 24) states.push(starState(t));
  assert.ok(states.some(s => s.face === 'back'), 'back never shown');
  assert.equal(starState(premium.s - 0.5).face, 'front');
});

test('collapse is complete before the TV switches off', () => {
  const sil = read('src/timing/impact.json').silence;
  assert.equal(collapse(sil - 0.05).sy, 1);
  const end = collapse(TV_OFF - 0.3);
  assert.ok(end.sy <= 0.12 + 1e-9 && end.rubble === 1, JSON.stringify(end));
  let last = 1;
  for (let t = sil; t < TV_OFF; t += 1 / 24) { const c = collapse(t); assert.ok(c.sy <= last + 1e-9); last = c.sy; }
});

import {CHOREO} from '../src/shots/index.ts';
export const DONE_A = ['08', '10', '13', '21', '22', '24', '25', '26', '27', '39', '43', '63'];

test('every tier-A shot has a plate, its puppets and a choreography module', () => {
  for (const id of DONE_A) {
    const s = shots().find(x => x.id === id);
    assert.equal(s.tier, 'A', `shot ${id} should be tier A`);
    assert.ok(fs.existsSync(`public/${s.plate}`), `shot ${id}: missing ${s.plate}`);
    assert.ok(CHOREO[id], `shot ${id}: no choreography`);
    const placed = CHOREO[id](s.start + 0.5, Math.round((s.start + 0.5) * 24), s);
    // a puppet, or (arms-only shots like 10) that puppet's painted parts
    assert.ok(placed.some(p => (p.who && s.puppets.includes(p.who)) || s.puppets.some(w => p.sprite?.startsWith(`puppets/${w}/`))), `shot ${id}: choreography draws none of ${s.puppets}`);
  }
});
