import { SERVICE_FEE_RATE } from "./config";
import type { GroceryOption } from "./types";

export interface Quote {
  chefFeeCents: number;
  groceryEstimateCents: number;
  serviceFeeCents: number;
  totalCents: number;
}

/** What a customer pays for a package. Groceries are only added when the chef shops. */
export function quoteBooking(
  pkg: { priceCents: number; groceryEstimateCents: number },
  groceries: GroceryOption,
  serviceFeeRate = SERVICE_FEE_RATE,
): Quote {
  const chefFeeCents = pkg.priceCents;
  const groceryEstimateCents = groceries === "chef" ? pkg.groceryEstimateCents : 0;
  const serviceFeeCents = Math.round(chefFeeCents * serviceFeeRate);
  return {
    chefFeeCents,
    groceryEstimateCents,
    serviceFeeCents,
    totalCents: chefFeeCents + groceryEstimateCents + serviceFeeCents,
  };
}

/** The chef's fee divided across every portion the package produces. */
export function pricePerMealCents(pkg: {
  priceCents: number;
  dishes: number;
  portionsPerDish: number;
}): number {
  return Math.round(pkg.priceCents / (pkg.dishes * pkg.portionsPerDish));
}
