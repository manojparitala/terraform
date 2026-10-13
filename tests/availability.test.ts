import { describe, expect, it } from "vitest";
import { availabilityCalendar, conflicts, startTimesForDate } from "@/lib/availability";
import { BOOKING_WINDOW_DAYS } from "@/lib/config";
import { addDays, bookableDates, isIsoDate, weekdayOf } from "@/lib/dates";
import { MONDAY, NOW } from "./helpers";

const mondays9to5 = [{ weekday: 1, startMinute: 540, endMinute: 1020 }];

describe("dates", () => {
  it("knows the test fixtures' weekdays", () => {
    expect(weekdayOf(MONDAY)).toBe(1);
    expect(weekdayOf("2026-10-14")).toBe(3);
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("validates ISO dates", () => {
    expect(isIsoDate("2026-10-19")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("10/19/2026")).toBe(false);
  });

  it("offers dates from tomorrow through the end of the booking window", () => {
    const dates = bookableDates(NOW);
    expect(dates).toHaveLength(BOOKING_WINDOW_DAYS);
    expect(dates[0]).toBe("2026-10-15");
    expect(dates.at(-1)).toBe(addDays("2026-10-14", BOOKING_WINDOW_DAYS));
  });
});

describe("conflicts", () => {
  it("allows back-to-back sessions only when there is no buffer", () => {
    expect(conflicts(540, 720, 720, 900, 0)).toBe(false);
    expect(conflicts(540, 720, 720, 900, 60)).toBe(true);
  });

  it("detects overlaps", () => {
    expect(conflicts(540, 720, 600, 660, 0)).toBe(true);
  });
});

describe("startTimesForDate", () => {
  it("offers every half hour where the whole session fits in working hours", () => {
    const times = startTimesForDate({ date: MONDAY, durationMinutes: 180, windows: mondays9to5, busy: [] });
    expect(times[0]).toBe(540); // 9:00
    expect(times.at(-1)).toBe(840); // 14:00, ending exactly at 17:00
    expect(times).toHaveLength(11);
  });

  it("returns nothing on days the chef doesn't work", () => {
    const tuesday = addDays(MONDAY, 1);
    expect(startTimesForDate({ date: tuesday, durationMinutes: 180, windows: mondays9to5, busy: [] })).toEqual([]);
  });

  it("keeps a buffer around existing bookings", () => {
    const busy = [{ date: MONDAY, startMinute: 540, endMinute: 720 }]; // 9:00–12:00
    const times = startTimesForDate(
      { date: MONDAY, durationMinutes: 180, windows: mondays9to5, busy },
      { bufferMinutes: 60 },
    );
    expect(times).toEqual([780, 810, 840]); // 13:00 onwards
  });

  it("ignores bookings on other days", () => {
    const busy = [{ date: addDays(MONDAY, 7), startMinute: 540, endMinute: 1020 }];
    expect(startTimesForDate({ date: MONDAY, durationMinutes: 180, windows: mondays9to5, busy })).toHaveLength(11);
  });

  it("returns nothing when the session is longer than the working day", () => {
    expect(startTimesForDate({ date: MONDAY, durationMinutes: 9 * 60, windows: mondays9to5, busy: [] })).toEqual([]);
  });
});

describe("availabilityCalendar", () => {
  it("covers the booking window and only opens the chef's working days", () => {
    const calendar = availabilityCalendar({ now: NOW, durationMinutes: 180, windows: mondays9to5, busy: [] });
    expect(calendar).toHaveLength(BOOKING_WINDOW_DAYS);
    const openDays = calendar.filter((day) => day.startTimes.length > 0);
    expect(openDays.map((day) => day.date)).toEqual(["2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09"]);
  });
});
