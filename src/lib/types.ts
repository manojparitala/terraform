export type Role = "customer" | "chef";

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";

export type BookingAction = "accept" | "decline" | "cancel" | "complete";

/** Who buys the ingredients: the chef (billed at cost) or the customer. */
export type GroceryOption = "chef" | "customer";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AvailabilityWindow {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** Minutes after midnight, in the chef's local time. */
  startMinute: number;
  endMinute: number;
}

export interface MealPackage {
  id: number;
  chefId: number;
  name: string;
  description: string;
  dishes: number;
  portionsPerDish: number;
  durationMinutes: number;
  priceCents: number;
  groceryEstimateCents: number;
  active: boolean;
}

export interface ChefSummary {
  id: number;
  userId: number;
  name: string;
  headline: string;
  city: string;
  yearsExperience: number;
  cuisines: string[];
  dietary: string[];
  rating: number | null;
  reviewCount: number;
  startingPriceCents: number | null;
}

export interface Review {
  id: number;
  bookingId: number;
  rating: number;
  comment: string;
  customerName: string;
  packageName: string;
  createdAt: string;
}

export interface ChefProfile extends ChefSummary {
  bio: string;
  packages: MealPackage[];
  availability: AvailabilityWindow[];
  reviews: Review[];
}

export interface Booking {
  id: number;
  status: BookingStatus;
  cancelledBy: Role | null;
  customerId: number;
  customerName: string;
  chefId: number;
  chefUserId: number;
  chefName: string;
  packageId: number;
  packageName: string;
  dishes: number;
  portionsPerDish: number;
  /** "YYYY-MM-DD" in the chef's local time. */
  date: string;
  startMinute: number;
  endMinute: number;
  address: string;
  groceries: GroceryOption;
  dietary: string[];
  allergies: string;
  notes: string;
  chefFeeCents: number;
  groceryEstimateCents: number;
  serviceFeeCents: number;
  totalCents: number;
  createdAt: string;
  review: { rating: number; comment: string } | null;
}
