const APP_VERSION = "1.0.0";

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

        <a className="download-btn" href="/sugartrack.apk" download>
          Download for Android
        </a>
        <p className="meta">Version {APP_VERSION} · APK, direct install</p>

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
