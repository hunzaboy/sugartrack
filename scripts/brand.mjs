/**
 * SugarTrack brand primitives.
 *
 * Everything here is vector (SVG paths) or text rendered from the Inter TTFs that
 * ship in node_modules, so every asset is generated crisp at its final size
 * rather than upscaled from a raster master. Colours are the corrected,
 * AA-verified palette from lib/theme.ts — keep the two in sync.
 */
import sharp from 'sharp';

export const brand = {
  primary: '#1F7A68',
  primaryDeep: '#155A4C',
  primaryDark: '#123F35',
  primarySoft: '#DDF1EC',
  canvas: '#F2F8F6',
  surface: '#FFFFFF',
  surfaceMuted: '#E8F4F1',
  text: '#17211F',
  textMuted: '#53645F',
  low: '#8A4B00',
  inRange: '#1B6B39',
  high: '#A32B22',
};

const INTER = 'node_modules/@expo-google-fonts/inter';
export const fonts = {
  bold: { file: `${INTER}/700Bold/Inter_700Bold.ttf`, family: 'Inter Bold' },
  regular: { file: `${INTER}/400Regular/Inter_400Regular.ttf`, family: 'Inter' },
};

/**
 * The mark: a blood droplet with a pulse trace through it.
 *
 * Drawn on a 512 grid. The droplet body is a circle of r=160 at (256,330) with
 * two curves rising to the tip, so the pulse can be positioned against a known
 * centre and stays inside the shape at any size.
 */
const DROPLET =
  'M256 44 C256 44 96 252 96 330 A160 160 0 0 0 416 330 C416 252 256 44 256 44 Z';
// Centred on the bulb's own centre (256,330) rather than the whole droplet, so
// the trace reads as balanced inside the round body at small sizes.
const PULSE = 'M146 330 H202 L227 278 L260 382 L286 330 H330';
const PULSE_DOT = { cx: 350, cy: 330, r: 17 };
const PULSE_WIDTH = 24;

/** The droplet + pulse, on a transparent background. `size` is the SVG viewport. */
export function markSvg({ size = 512, fill = 'gradient', pulse = brand.surface } = {}) {
  const paint =
    fill === 'gradient'
      ? 'url(#g)'
      : fill;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0.18" y1="0.05" x2="0.85" y2="1">
      <stop offset="0" stop-color="${brand.primary}"/>
      <stop offset="1" stop-color="${brand.primaryDeep}"/>
    </linearGradient>
  </defs>
  <path d="${DROPLET}" fill="${paint}"/>
  <path d="${PULSE}" fill="none" stroke="${pulse}" stroke-width="${PULSE_WIDTH}"
        stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${PULSE_DOT.cx}" cy="${PULSE_DOT.cy}" r="${PULSE_DOT.r}" fill="${pulse}"/>
</svg>`;
}

/**
 * Single-colour silhouette for Android 13 themed icons.
 *
 * The system tints whatever is opaque and ignores colour, so the pulse has to be
 * knocked *out* of the droplet with a mask rather than painted white — a white
 * pulse is opaque, gets tinted the same colour as the body, and disappears.
 * Inset matches the adaptive foreground so both align under the same mask.
 */
export function monochromeSvg({ size = 512, inset = 0.6 } = {}) {
  const s = 512 * inset;
  const o = (512 - s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <mask id="knockout" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
      <rect width="512" height="512" fill="#FFFFFF"/>
      <path d="${PULSE}" fill="none" stroke="#000000" stroke-width="${PULSE_WIDTH}"
            stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${PULSE_DOT.cx}" cy="${PULSE_DOT.cy}" r="${PULSE_DOT.r}" fill="#000000"/>
    </mask>
  </defs>
  <g transform="translate(${o} ${o}) scale(${inset})">
    <path d="${DROPLET}" fill="#000000" mask="url(#knockout)"/>
  </g>
</svg>`;
}

/**
 * The mark inset inside the adaptive-icon safe zone.
 *
 * Android composites a 108dp foreground but only guarantees the central 72dp is
 * visible, so the mark has to live inside ~66% of the canvas or launchers with a
 * circular mask will clip the droplet's tip.
 */
export function adaptiveForegroundSvg({ size = 1024 } = {}) {
  const inset = 0.6;
  const s = 512 * inset;
  const o = (512 - s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0.18" y1="0.05" x2="0.85" y2="1">
      <stop offset="0" stop-color="${brand.primary}"/>
      <stop offset="1" stop-color="${brand.primaryDeep}"/>
    </linearGradient>
  </defs>
  <g transform="translate(${o} ${o}) scale(${inset})">
    <path d="${DROPLET}" fill="url(#g)"/>
    <path d="${PULSE}" fill="none" stroke="${brand.surface}" stroke-width="${PULSE_WIDTH}"
          stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${PULSE_DOT.cx}" cy="${PULSE_DOT.cy}" r="${PULSE_DOT.r}" fill="${brand.surface}"/>
  </g>
</svg>`;
}

/** Soft mint field behind the adaptive foreground. */
export function adaptiveBackgroundSvg({ size = 1024 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="b" cx="0.34" cy="0.26" r="0.92">
      <stop offset="0" stop-color="#F4FBF9"/>
      <stop offset="1" stop-color="${brand.surfaceMuted}"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#b)"/>
</svg>`;
}

/** Square app icon: the mark on the mint field, no rounding (stores mask it). */
export function appIconSvg({ size = 1024 } = {}) {
  const inset = 0.68;
  const s = 512 * inset;
  const o = (512 - s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="b" cx="0.34" cy="0.26" r="0.92">
      <stop offset="0" stop-color="#F4FBF9"/>
      <stop offset="1" stop-color="${brand.surfaceMuted}"/>
    </radialGradient>
    <linearGradient id="g" x1="0.18" y1="0.05" x2="0.85" y2="1">
      <stop offset="0" stop-color="${brand.primary}"/>
      <stop offset="1" stop-color="${brand.primaryDeep}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#b)"/>
  <g transform="translate(${o} ${o}) scale(${inset})">
    <path d="${DROPLET}" fill="url(#g)"/>
    <path d="${PULSE}" fill="none" stroke="${brand.surface}" stroke-width="${PULSE_WIDTH}"
          stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${PULSE_DOT.cx}" cy="${PULSE_DOT.cy}" r="${PULSE_DOT.r}" fill="${brand.surface}"/>
  </g>
</svg>`;
}

/**
 * Rasterise a run of text with a bundled Inter face.
 *
 * librsvg has no access to the project's fonts, so SVG <text> would silently
 * fall back to a system face — which is exactly how the previous feature graphic
 * ended up in Helvetica instead of the app's typeface. Rendering text through
 * sharp with an explicit `fontfile` keeps it in Inter.
 */
export async function textPng(text, { px, color, weight = 'bold', letterSpacing = 0 } = {}) {
  const face = fonts[weight];
  const spacing = letterSpacing
    ? ` letter_spacing="${Math.round(letterSpacing * 1024)}"`
    : '';
  return sharp({
    text: {
      text: `<span foreground="${color}"${spacing}>${text}</span>`,
      fontfile: face.file,
      font: `${face.family} ${px}`,
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
}

/** A filled pill with a centred label, sized to its text. */
export async function chipPng(label, { px = 22, padX = 26, height = 58, fill = brand.primary, color = '#FFFFFF' } = {}) {
  const { data: textData, info } = await textPng(label, { px, color, weight: 'bold' });
  const width = info.width + padX * 2;
  const pill = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" rx="${height / 2}" fill="${fill}"/>
    </svg>`
  );
  return sharp(pill)
    .composite([{ input: textData, left: padX, top: Math.round((height - info.height) / 2) }])
    .png()
    .toBuffer({ resolveWithObject: true });
}
