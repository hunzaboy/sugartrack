import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — SugarTrack",
  description:
    "SugarTrack stores your blood sugar log on your phone. No account, no cloud, no tracking.",
};

export default function PrivacyPolicy() {
  return (
    <main>
      <div className="card legal">
        <p className="legal-kicker">
          <Link href="/">SugarTrack</Link>
        </p>
        <h1>Privacy Policy</h1>
        <p className="tagline">Last updated: 20 August 2026</p>

        <div className="section">
          <h2>Summary</h2>
          <p>
            SugarTrack is an offline blood sugar logbook for Android. It does
            not create accounts, does not require the internet, and does not
            send your data to us or to any server. Everything you enter stays
            on the device unless you export or back it up yourself.
          </p>
        </div>

        <div className="section">
          <h2>Who we are</h2>
          <p>
            SugarTrack is developed by the SugarTrack project (
            <a href="https://github.com/hunzaboy/sugartrack">
              github.com/hunzaboy/sugartrack
            </a>
            ). Contact:{" "}
            <a href="mailto:hunzaboy@gmail.com">hunzaboy@gmail.com</a>.
          </p>
        </div>

        <div className="section">
          <h2>What the app stores</h2>
          <p>Only on your phone, SugarTrack may store:</p>
          <ul>
            <li>
              Blood sugar readings you type in (value, time, context such as
              fasting or after meal, optional notes)
            </li>
            <li>Medication names and A1C values you enter</li>
            <li>Target range and unit preferences (mg/dL or mmol/L)</li>
            <li>
              Optional photos of meals that you choose to attach to a reading
            </li>
            <li>A daily reminder time, if you enable notifications</li>
          </ul>
          <p>
            SugarTrack is not a glucose meter. It does not measure blood
            sugar. Numbers come from a meter you already use. The app is not
            medical advice and is not a medical device.
          </p>
        </div>

        <div className="section">
          <h2>What we do not collect</h2>
          <ul>
            <li>No name, email, or account</li>
            <li>No location, contacts, or advertising IDs for ads</li>
            <li>No analytics or crash reports sent off the device</li>
            <li>No sale or sharing of personal data with third parties</li>
          </ul>
        </div>

        <div className="section">
          <h2>Camera and photos</h2>
          <p>
            If you take or pick a meal photo, the image is saved on the phone
            and linked to that reading. SugarTrack uses the camera (and, on
            some Android versions, related microphone permission pulled in by
            the camera library) only for this optional photo feature. It does
            not record audio. You can use the app without adding photos.
          </p>
        </div>

        <div className="section">
          <h2>Notifications</h2>
          <p>
            If you turn on a daily reminder, Android may show a local
            notification at the time you chose. Reminders are scheduled on
            the device. We do not send push messages from a server.
          </p>
        </div>

        <div className="section">
          <h2>Export and backup</h2>
          <p>
            You can save a PDF or CSV report, or a full backup zip, to a
            folder you choose on your Android device. After saving, you may
            optionally open Android&apos;s share sheet to send the file by
            email, Drive, or another app. SugarTrack does not upload these
            files itself.
          </p>
        </div>

        <div className="section">
          <h2>How to delete your data</h2>
          <p>
            Delete individual readings in History. To remove everything,
            uninstall SugarTrack, or clear the app&apos;s storage in Android
            settings. Uninstalling deletes the on-device database and photos
            stored by the app.
          </p>
        </div>

        <div className="section">
          <h2>Children</h2>
          <p>
            SugarTrack is intended for adults managing a personal or family
            logbook. It is not directed at children under 13. Do not enter
            another person&apos;s health information unless you are
            responsible for their care and they (or a guardian) agree.
          </p>
        </div>

        <div className="section">
          <h2>This website</h2>
          <p>
            The download site may use Vercel Analytics for anonymous page
            views. It does not receive readings from the app. The Android app
            does not load this site in order to function.
          </p>
        </div>

        <div className="section">
          <h2>Changes</h2>
          <p>
            If this policy changes, we will update the date above and this
            page. Continuing to use the app after a change means you accept
            the updated policy.
          </p>
        </div>

        <p className="disclaimer">
          Questions:{" "}
          <a href="mailto:hunzaboy@gmail.com">hunzaboy@gmail.com</a>
        </p>
      </div>
    </main>
  );
}
