"use client";

import { useState } from "react";
import { changeBookingStatus } from "@/actions/bookings";
import type { BookingAction, BookingStatus } from "@/lib/types";
import { Alert, buttonStyles, cx, type ButtonVariant } from "./ui";
import { useFormAction } from "./use-form-action";

const ACTIONS: Record<BookingAction, { label: string; pending: string; variant: ButtonVariant; confirm?: string }> = {
  accept: { label: "Accept request", pending: "Accepting…", variant: "primary" },
  decline: {
    label: "Decline",
    pending: "Declining…",
    variant: "secondary",
    confirm: "Decline this request? The time will open up for other customers.",
  },
  complete: { label: "Mark as completed", pending: "Saving…", variant: "primary" },
  cancel: {
    label: "Cancel booking",
    pending: "Cancelling…",
    variant: "danger",
    confirm: "Cancel this booking? This can't be undone.",
  },
};

export function BookingActions({
  bookingId,
  status,
  actions,
  align = "start",
  className,
}: {
  bookingId: number;
  status: BookingStatus;
  actions: BookingAction[];
  /** "end" right-aligns the buttons from the md breakpoint up. */
  align?: "start" | "end";
  className?: string;
}) {
  const { state, isPending, onSubmit } = useFormAction(changeBookingStatus);
  const [clicked, setClicked] = useState<BookingAction | null>(null);

  return (
    <form onSubmit={onSubmit} className={cx("space-y-3", className)}>
      <input type="hidden" name="bookingId" value={bookingId} />
      {actions.length > 0 && (
        <div className={cx("flex flex-wrap gap-2", align === "end" && "md:justify-end")}>
          {actions.map((action) => {
            const config = ACTIONS[action];
            const label = action === "cancel" && status === "pending" ? "Cancel request" : config.label;
            return (
              <button
                key={action}
                type="submit"
                name="action"
                value={action}
                disabled={isPending}
                onClick={(event) => {
                  if (config.confirm && !window.confirm(config.confirm)) {
                    event.preventDefault();
                    return;
                  }
                  setClicked(action);
                }}
                className={buttonStyles({ variant: config.variant, size: "sm" })}
              >
                {isPending && clicked === action ? config.pending : label}
              </button>
            );
          })}
        </div>
      )}
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
    </form>
  );
}
