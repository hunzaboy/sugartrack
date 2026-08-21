import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const WIDTH = 1080;
const HEIGHT = 1920;
const SCREEN_WIDTH = 850;
const SCREEN_HEIGHT = 1495;
const SCREEN_LEFT = 115;
const SCREEN_TOP = 405;

const screenshots = [
  {
    output: '01-log-readings',
    source: 'play-store/raw-screenshots/add-reading.png',
    line1: 'Log readings',
    line2: 'in seconds',
  },
  {
    output: '02-daily-trends',
    source: 'play-store/raw-screenshots/trends-daily.png',
    line1: 'See daily trends',
    line2: 'clearly',
  },
  {
    output: '03-every-reading',
    source: 'play-store/raw-screenshots/trends-readings.png',
    line1: 'Explore every',
    line2: 'reading',
  },
  {
    output: '04-history',
    source: 'play-store/raw-screenshots/history.png',
    line1: 'Keep history',
    line2: 'organized',
  },
  {
    output: '05-save-reports',
    source: 'play-store/raw-screenshots/export.png',
    line1: 'Save reports',
    line2: 'to your phone',
  },
  {
    output: '06-private-offline',
    source: 'play-store/raw-screenshots/settings.png',
    line1: 'Private. Offline.',
    line2: 'Yours.',
  },
];

await mkdir('play-store/screenshots', { recursive: true });
await mkdir('website/public/screenshots', { recursive: true });

const logo = await sharp('assets/logo-master.png').resize(84, 84).png().toBuffer();
const roundedMask = Buffer.from(`
  <svg width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}" rx="44" fill="#fff"/>
  </svg>
`);

for (const screenshot of screenshots) {
  const appScreen = await sharp(screenshot.source)
    .extract({ left: 0, top: 80, width: 1080, height: 1900 })
    .resize(SCREEN_WIDTH, SCREEN_HEIGHT)
    .composite([{ input: roundedMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const background = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0B4F45"/>
          <stop offset="1" stop-color="#177565"/>
        </linearGradient>
        <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
          <path d="M54 0H0V54" fill="none" stroke="#8DD9C8" stroke-width="1" opacity="0.18"/>
        </pattern>
        <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#002D26" flood-opacity="0.45"/>
        </filter>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
      <circle cx="980" cy="300" r="180" fill="#38A590" opacity="0.24"/>
      <text x="70" y="135" font-family="Inter, Arial, sans-serif" font-size="76" font-weight="700" fill="#FFFFFF">
        ${screenshot.line1}
      </text>
      <text x="70" y="232" font-family="Inter, Arial, sans-serif" font-size="76" font-weight="700" fill="#85F0D3">
        ${screenshot.line2}
      </text>
      <rect x="${SCREEN_LEFT - 8}" y="${SCREEN_TOP + 8}" width="${SCREEN_WIDTH + 16}" height="${SCREEN_HEIGHT}" rx="50"
        fill="#062F29" opacity="0.42" filter="url(#shadow)"/>
    </svg>
  `);

  const composition = sharp(background).composite([
    { input: logo, left: 930, top: 55 },
    { input: appScreen, left: SCREEN_LEFT, top: SCREEN_TOP },
  ]);

  await composition.clone().jpeg({ quality: 92 }).toFile(`play-store/screenshots/${screenshot.output}.jpg`);
  await composition.clone().png({ compressionLevel: 9 }).toFile(`website/public/screenshots/${screenshot.output}.png`);
}

console.log('Generated six branded Play Store and website screenshots.');
