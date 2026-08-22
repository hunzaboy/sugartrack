/**
 * Icon and splash assets, generated from vector sources.
 *
 * Previously these were all resizes of a single 1024px raster master, so every
 * output was a resample of the same pixels and the adaptive-icon foreground
 * carried a baked-in mint background (which a launcher's circular mask then cut
 * into). Everything here is rasterised from SVG at its target size instead.
 *
 * Run: npm run assets:brand
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import {
  brand,
  appIconSvg,
  markSvg,
  monochromeSvg,
  adaptiveForegroundSvg,
  adaptiveBackgroundSvg,
} from './brand.mjs';

const render = (svg, size, file, { flatten = false } = {}) => {
  let pipeline = sharp(Buffer.from(svg), { density: 384 }).resize(size, size);
  if (flatten) pipeline = pipeline.flatten({ background: brand.surfaceMuted }).removeAlpha();
  return pipeline.png({ compressionLevel: 9 }).toFile(file);
};

await mkdir('website/public', { recursive: true });
await mkdir('play-store', { recursive: true });

await Promise.all([
  // Expo app icon and splash. Square with the mint field; stores apply masking.
  render(appIconSvg({ size: 1024 }), 1024, 'assets/icon.png'),
  render(appIconSvg({ size: 1024 }), 1024, 'assets/splash-icon.png'),

  // Android adaptive icon. The foreground is transparent outside the mark and
  // inset to the 72dp safe zone so a circular mask never clips the droplet tip.
  render(adaptiveForegroundSvg({ size: 1024 }), 1024, 'assets/android-icon-foreground.png'),
  render(adaptiveBackgroundSvg({ size: 1024 }), 1024, 'assets/android-icon-background.png'),
  render(monochromeSvg({ size: 1024 }), 1024, 'assets/android-icon-monochrome.png'),

  // Play Store listing icon: 512x512, 32-bit PNG.
  render(appIconSvg({ size: 512 }), 512, 'play-store/icon-512.png'),

  // Web.
  render(appIconSvg({ size: 1024 }), 1024, 'website/public/icon.png'),
  render(appIconSvg({ size: 180 }), 180, 'website/public/apple-touch-icon.png'),
  render(appIconSvg({ size: 64 }), 64, 'assets/favicon.png'),

  // Transparent mark, for the website and any future marketing use.
  sharp(Buffer.from(markSvg({ size: 1024 })), { density: 384 })
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile('website/public/mark.png'),
]);

const report = [
  'assets/icon.png',
  'assets/splash-icon.png',
  'assets/android-icon-foreground.png',
  'assets/android-icon-background.png',
  'assets/android-icon-monochrome.png',
  'play-store/icon-512.png',
  'assets/favicon.png',
  'website/public/mark.png',
];
for (const file of report) {
  const m = await sharp(file).metadata();
  console.log(`${file.padEnd(42)} ${m.width}x${m.height}  ${m.channels}ch  alpha=${!!m.hasAlpha}`);
}
