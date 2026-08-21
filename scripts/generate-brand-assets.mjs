import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const source = 'assets/logo-master.png';

await mkdir('website/public', { recursive: true });
await mkdir('play-store', { recursive: true });

await Promise.all([
  sharp(source).resize(1024, 1024).png().toFile('assets/icon.png'),
  sharp(source).resize(1024, 1024).png().toFile('assets/splash-icon.png'),
  sharp(source).resize(1024, 1024).png().toFile('website/public/icon.png'),
  sharp(source).resize(512, 512).png().toFile('play-store/icon-512.png'),
  sharp(source).resize(48, 48).png().toFile('assets/favicon.png'),
]);

const featureIcon = await sharp(source).resize(280, 280).png().toBuffer();
const featureBackground = Buffer.from(`
  <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#F8FCFB"/>
        <stop offset="1" stop-color="#DDF1EC"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="500" fill="url(#bg)"/>
    <path d="M640 500 C760 360 900 390 1024 280 L1024 500 Z" fill="#C9E8E0" opacity="0.8"/>
    <path d="M740 500 C850 400 940 420 1024 350 L1024 500 Z" fill="#B5DDD4" opacity="0.7"/>
    <text x="410" y="235" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="700" fill="#194C43">
      SugarTrack
    </text>
    <text x="414" y="292" font-family="Inter, Arial, sans-serif" font-size="30" fill="#53645F">
      Offline blood sugar logbook
    </text>
  </svg>
`);

await sharp(featureBackground)
  .composite([{ input: featureIcon, left: 72, top: 110 }])
  .jpeg({ quality: 92 })
  .toFile('play-store/feature-graphic.jpg');

console.log('Generated SugarTrack icon, splash, website, store, favicon, and feature graphic assets.');
