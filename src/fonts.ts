import {continueRender, delayRender, staticFile} from 'remotion';

export const FONTS = {
  narration: 'IM Fell English',
  hook: 'Mountains of Christmas',
  tech: 'VT323',
} as const;

const files: [string, string, string?][] = [
  ['IM Fell English', 'fonts/IMFellEnglish.ttf'],
  ['IM Fell English', 'fonts/IMFellEnglish-Italic.ttf', 'italic'],
  ['Mountains of Christmas', 'fonts/MountainsOfChristmas-Regular.ttf'],
  ['Mountains of Christmas Bold', 'fonts/MountainsOfChristmas-Bold.ttf'],
  ['Bowlby One', 'fonts/BowlbyOne.ttf'],
  ['Berkshire Swash', 'fonts/BerkshireSwash.ttf'],
  ['VT323', 'fonts/VT323.ttf'],
];

let loaded = false;
/** Load every bundled font once, holding the render until they are ready. */
export function loadFonts() {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('fonts');
  Promise.all(files.map(([family, file, style]) => {
    const f = new FontFace(family, `url(${staticFile(file)})`, {style: style ?? 'normal'});
    return f.load().then(x => document.fonts.add(x));
  })).then(() => continueRender(handle));
}
