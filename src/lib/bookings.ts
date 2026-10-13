import { startTimesForDate } from "./availability";
import { getAvailability, getBusyIntervals, parseList } from "./chefs";
import { DIETARY_OPTIONS } from "./config";
import { bookableDates, isIsoDate, localIsoDate, startsAt } from "./dates";
import type { DB } from "./db";
import { AppError } from "./errors";
import { quoteBooking } from "./pricing";
import type {
  Booking,
  BookingAction,
  BookingStatus,
  GroceryOption,
  Role,
  SessionUser,
} from "./types";
import { optionalText, pickAllowed, requiredText } from "./validation";

// ---------------------------------------------------------------------------
// Requesting a booking
// ---------------------------------------------------------------------------

export interface BookingRequest {
  customerId: number;
  chefId: number;
  packageId: number;
  date: string;
  startMinute: number;
  address: string;
  groceries: GroceryOption;
  dietary: string[];
  allergies: string;
  notes: string;
}

interface PackageRow {
  id: number;
  name: string;
  dishes: number;
  portionsPerDish: number;
  durationMinutes: number;
  priceCents: number;
  groceryEstimateCents: number;
}

/**
 * Creates a pending booking request. The slot is re-checked inside a write
 * transaction, so two customers can never be given the same time.
 */
export function createBooking(db: DB, request: BookingRequest, now = new Date()): number {
  const address = requiredText(request.address, "Address", 200);
  const allergies = optionalText(request.allergies, "Allergies", 300);
  const notes = optionalText(request.notes, "Notes for your chef", 1000);
  const dietary = pickAllowed(request.dietary, DIETARY_OPTIONS);
  const groceries: GroceryOption = request.groceries === "customer" ? "customer" : "chef";
  if (!isIsoDate(request.date) || !bookableDates(now).includes(request.date)) {
    throw new AppError("Please choose a date within the next four weeks.");
  }

  const insert = db.transaction((): number => {
    const pkg = db
      .prepare(
        `SELECT id, name, dishes, portions_per_dish AS portionsPerDish,
                duration_minutes AS durationMinutes, price_cents AS priceCents,
                grocery_estimate_cents AS groceryEstimateCents
         FROM packages WHERE id = ? AND chef_id = ? AND active = 1`,
      )
      .get(request.packageId, request.chefId) as PackageRow | undefined;
    if (!pkg) throw new AppError("Please choose one of this chef's current packages.");

    const openTimes = startTimesForDate({
      date: request.date,
      durationMinutes: pkg.durationMinutes,
      windows: getAvailability(db, request.chefId),
      busy: getBusyIntervals(db, request.chefId, request.date, request.date),
    });
    if (!openTimes.includes(request.startMinute)) {
      throw new AppError("That start time is no longer available. Please pick another time.");
    }

    const quote = quoteBooking(pkg, groceries);
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO bookings (
           customer_id, chef_id, package_id, package_name, dishes, portions_per_dish,
           date, start_minute, end_minute, address, groceries, dietary, allergies, notes,
           chef_fee_cents, grocery_estimate_cents, service_fee_cents, total_cents)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        request.customerId,
        request.chefId,
        pkg.id,
        pkg.name,
        pkg.dishes,
        pkg.portionsPerDish,
        request.date,
        request.startMinute,
        request.startMinute + pkg.durationMinutes,
        address,
        groceries,
        JSON.stringify(dietary),
        allergies,
        notes,
        quote.chefFeeCents,
        quote.groceryEstimateCents,
        quote.serviceFeeCents,
        quote.totalCents,
      );
    return Number(lastInsertRowid);
  });

  // IMMEDIATE takes the write lock before the availability check runs.
  return insert.immediate();
}

// ---------------------------------------------------------------------------
// Reading bookings
// ---------------------------------------------------------------------------

const BOOKING_SELECT = `
  SELECT b.id, b.status, b.cancelled_by AS cancelledBy,
         b.customer_id AS customerId, customer.name AS customerName,
         b.chef_id AS chefId, c.user_id AS chefUserId, chef.name AS chefName,
         b.package_id AS packageId, b.package_name AS packageName,
         b.dishes, b.portions_per_dish AS portionsPerDish,
         b.date, b.start_minute AS startMinute, b.end_minute AS endMinute,
         b.address, b.groceries, b.dietary, b.allergies, b.notes,
         b.chef_fee_cents AS chefFeeCents, b.grocery_estimate_cents AS groceryEstimateCents,
         b.service_fee_cents AS serviceFeeCents, b.total_cents AS totalCents,
         b.created_at AS createdAt,
         r.rating AS reviewRating, r.comment AS reviewComment
  FROM bookings b
  JOIN users customer ON customer.id = b.customer_id
  JOIN chefs c ON c.id = b.chef_id
  JOIN users chef ON chef.id = c.user_id
  LEFT JOIN reviews r ON r.booking_id = b.id`;

type BookingRow = Omit<Booking, "dietary" | "review"> & {
  dietary: string;
  reviewRating: number | null;
  reviewComment: string | null;
};

function toBooking({ reviewRating, reviewComment, ...row }: BookingRow): Booking {
  return {
    ...row,
    dietary: parseList(row.dietary),
    review: reviewRating === null ? null : { rating: reviewRating, comment: reviewComment ?? "" },
  };
}

export function getBooking(db: DB, bookingId: number): Booking | null {
  const row = db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(bookingId) as BookingRow | undefined;
  return row ? toBooking(row) : null;
}

export function listBookingsForCustomer(db: DB, customerId: number): Booking[] {
  const rows = db
    .prepare(`${BOOKING_SELECT} WHERE b.customer_id = ? ORDER BY b.date, b.start_minute`)
    .all(customerId) as BookingRow[];
  return rows.map(toBooking);
}

export function listBookingsForChef(db: DB, chefId: number): Booking[] {
  const rows = db
    .prepare(`${BOOKING_SELECT} WHERE b.chef_id = ? ORDER BY b.date, b.start_minute`)
    .all(chefId) as BookingRow[];
  return rows.map(toBooking);
}

type Timed = Pick<Booking, "date" | "startMinute">;

export function hasStarted(booking: Timed, now = new Date()): boolean {
  return startsAt(booking.date, booking.startMinute) <= now;
}

/** A request the chef never answered before its start time. */
export function isExpired(booking: Timed & Pick<Booking, "status">, now = new Date()): boolean {
  return booking.status === "pending" && hasStarted(booking, now);
}

function isOpen(booking: Booking, now: Date): boolean {
  return (booking.status === "pending" || booking.status === "confirmed") && !hasStarted(booking, now);
}

const newestFirst = (a: Booking, b: Booking) =>
  b.date.localeCompare(a.date) || b.startMinute - a.startMinute;

/** Splits a customer's bookings (sorted oldest first) into upcoming and past. */
export function splitCustomerBookings(bookings: Booking[], now = new Date()) {
  return {
    upcoming: bookings.filter((booking) => isOpen(booking, now)),
    past: bookings.filter((booking) => !isOpen(booking, now)).sort(newestFirst),
  };
}

/** Everything the chef dashboard shows, from bookings sorted oldest first. */
export function chefDashboard(bookings: Booking[], now = new Date()) {
  const month = localIsoDate(now).slice(0, 7);
  const requests = bookings.filter((b) => b.status === "pending" && !hasStarted(b, now));
  const upcoming = bookings.filter((b) => b.status === "confirmed" && !hasStarted(b, now));
  const toComplete = bookings.filter((b) => b.status === "confirmed" && hasStarted(b, now));
  const open = new Set([...requests, ...upcoming, ...toComplete]);
  const history = bookings.filter((b) => !open.has(b)).sort(newestFirst);
  const earnedThisMonthCents = bookings
    .filter((b) => b.status === "completed" && b.date.startsWith(month))
    .reduce((sum, b) => sum + b.chefFeeCents, 0);
  return { requests, upcoming, toComplete, history, earnedThisMonthCents };
}

// ---------------------------------------------------------------------------
// Changing a booking's status
// ---------------------------------------------------------------------------

export const BOOKING_ACTIONS: readonly BookingAction[] = ["accept", "decline", "complete", "cancel"];

/** Which statuses each role may move a booking out of, per action. */
const RULES: Record<BookingAction, { to: BookingStatus; from: Partial<Record<Role, BookingStatus[]>> }> = {
  accept: { to: "confirmed", from: { chef: ["pending"] } },
  decline: { to: "declined", from: { chef: ["pending"] } },
  complete: { to: "completed", from: { chef: ["confirmed"] } },
  cancel: { to: "cancelled", from: { customer: ["pending", "confirmed"], chef: ["confirmed"] } },
};

const CURRENT_STATUS: Record<BookingStatus, string> = {
  pending: "This request is still waiting for the chef to respond.",
  confirmed: "This booking is already confirmed.",
  declined: "This request was declined.",
  cancelled: "This booking was cancelled.",
  completed: "This session is already marked as completed.",
};

type Actor = Pick<SessionUser, "id" | "role">;
type BookingRef = Timed & Pick<Booking, "status" | "customerId" | "chefUserId">;

export function isParticipant(booking: Pick<Booking, "customerId" | "chefUserId">, user: Actor): boolean {
  return user.role === "customer" ? booking.customerId === user.id : booking.chefUserId === user.id;
}

/** Why `user` can't take `action` on `booking` right now, or null if they can. */
function transitionProblem(booking: BookingRef, action: BookingAction, user: Actor, now: Date): string | null {
  const allowedFrom = RULES[action].from[user.role];
  if (!allowedFrom) return "Only the chef can do that.";
  if (!allowedFrom.includes(booking.status)) return CURRENT_STATUS[booking.status];

  const started = hasStarted(booking, now);
  if (action === "accept" && started) return "This request expired because its start time has passed.";
  if (action === "cancel" && started) return "This session has already started, so it can't be cancelled.";
  if (action === "complete" && !started) return "You can mark a session as completed once it has started.";
  return null;
}

export function availableActions(booking: BookingRef, user: Actor, now = new Date()): BookingAction[] {
  if (!isParticipant(booking, user)) return [];
  return BOOKING_ACTIONS.filter((action) => transitionProblem(booking, action, user, now) === null);
}

export function updateBookingStatus(
  db: DB,
  bookingId: number,
  action: string,
  user: Actor,
  now = new Date(),
): BookingStatus {
  if (!BOOKING_ACTIONS.includes(action as BookingAction)) throw new AppError("Unknown booking action.");
  const booking = getBooking(db, bookingId);
  if (!booking || !isParticipant(booking, user)) throw new AppError("We couldn't find that booking.");

  const problem = transitionProblem(booking, action as BookingAction, user, now);
  if (problem) throw new AppError(problem);

  const { to } = RULES[action as BookingAction];
  const { changes } = db
    .prepare(
      `UPDATE bookings SET status = ?, cancelled_by = ?, updated_at = datetime('now')
       WHERE id = ? AND status = ?`,
    )
    .run(to, to === "cancelled" ? user.role : null, bookingId, booking.status);
  if (changes === 0) throw new AppError("This booking just changed. Refresh to see its latest status.");
  return to;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export function createReview(
  db: DB,
  input: { bookingId: number; customerId: number; rating: number; comment: string },
): void {
  const booking = db
    .prepare("SELECT customer_id AS customerId, chef_id AS chefId, status FROM bookings WHERE id = ?")
    .get(input.bookingId) as { customerId: number; chefId: number; status: BookingStatus } | undefined;
  if (!booking || booking.customerId !== input.customerId) {
    throw new AppError("We couldn't find that booking.");
  }
  if (booking.status !== "completed") {
    throw new AppError("You can leave a review once your session is completed.");
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new AppError("Please choose a rating from 1 to 5 stars.");
  }
  const comment = optionalText(input.comment, "Your review", 1000);
  if (db.prepare("SELECT 1 FROM reviews WHERE booking_id = ?").get(input.bookingId)) {
    throw new AppError("You've already reviewed this session.");
  }
  db.prepare(
    "INSERT INTO reviews (booking_id, chef_id, customer_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
  ).run(input.bookingId, booking.chefId, input.customerId, input.rating, comment);
}
