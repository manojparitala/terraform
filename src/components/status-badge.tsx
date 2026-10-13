import type { BookingStatus, Role } from "@/lib/types";
import { cx } from "./ui";

const STYLES: Record<BookingStatus | "expired", string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-600/25",
  confirmed: "bg-basil-50 text-basil-800 ring-basil-600/25",
  completed: "bg-sky-50 text-sky-800 ring-sky-600/25",
  declined: "bg-stone-100 text-stone-600 ring-stone-500/20",
  cancelled: "bg-stone-100 text-stone-600 ring-stone-500/20",
  expired: "bg-stone-100 text-stone-600 ring-stone-500/20",
};

const LABELS: Record<BookingStatus | "expired", string> = {
  pending: "Awaiting chef",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function StatusBadge({
  status,
  expired = false,
  viewer = "customer",
}: {
  status: BookingStatus;
  expired?: boolean;
  viewer?: Role;
}) {
  const key = expired ? "expired" : status;
  const label = key === "pending" && viewer === "chef" ? "New request" : LABELS[key];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        STYLES[key],
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
