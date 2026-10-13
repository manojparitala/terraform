import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { BookingForm } from "@/components/booking-form";
import { ButtonLink, Card, Container } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getChefCalendar, getChefProfile } from "@/lib/chefs";
import { DIETARY_OPTIONS } from "@/lib/config";
import { getDb } from "@/lib/db";
import { parseId } from "@/lib/forms";
import { firstName } from "@/lib/format";

export const metadata: Metadata = { title: "Book a session" };

export default async function BookPage({ params, searchParams }: PageProps<"/chefs/[id]/book">) {
  const { id } = await params;
  const query = await searchParams;
  const packageParam = typeof query.package === "string" ? query.package : "";
  const user = await requireUser({
    returnTo: `/chefs/${id}/book${packageParam ? `?package=${encodeURIComponent(packageParam)}` : ""}`,
  });

  const db = getDb();
  const chef = getChefProfile(db, parseId(id));
  if (!chef) notFound();
  const name = firstName(chef.name);

  if (user.role !== "customer" || chef.packages.length === 0 || chef.availability.length === 0) {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-semibold">
            {user.role !== "customer" ? "Booking is for customer accounts" : `${name} isn't taking bookings yet`}
          </h1>
          <p className="mt-2 text-stone-600">
            {user.role !== "customer"
              ? "You're logged in as a chef. Log out and use a customer account to book a session."
              : "Check back soon, or browse other chefs who are available now."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink href={`/chefs/${chef.id}`} variant="secondary">
              Back to {name}&apos;s profile
            </ButtonLink>
            <ButtonLink href="/chefs">Browse chefs</ButtonLink>
          </div>
        </Card>
      </Container>
    );
  }

  const initialPackageId = chef.packages.find((pkg) => String(pkg.id) === packageParam)?.id ?? chef.packages[0].id;

  return (
    <Container className="py-8 sm:py-10">
      <Link
        href={`/chefs/${chef.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden />
        {name}&apos;s profile
      </Link>
      <div className="mt-5 flex items-center gap-4">
        <Avatar name={chef.name} seed={chef.id} size="lg" />
        <div>
          <p className="text-sm text-stone-500">Request a session with</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{chef.name}</h1>
        </div>
      </div>
      <BookingForm
        chef={{ id: chef.id, name: chef.name, city: chef.city }}
        packages={chef.packages}
        calendar={getChefCalendar(db, chef.id, chef.packages)}
        initialPackageId={initialPackageId}
        dietaryOptions={DIETARY_OPTIONS}
      />
    </Container>
  );
}
