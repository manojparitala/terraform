import {
  ArrowLeft,
  Award,
  CalendarDays,
  CircleCheck,
  Clock,
  MapPin,
  MessageSquareQuote,
  ShoppingBasket,
  Users,
  Utensils,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Cover } from "@/components/avatar";
import { RatingBadge, Stars } from "@/components/rating";
import { ButtonLink, Card, Container, EmptyState, Tag } from "@/components/ui";
import { getChefProfile } from "@/lib/chefs";
import { WEEKDAYS } from "@/lib/config";
import { getDb } from "@/lib/db";
import { parseId } from "@/lib/forms";
import {
  firstName,
  formatDuration,
  formatMoney,
  formatMonthYear,
  formatTimeRange,
  pluralize,
  shortName,
} from "@/lib/format";
import { pricePerMealCents } from "@/lib/pricing";
import type { MealPackage } from "@/lib/types";

const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

export async function generateMetadata({ params }: PageProps<"/chefs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const chef = getChefProfile(getDb(), parseId(id));
  return { title: chef ? `${chef.name}, personal chef in ${chef.city}` : "Chef not found" };
}

export default async function ChefPage({ params }: PageProps<"/chefs/[id]">) {
  const { id } = await params;
  const chef = getChefProfile(getDb(), parseId(id));
  if (!chef) notFound();

  const name = firstName(chef.name);
  const bookable = chef.packages.length > 0 && chef.availability.length > 0;

  return (
    <Container className="py-8 sm:py-10">
      <Link href="/chefs" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-ink">
        <ArrowLeft size={16} aria-hidden />
        All chefs
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-12">
          <Card className="overflow-hidden">
            <Cover seed={chef.id} className="h-32 sm:h-40" />
            <div className="px-6 pb-7 sm:px-8">
              <Avatar name={chef.name} seed={chef.id} size="xl" className="-mt-12 sm:-mt-14" />
              <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{chef.name}</h1>
                  <p className="mt-1 text-lg text-stone-600">{chef.headline}</p>
                </div>
                <RatingBadge rating={chef.rating} count={chef.reviewCount} className="mt-1" />
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600">
                {chef.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} aria-hidden />
                    {chef.city}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Award size={16} aria-hidden />
                  {pluralize(chef.yearsExperience, "year")} cooking professionally
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {chef.cuisines.map((cuisine) => (
                  <Tag key={cuisine}>{cuisine}</Tag>
                ))}
                {chef.dietary.map((diet) => (
                  <Tag key={diet} tone="green">
                    {diet}
                  </Tag>
                ))}
              </div>
            </div>
          </Card>

          {chef.bio && (
            <section>
              <h2 className="font-display text-2xl font-semibold">About {name}</h2>
              <div className="mt-3 max-w-prose space-y-3 leading-relaxed text-stone-700">
                {chef.bio.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          <section id="packages">
            <h2 className="font-display text-2xl font-semibold">Meal-prep packages</h2>
            <p className="mt-1 text-sm text-stone-600">
              Prices cover {name}&apos;s time. If {name} does the shopping, groceries are billed at cost.
            </p>
            {chef.packages.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {chef.packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} chefId={chef.id} bookable={bookable} />
                ))}
              </div>
            ) : (
              <p className="mt-5 text-stone-600">{name} hasn&apos;t published any packages yet.</p>
            )}
          </section>

          <section id="reviews">
            <h2 className="font-display text-2xl font-semibold">
              Reviews <span className="font-sans text-base font-normal text-stone-500">({chef.reviewCount})</span>
            </h2>
            {chef.reviews.length > 0 ? (
              <ul className="mt-5 space-y-4">
                {chef.reviews.map((review) => (
                  <li key={review.id}>
                    <Card className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar name={review.customerName} seed={review.bookingId} size="sm" />
                          <div>
                            <p className="text-sm font-semibold">{shortName(review.customerName)}</p>
                            <p className="text-xs text-stone-500">
                              {review.packageName} · {formatMonthYear(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Stars value={review.rating} />
                      </div>
                      {review.comment && <p className="mt-3 text-sm leading-relaxed text-stone-700">{review.comment}</p>}
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5">
                <EmptyState
                  icon={<MessageSquareQuote size={22} aria-hidden />}
                  title="No reviews yet"
                  description={`Be one of the first to try ${name}'s cooking.`}
                />
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <p className="text-sm text-stone-600">Sessions from</p>
            <p className="mt-1 font-display text-4xl font-semibold">
              {chef.startingPriceCents === null ? "—" : formatMoney(chef.startingPriceCents)}
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-stone-700">
              {["No payment to send a request", `${name} confirms before it's final`, "Cancel any time before your session"].map(
                (point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CircleCheck size={17} className="mt-px shrink-0 text-basil-600" aria-hidden />
                    {point}
                  </li>
                ),
              )}
            </ul>
            {bookable ? (
              <ButtonLink href={`/chefs/${chef.id}/book`} size="lg" className="mt-6 w-full">
                Book {name}
              </ButtonLink>
            ) : (
              <p className="mt-6 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
                {name} isn&apos;t taking bookings yet.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarDays size={18} className="text-basil-700" aria-hidden />
              Weekly hours
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              {MONDAY_FIRST.map((weekday) => {
                const window = chef.availability.find((w) => w.weekday === weekday);
                return (
                  <div key={weekday} className="flex justify-between gap-4">
                    <dt className="text-stone-600">{WEEKDAYS[weekday]}</dt>
                    <dd className={window ? "font-medium" : "text-stone-400"}>
                      {window ? formatTimeRange(window.startMinute, window.endMinute) : "Unavailable"}
                    </dd>
                  </div>
                );
              })}
            </dl>
            {chef.city && <p className="hint mt-4">Times are local to {chef.city}.</p>}
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function PackageCard({ pkg, chefId, bookable }: { pkg: MealPackage; chefId: number; bookable: boolean }) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold">{pkg.name}</h3>
        <p className="text-right">
          <span className="text-xl font-semibold">{formatMoney(pkg.priceCents)}</span>
          <span className="block text-xs text-stone-500">≈ {formatMoney(pricePerMealCents(pkg))} per meal</span>
        </p>
      </div>
      {pkg.description && <p className="mt-2 text-sm text-stone-600">{pkg.description}</p>}
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-stone-700">
        <li className="flex items-center gap-1.5">
          <Utensils size={15} className="shrink-0 text-stone-400" aria-hidden />
          {pluralize(pkg.dishes, "dish", "dishes")}
        </li>
        <li className="flex items-center gap-1.5">
          <Users size={15} className="shrink-0 text-stone-400" aria-hidden />
          {pkg.portionsPerDish} portions each
        </li>
        <li className="flex items-center gap-1.5">
          <Clock size={15} className="shrink-0 text-stone-400" aria-hidden />
          {formatDuration(pkg.durationMinutes)}
        </li>
        <li className="flex items-center gap-1.5">
          <ShoppingBasket size={15} className="shrink-0 text-stone-400" aria-hidden />
          Groceries ≈ {formatMoney(pkg.groceryEstimateCents)}
        </li>
      </ul>
      {bookable && (
        <div className="mt-auto pt-5">
          <ButtonLink href={`/chefs/${chefId}/book?package=${pkg.id}`} variant="secondary" className="w-full">
            Book this package
          </ButtonLink>
        </div>
      )}
    </Card>
  );
}
