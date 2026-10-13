import { Search, SlidersHorizontal, UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";
import { ChefCard } from "@/components/chef-card";
import { ButtonLink, buttonStyles, Container, EmptyState, PageHeader } from "@/components/ui";
import { listChefs, listCities } from "@/lib/chefs";
import { CUISINES, DIETARY_OPTIONS } from "@/lib/config";
import { getDb } from "@/lib/db";
import { bookingRange, parseChefFilters, PRICE_LIMITS } from "@/lib/filters";
import { pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Find a chef" };

export default async function ChefsPage({ searchParams }: PageProps<"/chefs">) {
  const filters = parseChefFilters(await searchParams);
  const db = getDb();
  const chefs = listChefs(db, filters);
  const cities = listCities(db);
  const range = bookingRange();
  const filtered = Object.keys(filters).some((key) => key !== "sort");

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        eyebrow="Find a chef"
        title="Personal chefs for your meal prep"
        description="Every chef cooks in your kitchen and leaves you with a fridge full of portioned meals. Filter by what matters to you."
      />

      <form method="get" className="mt-8 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="q" className="label">
              Search
            </label>
            <div className="relative">
              <Search
                size={16}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-400"
              />
              <input
                id="q"
                name="q"
                defaultValue={filters.q}
                placeholder="Chef name, cuisine or style"
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label htmlFor="city" className="label">
              City
            </label>
            <select id="city" name="city" defaultValue={filters.city ?? ""} className="input">
              <option value="">Any city</option>
              {cities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="label">
              Available on
            </label>
            <input
              id="date"
              name="date"
              type="date"
              min={range.first}
              max={range.last}
              defaultValue={filters.date}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="cuisine" className="label">
              Cuisine
            </label>
            <select id="cuisine" name="cuisine" defaultValue={filters.cuisine ?? ""} className="input">
              <option value="">Any cuisine</option>
              {CUISINES.map((cuisine) => (
                <option key={cuisine}>{cuisine}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dietary" className="label">
              Dietary need
            </label>
            <select id="dietary" name="dietary" defaultValue={filters.dietary ?? ""} className="input">
              <option value="">Any diet</option>
              {DIETARY_OPTIONS.map((diet) => (
                <option key={diet}>{diet}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="maxPrice" className="label">
              Session price
            </label>
            <select
              id="maxPrice"
              name="maxPrice"
              defaultValue={filters.maxPriceCents ? String(filters.maxPriceCents / 100) : ""}
              className="input"
            >
              <option value="">Any price</option>
              {PRICE_LIMITS.map((limit) => (
                <option key={limit} value={limit}>
                  Up to ${limit}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort" className="label">
              Sort by
            </label>
            <select id="sort" name="sort" defaultValue={filters.sort ?? "rating"} className="input">
              <option value="rating">Top rated</option>
              <option value="price">Lowest price</option>
              <option value="experience">Most experienced</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {filtered && (
            <ButtonLink href="/chefs" variant="ghost" size="sm">
              Clear filters
            </ButtonLink>
          )}
          <button type="submit" className={buttonStyles({ size: "sm" })}>
            <SlidersHorizontal size={16} aria-hidden />
            Apply filters
          </button>
        </div>
      </form>

      <p className="mt-8 text-sm text-stone-600" aria-live="polite">
        {pluralize(chefs.length, "chef")} {filtered ? "match your filters" : "available to book"}
      </p>

      {chefs.length > 0 ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {chefs.map((chef) => (
            <ChefCard key={chef.id} chef={chef} />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            icon={<UtensilsCrossed size={22} aria-hidden />}
            title="No chefs match those filters"
            description="Try a different date, or remove a filter to see more chefs."
            action={
              <ButtonLink href="/chefs" variant="secondary">
                Clear filters
              </ButtonLink>
            }
          />
        </div>
      )}
    </Container>
  );
}
