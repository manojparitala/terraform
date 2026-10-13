/** What a server action returns to the form that called it. */
export type FormState = { error?: string; success?: string } | undefined;

export function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** A numeric field, or NaN when it is missing or blank. */
export function numberField(formData: FormData, name: string): number {
  const value = textField(formData, name);
  return value === "" ? Number.NaN : Number(value);
}

export function listField(formData: FormData, name: string): string[] {
  return formData.getAll(name).filter((value): value is string => typeof value === "string");
}

/** Only same-site relative paths such as "/chefs/3/book" are allowed as redirect targets. */
export function safeRedirectPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

/** A route id such as the "12" in /chefs/12, or NaN if it isn't a positive integer. */
export function parseId(value: string): number {
  return /^[1-9]\d{0,9}$/.test(value) ? Number(value) : Number.NaN;
}

export function dollarsToCents(dollars: number): number {
  return Number.isFinite(dollars) ? Math.round(dollars * 100) : Number.NaN;
}
