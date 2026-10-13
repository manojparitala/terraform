import { AppError } from "./errors";

/** A required, trimmed string between 1 and `max` characters. */
export function requiredText(value: string, label: string, max: number): string {
  const text = value.trim();
  if (!text) throw new AppError(`${label} is required.`);
  if (text.length > max) throw new AppError(`${label} must be ${max} characters or fewer.`);
  return text;
}

/** An optional, trimmed string of at most `max` characters. */
export function optionalText(value: string, label: string, max: number): string {
  const text = value.trim();
  if (text.length > max) throw new AppError(`${label} must be ${max} characters or fewer.`);
  return text;
}

export function integerInRange(value: number, label: string, min: number, max: number): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AppError(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return value;
}

/** An amount in cents between $0 and `maxDollars`. */
export function centsInRange(cents: number, label: string, maxDollars: number): number {
  if (!Number.isInteger(cents) || cents < 0 || cents > maxDollars * 100) {
    throw new AppError(`${label} must be between $0 and $${maxDollars.toLocaleString("en-US")}.`);
  }
  return cents;
}

/** Keeps only values from `allowed`, without duplicates, in the order given. */
export function pickAllowed<T extends string>(values: string[], allowed: readonly T[]): T[] {
  const allowedSet = new Set<string>(allowed);
  return [...new Set(values)].filter((value): value is T => allowedSet.has(value));
}
