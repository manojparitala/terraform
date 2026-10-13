"use server";

import { redirect } from "next/navigation";
import { endSession, homePathFor, startSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { safeRedirectPath, textField, type FormState } from "@/lib/forms";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import type { Role } from "@/lib/types";
import { createUser, findUserByEmail, validateSignup } from "@/lib/users";

// Checked when the email is unknown, so a wrong email takes as long as a wrong password.
let dummyHash: Promise<string> | undefined;

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const email = textField(formData, "email");
  const password = String(formData.get("password") ?? "");
  const user = email ? findUserByEmail(getDb(), email) : undefined;
  dummyHash ??= hashPassword("not-a-real-password");
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !valid) return { error: "That email and password don't match an account." };

  await startSession(user.id);
  redirect(safeRedirectPath(formData.get("next"), homePathFor(user)));
}

export async function signup(_state: FormState, formData: FormData): Promise<FormState> {
  const name = textField(formData, "name");
  const email = textField(formData, "email");
  const password = String(formData.get("password") ?? "");
  const role: Role = formData.get("role") === "chef" ? "chef" : "customer";

  let userId: number;
  try {
    validateSignup({ name, email, password });
    userId = createUser(getDb(), { name, email, passwordHash: await hashPassword(password), role }).id;
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  await startSession(userId);
  redirect(role === "chef" ? "/chef/profile?welcome=1" : safeRedirectPath(formData.get("next"), "/chefs"));
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}
