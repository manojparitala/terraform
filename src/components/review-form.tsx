"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { submitReview } from "@/actions/bookings";
import { Alert, buttonStyles } from "./ui";
import { useFormAction } from "./use-form-action";

const RATING_LABELS = ["", "Not great", "Okay", "Good", "Great", "Outstanding"];

export function ReviewForm({ bookingId, chefName }: { bookingId: number; chefName: string }) {
  const { state, isPending, onSubmit } = useFormAction(submitReview);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const shown = hovered || rating;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <fieldset>
        <legend className="font-semibold">How was your session with {chefName}?</legend>
        <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHovered(value)}
              className="rounded-md p-0.5 focus-visible:outline-2 focus-visible:outline-basil-600"
            >
              <Star
                size={28}
                aria-hidden
                className={value <= shown ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-stone-600">{RATING_LABELS[shown]}</span>
        </div>
      </fieldset>
      <div>
        <label htmlFor="comment" className="label">
          Tell others about the food <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <textarea id="comment" name="comment" rows={4} maxLength={1000} className="input" />
      </div>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <button type="submit" disabled={isPending || rating === 0} className={buttonStyles({ className: "w-full" })}>
        {isPending ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
