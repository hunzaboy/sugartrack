import { Platform } from 'react-native';

/**
 * Haptic feedback, fire-and-forget.
 *
 * On Android we prefer `performAndroidHapticsAsync`, which the SDK 57 docs
 * recommend over `impactAsync`: it drives the platform haptics engine rather than
 * the discouraged `Vibrator` API, and it needs no VIBRATE permission — so adding
 * haptics does not change the manifest.
 *
 * The module is resolved lazily and every call is swallowed on failure. That is
 * deliberate: it means a dev client built *before* expo-haptics was added still
 * runs the whole app (silently, without haptics) instead of crashing on import,
 * so UI work can be tested over the existing client and the native rebuild can
 * happen whenever convenient.
 */
type HapticsModule = typeof import('expo-haptics');

let cached: HapticsModule | null | undefined;

function getHaptics(): HapticsModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-haptics') as HapticsModule;
  } catch {
    cached = null;
  }
  return cached;
}

function run(fn: (h: HapticsModule) => Promise<unknown> | undefined) {
  const haptics = getHaptics();
  if (!haptics) return;
  try {
    const result = fn(haptics);
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch {
    // A missing native module or a device without a vibrator must never break a flow.
  }
}

const isAndroid = Platform.OS === 'android';

/** Light tick — button presses, chip selection, row taps. */
export function tapFeedback() {
  run((h) =>
    isAndroid && h.performAndroidHapticsAsync
      ? h.performAndroidHapticsAsync(h.AndroidHaptics.Virtual_Key)
      : h.impactAsync(h.ImpactFeedbackStyle.Light)
  );
}

/** Toggle on/off — switches. */
export function toggleFeedback(on: boolean) {
  run((h) =>
    isAndroid && h.performAndroidHapticsAsync
      ? h.performAndroidHapticsAsync(on ? h.AndroidHaptics.Toggle_On : h.AndroidHaptics.Toggle_Off)
      : h.selectionAsync()
  );
}

/** A write succeeded — reading saved, backup written. */
export function successFeedback() {
  run((h) =>
    isAndroid && h.performAndroidHapticsAsync
      ? h.performAndroidHapticsAsync(h.AndroidHaptics.Confirm)
      : h.notificationAsync(h.NotificationFeedbackType.Success)
  );
}

/** Validation failed or an action was refused. */
export function warningFeedback() {
  run((h) =>
    isAndroid && h.performAndroidHapticsAsync
      ? h.performAndroidHapticsAsync(h.AndroidHaptics.Reject)
      : h.notificationAsync(h.NotificationFeedbackType.Warning)
  );
}

/** Long-press engaged. */
export function longPressFeedback() {
  run((h) =>
    isAndroid && h.performAndroidHapticsAsync
      ? h.performAndroidHapticsAsync(h.AndroidHaptics.Long_Press)
      : h.impactAsync(h.ImpactFeedbackStyle.Medium)
  );
}
