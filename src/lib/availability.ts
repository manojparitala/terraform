import { BUFFER_MINUTES, SLOT_INTERVAL_MINUTES } from "./config";
import { bookableDates, weekdayOf } from "./dates";
import type { AvailabilityWindow } from "./types";

/** Time a chef has already promised to someone (a pending or confirmed booking). */
export interface BusyInterval {
  date: string;
  startMinute: number;
  endMinute: number;
}

export interface DayAvailability {
  date: string;
  startTimes: number[];
}

export interface SlotOptions {
  intervalMinutes?: number;
  bufferMinutes?: number;
}

/** True when two sessions on the same day are closer together than `bufferMinutes`. */
export function conflicts(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  bufferMinutes = BUFFER_MINUTES,
): boolean {
  return aStart < bEnd + bufferMinutes && bStart < aEnd + bufferMinutes;
}

/**
 * Start times (minutes after midnight) at which a session of `durationMinutes`
 * fits inside the chef's working hours on `date` without clashing with
 * existing bookings.
 */
export function startTimesForDate(
  input: {
    date: string;
    durationMinutes: number;
    windows: AvailabilityWindow[];
    busy: BusyInterval[];
  },
  options: SlotOptions = {},
): number[] {
  const interval = options.intervalMinutes ?? SLOT_INTERVAL_MINUTES;
  const buffer = options.bufferMinutes ?? BUFFER_MINUTES;
  const weekday = weekdayOf(input.date);
  const sameDay = input.busy.filter((busy) => busy.date === input.date);
  const times: number[] = [];

  for (const window of input.windows) {
    if (window.weekday !== weekday) continue;
    for (
      let start = window.startMinute;
      start + input.durationMinutes <= window.endMinute;
      start += interval
    ) {
      const end = start + input.durationMinutes;
      const clashes = sameDay.some((busy) =>
        conflicts(start, end, busy.startMinute, busy.endMinute, buffer),
      );
      if (!clashes) times.push(start);
    }
  }

  return times.sort((a, b) => a - b);
}

/** Open start times for every date in the booking window. */
export function availabilityCalendar(
  input: {
    now: Date;
    durationMinutes: number;
    windows: AvailabilityWindow[];
    busy: BusyInterval[];
  },
  options?: SlotOptions,
): DayAvailability[] {
  return bookableDates(input.now).map((date) => ({
    date,
    startTimes: startTimesForDate(
      { date, durationMinutes: input.durationMinutes, windows: input.windows, busy: input.busy },
      options,
    ),
  }));
}
