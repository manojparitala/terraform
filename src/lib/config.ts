export const APP_NAME = "PrepChef";

/** Platform fee added to each booking, as a share of the chef's fee. */
export const SERVICE_FEE_RATE = 0.05;

/** Customers can book from MIN_LEAD_DAYS after today up to BOOKING_WINDOW_DAYS ahead. */
export const MIN_LEAD_DAYS = 1;
export const BOOKING_WINDOW_DAYS = 28;

/** Start times are offered on this grid inside a chef's working hours. */
export const SLOT_INTERVAL_MINUTES = 30;

/** Minimum gap a chef keeps between two sessions, for travel and cleanup. */
export const BUFFER_MINUTES = 60;

export const CUISINES = [
  "American",
  "Caribbean",
  "Chinese",
  "French",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Latin American",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Southern",
  "Thai",
  "Vietnamese",
  "West African",
] as const;

export const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-free",
  "Dairy-free",
  "Nut-free",
  "Keto",
  "Paleo",
  "Low-carb",
  "High-protein",
  "Halal",
  "Kosher",
] as const;

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
