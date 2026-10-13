import type { BookingRequest } from "@/lib/bookings";
import { getChefByUserId, replaceAvailability, savePackage } from "@/lib/chefs";
import { openDatabase } from "@/lib/db";
import { createUser } from "@/lib/users";

/** Wednesday, October 14, 2026 at noon (server-local time). */
export const NOW = new Date(2026, 9, 14, 12, 0);
/** The following Monday, a day the test chef works 9:00–17:00. */
export const MONDAY = "2026-10-19";

/** An in-memory marketplace with one chef, one package and two customers. */
export function createMarketplace() {
  const db = openDatabase(":memory:");
  const customer = createUser(db, {
    name: "Casey Customer",
    email: "casey@example.test",
    passwordHash: "unused",
    role: "customer",
  });
  const otherCustomer = createUser(db, {
    name: "Drew Other",
    email: "drew@example.test",
    passwordHash: "unused",
    role: "customer",
  });
  const chefUser = createUser(db, {
    name: "Robin Chef",
    email: "robin@example.test",
    passwordHash: "unused",
    role: "chef",
  });
  const otherChefUser = createUser(db, {
    name: "Sasha Chef",
    email: "sasha@example.test",
    passwordHash: "unused",
    role: "chef",
  });

  const chef = getChefByUserId(db, chefUser.id)!;
  const otherChef = getChefByUserId(db, otherChefUser.id)!;
  replaceAvailability(db, chef.id, [{ weekday: 1, startMinute: 9 * 60, endMinute: 17 * 60 }]);
  replaceAvailability(db, otherChef.id, [{ weekday: 1, startMinute: 9 * 60, endMinute: 17 * 60 }]);

  const packageId = savePackage(db, chef.id, {
    name: "Weekly prep",
    description: "Four dishes, four portions each",
    dishes: 4,
    portionsPerDish: 4,
    durationMinutes: 180,
    priceCents: 15_000,
    groceryEstimateCents: 6_000,
  });
  const otherPackageId = savePackage(db, otherChef.id, {
    name: "Other chef's prep",
    description: "",
    dishes: 3,
    portionsPerDish: 2,
    durationMinutes: 120,
    priceCents: 9_000,
    groceryEstimateCents: 3_000,
  });

  const request = (overrides: Partial<BookingRequest> = {}): BookingRequest => ({
    customerId: customer.id,
    chefId: chef.id,
    packageId,
    date: MONDAY,
    startMinute: 9 * 60,
    address: "12 Test St",
    groceries: "chef",
    dietary: [],
    allergies: "",
    notes: "",
    ...overrides,
  });

  return { db, customer, otherCustomer, chefUser, otherChefUser, chef, otherChef, packageId, otherPackageId, request };
}
