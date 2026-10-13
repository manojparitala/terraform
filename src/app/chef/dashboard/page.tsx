import {
  CalendarCheck,
  Circle,
  CircleCheck,
  Inbox,
  Star,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BookingActions } from "@/components/booking-actions";
import { BookingRow, DateTile } from "@/components/booking-row";
import { StatusBadge } from "@/components/status-badge";
import { ButtonLink, Card, Container, EmptyState, PageHeader, SectionHeading } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { availableActions, chefDashboard, listBookingsForChef } from "@/lib/bookings";
import { getChefByUserId, getChefProfile } from "@/lib/chefs";
import { getDb } from "@/lib/db";
import { firstName, formatMoney, formatTimeRange, pluralize } from "@/lib/format";
import type { Booking, SessionUser } from "@/lib/types";

export const metadata: Metadata = { title: "Chef dashboard" };

export default async function ChefDashboardPage() {
  const user = await requireUser({ role: "chef", returnTo: "/chef/dashboard" });
  const db = getDb();
  const account = getChefByUserId(db, user.id);
  const chef = account && getChefProfile(db, account.id);
  if (!account || !chef) notFound();

  const { requests, upcoming, toComplete, history, earnedThisMonthCents } = chefDashboard(
    listBookingsForChef(db, chef.id),
  );
  const setup = [
    {
      done: Boolean(account.headline && account.city && account.cuisines.length),
      label: "Add your headline, city and cuisines",
      href: "/chef/profile#profile",
    },
    { done: chef.availability.length > 0, label: "Set your weekly hours", href: "/chef/profile#hours" },
    { done: chef.packages.length > 0, label: "Add at least one meal-prep package", href: "/chef/profile#packages" },
  ];
  const listed = chef.availability.length > 0 && chef.packages.length > 0;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        eyebrow="Chef dashboard"
        title={`Welcome back, ${firstName(user.name)}`}
        description={
          listed
            ? "New requests, upcoming sessions and how your month is going."
            : "Finish setting up your profile to start receiving booking requests."
        }
        actions={
          <>
            <ButtonLink href={`/chefs/${chef.id}`} variant="secondary">
              View public profile
            </ButtonLink>
            <ButtonLink href="/chef/profile">Edit profile &amp; menu</ButtonLink>
          </>
        }
      />

      {!setup.every((step) => step.done) && (
        <Card className="mt-8 border-amber-200 bg-amber-50/70 p-6">
          <h2 className="font-semibold">Finish setting up to get bookings</h2>
          <p className="mt-1 text-sm text-stone-700">
            Customers can find and book you once you have weekly hours and at least one package.
          </p>
          <ul className="mt-4 space-y-2">
            {setup.map((step) => (
              <li key={step.label}>
                <Link href={step.href} className="inline-flex items-center gap-2 text-sm hover:underline">
                  {step.done ? (
                    <CircleCheck size={18} className="text-basil-600" aria-hidden />
                  ) : (
                    <Circle size={18} className="text-stone-400" aria-hidden />
                  )}
                  <span className={step.done ? "text-stone-500 line-through" : "font-medium"}>{step.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Inbox} label="New requests" value={String(requests.length)} />
        <Stat icon={CalendarCheck} label="Upcoming sessions" value={String(upcoming.length)} />
        <Stat icon={Wallet} label="Earned this month" value={formatMoney(earnedThisMonthCents)} />
        <Stat
          icon={Star}
          label="Rating"
          value={chef.rating === null ? "New" : chef.rating.toFixed(1)}
          detail={pluralize(chef.reviewCount, "review")}
        />
      </div>

      <section className="mt-12">
        <SectionHeading title="New requests" count={requests.length} />
        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((booking) => (
              <SessionCard key={booking.id} booking={booking} user={user} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Inbox size={22} aria-hidden />}
            title="No new requests"
            description="When a customer requests a session, it shows up here for you to accept or decline."
          />
        )}
      </section>

      {toComplete.length > 0 && (
        <section className="mt-12">
          <SectionHeading title="Ready to mark as completed" count={toComplete.length} />
          <div className="space-y-4">
            {toComplete.map((booking) => (
              <SessionCard key={booking.id} booking={booking} user={user} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <SectionHeading title="Upcoming sessions" count={upcoming.length} />
        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map((booking) => (
              <SessionCard key={booking.id} booking={booking} user={user} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarCheck size={22} aria-hidden />}
            title="Nothing scheduled yet"
            description="Accepted requests become upcoming sessions."
          />
        )}
      </section>

      <section className="mt-12">
        <SectionHeading title="History" count={history.length} />
        {history.length > 0 ? (
          <ul className="space-y-3">
            {history.map((booking) => (
              <li key={booking.id}>
                <BookingRow booking={booking} viewer="chef" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">Completed, declined and cancelled sessions will show up here.</p>
        )}
      </section>
    </Container>
  );
}

function Stat({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-600">{label}</p>
        <Icon size={18} className="text-basil-700" aria-hidden />
      </div>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {detail && <p className="text-xs text-stone-500">{detail}</p>}
    </Card>
  );
}

function SessionCard({ booking, user }: { booking: Booking; user: SessionUser }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <DateTile date={booking.date} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/bookings/${booking.id}`} className="font-semibold hover:underline">
              {booking.packageName}
            </Link>
            <StatusBadge status={booking.status} viewer="chef" />
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {booking.customerName} · {formatTimeRange(booking.startMinute, booking.endMinute)} ·{" "}
            {booking.dishes * booking.portionsPerDish} meals
          </p>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <SessionDetail label="Address">{booking.address}</SessionDetail>
            <SessionDetail label="Groceries">
              {booking.groceries === "chef"
                ? `You shop (≈ ${formatMoney(booking.groceryEstimateCents)})`
                : "Customer provides"}
            </SessionDetail>
            {booking.dietary.length > 0 && <SessionDetail label="Diet">{booking.dietary.join(", ")}</SessionDetail>}
            {booking.allergies && (
              <SessionDetail label="Allergies">
                <span className="font-medium text-red-700">{booking.allergies}</span>
              </SessionDetail>
            )}
          </dl>
          {booking.notes && (
            <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm text-stone-700">&ldquo;{booking.notes}&rdquo;</p>
          )}
        </div>
        <div className="flex flex-col gap-3 md:w-56 md:items-end">
          <p className="md:text-right">
            <span className="block text-xs text-stone-500">You earn</span>
            <span className="text-lg font-semibold">{formatMoney(booking.chefFeeCents)}</span>
          </p>
          <BookingActions
            bookingId={booking.id}
            status={booking.status}
            actions={availableActions(booking, user)}
            align="end"
            className="md:text-right"
          />
        </div>
      </div>
    </Card>
  );
}

function SessionDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-stone-500">{label}</dt>
      <dd className="min-w-0 text-stone-800">{children}</dd>
    </div>
  );
}
