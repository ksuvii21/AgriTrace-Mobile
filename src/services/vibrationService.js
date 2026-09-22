/**
 * AgriTrace – Vibration service
 * ------------------------------
 * Repeating emergency vibration pattern for critical alerts.
 *
 * Android note:
 *  - React Native's `Vibration.vibrate(pattern, repeat)` supports the
 *    `repeat` boolean natively on Android, so the pattern loops without
 *    JS timers (which is what actually keeps vibrating while the JS
 *    thread is busy). On iOS the `repeat` flag is ignored, so we fall
 *    back to a bounded setTimeout loop to emulate "until acknowledged".
 *
 * Pattern: vibrate → pause → vibrate → pause → longer vibrate.
 */

import { Platform, Vibration } from "react-native";

/**
 * [wait, vibrate, wait, vibrate, wait, longVibrate]
 * The leading value is the initial delay before the first vibration.
 */
export const CRITICAL_VIBRATION_PATTERN = [0, 500, 250, 1200];

/** Approximate duration of one pattern cycle (ms), for the iOS fallback. */
const PATTERN_CYCLE_MS = CRITICAL_VIBRATION_PATTERN.reduce(
  (sum, part) => sum + part,
  0,
);

let loopTimer = null;
let running = false;
let muted = false;

function clearLoopTimer() {
  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }
}

/** iOS fallback: re-fire a single (non-repeating) pattern on a timer. */
function scheduleIosLoop() {
  clearLoopTimer();
  loopTimer = setTimeout(() => {
    if (!running || muted) return;

    try {
      Vibration.vibrate(CRITICAL_VIBRATION_PATTERN);
    } catch {
      // Ignore — device may not support vibration.
    }

    scheduleIosLoop();
  }, PATTERN_CYCLE_MS);
}

/**
 * Start the repeating emergency vibration.
 * Idempotent — repeated calls will not stack patterns.
 */
export function startVibration() {
  if (running) return;

  running = true;
  muted = false;

  try {
    if (Platform.OS === "android") {
      Vibration.vibrate(CRITICAL_VIBRATION_PATTERN, true);
    } else {
      Vibration.vibrate(CRITICAL_VIBRATION_PATTERN);
      scheduleIosLoop();
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[vibrationService] start failed:", error?.message);
    }
  }
}

/** Stop vibration immediately and cancel any fallback loop. */
export function stopVibration() {
  running = false;
  clearLoopTimer();

  try {
    Vibration.cancel();
  } catch {
    // Ignore — nothing vibrating.
  }
}

/**
 * Toggle the vibration mute state WITHOUT losing the running flag,
 * so toggling back on resumes the emergency pattern.
 */
export function setVibrationMuted(nextMuted) {
  const shouldMute = !!nextMuted;

  if (shouldMute) {
    muted = true;
    clearLoopTimer();
    try {
      Vibration.cancel();
    } catch {
      // Ignore.
    }
    return;
  }

  muted = false;

  if (!running) return;

  try {
    if (Platform.OS === "android") {
      Vibration.vibrate(CRITICAL_VIBRATION_PATTERN, true);
    } else {
      Vibration.vibrate(CRITICAL_VIBRATION_PATTERN);
      scheduleIosLoop();
    }
  } catch {
    // Ignore.
  }
}

export function isVibrationActive() {
  return running && !muted;
}

export function isVibrationMuted() {
  return muted;
}

/** Full teardown — used on logout / unmount. */
export function disposeVibration() {
  muted = false;
  stopVibration();
}

export default {
  CRITICAL_VIBRATION_PATTERN,
  startVibration,
  stopVibration,
  setVibrationMuted,
  isVibrationActive,
  isVibrationMuted,
  disposeVibration,
};
