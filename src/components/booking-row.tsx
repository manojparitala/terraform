import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { isExpired } from "@/lib/bookings";
import { formatMoney, formatMonthShort, formatTimeRange, formatWeekdayShort } from "@/lib/format";
import type { Booking, Role } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { Tag } from "./ui";

export function DateTile({ date }: { date: string }) {
  return (
    <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-basil-50 py-2 text-basil-900 ring-1 ring-basil-600/10">
      <span className="text-[11px] font-semibold uppercase">{formatMonthShort(date)}</span>
      <span className="font-display text-2xl leading-none font-semibold">{Number(date.slice(8))}</span>
      <span className="mt-0.5 text-[11px] text-basil-700">{formatWeekdayShort(date)}</span>
    </div>
  );
}

/** A compact, clickable summary of one booking. */
export function BookingRow({ booking, viewer }: { booking: Booking; viewer: Role }) {
  const needsReview = viewer === "customer" && booking.status === "completed" && !booking.review;
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs transition hover:border-stone-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-basil-600 sm:p-5"
    >
      <DateTile date={booking.date} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-semibold">{booking.packageName}</p>
          {needsReview && <Tag tone="orange">Leave a review</Tag>}
        </div>
        <p className="mt-0.5 text-sm text-stone-600">
          {viewer === "chef" ? booking.customerName : `with ${booking.chefName}`}
          <span aria-hidden> · </span>
          <span className="whitespace-nowrap">{formatTimeRange(booking.startMinute, booking.endMinute)}</span>
        </p>
        <div className="mt-2 sm:hidden">
          <StatusBadge status={booking.status} expired={isExpired(booking)} viewer={viewer} />
        </div>
      </div>
      <p className="hidden text-right font-semibold sm:block">
        {formatMoney(viewer === "chef" ? booking.chefFeeCents : booking.totalCents)}
      </p>
      <div className="hidden w-32 justify-end sm:flex">
        <StatusBadge status={booking.status} expired={isExpired(booking)} viewer={viewer} />
      </div>
      <ChevronRight size={18} aria-hidden className="shrink-0 text-stone-400 transition group-hover:translate-x-0.5" />
    </Link>
  );
}
