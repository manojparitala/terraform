import type { DB } from "./db";
import { AppError } from "./errors";
import type { Role, SessionUser } from "./types";
import { requiredText } from "./validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export interface UserWithPassword extends SessionUser {
  passwordHash: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findUserByEmail(db: DB, email: string): UserWithPassword | undefined {
  return db
    .prepare("SELECT id, email, name, role, password_hash AS passwordHash FROM users WHERE email = ?")
    .get(normalizeEmail(email)) as UserWithPassword | undefined;
}

/** Checks sign-up details, throwing an AppError that describes the first problem. */
export function validateSignup(input: { name: string; email: string; password: string }): void {
  requiredText(input.name, "Your name", 80);
  if (!EMAIL_PATTERN.test(normalizeEmail(input.email))) {
    throw new AppError("Please enter a valid email address.");
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
  }
}

/** Creates a user. Chef accounts also get an empty chef profile to fill in. */
export function createUser(
  db: DB,
  input: { name: string; email: string; passwordHash: string; role: Role },
): SessionUser {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();

  return db.transaction(() => {
    if (findUserByEmail(db, email)) {
      throw new AppError("An account with this email already exists. Try logging in instead.");
    }
    const { lastInsertRowid } = db
      .prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)")
      .run(email, name, input.passwordHash, input.role);
    const id = Number(lastInsertRowid);
    if (input.role === "chef") db.prepare("INSERT INTO chefs (user_id) VALUES (?)").run(id);
    return { id, email, name, role: input.role };
  })();
}
