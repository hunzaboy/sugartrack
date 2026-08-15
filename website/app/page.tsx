const APP_VERSION = "1.0.0";

// Where the APK is hosted. The file is too big to live in this repo's
// deploy bundle (see README), so it's attached to a GitHub Release instead —
// permanent, free, no size concerns. Update this to the new release's asset
// URL each time you cut a new build.
const APK_URL =
  "https://github.com/hunzaboy/sugartrack/releases/download/v1.0.0/sugartrack.apk";

export default function Home() {
  return (
    <main>
      <div className="card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="SugarTrack" className="icon" />
        <h1>SugarTrack</h1>
        <p className="tagline">
          Track your blood sugar readings, meals, and trends — right from
          your phone.
        </p>

        <a className="download-btn" href={APK_URL} download>
          Download for Android
        </a>
        <p className="meta">Version {APP_VERSION} · Production build</p>

        <div className="instructions">
          <h2>How to install</h2>
          <ol>
            <li>Tap the download button above on your Android phone.</li>
            <li>
              Open the downloaded file. If prompted, allow installs from this
              source (Settings → “Install unknown apps”).
            </li>
            <li>Tap Install, then open SugarTrack once it&apos;s done.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
