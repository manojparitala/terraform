// Formatting helpers shared by server and client components. Dates are
// formatted in UTC because they are stored as plain calendar dates.

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const wholeMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatMoney(cents: number): string {
  return cents % 100 === 0 ? wholeMoney.format(cents / 100) : money.format(cents / 100);
}

/** 540 → "9:00 AM" */
export function formatTime(minute: number): string {
  const hours = Math.floor(minute / 60) % 24;
  const minutes = String(minute % 60).padStart(2, "0");
  const suffix = hours < 12 ? "AM" : "PM";
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${suffix}`;
}

export function formatTimeRange(startMinute: number, endMinute: number): string {
  return `${formatTime(startMinute)} – ${formatTime(endMinute)}`;
}

/** 180 → "3 hours", 150 → "2.5 hours" */
export function formatDuration(minutes: number): string {
  const hours = minutes / 60;
  if (hours < 1) return `${minutes} min`;
  const value = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${value} ${hours === 1 ? "hour" : "hours"}`;
}

function toUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

const longDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const shortDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  month: "short",
  day: "numeric",
});
const monthShort = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" });
const weekdayShort = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" });
const monthYear = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

/** "2026-10-18" → "Sunday, October 18, 2026" */
export function formatLongDate(date: string): string {
  return longDate.format(toUtcDate(date));
}

/** "2026-10-18" → "Sun, Oct 18" */
export function formatShortDate(date: string): string {
  return shortDate.format(toUtcDate(date));
}

/** "2026-10-18" → "Oct" */
export function formatMonthShort(date: string): string {
  return monthShort.format(toUtcDate(date));
}

/** "2026-10-18" → "Sun" */
export function formatWeekdayShort(date: string): string {
  return weekdayShort.format(toUtcDate(date));
}

/** A SQLite timestamp or ISO date → "October 2026" */
export function formatMonthYear(timestamp: string): string {
  return monthYear.format(toUtcDate(timestamp.slice(0, 10)));
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "Taylor Brooks" → "Taylor B." */
export function shortName(name: string): string {
  const words = name.trim().split(/\s+/);
  return words.length > 1 ? `${words[0]} ${words[words.length - 1][0]}.` : name;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
