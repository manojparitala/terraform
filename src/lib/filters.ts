import type { ChefFilters } from "./chefs";
import { CUISINES, DIETARY_OPTIONS } from "./config";
import { bookableDates, isIsoDate } from "./dates";

type SearchParams = Record<string, string | string[] | undefined>;

export const PRICE_LIMITS = [125, 150, 200, 250] as const;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Turns /chefs query parameters into filters, ignoring anything unexpected. */
export function parseChefFilters(params: SearchParams, now = new Date()): ChefFilters {
  const filters: ChefFilters = {};

  const q = first(params.q).slice(0, 80);
  if (q) filters.q = q;

  const city = first(params.city).slice(0, 60);
  if (city) filters.city = city;

  const cuisine = first(params.cuisine);
  if ((CUISINES as readonly string[]).includes(cuisine)) filters.cuisine = cuisine;

  const dietary = first(params.dietary);
  if ((DIETARY_OPTIONS as readonly string[]).includes(dietary)) filters.dietary = dietary;

  const maxPrice = Number(first(params.maxPrice));
  if (Number.isInteger(maxPrice) && maxPrice > 0) filters.maxPriceCents = maxPrice * 100;

  const date = first(params.date);
  if (isIsoDate(date) && bookableDates(now).includes(date)) filters.date = date;

  const sort = first(params.sort);
  if (sort === "price" || sort === "experience") filters.sort = sort;

  return filters;
}

/** First and last bookable dates, for date inputs. */
export function bookingRange(now = new Date()): { first: string; last: string } {
  const dates = bookableDates(now);
  return { first: dates[0], last: dates[dates.length - 1] };
}
