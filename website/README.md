# SugarTrack download site

Minimal Next.js page with a single "Download for Android" button. No
backend, no analytics — just a static download page for a small group of
testers.

## Why the APK isn't in `public/`

The production APK is ~126MB. Vercel caps **static file uploads at 100MB on
the Hobby plan** ([docs](https://vercel.com/docs/limits)), so a file that
size can't be committed into `website/public/` — the deployment itself
fails. (GitHub also rejects files over 100MB on push, and Git LFS doesn't
help, since Vercel still materializes the full file at build time.)

Note this is purely an *upload* limit — serving and downloading a large
file is fine, it just has to be hosted somewhere other than the deploy
bundle. So the APK is attached to a **GitHub Release** on this repo
instead (2GB per-file limit, free, permanent), and the button links
straight to the release asset. This requires the repo to be public —
private-repo release assets need an auth token to download, which a plain
link can't provide.

## Updating the APK

1. Build a new APK (`npm run build:production` from the repo root, or via
   the EAS dashboard) and download the `.apk` file.
2. Cut a new release with it attached:
   ```bash
   gh release create v1.0.1 /path/to/sugartrack.apk \
     --repo hunzaboy/sugartrack --title "SugarTrack v1.0.1"
   ```
3. Update `APK_URL` in `app/page.tsx` to
   `https://github.com/hunzaboy/sugartrack/releases/download/v1.0.1/sugartrack.apk`,
   and bump `APP_VERSION` to match.
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
