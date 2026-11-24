# Throwaway test-shot artwork

Original artwork generated with the built-in image_gen tool. No text is part of the artwork.
Retained generation sheets and prompts are in `sources/`. Rebuild with
`python spike/scripts/prepare_assets.py` (Pillow and numpy).

Coordinates below are local PNG pixels from the top-left; +x right, +y down.
Pivots attach to the named parent. Torso pivot and full-reference pivot are root anchors.
Heads share one canvas and pivot; pixels outside the mouth/chin patch are identical.
The whole reference silhouette is approximately 1500px high. Parts have opaque rounded
joint overlap; hide the caps beneath the neighboring segment when assembling.
The reference is a pose/model guide, not a pixel-exact assembly of the separate puppet.
Back limbs go behind torso; front limbs go above it. Scarf is baked into torso.

| File | Pixel size | Parent | Attachment pivot (x, y) |
|---|---|---|---|
| `ram-full.png` | 710 × 1504 | — | 243, 884 |
| `ram-torso.png` | 457 × 703 | root | 298, 334 |
| `ram-arm-upper-back.png` | 248 × 357 | ram-torso.png | 202, 63 |
| `ram-arm-lower-back.png` | 372 × 272 | ram-arm-upper-back.png | 48, 214 |
| `ram-leg-upper-back.png` | 189 × 326 | ram-torso.png | 62, 48 |
| `ram-leg-lower-back.png` | 261 × 406 | ram-leg-upper-back.png | 96, 42 |
| `ram-arm-upper-front.png` | 266 × 348 | ram-torso.png | 216, 63 |
| `ram-arm-lower-front.png` | 394 × 272 | ram-arm-upper-front.png | 50, 218 |
| `ram-leg-upper-front.png` | 190 × 321 | ram-torso.png | 51, 45 |
| `ram-leg-lower-front.png` | 272 × 405 | ram-leg-upper-front.png | 93, 46 |
| `ram-head-closed.png` | 379 × 555 | ram-torso.png | 174, 530 |
| `ram-head-open.png` | 379 × 555 | ram-torso.png | 174, 530 |
| `ram-head-wide.png` | 379 × 555 | ram-torso.png | 174, 530 |
| `bg-serverroom.png` | 2400 × 1350 | — | — |
| `fg-rack.png` | 338 × 1350 | — | — |
| `fg-snowsill.png` | 2400 × 381 | — | — |

Parent attachment sockets (local pixels):

- `ram-torso.png`: neck: (324, 64); shoulder-back: (239, 138); shoulder-front: (263, 145); hip-back: (267, 516); hip-front: (334, 516).
- `ram-arm-upper-back.png`: elbow: (66, 300).
- `ram-leg-upper-back.png`: knee: (144, 280).
- `ram-arm-upper-front.png`: elbow: (80, 300).
- `ram-leg-upper-front.png`: knee: (134, 278).

`rig.json` provides the same dimensions, pivots and sockets as machine-readable data.
