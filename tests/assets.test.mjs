import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// image facts via the project's Python (Pillow): size, mode and alpha at given points
const probe = (path, pts = []) => JSON.parse(execFileSync('.venv/bin/python', ['-I', 'scripts/check_assets.py', path, JSON.stringify(pts)], {encoding: 'utf8'}));
const shots = () => JSON.parse(fs.readFileSync('src/shots.json', 'utf8'));

test('every shot still exists at 1600x1200', () => {
  for (const s of shots()) {
    const p = `public/${s.still}`;
    assert.ok(fs.existsSync(p), `missing ${p}`);
    assert.deepEqual(probe(p).size, [1600, 1200], p);
  }
});

test('tv plate has a transparent 4:3 screen hole matching console.json', () => {
  const r = JSON.parse(fs.readFileSync('public/tv/console.json', 'utf8'));
  assert.ok(Math.abs(r.w / r.h - 4 / 3) < 0.01, `hole aspect ${r.w / r.h}`);
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const info = probe('public/tv/console.png', [[cx, cy], [r.x - 20, cy], [r.x + r.w + 20, cy], [cx, r.y - 20], [cx, r.y + r.h + 20]]);
  assert.deepEqual(info.size, [1920, 1080]);
  assert.equal(info.alpha[0], 0, 'centre of the screen is transparent');
  info.alpha.slice(1).forEach((a, i) => assert.equal(a, 255, `outside edge ${i} is opaque`));
});

test('cast sheets exist for ram, sam, girl, elves, reindeer, townsfolk', () => {
  for (const c of ['ram', 'sam', 'girl', 'elves', 'reindeer', 'townsfolk']) {
    const p = `public/cast/${c}.png`;
    assert.ok(fs.existsSync(p), `missing ${p}`);
    assert.ok(probe(p).size[0] >= 1024, p);
  }
});
