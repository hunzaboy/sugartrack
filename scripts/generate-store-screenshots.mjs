/**
 * Play Store and website screenshots.
 *
 * Frames raw device captures on a branded background. Two things changed from
 * the previous version: the caption type is now really Inter (SVG <text> was
 * falling back to a system face, because librsvg cannot see the project's
 * fonts), and the palette is the app's own rather than a darker invented one.
 *
 * Raw captures come from `play-store/raw-screenshots/*.png` — full-resolution
 * device screenshots. Two things to get right when recapturing:
 *
 *  1. Turn off the dev-client floating button, or it lands in the published
 *     artwork (it was visible in the previous store screenshots):
 *       adb shell "run-as <pkg> sh -c 'sed -i s/\"showFab\" value=\"true\"/\"showFab\" value=\"false\"/ \
 *         shared_prefs/expo.modules.devmenu.sharedpreferences.xml'"
 *     ...or add `<boolean name="showFab" value="false" />` to that file.
 *  2. Scroll each screen to the top first — tabs keep their scroll position,
 *     which otherwise crops the headline content out of frame — and let Metro's
 *     "Refreshing…" banner clear before capturing.
 *
 * Run: npm run assets:screenshots
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { brand, markSvg, textPng } from './brand.mjs';

const WIDTH = 1080;
const HEIGHT = 1920;

/** Phone plate. */
const SCREEN_W = 858;
const SCREEN_H = 1430;
const SCREEN_X = Math.round((WIDTH - SCREEN_W) / 2);
const SCREEN_Y = 430;
const SCREEN_RADIUS = 46;

/** Device status bar to trim off the top of each capture. */
const STATUS_BAR = 100;

const screenshots = [
  { output: '01-log-readings', source: 'add-reading.png', line1: 'Log a reading', line2: 'in seconds' },
  { output: '02-daily-trends', source: 'trends-daily.png', line1: 'See your time', line2: 'in range' },
  { output: '03-every-reading', source: 'trends-readings.png', line1: 'Every reading,', line2: 'on one chart' },
  { output: '04-history', source: 'history.png', line1: 'History, grouped', line2: 'by day' },
  { output: '05-save-reports', source: 'export.png', line1: 'A report for', line2: 'your doctor' },
  { output: '06-private-offline', source: 'settings.png', line1: 'Private. Offline.', line2: 'Yours.' },
];

const background = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="#F8FCFB"/>
      <stop offset="1" stop-color="${brand.surfaceMuted}"/>
    </linearGradient>
    <linearGradient id="wave" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${brand.primary}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${brand.primary}" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="plate" x="-30%" y="-15%" width="160%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" flood-color="#0C3129" flood-opacity="0.24"/>
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <path d="M0 ${HEIGHT} C 240 ${HEIGHT - 260} 660 ${HEIGHT - 120} ${WIDTH} ${HEIGHT - 330}
           L ${WIDTH} ${HEIGHT} Z" fill="url(#wave)"/>

  <!-- Plate behind the capture, carrying the shadow. -->
  <rect x="${SCREEN_X}" y="${SCREEN_Y}" width="${SCREEN_W}" height="${SCREEN_H}" rx="${SCREEN_RADIUS}"
        fill="${brand.surface}" filter="url(#plate)"/>
</svg>`;

const roundedMask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SCREEN_W}" height="${SCREEN_H}">
     <rect width="${SCREEN_W}" height="${SCREEN_H}" rx="${SCREEN_RADIUS}" fill="#fff"/>
   </svg>`
);

async function build() {
  await mkdir('play-store/screenshots', { recursive: true });
  await mkdir('website/public/screenshots', { recursive: true });

  const mark = await sharp(Buffer.from(markSvg({ size: 76 }))).png().toBuffer();

  for (const shot of screenshots) {
    const source = `play-store/raw-screenshots/${shot.source}`;
    const meta = await sharp(source).metadata();

    // Trim the status bar, then take the tallest region that matches the
    // plate's aspect ratio so the capture is never stretched.
    const cropW = meta.width;
    const cropH = Math.min(
      meta.height - STATUS_BAR,
      Math.round(cropW * (SCREEN_H / SCREEN_W))
    );
    const appScreen = await sharp(source)
      .extract({ left: 0, top: STATUS_BAR, width: cropW, height: cropH })
      .resize(SCREEN_W, SCREEN_H, { fit: 'cover', position: 'top' })
      .composite([{ input: roundedMask, blend: 'dest-in' }])
      .png()
      .toBuffer();

    const line1 = await textPng(shot.line1, {
      px: 66,
      color: brand.text,
      weight: 'bold',
      letterSpacing: -0.022,
    });
    const line2 = await textPng(shot.line2, {
      px: 66,
      color: brand.primary,
      weight: 'bold',
      letterSpacing: -0.022,
    });

    const composition = sharp(Buffer.from(background)).composite([
      { input: mark, left: WIDTH - 76 - 64, top: 62 },
      { input: line1.data, left: 72, top: 152 },
      { input: line2.data, left: 72, top: 152 + line1.info.height + 8 },
      { input: appScreen, left: SCREEN_X, top: SCREEN_Y },
    ]);

    await composition
      .clone()
      .flatten({ background: brand.canvas })
      .removeAlpha()
      .jpeg({ quality: 94, chromaSubsampling: '4:4:4' })
      .toFile(`play-store/screenshots/${shot.output}.jpg`);

    await composition
      .clone()
      .flatten({ background: brand.canvas })
      .png({ compressionLevel: 9 })
      .toFile(`website/public/screenshots/${shot.output}.png`);

    console.log(`${shot.output}  ${WIDTH}x${HEIGHT}`);
  }
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
