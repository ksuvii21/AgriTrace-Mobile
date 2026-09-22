/**
 * AgriTrace – Date helpers
 * ------------------------
 * Small, dependency-free formatting helpers shared by the alert screens.
 */

/** Safely parses a value into a Date, returning null when invalid. */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Human readable date + time, e.g. "12 Feb 2026, 14:05". */
export function formatDateTime(value, fallback = "—") {
  const date = toDate(value);
  if (!date) return fallback;

  try {
    return date.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date.toLocaleString();
  }
}

/** Human readable clock time only, e.g. "14:05". */
export function formatTime(value, fallback = "—") {
  const date = toDate(value);
  if (!date) return fallback;

  try {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date.toLocaleTimeString();
  }
}

/** Relative "x minutes ago" label with a graceful fallback. */
export function formatRelativeTime(value, fallback = "—") {
  const date = toDate(value);
  if (!date) return fallback;

  const diffMs = Date.now() - date.getTime();
  const seconds = Math.round(diffMs / 1000);

  if (seconds < 45) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;

  return formatDateTime(value, fallback);
}

export default {
  toDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
};
