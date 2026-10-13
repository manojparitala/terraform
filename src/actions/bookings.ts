"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createBooking, createReview, updateBookingStatus } from "@/lib/bookings";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { listField, numberField, textField, type FormState } from "@/lib/forms";
import type { BookingStatus } from "@/lib/types";

export async function requestBooking(_state: FormState, formData: FormData): Promise<FormState> {
  const chefId = numberField(formData, "chefId");
  const user = await requireUser({ returnTo: `/chefs/${chefId}/book` });
  if (user.role !== "customer") {
    return { error: "Chef accounts can't book sessions. Log in with a customer account to book a chef." };
  }

  let bookingId: number;
  try {
    bookingId = createBooking(getDb(), {
      customerId: user.id,
      chefId,
      packageId: numberField(formData, "packageId"),
      date: textField(formData, "date"),
      startMinute: numberField(formData, "startMinute"),
      address: textField(formData, "address"),
      groceries: textField(formData, "groceries") === "customer" ? "customer" : "chef",
      dietary: listField(formData, "dietary"),
      allergies: textField(formData, "allergies"),
      notes: textField(formData, "notes"),
    });
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(`/bookings/${bookingId}?requested=1`);
}

const STATUS_MESSAGES: Record<BookingStatus, string> = {
  pending: "Request updated.",
  confirmed: "Booking accepted. It's now on your schedule.",
  declined: "Request declined.",
  cancelled: "Booking cancelled.",
  completed: "Session marked as completed. Nice work!",
};

export async function changeBookingStatus(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    const status = updateBookingStatus(
      getDb(),
      numberField(formData, "bookingId"),
      textField(formData, "action"),
      user,
    );
    revalidatePath("/", "layout");
    return { success: STATUS_MESSAGES[status] };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
}

export async function submitReview(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser({ role: "customer" });
  try {
    createReview(getDb(), {
      bookingId: numberField(formData, "bookingId"),
      customerId: user.id,
      rating: numberField(formData, "rating"),
      comment: textField(formData, "comment"),
    });
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  return { success: "Thanks for your review!" };
}
