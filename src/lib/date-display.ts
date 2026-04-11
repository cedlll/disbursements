/**
 * UTC date strings for SSR/client hydration — avoids date-fns local-TZ drift
 * between Node and the browser.
 */
const LOCALE = "en-US";

export function formatUtcShortDateTime(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(d);
}

export function formatUtcMediumDate(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Month-to-date span in UTC, e.g. "Mar 1–28, 2026" (completed-through-today style ranges). */
export function formatUtcMonthToDateThrough(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const monthShort = new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m, 1)));
  return `${monthShort} 1–${day}, ${y}`;
}

export function formatUtcLongDate(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatUtcLongDateAtTime(d: Date): string {
  const datePart = new Intl.DateTimeFormat(LOCALE, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
  const timePart = new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(d);
  return `${datePart} at ${timePart}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatUtcCsvDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function formatUtcCsvDateTime(d: Date): string {
  return `${formatUtcCsvDate(d)} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}
