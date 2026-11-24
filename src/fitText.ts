/** Still-space text fitting. Sizes are in still pixels (stills are 1600x1200; the camera scales them). */
export const STILL_W = 1600;
export const STILL_H = 1200;
/** Smallest readable size: after the 960-px programme and the 480-px CRT base it is ~14 px tall. */
export const MIN_FONT = 48;
export type Style = 'narration' | 'hook' | 'tech' | 'aside';
const MAX_FONT: Record<Style, number> = {narration: 84, hook: 104, tech: 76, aside: 64};
/** Conservative average advance per character, as a fraction of the font size. */
const CHAR_W: Record<Style, number> = {narration: 0.52, hook: 0.56, tech: 0.5, aside: 0.52};
export const LINE_H = 1.15;

export function fitText(text: string, box: {w: number; h: number}, style: Style) {
  const words = text.split(/\s+/).filter(Boolean);
  for (let size = MAX_FONT[style]; size >= MIN_FONT; size -= 2) {
    const estimateWidth = (s: string) => s.length * CHAR_W[style] * size;
    const lines: string[] = [];
    for (const w of words) {
      const cur = lines.at(-1);
      if (cur !== undefined && estimateWidth(cur + ' ' + w) <= box.w) lines[lines.length - 1] = cur + ' ' + w;
      else lines.push(w);
    }
    if (lines.length * size * LINE_H <= box.h && lines.every(l => estimateWidth(l) <= box.w)) return {fontSize: size, lines, estimateWidth};
  }
  const size = MIN_FONT, estimateWidth = (s: string) => s.length * CHAR_W[style] * size;
  return {fontSize: size, lines: [text], estimateWidth};
}

/** Screen-space band (lower third of the programme) for carried lines, in still-pixel units at zoom 1:
 *  x 8%..92%, y 82%..95% of the frame. */
export const CAPTION_BAND = {x: 0.08 * STILL_W, y: 0.82 * STILL_H, w: 0.84 * STILL_W, h: 0.13 * STILL_H};
