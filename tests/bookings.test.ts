import { describe, expect, it } from "vitest";
import {
  availableActions,
  chefDashboard,
  createBooking,
  createReview,
  getBooking,
  listBookingsForChef,
  updateBookingStatus,
} from "@/lib/bookings";
import { getChefCalendar, getPackages, listChefs } from "@/lib/chefs";
import { addDays } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { createMarketplace, MONDAY, NOW } from "./helpers";

/** Noon on the Monday of the test booking, after a 9:00 session has started. */
const DURING_SESSION = new Date(2026, 9, 19, 12, 0);

describe("createBooking", () => {
  it("creates a pending request with the package and price copied onto it", () => {
    const { db, request } = createMarketplace();
    const id = createBooking(db, request({ dietary: ["Vegan", "Not a real diet"] }), NOW);
    const booking = getBooking(db, id)!;

    expect(booking).toMatchObject({
      status: "pending",
      packageName: "Weekly prep",
      date: MONDAY,
      startMinute: 540,
      endMinute: 720,
      chefFeeCents: 15_000,
      groceryEstimateCents: 6_000,
      serviceFeeCents: 750,
      totalCents: 21_750,
      dietary: ["Vegan"],
      chefName: "Robin Chef",
      customerName: "Casey Customer",
    });
  });

  it("never gives the same time to two customers", () => {
    const { db, request, otherCustomer } = createMarketplace();
    createBooking(db, request(), NOW);
    expect(() => createBooking(db, request({ customerId: otherCustomer.id }), NOW)).toThrow(
      /no longer available/,
    );
  });

  it("keeps the buffer between sessions", () => {
    const { db, request, otherCustomer } = createMarketplace();
    createBooking(db, request(), NOW); // 9:00–12:00
    expect(() => createBooking(db, request({ customerId: otherCustomer.id, startMinute: 750 }), NOW)).toThrow(
      AppError,
    );
    expect(() => createBooking(db, request({ customerId: otherCustomer.id, startMinute: 780 }), NOW)).not.toThrow();
  });

  it("removes booked times from the chef's calendar", () => {
    const { db, request, chef } = createMarketplace();
    createBooking(db, request(), NOW);
    const calendar = getChefCalendar(db, chef.id, getPackages(db, chef.id), NOW);
    const monday = Object.values(calendar)[0].find((day) => day.date === MONDAY)!;
    expect(monday.startTimes).toEqual([780, 810, 840]);
  });

  it("rejects dates outside the booking window and days the chef doesn't work", () => {
    const { db, request } = createMarketplace();
    expect(() => createBooking(db, request({ date: "2026-10-14" }), NOW)).toThrow(/next four weeks/);
    expect(() => createBooking(db, request({ date: addDays(MONDAY, 35) }), NOW)).toThrow(/next four weeks/);
    expect(() => createBooking(db, request({ date: addDays(MONDAY, 1) }), NOW)).toThrow(/no longer available/);
  });

  it("rejects another chef's package", () => {
    const { db, request, otherPackageId } = createMarketplace();
    expect(() => createBooking(db, request({ packageId: otherPackageId }), NOW)).toThrow(/current packages/);
  });

  it("requires an address", () => {
    const { db, request } = createMarketplace();
    expect(() => createBooking(db, request({ address: "   " }), NOW)).toThrow(/Address is required/);
  });
});

describe("updateBookingStatus", () => {
  it("lets only the booking's chef accept a request", () => {
    const { db, request, customer, chefUser, otherChefUser } = createMarketplace();
    const id = createBooking(db, request(), NOW);

    expect(() => updateBookingStatus(db, id, "accept", customer, NOW)).toThrow(/Only the chef/);
    expect(() => updateBookingStatus(db, id, "accept", otherChefUser, NOW)).toThrow(/couldn't find/);
    expect(updateBookingStatus(db, id, "accept", chefUser, NOW)).toBe("confirmed");
    expect(() => updateBookingStatus(db, id, "accept", chefUser, NOW)).toThrow(/already confirmed/);
  });

  it("frees the slot when a customer cancels", () => {
    const { db, request, customer, otherCustomer } = createMarketplace();
    const id = createBooking(db, request(), NOW);
    expect(updateBookingStatus(db, id, "cancel", customer, NOW)).toBe("cancelled");
    expect(getBooking(db, id)!.cancelledBy).toBe("customer");
    expect(() => createBooking(db, request({ customerId: otherCustomer.id }), NOW)).not.toThrow();
  });

  it("frees the slot when the chef declines", () => {
    const { db, request, chefUser, otherCustomer } = createMarketplace();
    const id = createBooking(db, request(), NOW);
    updateBookingStatus(db, id, "decline", chefUser, NOW);
    expect(() => createBooking(db, request({ customerId: otherCustomer.id }), NOW)).not.toThrow();
  });

  it("only completes sessions that have started, and blocks late cancellations", () => {
    const { db, request, customer, chefUser } = createMarketplace();
    const id = createBooking(db, request(), NOW);
    updateBookingStatus(db, id, "accept", chefUser, NOW);

    expect(() => updateBookingStatus(db, id, "complete", chefUser, NOW)).toThrow(/once it has started/);
    expect(() => updateBookingStatus(db, id, "cancel", customer, DURING_SESSION)).toThrow(/already started/);
    expect(updateBookingStatus(db, id, "complete", chefUser, DURING_SESSION)).toBe("completed");
  });

  it("expires requests the chef didn't answer in time", () => {
    const { db, request, chefUser } = createMarketplace();
    const id = createBooking(db, request(), NOW);
    expect(() => updateBookingStatus(db, id, "accept", chefUser, DURING_SESSION)).toThrow(/expired/);
  });

  it("rejects unknown actions", () => {
    const { db, request, chefUser } = createMarketplace();
    const id = createBooking(db, request(), NOW);
    expect(() => updateBookingStatus(db, id, "refund", chefUser, NOW)).toThrow(/Unknown/);
  });
});

describe("availableActions", () => {
  it("matches what each participant may do", () => {
    const { db, request, customer, otherCustomer, chefUser } = createMarketplace();
    const id = createBooking(db, request(), NOW);
    const booking = getBooking(db, id)!;

    expect(availableActions(booking, chefUser, NOW)).toEqual(["accept", "decline"]);
    expect(availableActions(booking, customer, NOW)).toEqual(["cancel"]);
    expect(availableActions(booking, otherCustomer, NOW)).toEqual([]);

    updateBookingStatus(db, id, "accept", chefUser, NOW);
    const confirmed = getBooking(db, id)!;
    expect(availableActions(confirmed, chefUser, NOW)).toEqual(["cancel"]);
    expect(availableActions(confirmed, chefUser, DURING_SESSION)).toEqual(["complete"]);
  });
});

describe("createReview", () => {
  it("allows one review per completed session, by its customer", () => {
    const { db, request, customer, otherCustomer, chefUser, chef } = createMarketplace();
    const id = createBooking(db, request(), NOW);
    const review = { bookingId: id, customerId: customer.id, rating: 5, comment: "Fantastic!" };

    expect(() => createReview(db, review)).toThrow(/once your session is completed/);
    updateBookingStatus(db, id, "accept", chefUser, NOW);
    updateBookingStatus(db, id, "complete", chefUser, DURING_SESSION);

    expect(() => createReview(db, { ...review, customerId: otherCustomer.id })).toThrow(/couldn't find/);
    expect(() => createReview(db, { ...review, rating: 6 })).toThrow(/1 to 5/);
    createReview(db, review);
    expect(() => createReview(db, review)).toThrow(/already reviewed/);

    expect(getBooking(db, id)!.review).toEqual({ rating: 5, comment: "Fantastic!" });
    expect(listChefs(db).find((c) => c.id === chef.id)).toMatchObject({ rating: 5, reviewCount: 1 });
  });
});

describe("chefDashboard", () => {
  it("groups requests, upcoming sessions and sessions to complete", () => {
    const { db, request, chefUser, chef, otherCustomer } = createMarketplace();
    const pending = createBooking(db, request(), NOW);
    const confirmed = createBooking(db, request({ customerId: otherCustomer.id, startMinute: 780 }), NOW);
    updateBookingStatus(db, confirmed, "accept", chefUser, NOW);

    const before = chefDashboard(listBookingsForChef(db, chef.id), NOW);
    expect(before.requests.map((b) => b.id)).toEqual([pending]);
    expect(before.upcoming.map((b) => b.id)).toEqual([confirmed]);

    const after = chefDashboard(listBookingsForChef(db, chef.id), new Date(2026, 9, 19, 18, 0));
    expect(after.toComplete.map((b) => b.id)).toEqual([confirmed]);
    expect(after.history.map((b) => b.id)).toEqual([pending]); // expired request
  });
});
