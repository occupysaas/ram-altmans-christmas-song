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

import {starState, TV_OFF} from '../src/fx/fxMath.ts';

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

import {CHOREO} from '../src/shots/index.ts';
export const DONE_A = ['08', '10', '13', '15', '16', '21', '22', '24', '40', '49', '61', '25', '26', '27', '31', '34', '39', '43', '46', '47', '48', '58', '59', '63'];

test('every tier-A shot has a plate, its puppets and a choreography module', () => {
  for (const id of DONE_A) {
    const s = shots().find(x => x.id === id);
    assert.equal(s.tier, 'A', `shot ${id} should be tier A`);
    assert.ok(fs.existsSync(`public/${s.plate}`), `shot ${id}: missing ${s.plate}`);
    assert.ok(CHOREO[id], `shot ${id}: no choreography`);
    const placed = CHOREO[id](s.start + 0.5, Math.round((s.start + 0.5) * 24), s);
    // a puppet, or (arms-only shots like 10) that puppet's painted parts
    assert.ok(placed.some(p => (p.who && s.puppets.includes(p.who)) || p.sleighTeam || s.puppets.some(w => p.sprite?.startsWith(`puppets/${w}/`))), `shot ${id}: choreography draws none of ${s.puppets}`);
  }
});

import {SLEIGH_PATHS} from '../src/shots/sleigh.ts';

test('sleigh teams face their direction of travel', () => {
  for (const id of ['15', '16', '31', '34', '46', '47', '48']) {
    const s = shots().find(x => x.id === id), path = SLEIGH_PATHS[id];
    assert.ok(path, `no sleigh path for ${id}`);
    for (let k = 1; k < 10; k++) {
      const t = s.start + (s.end - s.start) * k / 10, a = path(t - 0.05, s), b = path(t + 0.05, s);
      const dx = b.pos[0] - a.pos[0];
      if (Math.abs(dx) < 1) continue;            // hovering (e.g. frozen on "buffering")
      assert.equal(b.flip, dx < 0, `shot ${id} at ${t.toFixed(2)}: dx ${dx.toFixed(1)} flip ${b.flip}`);
    }
  }
});

import {mouthAt} from '../src/lipsync.ts';
import {doorShake} from '../src/fx/door.ts';

test('ending mouths are closed outside lines 46-48', () => {
  const L = lyr();
  for (const t of [L[46].start - 1, 223.4, L[48].end + 0.6, 150]) {
    assert.equal(mouthAt('girl', t), 'X', `girl at ${t}`);
    assert.equal(mouthAt('ram', t), 'X', `ram at ${t}`);
  }
});

test('girl speaks lines 46-47, Ram speaks line 48', () => {
  const L = lyr(), talking = (who, a, b) => { for (let t = a; t < b; t += 1 / 24) if (mouthAt(who, t) !== 'X') return true; return false; };
  assert.ok(talking('girl', L[46].start, L[46].end) && talking('girl', L[47].start, L[47].end));
  assert.ok(!talking('ram', L[46].start, L[47].end), 'Ram silent while the girl speaks');
  assert.ok(talking('ram', L[48].start, L[48].end));
  assert.ok(!talking('girl', L[48].start, L[48].end), 'girl silent while Ram speaks');
});

test('door shakes on each knock', () => {
  const k = read('src/timing/impact.json').knocks;
  for (const t of k) { assert.ok(Math.abs(doorShake(t + 0.03)) > 2, `knock ${t}`); }
  assert.equal(doorShake(k[0] - 0.2), 0);
  assert.ok(Math.abs(doorShake(k[2] + 0.6)) < 0.5);
});

import {FX_IMPL, NEEDS_REGION} from '../src/fx/registry.ts';

test('every fx named in shots.json has an implementation and a region', () => {
  const regions = read('docs/fx-regions.json');
  for (const s of shots()) for (const f of s.fx) {
    assert.ok(FX_IMPL.includes(f), `shot ${s.id}: no implementation for fx "${f}"`);
    if (NEEDS_REGION.includes(f)) assert.ok(regions[s.id]?.[f], `shot ${s.id}: no region for fx "${f}"`);
  }
});
