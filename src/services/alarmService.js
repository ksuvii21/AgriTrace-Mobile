/**
 * AgriTrace – Emergency alarm service
 * -----------------------------------
 * Wraps expo-audio so the critical alert can loop a locally bundled
 * alarm sound, offline, with correct lifecycle handling.
 *
 * Design notes:
 *  - Uses `createAudioPlayer` (manual lifetime) instead of the hook so
 *    playback survives component unmounts and can be driven from a
 *    context / service layer.
 *  - Enforces a SINGLE active alarm instance. Calling play() twice will
 *    not spawn a second overlapping alarm (the main cause of "double
 *    alarm" bugs on Android).
 *  - Audio is fully released on stop() to avoid native resource leaks.
 *  - Background/lifecycle safe: `setAudioModeAsync` keeps the alarm
 *    audible in silent mode and continues briefly while backgrounded.
 */

import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

// Locally bundled → works with no network (requirement: offline alarm).
const ALARM_SOURCE = require("../../assets/sounds/critical_alarm.wav");

let activePlayer = null;
let audioModeConfigured = false;
let muted = false;

/**
 * Configure the global audio session so the emergency alarm is audible
 * even when the device is in silent mode, and can briefly survive the
 * app being backgrounded.
 */
async function ensureAudioMode() {
  if (audioModeConfigured) return;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
    audioModeConfigured = true;
  } catch (error) {
    if (__DEV__) {
      console.warn("[alarmService] setAudioModeAsync failed:", error?.message);
    }
  }
}

function releasePlayer() {
  if (!activePlayer) return;

  try {
    activePlayer.pause();
    // Reset to start so a later play() begins from the top.
    activePlayer.seekTo(0);
  } catch {
    // Player may already be detached — ignore.
  }

  try {
    activePlayer.remove();
  } catch {
    // Ignore double-release.
  }

  activePlayer = null;
}

/**
 * Start the looping emergency alarm.
 * Idempotent: if an alarm is already playing this is a no-op.
 */
export async function startAlarm() {
  await ensureAudioMode();

  if (activePlayer) {
    // Already running — never spin up a duplicate player.
    if (!muted) {
      try {
        activePlayer.play();
      } catch {
        // Ignore — already playing.
      }
    }
    return;
  }

  try {
    const player = createAudioPlayer(ALARM_SOURCE);
    player.loop = true;
    player.volume = 1.0;
    activePlayer = player;

    if (!muted) {
      player.play();
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[alarmService] unable to start alarm:", error?.message);
    }
  }
}

/**
 * Stop the alarm and release the native player. Always safe to call,
 * even if no alarm is running.
 */
export function stopAlarm() {
  releasePlayer();
}

/**
 * Temporarily mute/unmute audio without tearing down the player.
 * `Sound OFF` = muted, `Sound ON` = resumes the looping alarm.
 */
export function setMuted(nextMuted) {
  muted = !!nextMuted;

  if (!activePlayer) return;

  try {
    if (muted) {
      activePlayer.pause();
      activePlayer.seekTo(0);
    } else {
      activePlayer.play();
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[alarmService] mute toggle failed:", error?.message);
    }
  }
}

export function isMuted() {
  return muted;
}

export function isAlarmPlaying() {
  return !!activePlayer && !muted;
}

/**
 * Re-assert playback after the app returns to the foreground.
 * expo-audio may have paused background playback on some Android OEMs.
 */
export function resumeAlarmIfNeeded() {
  if (!activePlayer || muted) return;
  try {
    activePlayer.play();
  } catch {
    // Ignore.
  }
}

/**
 * Full teardown — used on logout so an alarm never outlives the session.
 */
export function disposeAlarm() {
  muted = false;
  releasePlayer();
}

export default {
  startAlarm,
  stopAlarm,
  setMuted,
  isMuted,
  isAlarmPlaying,
  resumeAlarmIfNeeded,
  disposeAlarm,
};
