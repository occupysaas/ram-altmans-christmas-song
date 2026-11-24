import lyrics from './timing/lyrics-aligned.json' with {type: 'json'};

export type LyricEntry = {line: number; from: number; to: number; carry?: boolean};

/** How many words of line `lineIndex` have started by time `t` (seconds). */
export function visibleWords(lineIndex: number, t: number): number {
  return lyrics[lineIndex].words.filter(w => w.s <= t).length;
}

/** The display text of an entry's word range. */
export function entryText(e: LyricEntry): string {
  return lyrics[e.line].words.slice(e.from, e.to).map(w => w.w).join(' ');
}
