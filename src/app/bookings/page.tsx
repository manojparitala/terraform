import { CalendarDays, Plus } from "lucide-react";
import type { Metadata } from "next";
import { BookingRow } from "@/components/booking-row";
import { ButtonLink, Container, EmptyState, PageHeader, SectionHeading } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listBookingsForCustomer, splitCustomerBookings } from "@/lib/bookings";
import { getDb } from "@/lib/db";
import { firstName } from "@/lib/format";

export const metadata: Metadata = { title: "My bookings" };

export default async function MyBookingsPage() {
  const user = await requireUser({ role: "customer", returnTo: "/bookings" });
  const { upcoming, past } = splitCustomerBookings(listBookingsForCustomer(getDb(), user.id));

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        eyebrow="My bookings"
        title={`Hi, ${firstName(user.name)}`}
        description="Your upcoming meal-prep sessions and everything you've booked before."
        actions={
          <ButtonLink href="/chefs">
            <Plus size={16} aria-hidden />
            Book a chef
          </ButtonLink>
        }
      />

      <section className="mt-10">
        <SectionHeading title="Upcoming" count={upcoming.length} />
        {upcoming.length > 0 ? (
          <ul className="space-y-3">
            {upcoming.map((booking) => (
              <li key={booking.id}>
                <BookingRow booking={booking} viewer="customer" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<CalendarDays size={22} aria-hidden />}
            title="No upcoming sessions"
            description="Find a chef you like and book your first week of meals."
            action={<ButtonLink href="/chefs">Find a chef</ButtonLink>}
          />
        )}
      </section>

      <section className="mt-12">
        <SectionHeading title="Past" count={past.length} />
        {past.length > 0 ? (
          <ul className="space-y-3">
            {past.map((booking) => (
              <li key={booking.id}>
                <BookingRow booking={booking} viewer="customer" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">Your completed and cancelled bookings will show up here.</p>
        )}
      </section>
    </Container>
  );
}
