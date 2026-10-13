import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  Leaf,
  MapPin,
  MessageSquare,
  ShoppingBasket,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BookingActions } from "@/components/booking-actions";
import { Stars } from "@/components/rating";
import { ReviewForm } from "@/components/review-form";
import { StatusBadge } from "@/components/status-badge";
import { Alert, Card, Container, cx } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { availableActions, getBooking, isExpired, isParticipant } from "@/lib/bookings";
import { getDb } from "@/lib/db";
import { parseId } from "@/lib/forms";
import { firstName, formatLongDate, formatMoney, formatTimeRange } from "@/lib/format";
import type { Booking, Role } from "@/lib/types";

export const metadata: Metadata = { title: "Booking details" };

export default async function BookingPage({ params, searchParams }: PageProps<"/bookings/[id]">) {
  const { id } = await params;
  const { requested } = await searchParams;
  const user = await requireUser({ returnTo: `/bookings/${id}` });
  const booking = getBooking(getDb(), parseId(id));
  if (!booking || !isParticipant(booking, user)) notFound();

  const viewer = user.role;
  const actions = availableActions(booking, user);
  const expired = isExpired(booking);
  const chefName = firstName(booking.chefName);

  return (
    <Container className="py-8 sm:py-10">
      <Link
        href={viewer === "chef" ? "/chef/dashboard" : "/bookings"}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden />
        {viewer === "chef" ? "Dashboard" : "My bookings"}
      </Link>

      {requested === "1" && booking.status === "pending" && (
        <div className="mt-5">
          <Alert tone="success">
            <strong className="font-semibold">Request sent!</strong> {chefName} will review it and confirm. You can
            follow its status here and in My bookings.
          </Alert>
        </div>
      )}

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={booking.status} expired={expired} viewer={viewer} />
            <span className="text-sm text-stone-500">Booking #{booking.id}</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">{booking.packageName}</h1>
          <p className="mt-1 text-stone-600">
            {viewer === "chef" ? (
              <>For {booking.customerName}</>
            ) : (
              <>
                With{" "}
                <Link href={`/chefs/${booking.chefId}`} className="font-medium text-basil-700 hover:underline">
                  {booking.chefName}
                </Link>
              </>
            )}
          </p>

          <Timeline booking={booking} expired={expired} viewer={viewer} />

          <dl className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Detail icon={CalendarDays} label="Date">
              {formatLongDate(booking.date)}
            </Detail>
            <Detail icon={Clock} label="Time">
              {formatTimeRange(booking.startMinute, booking.endMinute)}
            </Detail>
            <Detail icon={MapPin} label="Kitchen address">
              {booking.address}
            </Detail>
            <Detail icon={Utensils} label="What's cooking">
              {booking.dishes} dishes × {booking.portionsPerDish} portions ({booking.dishes * booking.portionsPerDish}{" "}
              meals)
            </Detail>
            <Detail icon={ShoppingBasket} label="Groceries">
              {booking.groceries === "chef"
                ? `${chefName} shops (estimated ${formatMoney(booking.groceryEstimateCents)})`
                : "Customer has groceries ready"}
            </Detail>
            <Detail icon={Leaf} label="Dietary needs">
              {booking.dietary.length > 0 ? booking.dietary.join(", ") : "None specified"}
            </Detail>
            <Detail icon={CircleAlert} label="Allergies">
              {booking.allergies || "None"}
            </Detail>
            <Detail icon={MessageSquare} label="Notes for the chef">
              {booking.notes || "None"}
            </Detail>
          </dl>
        </Card>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <h2 className="font-semibold">Price</h2>
            <div className="mt-4 space-y-2 text-sm text-stone-700">
              <PriceLine label="Chef's fee" cents={booking.chefFeeCents} />
              <PriceLine label="Groceries (estimate)" cents={booking.groceryEstimateCents} />
              <PriceLine label="Service fee" cents={booking.serviceFeeCents} />
              <div className="flex justify-between border-t border-stone-100 pt-3 text-base font-semibold text-ink">
                <span>Estimated total</span>
                <span>{formatMoney(booking.totalCents)}</span>
              </div>
            </div>
            {viewer === "chef" && (
              <p className="mt-4 rounded-xl bg-basil-50 px-4 py-3 text-sm text-basil-900">
                You earn <strong className="font-semibold">{formatMoney(booking.chefFeeCents)}</strong> for this
                session, plus groceries at cost.
              </p>
            )}
          </Card>

          {actions.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold">
                {viewer === "chef" && booking.status === "pending" ? "Respond to this request" : "Manage booking"}
              </h2>
              <BookingActions bookingId={booking.id} status={booking.status} actions={actions} className="mt-4" />
            </Card>
          )}

          {viewer === "customer" && booking.status === "completed" && (
            <Card className="p-6">
              {booking.review ? (
                <div>
                  <h2 className="font-semibold">Your review</h2>
                  <div className="mt-3">
                    <Stars value={booking.review.rating} />
                  </div>
                  {booking.review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-stone-700">{booking.review.comment}</p>
                  )}
                </div>
              ) : (
                <ReviewForm bookingId={booking.id} chefName={chefName} />
              )}
            </Card>
          )}
        </aside>
      </div>
    </Container>
  );
}

function Timeline({ booking, expired, viewer }: { booking: Booking; expired: boolean; viewer: Role }) {
  type Step = { label: string; state: "done" | "current" | "upcoming" | "stopped" };
  const steps: Step[] = [{ label: "Requested", state: "done" }];

  if (booking.status === "declined") {
    steps.push({ label: "Declined by chef", state: "stopped" });
  } else if (booking.status === "cancelled") {
    const by = booking.cancelledBy === viewer ? "you" : booking.cancelledBy === "chef" ? "chef" : "customer";
    steps.push({ label: `Cancelled by ${by}`, state: "stopped" });
  } else if (expired) {
    steps.push({ label: "Expired without a reply", state: "stopped" });
  } else {
    steps.push({ label: "Confirmed", state: booking.status === "pending" ? "current" : "done" });
    steps.push({
      label: "Cooked & packed",
      state: booking.status === "completed" ? "done" : booking.status === "confirmed" ? "current" : "upcoming",
    });
  }

  return (
    <ol className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center sm:flex-1 sm:last:flex-none">
          <span className="flex items-center gap-2">
            <span
              className={cx(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                step.state === "done" && "bg-basil-600 text-white",
                step.state === "current" && "bg-amber-100 text-amber-700 ring-2 ring-amber-300",
                step.state === "upcoming" && "bg-stone-100 text-stone-400",
                step.state === "stopped" && "bg-stone-200 text-stone-600",
              )}
            >
              {step.state === "done" && <Check size={15} aria-hidden />}
              {step.state === "stopped" && <X size={15} aria-hidden />}
              {(step.state === "current" || step.state === "upcoming") && (
                <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
              )}
            </span>
            <span
              className={cx(
                "text-sm font-medium whitespace-nowrap",
                step.state === "upcoming" ? "text-stone-400" : "text-stone-800",
              )}
            >
              {step.label}
            </span>
          </span>
          {index < steps.length - 1 && <span aria-hidden className="mx-3 hidden h-px flex-1 bg-stone-200 sm:block" />}
        </li>
      ))}
    </ol>
  );
}

function Detail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-basil-700" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</dt>
        <dd className="mt-0.5 text-sm break-words text-stone-800">{children}</dd>
      </div>
    </div>
  );
}

function PriceLine({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{formatMoney(cents)}</span>
    </div>
  );
}
