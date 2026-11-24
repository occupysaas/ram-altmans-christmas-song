"""src/shots.json → docs/codex/02-stills-<section>.md, one Codex brief per section (design §7a tower stages)."""
import json, re
TOWER = {
 1: "a modest curly glass-and-chrome tower on the snowy peak, one thin smoke plume, a few blinking lights",
 2: "the tower has grown: extra floors and side wings bolted on, two or three smoking stacks, an occasional spark",
 3: "a sprawling top-heavy mega-tower: cooling fans everywhere, thick smoke, steady spark showers, cyan glow lighting the clouds",
 4: "a grotesquely huge tower filling the sky, belching black-grey smoke, arcs of electricity, sparks raining onto the snow, cracks showing",
 5: "the tower at its absolute peak: colossal, leaning and groaning, smoking and sparking non-stop",
}
def where(b):
    v = 'upper' if b['y'] + b['h'] / 2 < 0.4 else 'lower' if b['y'] + b['h'] / 2 > 0.6 else 'middle'
    hz = 'left' if b['x'] + b['w'] / 2 < 0.4 else 'right' if b['x'] + b['w'] / 2 > 0.6 else 'centre'
    return f"{v} {hz} (about x {b['x']:.2f}-{b['x'] + b['w']:.2f}, y {b['y']:.2f}-{b['y'] + b['h']:.2f} of the frame)"
style = open('docs/codex/style.md').read()
shots = json.load(open('src/shots.json'))
for sec in dict.fromkeys(s['section'] for s in shots):
    ss = [s for s in shots if s['section'] == sec]
    out = [f"# Brief: key stills for the {sec} section of \"Ram Altman's Christmas Song\"\n",
           "Generate one key-frame painting per shot below with your image_gen tool, in the order listed. Use the attached cast reference sheets as the exact models for every character (Ram Altman, Sam, the girl, the elves, the reindeer, the townsfolk): faces, colours and costumes must match the sheets. After each image, look at it; regenerate it if a character is off-model, if any text/letters/numbers/logos appear, or if the lyric area is busy. Then save it as a 4:3 PNG of exactly 1600x1200 px at the path given (crop/resize with Pillow via `.venv/bin/python`; never stretch). Append each prompt to `docs/asset-prompts.md`. Do not ask questions; stop when every file listed exists at 1600x1200 and you have looked at each.\n",
           style.strip(), "\nEvery still: 4:3 landscape composition, rich and full like a frame from a 1960s TV special, characters acting in profile or three-quarter view (not posing at the camera), snow and Christmas details everywhere. Leave the named lyric area calm and uncluttered (sky, wall, plain surface) because lyrics are added there later in code.\n"]
    for s in ss:
        b = s['lyrics'][0]['surface'] if s['lyrics'] else None
        t = f"- Background tower (visible if the scene shows the hill, the sky or a window toward the hill): {TOWER[s['towerStage']]}.\n" if s['towerStage'] else ""
        out.append(f"## Shot {s['id']}: `public/{s['still']}`\n{s['brief']}\n{t}" + (f"- Calm lyric area: {where(b)}.\n" if b else ""))
    fn = 'docs/codex/02-stills-' + re.sub(r'[^a-z0-9]+', '-', sec.lower()).strip('-') + '.md'
    open(fn, 'w').write('\n'.join(out)); print(fn, len(ss))
