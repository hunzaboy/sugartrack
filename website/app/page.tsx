const APP_VERSION = "1.0.0";

// Where the APK is hosted. The file is too big to live in this repo's
// deploy bundle (see README), so it's attached to a GitHub Release instead —
// permanent, free, no size concerns. Update this to the new release's asset
// URL each time you cut a new build.
const APK_URL =
  "https://github.com/hunzaboy/sugartrack/releases/download/v1.0.0/sugartrack.apk";
const GITHUB_URL = "https://github.com/hunzaboy/sugartrack";

export default function Home() {
  return (
    <main>
      <div className="card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="SugarTrack" className="icon" />
        <h1>SugarTrack</h1>
        <p className="tagline">
          A simple Android logbook for blood sugar.{" "}
          <strong>Free. No account. No internet.</strong> Everything stays
          on the phone.
        </p>

        <ul className="pills">
          <li>Free</li>
          <li>Works offline</li>
          <li>No cloud</li>
          <li>No servers</li>
        </ul>

        <a className="download-btn" href={APK_URL} download>
          Download for Android
        </a>
        <p className="meta">Version {APP_VERSION} · Production build</p>
        <a className="github-link" href={GITHUB_URL}>
          View on GitHub
        </a>

        <div className="section">
          <h2>Why it exists</h2>
          <p>
            I built this so I wouldn&apos;t have to keep filling in paper
            forms and notebooks while tracking blood sugar for someone close
            to me. Anyone in the same situation can use it.
          </p>
        </div>

        <div className="section">
          <h2>Why on-device</h2>
          <p>
            Health numbers are personal. SugarTrack does not talk to a
            server, does not require a login, and does not send readings
            anywhere. The database lives on the phone. If the phone is
            offline, the app still works.
          </p>
          <p>
            There is no cloud backup unless you make one yourself. Use
            Export for Doctor (PDF or CSV) or Backup in settings to copy
            data off the phone when you want a spare copy.
          </p>
        </div>

        <div className="section">
          <h2>What it does</h2>
          <ul>
            <li>
              Log a reading with time, context (fasting, before/after meal,
              bedtime, or random), an optional note, and an optional meal
              photo
            </li>
            <li>
              See the latest value on the home screen, colored against the
              target range you set
            </li>
            <li>Browse history and a trend graph</li>
            <li>Log medications and A1C results</li>
            <li>Set a daily reminder so a reading doesn&apos;t get skipped</li>
            <li>Export a report to take to a doctor visit</li>
          </ul>
          <p>Units can be mg/dL or mmol/L. Target high/low is yours to set.</p>
        </div>

        <div className="section">
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

        <div className="section">
          <h2>Support this work</h2>
          <p>
            SugarTrack is the first of several planned apps for health and
            lifestyle tracking — all offline, all on-device, and built around
            problems people actually face. No accounts, no cloud, and no
            subscriptions.
          </p>
          <p>
            If this project is useful to you, starring the repository on
            GitHub is a simple way to show support. It also helps make the
            case for building more tools in the same spirit.
          </p>
          <a className="star-btn" href={GITHUB_URL}>
            Star on GitHub
          </a>
        </div>

        <p className="disclaimer">
          SugarTrack is a logbook, not a glucose meter and not medical
          advice. Readings come from your own meter. Talk to a doctor about
          what the numbers mean.
        </p>
      </div>
    </main>
  );
}
