import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  CookingPot,
  Leaf,
  Refrigerator,
  Salad,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Soup,
  Sparkles,
  Wallet,
  Wheat,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { ChefCard } from "@/components/chef-card";
import { ButtonLink, buttonStyles, Card, Container } from "@/components/ui";
import { listChefs, listCities } from "@/lib/chefs";
import { DIETARY_OPTIONS } from "@/lib/config";
import { getDb } from "@/lib/db";

export default function HomePage() {
  const db = getDb();
  const featured = listChefs(db).slice(0, 3);
  const cities = listCities(db);

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[36rem] bg-[radial-gradient(ellipse_at_top,var(--color-basil-100),transparent_65%)]"
        />
        <Container className="grid items-center gap-14 pt-12 pb-20 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20 lg:pb-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-basil-800 shadow-xs ring-1 ring-basil-600/15">
              <Sparkles size={15} aria-hidden />
              All of the meal prep, none of the prep
            </p>
            <h1 className="mt-6 font-display text-[2.6rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              A week of <span className="whitespace-nowrap">home-cooked</span> meals,{" "}
              <span className="text-basil-700">made in your kitchen.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-stone-600">
              Book a local personal chef to shop, cook and portion your meals for the week. Tailored to your diet,
              packed into your fridge, and your kitchen left spotless.
            </p>

            <form
              action="/chefs"
              className="mt-8 grid gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-200 sm:grid-cols-[1fr_1fr_auto]"
            >
              <label className="sr-only" htmlFor="hero-city">
                City
              </label>
              <select id="hero-city" name="city" className="input border-transparent shadow-none" defaultValue="">
                <option value="">Any city</option>
                {cities.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="hero-diet">
                Dietary need
              </label>
              <select id="hero-diet" name="dietary" className="input border-transparent shadow-none" defaultValue="">
                <option value="">Any diet</option>
                {DIETARY_OPTIONS.map((diet) => (
                  <option key={diet}>{diet}</option>
                ))}
              </select>
              <button type="submit" className={buttonStyles({ className: "h-auto py-2.5" })}>
                <Search size={16} aria-hidden />
                Find a chef
              </button>
            </form>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-600">
              {["Real availability, booked in minutes", "Groceries handled or BYO", "Cancel before your session"].map(
                (point) => (
                  <li key={point} className="flex items-center gap-1.5">
                    <CircleCheck size={16} className="text-basil-600" aria-hidden />
                    {point}
                  </li>
                ),
              )}
            </ul>
          </div>

          <HeroPreview />
        </Container>
      </section>

      <section id="how-it-works" className="border-y border-stone-200/70 bg-white/60 py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-basil-700">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              From an empty fridge to a full week in one afternoon
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative rounded-2xl bg-cream p-6 ring-1 ring-stone-200/70">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-basil-700 text-white">
                    <step.icon size={22} aria-hidden />
                  </span>
                  <span className="font-display text-4xl font-semibold text-stone-200">{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {featured.length > 0 && (
        <section className="py-20">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-basil-700">Top-rated chefs</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Loved by their regulars
                </h2>
              </div>
              <ButtonLink href="/chefs" variant="secondary">
                See all chefs
                <ArrowRight size={16} aria-hidden />
              </ButtonLink>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((chef) => (
                <ChefCard key={chef.id} chef={chef} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="pb-20">
        <Container>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title}>
                <benefit.icon size={24} className="text-basil-700" aria-hidden />
                <h3 className="mt-4 font-semibold">{benefit.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{benefit.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-basil-800 px-6 py-14 text-white sm:px-12">
            <CookingPot
              aria-hidden
              strokeWidth={1.25}
              className="absolute right-6 -bottom-8 hidden h-56 w-56 rotate-[-8deg] text-white/10 md:block"
            />
            <div className="relative max-w-xl">
              <p className="text-sm font-semibold text-basil-200">For chefs</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Fill your week with regular meal-prep clients
              </h2>
              <p className="mt-4 text-basil-100">
                Set your own menu, prices and hours. We bring the bookings; you bring the knife skills.
              </p>
              <ButtonLink href="/signup?role=chef" variant="light" size="lg" className="mt-8">
                Join as a chef
                <ArrowRight size={18} aria-hidden />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

const STEPS = [
  {
    icon: Search,
    title: "Find your chef",
    body: "Browse local chefs by cuisine, diet and price. Every profile shows real menus, reviews and open times.",
  },
  {
    icon: CalendarDays,
    title: "Pick a package and a time",
    body: "Choose how many dishes and portions you need, then request an open slot. Add allergies and preferences.",
  },
  {
    icon: Refrigerator,
    title: "Open a full fridge",
    body: "Your chef shops, cooks, portions and labels everything, then leaves your kitchen spotless.",
  },
];

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Reviews from real sessions",
    body: "Only customers who've had a completed session can leave a review.",
  },
  {
    icon: Leaf,
    title: "Your diet, your rules",
    body: "Vegan, keto, halal, gluten-free or allergy-aware. Your needs travel with every booking.",
  },
  {
    icon: ShoppingBasket,
    title: "Groceries handled",
    body: "Let your chef shop and bill at cost, or have the ingredients ready yourself.",
  },
  {
    icon: Wallet,
    title: "Clear, upfront pricing",
    body: "See the chef's fee, grocery estimate and service fee before you send a request.",
  },
];

const PREVIEW_DISHES = [
  { icon: Salad, name: "Chipotle chicken burrito bowls" },
  { icon: Soup, name: "Black bean & sweet potato enchiladas" },
  { icon: Wheat, name: "Citrus shrimp with cilantro-lime rice" },
  { icon: Leaf, name: "Turkey picadillo lettuce cups" },
];

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-linear-to-br from-basil-200/70 via-orange-100 to-amber-100 blur-2xl" />
      <Card className="rotate-1 p-6 shadow-xl shadow-stone-900/5">
        <div className="flex items-center gap-3">
          <Avatar name="Maria Alvarez" seed={1} />
          <div>
            <p className="text-xs text-stone-500">This week&apos;s prep by</p>
            <p className="font-semibold">Chef Maria</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-basil-50 px-2.5 py-1 text-xs font-semibold text-basil-800 ring-1 ring-basil-600/25 ring-inset">
            <CircleCheck size={14} />
            Confirmed
          </span>
        </div>
        <ul className="mt-5 divide-y divide-stone-100">
          {PREVIEW_DISHES.map((dish) => (
            <li key={dish.name} className="flex items-center gap-3 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
                <dish.icon size={18} />
              </span>
              <span className="flex-1 text-sm font-medium">{dish.name}</span>
              <span className="text-xs font-medium text-stone-500">× 4</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-stone-600">
            <CalendarDays size={16} />
            Sunday · 10:00 AM
          </span>
          <span className="font-semibold">16 meals ready</span>
        </div>
      </Card>
      <div className="absolute -bottom-5 -left-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-lg ring-1 ring-stone-200 sm:-left-6">
        <Refrigerator size={16} className="text-basil-700" />
        Packed, labeled &amp; in your fridge
      </div>
    </div>
  );
}
