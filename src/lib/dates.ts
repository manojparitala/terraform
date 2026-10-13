import { BOOKING_WINDOW_DAYS, MIN_LEAD_DAYS } from "./config";

// Calendar dates are plain "YYYY-MM-DD" strings in the chef's local time.
// Date arithmetic runs in UTC so it never shifts across daylight-saving changes.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parts(date: string): [number, number, number] {
  const [year, month, day] = date.split("-").map(Number);
  return [year, month, day];
}

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = parts(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** The server's local calendar date for `now`. */
export function localIsoDate(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = parts(date);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(date: string): number {
  const [year, month, day] = parts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** The moment a session starts, as a server-local Date. */
export function startsAt(date: string, startMinute: number): Date {
  const [year, month, day] = parts(date);
  return new Date(year, month - 1, day, 0, startMinute);
}

/** Every date a customer can currently book, in order. */
export function bookableDates(now: Date): string[] {
  const today = localIsoDate(now);
  const dates: string[] = [];
  for (let offset = MIN_LEAD_DAYS; offset <= BOOKING_WINDOW_DAYS; offset++) {
    dates.push(addDays(today, offset));
  }
  return dates;
}
