/**
 * Play Store feature graphic — 1024x500.
 *
 * Rendered at final size from vector sources with the bundled Inter faces, then
 * written as a 24-bit PNG with no alpha (Play rejects alpha here). The previous
 * version was a JPEG whose gradient banded and whose palette (cream) appears
 * nowhere in the app, so it read as soft and off-brand next to the product.
 *
 * Layout follows the app's own language: mint canvas, a white squircle card with
 * the app's card shadow, an Inter Bold wordmark, and feature pills that are
 * literally the app's ChoicePicker chip.
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { brand, markSvg, textPng, chipPng } from './brand.mjs';

const W = 1024;
const H = 500;
/** Play can crop the outer edge, so nothing meaningful goes within ~6%. */
const PAD = 62;
const CARD = 236;
const CARD_RADIUS = 52;
const MARK = 158;

const background = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F8FCFB"/>
      <stop offset="1" stop-color="${brand.surfaceMuted}"/>
    </linearGradient>
    <linearGradient id="wave" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${brand.primary}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${brand.primary}" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="wave2" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${brand.primaryDeep}" stop-opacity="0.11"/>
      <stop offset="1" stop-color="${brand.primaryDeep}" stop-opacity="0.03"/>
    </linearGradient>
    <filter id="cardShadow" x="-45%" y="-45%" width="190%" height="190%">
      <feDropShadow dx="0" dy="11" stdDeviation="19" flood-color="#123C34" flood-opacity="0.17"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Soft sweeps in the bottom-right dead space. -->
  <path d="M636 ${H} C 792 ${H - 158} 884 ${H - 124} ${W} ${H - 262} L ${W} ${H} Z" fill="url(#wave)"/>
  <path d="M772 ${H} C 884 ${H - 94} 952 ${H - 82} ${W} ${H - 168} L ${W} ${H} Z" fill="url(#wave2)"/>

  <!-- A trend line with in-range / high / low points: the app's core idea,
       stated quietly in the corner rather than as a band across the artwork
       (which collided with the wordmark and the chips). -->
  <g opacity="0.5">
    <path d="M700 424 C 748 424 764 386 806 388 C 852 390 866 434 908 408 C 936 391 948 396 970 390"
          fill="none" stroke="${brand.primary}" stroke-opacity="0.55" stroke-width="3.5"
          stroke-linecap="round"/>
    <circle cx="700" cy="424" r="6" fill="${brand.inRange}"/>
    <circle cx="806" cy="388" r="6" fill="${brand.inRange}"/>
    <circle cx="908" cy="408" r="6" fill="${brand.high}"/>
    <circle cx="970" cy="390" r="6" fill="${brand.low}"/>
  </g>

  <!-- Icon card: the app's surface + radius + cardShadow. -->
  <rect x="${PAD}" y="${(H - CARD) / 2}" width="${CARD}" height="${CARD}" rx="${CARD_RADIUS}"
        fill="${brand.surface}" filter="url(#cardShadow)"/>
</svg>`;

async function build() {
  await mkdir('play-store', { recursive: true });

  const mark = await sharp(Buffer.from(markSvg({ size: MARK }))).png().toBuffer();

  const title = await textPng('SugarTrack', {
    px: 68,
    color: brand.text,
    weight: 'bold',
    letterSpacing: -0.022,
  });
  const tagline = await textPng('Your private blood sugar logbook', {
    px: 28,
    color: brand.textMuted,
    weight: 'regular',
  });

  const chips = [];
  // Short labels so all four fit one row — a lone chip on a second row read as
  // an orphan and unbalanced the block.
  for (const label of ['No account', 'No ads', 'Offline', 'Doctor PDF']) {
    chips.push(await chipPng(label, { px: 21, height: 54 }));
  }

  const textLeft = PAD + CARD + 56;
  const available = W - textLeft - PAD;

  // Lay the chips out first so the whole block can be centred as one unit.
  const gap = 11;
  const rows = [[]];
  let rowWidth = 0;
  for (const chip of chips) {
    const add = rows[rows.length - 1].length ? gap + chip.info.width : chip.info.width;
    if (rowWidth + add > available && rows[rows.length - 1].length) {
      rows.push([chip]);
      rowWidth = chip.info.width;
    } else {
      rows[rows.length - 1].push(chip);
      rowWidth += add;
    }
  }
  const chipRowHeight = chips[0].info.height;
  const chipsHeight = rows.length * chipRowHeight + (rows.length - 1) * gap;

  const titleGap = 12;
  const chipsGap = 28;
  const blockHeight = title.info.height + titleGap + tagline.info.height + chipsGap + chipsHeight;
  let cursor = Math.round((H - blockHeight) / 2);

  const layers = [
    {
      input: mark,
      left: PAD + Math.round((CARD - MARK) / 2),
      top: Math.round((H - MARK) / 2),
    },
    { input: title.data, left: textLeft, top: cursor },
  ];
  cursor += title.info.height + titleGap;
  layers.push({ input: tagline.data, left: textLeft, top: cursor });
  cursor += tagline.info.height + chipsGap;

  for (const row of rows) {
    let x = textLeft;
    for (const chip of row) {
      layers.push({ input: chip.data, left: Math.round(x), top: Math.round(cursor) });
      x += chip.info.width + gap;
    }
    cursor += chipRowHeight + gap;
  }

  const composed = sharp(Buffer.from(background)).composite(layers);

  // flatten() drops transparency; removeAlpha() guarantees a 3-channel PNG,
  // which is what Play means by "24-bit PNG (no alpha)".
  const write = (pipeline, file) =>
    pipeline
      .flatten({ background: brand.canvas })
      .removeAlpha()
      .png({ compressionLevel: 9, palette: false })
      .toFile(file);

  await write(composed.clone(), 'play-store/feature-graphic.png');
  await write(
    composed.clone().resize(W * 2, H * 2, { kernel: 'lanczos3' }),
    'play-store/feature-graphic@2x.png'
  );

  for (const f of ['play-store/feature-graphic.png', 'play-store/feature-graphic@2x.png']) {
    const m = await sharp(f).metadata();
    console.log(`${f}  ${m.width}x${m.height}  ${m.channels}ch  alpha=${!!m.hasAlpha}`);
  }
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
