import {
  availabilityCalendar,
  startTimesForDate,
  type BusyInterval,
  type DayAvailability,
} from "./availability";
import { CUISINES, DIETARY_OPTIONS } from "./config";
import { bookableDates } from "./dates";
import type { DB } from "./db";
import { AppError } from "./errors";
import type { AvailabilityWindow, ChefProfile, ChefSummary, MealPackage, Review } from "./types";
import { centsInRange, integerInRange, optionalText, pickAllowed, requiredText } from "./validation";

export function parseList(json: string): string[] {
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

const SUMMARY_COLUMNS = `
  c.id, c.user_id AS userId, u.name, c.headline, c.city,
  c.years_experience AS yearsExperience, c.cuisines, c.dietary,
  (SELECT AVG(r.rating) FROM reviews r WHERE r.chef_id = c.id) AS rating,
  (SELECT COUNT(*) FROM reviews r WHERE r.chef_id = c.id) AS reviewCount,
  (SELECT MIN(p.price_cents) FROM packages p WHERE p.chef_id = c.id AND p.active = 1) AS startingPriceCents`;

// A chef appears in search once they can actually be booked.
const IS_LISTED = `
  EXISTS (SELECT 1 FROM packages p WHERE p.chef_id = c.id AND p.active = 1)
  AND EXISTS (SELECT 1 FROM availability a WHERE a.chef_id = c.id)`;

type SummaryRow = Omit<ChefSummary, "cuisines" | "dietary"> & { cuisines: string; dietary: string };

function toSummary(row: SummaryRow): ChefSummary {
  return {
    ...row,
    cuisines: parseList(row.cuisines),
    dietary: parseList(row.dietary),
    rating: row.rating === null ? null : Math.round(row.rating * 10) / 10,
  };
}

export type ChefSort = "rating" | "price" | "experience";

export interface ChefFilters {
  q?: string;
  city?: string;
  cuisine?: string;
  dietary?: string;
  maxPriceCents?: number;
  /** Only chefs with at least one open start time on this date. */
  date?: string;
  sort?: ChefSort;
}

const ORDER_BY: Record<ChefSort, string> = {
  rating: "rating IS NULL, rating DESC, reviewCount DESC, name",
  price: "startingPriceCents, rating DESC, name",
  experience: "yearsExperience DESC, name",
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function listChefs(db: DB, filters: ChefFilters = {}): ChefSummary[] {
  const where = [IS_LISTED];
  const params: Record<string, string | number> = {};

  if (filters.q) {
    const fields = ["u.name", "c.headline", "c.bio", "c.city", "c.cuisines"];
    where.push(`(${fields.map((field) => `${field} LIKE @q ESCAPE '\\'`).join(" OR ")})`);
    params.q = `%${escapeLike(filters.q)}%`;
  }
  if (filters.city) {
    where.push("c.city = @city");
    params.city = filters.city;
  }
  if (filters.cuisine) {
    where.push("EXISTS (SELECT 1 FROM json_each(c.cuisines) WHERE value = @cuisine)");
    params.cuisine = filters.cuisine;
  }
  if (filters.dietary) {
    where.push("EXISTS (SELECT 1 FROM json_each(c.dietary) WHERE value = @dietary)");
    params.dietary = filters.dietary;
  }

  let sql = `SELECT ${SUMMARY_COLUMNS} FROM chefs c JOIN users u ON u.id = c.user_id
             WHERE ${where.join(" AND ")}`;
  if (filters.maxPriceCents !== undefined) {
    sql = `SELECT * FROM (${sql}) WHERE startingPriceCents <= @maxPrice`;
    params.maxPrice = filters.maxPriceCents;
  }
  sql += ` ORDER BY ${ORDER_BY[filters.sort ?? "rating"]}`;

  const statement = db.prepare(sql);
  const rows = (Object.keys(params).length ? statement.all(params) : statement.all()) as SummaryRow[];
  const chefs = rows.map(toSummary);

  const date = filters.date;
  return date ? chefs.filter((chef) => hasOpeningOn(db, chef.id, date)) : chefs;
}

export function listCities(db: DB): string[] {
  const rows = db
    .prepare(`SELECT DISTINCT c.city FROM chefs c WHERE c.city <> '' AND ${IS_LISTED} ORDER BY c.city`)
    .all() as { city: string }[];
  return rows.map((row) => row.city);
}

export function getChefProfile(db: DB, chefId: number): ChefProfile | null {
  const row = db
    .prepare(`SELECT ${SUMMARY_COLUMNS}, c.bio FROM chefs c JOIN users u ON u.id = c.user_id WHERE c.id = ?`)
    .get(chefId) as (SummaryRow & { bio: string }) | undefined;
  if (!row) return null;

  const { bio, ...summary } = row;
  return {
    ...toSummary(summary),
    bio,
    packages: getPackages(db, chefId),
    availability: getAvailability(db, chefId),
    reviews: getReviews(db, chefId),
  };
}

export function getPackages(
  db: DB,
  chefId: number,
  options: { includeArchived?: boolean } = {},
): MealPackage[] {
  const rows = db
    .prepare(
      `SELECT id, chef_id AS chefId, name, description, dishes, portions_per_dish AS portionsPerDish,
              duration_minutes AS durationMinutes, price_cents AS priceCents,
              grocery_estimate_cents AS groceryEstimateCents, active
       FROM packages
       WHERE chef_id = ? ${options.includeArchived ? "" : "AND active = 1"}
       ORDER BY active DESC, price_cents, id`,
    )
    .all(chefId) as (Omit<MealPackage, "active"> & { active: number })[];
  return rows.map((row) => ({ ...row, active: row.active === 1 }));
}

export function getAvailability(db: DB, chefId: number): AvailabilityWindow[] {
  return db
    .prepare(
      `SELECT weekday, start_minute AS startMinute, end_minute AS endMinute
       FROM availability WHERE chef_id = ? ORDER BY weekday`,
    )
    .all(chefId) as AvailabilityWindow[];
}

export function getReviews(db: DB, chefId: number, limit = 20): Review[] {
  return db
    .prepare(
      `SELECT r.id, r.booking_id AS bookingId, r.rating, r.comment, u.name AS customerName,
              b.package_name AS packageName, r.created_at AS createdAt
       FROM reviews r
       JOIN users u ON u.id = r.customer_id
       JOIN bookings b ON b.id = r.booking_id
       WHERE r.chef_id = ?
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT ?`,
    )
    .all(chefId, limit) as Review[];
}

/** Sessions that block the chef's calendar between two dates (inclusive). */
export function getBusyIntervals(db: DB, chefId: number, fromDate: string, toDate: string): BusyInterval[] {
  return db
    .prepare(
      `SELECT date, start_minute AS startMinute, end_minute AS endMinute
       FROM bookings
       WHERE chef_id = ? AND status IN ('pending', 'confirmed') AND date BETWEEN ? AND ?`,
    )
    .all(chefId, fromDate, toDate) as BusyInterval[];
}

/** Open start times for each package across the booking window, keyed by package id. */
export function getChefCalendar(
  db: DB,
  chefId: number,
  packages: MealPackage[],
  now = new Date(),
): Record<number, DayAvailability[]> {
  const dates = bookableDates(now);
  const windows = getAvailability(db, chefId);
  const busy = getBusyIntervals(db, chefId, dates[0], dates[dates.length - 1]);
  return Object.fromEntries(
    packages.map((pkg) => [
      pkg.id,
      availabilityCalendar({ now, durationMinutes: pkg.durationMinutes, windows, busy }),
    ]),
  );
}

function hasOpeningOn(db: DB, chefId: number, date: string): boolean {
  const { shortest } = db
    .prepare("SELECT MIN(duration_minutes) AS shortest FROM packages WHERE chef_id = ? AND active = 1")
    .get(chefId) as { shortest: number | null };
  if (!shortest) return false;
  return (
    startTimesForDate({
      date,
      durationMinutes: shortest,
      windows: getAvailability(db, chefId),
      busy: getBusyIntervals(db, chefId, date, date),
    }).length > 0
  );
}

// ---------------------------------------------------------------------------
// The signed-in chef's own profile, hours and menu
// ---------------------------------------------------------------------------

export interface ChefAccount {
  id: number;
  userId: number;
  name: string;
  headline: string;
  bio: string;
  city: string;
  yearsExperience: number;
  cuisines: string[];
  dietary: string[];
}

export function getChefByUserId(db: DB, userId: number): ChefAccount | null {
  const row = db
    .prepare(
      `SELECT c.id, c.user_id AS userId, u.name, c.headline, c.bio, c.city,
              c.years_experience AS yearsExperience, c.cuisines, c.dietary
       FROM chefs c JOIN users u ON u.id = c.user_id
       WHERE c.user_id = ?`,
    )
    .get(userId) as (Omit<ChefAccount, "cuisines" | "dietary"> & { cuisines: string; dietary: string }) | undefined;
  if (!row) return null;
  return { ...row, cuisines: parseList(row.cuisines), dietary: parseList(row.dietary) };
}

export interface ChefProfileInput {
  name: string;
  headline: string;
  bio: string;
  city: string;
  yearsExperience: number;
  cuisines: string[];
  dietary: string[];
}

export function updateChefProfile(db: DB, chefId: number, input: ChefProfileInput): void {
  const name = requiredText(input.name, "Your name", 80);
  const headline = requiredText(input.headline, "Headline", 100);
  const city = requiredText(input.city, "City", 60);
  const bio = optionalText(input.bio, "About you", 2000);
  const yearsExperience = integerInRange(input.yearsExperience, "Years of experience", 0, 60);
  const cuisines = pickAllowed(input.cuisines, CUISINES);
  const dietary = pickAllowed(input.dietary, DIETARY_OPTIONS);
  if (cuisines.length === 0) throw new AppError("Pick at least one cuisine you cook.");

  db.transaction(() => {
    const { changes } = db
      .prepare(
        `UPDATE chefs SET headline = ?, bio = ?, city = ?, years_experience = ?, cuisines = ?, dietary = ?
         WHERE id = ?`,
      )
      .run(headline, bio, city, yearsExperience, JSON.stringify(cuisines), JSON.stringify(dietary), chefId);
    if (changes === 0) throw new AppError("We couldn't find your chef profile.");
    db.prepare("UPDATE users SET name = ? WHERE id = (SELECT user_id FROM chefs WHERE id = ?)").run(name, chefId);
  })();
}

/** Replaces the chef's weekly hours. Existing bookings are not affected. */
export function replaceAvailability(db: DB, chefId: number, windows: AvailabilityWindow[]): void {
  const seen = new Set<number>();
  for (const window of windows) {
    integerInRange(window.weekday, "Weekday", 0, 6);
    if (seen.has(window.weekday)) throw new AppError("Each day can only have one set of hours.");
    seen.add(window.weekday);
    const valid =
      Number.isInteger(window.startMinute) &&
      Number.isInteger(window.endMinute) &&
      window.startMinute >= 0 &&
      window.endMinute <= 24 * 60;
    if (!valid) throw new AppError("Please choose valid start and end times.");
    if (window.endMinute - window.startMinute < 60) {
      throw new AppError("Working hours must end at least an hour after they start.");
    }
  }

  db.transaction(() => {
    db.prepare("DELETE FROM availability WHERE chef_id = ?").run(chefId);
    const insert = db.prepare(
      "INSERT INTO availability (chef_id, weekday, start_minute, end_minute) VALUES (?, ?, ?, ?)",
    );
    for (const window of windows) insert.run(chefId, window.weekday, window.startMinute, window.endMinute);
  })();
}

export interface PackageInput {
  name: string;
  description: string;
  dishes: number;
  portionsPerDish: number;
  durationMinutes: number;
  priceCents: number;
  groceryEstimateCents: number;
}

/** Creates a package, or updates `packageId` if given. Returns the package id. */
export function savePackage(db: DB, chefId: number, input: PackageInput, packageId?: number): number {
  const values = [
    requiredText(input.name, "Package name", 60),
    optionalText(input.description, "Description", 300),
    integerInRange(input.dishes, "Number of dishes", 1, 12),
    integerInRange(input.portionsPerDish, "Portions per dish", 1, 12),
    integerInRange(input.durationMinutes, "Session length in minutes", 60, 600),
    centsInRange(input.priceCents, "Price", 5_000),
    centsInRange(input.groceryEstimateCents, "Grocery estimate", 2_000),
  ];

  if (packageId === undefined) {
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO packages (name, description, dishes, portions_per_dish, duration_minutes,
                               price_cents, grocery_estimate_cents, chef_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(...values, chefId);
    return Number(lastInsertRowid);
  }

  const { changes } = db
    .prepare(
      `UPDATE packages SET name = ?, description = ?, dishes = ?, portions_per_dish = ?,
                           duration_minutes = ?, price_cents = ?, grocery_estimate_cents = ?
       WHERE id = ? AND chef_id = ? AND active = 1`,
    )
    .run(...values, packageId, chefId);
  if (changes === 0) throw new AppError("We couldn't find that package.");
  return packageId;
}

/** Hides a package from customers. Past bookings keep their copy of its details. */
export function archivePackage(db: DB, chefId: number, packageId: number): void {
  const { changes } = db
    .prepare("UPDATE packages SET active = 0 WHERE id = ? AND chef_id = ? AND active = 1")
    .run(packageId, chefId);
  if (changes === 0) throw new AppError("We couldn't find that package.");
}
