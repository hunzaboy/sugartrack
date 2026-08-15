# SugarTrack download site

Minimal Next.js page with a single "Download for Android" button that serves
the APK straight from this site. No backend, no analytics — just a static
download page for a small group of testers.

## Updating the APK

1. Build a new APK (e.g. `npm run build:preview` or `build:production` from
   the repo root, or download the artifact from the EAS build dashboard).
2. Replace `public/sugartrack.apk` with the new file.
3. Bump `APP_VERSION` in `app/page.tsx` if you want the version label to
   match.
4. Commit and push — Vercel redeploys automatically.

## Local dev

```bash
cd website
npm install
npm run dev
```

Open http://localhost:3000.

## Deploying on Vercel

This site lives in a subfolder of the main SugarTrack repo, not the repo
root. When creating the Vercel project:

1. New Project → Import the `SugarTrack` git repo.
2. Under **Root Directory**, select `website`.
3. Framework preset: Next.js (auto-detected). Leave build/output settings
   default.
4. Deploy.

The root Expo app and this website are fully independent — this folder has
its own `package.json` and dependencies, so it never touches the Expo/React
Native setup at the repo root.
