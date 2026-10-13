import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "./db";
import { createSession, deleteSession, getSessionUser } from "./sessions";
import type { Role, SessionUser } from "./types";

const SESSION_COOKIE = "prepchef_session";

function secureCookies(): boolean {
  return process.env.NODE_ENV === "production" && process.env.SESSION_COOKIE_SECURE !== "false";
}

/** The signed-in user for the current request, or null. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getSessionUser(getDb(), token) : null;
});

/** Where each kind of account lands after logging in. */
export function homePathFor(user: Pick<SessionUser, "role">): string {
  return user.role === "chef" ? "/chef/dashboard" : "/bookings";
}

/**
 * Returns the signed-in user. Visitors are sent to the login page (and back
 * to `returnTo` afterwards); users with the wrong role are sent to their home.
 */
export async function requireUser(options: { role?: Role; returnTo?: string } = {}): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(options.returnTo ?? "/")}`);
  if (options.role && user.role !== options.role) redirect(homePathFor(user));
  return user;
}

export async function startSession(userId: number): Promise<void> {
  const { token, expiresAt } = createSession(getDb(), userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(getDb(), token);
  store.delete(SESSION_COOKIE);
}
