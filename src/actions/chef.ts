"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  archivePackage as archiveChefPackage,
  getChefByUserId,
  replaceAvailability,
  savePackage as saveChefPackage,
  updateChefProfile,
} from "@/lib/chefs";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { dollarsToCents, listField, numberField, textField, type FormState } from "@/lib/forms";
import type { AvailabilityWindow } from "@/lib/types";

async function currentChefId(): Promise<number> {
  const user = await requireUser({ role: "chef", returnTo: "/chef/profile" });
  const chef = getChefByUserId(getDb(), user.id);
  if (!chef) throw new Error(`Chef account ${user.id} has no chef profile`);
  return chef.id;
}

/** Runs a change, refreshes every page that shows chef data, and reports the outcome. */
function applyChange(change: () => void, success: string): FormState {
  try {
    change();
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  return { success };
}

export async function saveChefProfile(_state: FormState, formData: FormData): Promise<FormState> {
  const chefId = await currentChefId();
  return applyChange(
    () =>
      updateChefProfile(getDb(), chefId, {
        name: textField(formData, "name"),
        headline: textField(formData, "headline"),
        bio: textField(formData, "bio"),
        city: textField(formData, "city"),
        yearsExperience: numberField(formData, "yearsExperience"),
        cuisines: listField(formData, "cuisines"),
        dietary: listField(formData, "dietary"),
      }),
    "Profile saved.",
  );
}

export async function saveAvailability(_state: FormState, formData: FormData): Promise<FormState> {
  const chefId = await currentChefId();
  const windows: AvailabilityWindow[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    if (!formData.get(`day-${weekday}`)) continue;
    windows.push({
      weekday,
      startMinute: numberField(formData, `start-${weekday}`),
      endMinute: numberField(formData, `end-${weekday}`),
    });
  }
  return applyChange(() => replaceAvailability(getDb(), chefId, windows), "Weekly hours saved.");
}

export async function savePackage(_state: FormState, formData: FormData): Promise<FormState> {
  const chefId = await currentChefId();
  const packageId = numberField(formData, "packageId");
  return applyChange(
    () =>
      saveChefPackage(
        getDb(),
        chefId,
        {
          name: textField(formData, "name"),
          description: textField(formData, "description"),
          dishes: numberField(formData, "dishes"),
          portionsPerDish: numberField(formData, "portionsPerDish"),
          durationMinutes: numberField(formData, "durationMinutes"),
          priceCents: dollarsToCents(numberField(formData, "price")),
          groceryEstimateCents: dollarsToCents(numberField(formData, "groceryEstimate")),
        },
        Number.isNaN(packageId) ? undefined : packageId,
      ),
    Number.isNaN(packageId) ? "Package added." : "Package updated.",
  );
}

export async function archivePackage(_state: FormState, formData: FormData): Promise<FormState> {
  const chefId = await currentChefId();
  return applyChange(
    () => archiveChefPackage(getDb(), chefId, numberField(formData, "packageId")),
    "Package removed from your menu.",
  );
}
