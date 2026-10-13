import { describe, expect, it } from "vitest";
import { pricePerMealCents, quoteBooking } from "@/lib/pricing";
import { formatDuration, formatMoney, formatTime, shortName } from "@/lib/format";

describe("quoteBooking", () => {
  const pkg = { priceCents: 15_000, groceryEstimateCents: 6_000 };

  it("adds the grocery estimate when the chef shops", () => {
    expect(quoteBooking(pkg, "chef")).toEqual({
      chefFeeCents: 15_000,
      groceryEstimateCents: 6_000,
      serviceFeeCents: 750,
      totalCents: 21_750,
    });
  });

  it("leaves groceries out when the customer provides them", () => {
    expect(quoteBooking(pkg, "customer")).toMatchObject({ groceryEstimateCents: 0, totalCents: 15_750 });
  });

  it("rounds the service fee to the nearest cent", () => {
    expect(quoteBooking({ priceCents: 12_345, groceryEstimateCents: 0 }, "chef").serviceFeeCents).toBe(617);
  });
});

describe("pricePerMealCents", () => {
  it("spreads the chef's fee across every portion", () => {
    expect(pricePerMealCents({ priceCents: 16_000, dishes: 4, portionsPerDish: 4 })).toBe(1_000);
  });
});

describe("formatting", () => {
  it("formats money without needless cents", () => {
    expect(formatMoney(16_500)).toBe("$165");
    expect(formatMoney(21_750)).toBe("$217.50");
  });

  it("formats times and durations", () => {
    expect(formatTime(0)).toBe("12:00 AM");
    expect(formatTime(540)).toBe("9:00 AM");
    expect(formatTime(780)).toBe("1:00 PM");
    expect(formatDuration(180)).toBe("3 hours");
    expect(formatDuration(150)).toBe("2.5 hours");
    expect(formatDuration(60)).toBe("1 hour");
  });

  it("shortens names for public reviews", () => {
    expect(shortName("Taylor Brooks")).toBe("Taylor B.");
    expect(shortName("Cher")).toBe("Cher");
  });
});
