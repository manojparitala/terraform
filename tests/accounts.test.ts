import { describe, expect, it } from "vitest";
import { listBookingsForChef, listBookingsForCustomer } from "@/lib/bookings";
import { getAvailability, getChefByUserId, listChefs, listCities, savePackage, updateChefProfile } from "@/lib/chefs";
import { weekdayOf } from "@/lib/dates";
import { openDatabase } from "@/lib/db";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { seedDemoData } from "@/lib/seed";
import { createSession, getSessionUser, SESSION_TTL_MS } from "@/lib/sessions";
import { createUser, findUserByEmail, validateSignup } from "@/lib/users";
import { createMarketplace, NOW } from "./helpers";

describe("passwords", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong horse", hash)).toBe(false);
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });
});

describe("sessions", () => {
  it("resolves a token to its user until it expires", () => {
    const { db, customer } = createMarketplace();
    const now = Date.now();
    const { token } = createSession(db, customer.id, now);

    expect(getSessionUser(db, token, now)).toMatchObject({ id: customer.id, role: "customer" });
    expect(getSessionUser(db, "forged-token", now)).toBeNull();
    expect(getSessionUser(db, token, now + SESSION_TTL_MS + 1)).toBeNull();
    expect(getSessionUser(db, token, now)).toBeNull(); // expired sessions are deleted
  });
});

describe("users", () => {
  it("treats emails case-insensitively and rejects duplicates", () => {
    const { db } = createMarketplace();
    expect(findUserByEmail(db, "  CASEY@example.test ")).toBeDefined();
    expect(() =>
      createUser(db, { name: "Dupe", email: "Casey@Example.test", passwordHash: "x", role: "customer" }),
    ).toThrow(/already exists/);
  });

  it("validates sign-up details", () => {
    expect(() => validateSignup({ name: "", email: "a@b.co", password: "longenough" })).toThrow(/name/);
    expect(() => validateSignup({ name: "Al", email: "nope", password: "longenough" })).toThrow(/email/);
    expect(() => validateSignup({ name: "Al", email: "a@b.co", password: "short" })).toThrow(/8 characters/);
    expect(() => validateSignup({ name: "Al", email: "a@b.co", password: "longenough" })).not.toThrow();
  });

  it("only lists chefs once they have a package and working hours", () => {
    const db = openDatabase(":memory:");
    const user = createUser(db, { name: "New Chef", email: "new@example.test", passwordHash: "x", role: "chef" });
    const chef = getChefByUserId(db, user.id)!;
    expect(listChefs(db)).toHaveLength(0);

    updateChefProfile(db, chef.id, {
      name: "Nova Chef",
      headline: "Seasonal vegetarian meal prep",
      bio: "",
      city: "Portland, OR",
      yearsExperience: 4,
      cuisines: ["French", "Not a cuisine"],
      dietary: ["Vegetarian"],
    });
    savePackage(db, chef.id, {
      name: "Starter",
      description: "",
      dishes: 3,
      portionsPerDish: 2,
      durationMinutes: 120,
      priceCents: 9_000,
      groceryEstimateCents: 0,
    });
    expect(listChefs(db)).toHaveLength(0);

    db.prepare("INSERT INTO availability (chef_id, weekday, start_minute, end_minute) VALUES (?, 2, 600, 960)").run(chef.id);
    expect(listChefs(db)).toMatchObject([{ name: "Nova Chef", cuisines: ["French"], city: "Portland, OR" }]);
  });
});

describe("demo seed data", () => {
  const db = openDatabase(":memory:");
  seedDemoData(db, NOW);

  it("creates bookable chefs with reviews in several cities", () => {
    const chefs = listChefs(db);
    expect(chefs).toHaveLength(8);
    expect(chefs.every((chef) => chef.reviewCount > 0 && chef.rating !== null)).toBe(true);
    expect(listCities(db)).toEqual(["Austin, TX", "Denver, CO", "Seattle, WA"]);
    expect(listChefs(db, { city: "Austin, TX", dietary: "Vegan" }).map((c) => c.name).sort()).toEqual([
      "Lina Haddad",
      "Priya Raman",
    ]);
  });

  it("creates working demo logins", async () => {
    for (const account of DEMO_ACCOUNTS) {
      const user = findUserByEmail(db, account.email)!;
      expect(await verifyPassword(DEMO_PASSWORD, user.passwordHash)).toBe(true);
    }
  });

  it("only schedules sessions inside each chef's working hours", () => {
    for (const chef of listChefs(db)) {
      const windows = getAvailability(db, chef.id);
      for (const booking of listBookingsForChef(db, chef.id)) {
        const window = windows.find((w) => w.weekday === weekdayOf(booking.date));
        expect(window, `${chef.name} on ${booking.date}`).toBeDefined();
        expect(booking.endMinute).toBeLessThanOrEqual(window!.endMinute);
      }
    }
  });

  it("gives the demo customer something to see in every state", () => {
    const customer = findUserByEmail(db, DEMO_ACCOUNTS[0].email)!;
    const statuses = listBookingsForCustomer(db, customer.id).map((b) => b.status);
    expect(new Set(statuses)).toEqual(new Set(["confirmed", "pending", "completed", "cancelled"]));
  });
});
