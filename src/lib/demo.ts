/** Logins created by the demo seed data. Shown on the login page while demo data is enabled. */
export const DEMO_PASSWORD = "password123";

export const DEMO_ACCOUNTS = [
  { label: "Customer", name: "Jordan Lee", email: "demo@prepchef.test" },
  { label: "Chef", name: "Maria Alvarez", email: "maria@prepchef.test" },
] as const;

export function demoDataEnabled(): boolean {
  return process.env.SEED_DEMO_DATA !== "false";
}
