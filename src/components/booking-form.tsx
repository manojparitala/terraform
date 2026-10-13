"use client";

import { CalendarDays, Clock, Utensils, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { requestBooking } from "@/actions/bookings";
import type { DayAvailability } from "@/lib/availability";
import { addDays, weekdayOf } from "@/lib/dates";
import {
  firstName,
  formatDuration,
  formatLongDate,
  formatMoney,
  formatMonthShort,
  formatShortDate,
  formatTime,
  pluralize,
} from "@/lib/format";
import { quoteBooking } from "@/lib/pricing";
import type { GroceryOption, MealPackage } from "@/lib/types";
import { Alert, buttonStyles, Card, cx } from "./ui";
import { useFormAction } from "./use-form-action";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function firstOpenDate(days: DayAvailability[] | undefined): string {
  return days?.find((day) => day.startTimes.length > 0)?.date ?? "";
}

export function BookingForm({
  chef,
  packages,
  calendar,
  initialPackageId,
  dietaryOptions,
}: {
  chef: { id: number; name: string; city: string };
  packages: MealPackage[];
  /** Open start times per date, keyed by package id. */
  calendar: Record<number, DayAvailability[]>;
  initialPackageId: number;
  dietaryOptions: readonly string[];
}) {
  const { state, isPending, onSubmit } = useFormAction(requestBooking);
  const [packageId, setPackageId] = useState(initialPackageId);
  const [date, setDate] = useState(() => firstOpenDate(calendar[initialPackageId]));
  const [startMinute, setStartMinute] = useState<number | null>(null);
  const [groceries, setGroceries] = useState<GroceryOption>("chef");
  const [dietary, setDietary] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");

  const pkg = packages.find((p) => p.id === packageId) ?? packages[0];
  const days = calendar[pkg.id] ?? [];
  const times = days.find((day) => day.date === date)?.startTimes ?? [];
  const hasOpenings = days.some((day) => day.startTimes.length > 0);
  const quote = quoteBooking(pkg, groceries);
  const chefName = firstName(chef.name);
  const ready = date !== "" && startMinute !== null && address.trim() !== "";

  function choosePackage(id: number) {
    setPackageId(id);
    const nextDays = calendar[id] ?? [];
    const nextTimes = nextDays.find((day) => day.date === date)?.startTimes ?? [];
    if (nextTimes.length === 0) {
      setDate(firstOpenDate(nextDays));
      setStartMinute(null);
    } else if (startMinute !== null && !nextTimes.includes(startMinute)) {
      setStartMinute(null);
    }
  }

  function chooseDate(next: string) {
    setDate(next);
    const nextTimes = days.find((day) => day.date === next)?.startTimes ?? [];
    if (startMinute !== null && !nextTimes.includes(startMinute)) setStartMinute(null);
  }

  function toggleDiet(diet: string) {
    setDietary((current) => (current.includes(diet) ? current.filter((d) => d !== diet) : [...current, diet]));
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <input type="hidden" name="chefId" value={chef.id} />
      <input type="hidden" name="packageId" value={pkg.id} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="startMinute" value={startMinute ?? ""} />

      <div className="min-w-0 space-y-6">
        <Step number={1} title="Choose a package">
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Package</legend>
            {packages.map((option) => {
              const selected = option.id === pkg.id;
              return (
                <label
                  key={option.id}
                  className={cx(
                    "flex cursor-pointer flex-col rounded-xl border bg-white p-4 transition has-focus-visible:ring-3 has-focus-visible:ring-basil-600/25",
                    selected ? "border-basil-600 ring-1 ring-basil-600" : "border-stone-200 hover:border-stone-300",
                  )}
                >
                  <input
                    type="radio"
                    name="package-choice"
                    value={option.id}
                    checked={selected}
                    onChange={() => choosePackage(option.id)}
                    className="sr-only"
                  />
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-semibold">{option.name}</span>
                    <span className="font-semibold">{formatMoney(option.priceCents)}</span>
                  </span>
                  <span className="mt-1 text-sm text-stone-600">
                    {pluralize(option.dishes, "dish", "dishes")} × {option.portionsPerDish} portions ·{" "}
                    {formatDuration(option.durationMinutes)}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </Step>

        <Step
          number={2}
          title="Pick a date and start time"
          description={`The next four weeks of ${chefName}'s availability${chef.city ? `, in ${chef.city} time` : ""}.`}
        >
          {hasOpenings ? (
            <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-8">
              <DatePicker days={days} selected={date} onSelect={chooseDate} />
              <div>
                <fieldset>
                  <legend className="label">{date ? `Start times · ${formatShortDate(date)}` : "Start times"}</legend>
                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-2 xl:grid-cols-3">
                    {times.map((time) => {
                    const selected = time === startMinute;
                    return (
                        <label
                          key={time}
                          className={cx(
                            "cursor-pointer rounded-lg border px-2 py-2 text-center text-sm font-medium whitespace-nowrap transition select-none has-focus-visible:ring-3 has-focus-visible:ring-basil-600/30",
                            selected
                              ? "border-basil-700 bg-basil-700 text-white"
                              : "border-stone-200 bg-white hover:border-basil-600",
                          )}
                        >
                          <input
                            type="radio"
                            name="time-choice"
                            value={time}
                            checked={selected}
                            onChange={() => setStartMinute(time)}
                            className="sr-only"
                          />
                          {formatTime(time)}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {startMinute !== null && (
                  <p className="hint">
                    {chefName} will cook from {formatTime(startMinute)} until about{" "}
                    {formatTime(startMinute + pkg.durationMinutes)}.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
              {chefName} has no openings for this package in the next four weeks. Try a shorter package, or check
              back soon.
            </p>
          )}
        </Step>

        <Step number={3} title="Kitchen and groceries">
          <div>
            <label htmlFor="address" className="label">
              Address where {chefName} will cook
            </label>
            <input
              id="address"
              name="address"
              required
              maxLength={200}
              autoComplete="street-address"
              placeholder="Street address, apartment, city"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="input"
            />
          </div>
          <fieldset className="mt-5">
            <legend className="label">Groceries</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <GroceryChoice
                value="chef"
                selected={groceries}
                onSelect={setGroceries}
                title={`${chefName} shops for me`}
                body={`Estimated ${formatMoney(pkg.groceryEstimateCents)}, billed at cost.`}
              />
              <GroceryChoice
                value="customer"
                selected={groceries}
                onSelect={setGroceries}
                title="I'll have groceries ready"
                body={`${chefName} sends a shopping list once the booking is confirmed.`}
              />
            </div>
          </fieldset>
        </Step>

        <Step number={4} title="Dietary needs" description="Your chef plans the menu around these.">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Dietary needs</legend>
            {dietaryOptions.map((diet) => (
              <label key={diet} className="chip">
                <input
                  type="checkbox"
                  name="dietary"
                  value={diet}
                  checked={dietary.includes(diet)}
                  onChange={() => toggleDiet(diet)}
                  className="sr-only"
                />
                {diet}
              </label>
            ))}
          </fieldset>
          <div className="mt-5 grid gap-5">
            <div>
              <label htmlFor="allergies" className="label">
                Allergies <span className="font-normal text-stone-500">(optional)</span>
              </label>
              <input
                id="allergies"
                name="allergies"
                maxLength={300}
                placeholder="For example: peanuts, shellfish"
                value={allergies}
                onChange={(event) => setAllergies(event.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="notes" className="label">
                Notes for {chefName} <span className="font-normal text-stone-500">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                maxLength={1000}
                placeholder="Household size, favorite dishes, parking or kitchen tips"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="input"
              />
            </div>
          </div>
        </Step>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">Your booking</h2>
          <div className="mt-4 space-y-3 text-sm">
            <SummaryItem icon={Utensils} label="Package">
              <p className="font-medium">{pkg.name}</p>
              <p className="text-xs text-stone-500">
                {pkg.dishes * pkg.portionsPerDish} meals ({pkg.dishes} dishes × {pkg.portionsPerDish} portions)
              </p>
            </SummaryItem>
            <SummaryItem icon={CalendarDays} label="Date">
              <p className={date ? "font-medium" : "text-stone-400"}>{date ? formatLongDate(date) : "Choose a date"}</p>
            </SummaryItem>
            <SummaryItem icon={Clock} label="Time">
              <p className={startMinute === null ? "text-stone-400" : "font-medium"}>
                {startMinute === null
                  ? "Choose a start time"
                  : `${formatTime(startMinute)} – ${formatTime(startMinute + pkg.durationMinutes)}`}
              </p>
            </SummaryItem>
          </div>

          <div className="mt-5 space-y-2 border-t border-stone-100 pt-5 text-sm text-stone-700">
            <PriceLine label="Chef's fee" cents={quote.chefFeeCents} />
            <PriceLine
              label={groceries === "chef" ? "Groceries (estimate)" : "Groceries (you provide)"}
              cents={quote.groceryEstimateCents}
            />
            <PriceLine label="Service fee" cents={quote.serviceFeeCents} />
            <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-base font-semibold text-ink">
              <span>Estimated total</span>
              <span>{formatMoney(quote.totalCents)}</span>
            </div>
          </div>

          {state?.error && (
            <div className="mt-5">
              <Alert tone="error">{state.error}</Alert>
            </div>
          )}
          <button
            type="submit"
            disabled={!ready || isPending}
            className={buttonStyles({ size: "lg", className: "mt-5 w-full" })}
          >
            {isPending ? "Sending request…" : "Request booking"}
          </button>
          <p className="mt-3 text-center text-xs text-stone-500">
            {ready
              ? `No payment now. ${chefName} reviews your request and confirms it.`
              : "Choose a date, a start time and an address to continue."}
          </p>
        </Card>
      </aside>
    </form>
  );
}

function Step({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-basil-100 text-sm font-semibold text-basil-800">
          {number}
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-stone-600">{description}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function DatePicker({
  days,
  selected,
  onSelect,
}: {
  days: DayAvailability[];
  selected: string;
  onSelect: (date: string) => void;
}) {
  const open = new Set(days.filter((day) => day.startTimes.length > 0).map((day) => day.date));
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const gridStart = addDays(first, -weekdayOf(first));
  const gridEnd = addDays(last, 6 - weekdayOf(last));
  const cells: string[] = [];
  for (let date = gridStart; date <= gridEnd; date = addDays(date, 1)) cells.push(date);

  return (
    <fieldset>
      <legend className="sr-only">Date</legend>
      <div aria-hidden className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-stone-500">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <span key={index}>{initial}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {cells.map((date) => {
          const isOpen = open.has(date);
          const isSelected = date === selected;
          const day = Number(date.slice(8));
          return (
            <label
              key={date}
              className={cx(
                "flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition select-none has-focus-visible:ring-3 has-focus-visible:ring-basil-600/30",
                isSelected
                  ? "bg-basil-700 font-semibold text-white shadow-sm"
                  : isOpen
                    ? "cursor-pointer bg-basil-50 font-medium text-basil-900 hover:bg-basil-100"
                    : "text-stone-300",
              )}
            >
              <input
                type="radio"
                name="date-choice"
                value={date}
                checked={isSelected}
                disabled={!isOpen}
                onChange={() => onSelect(date)}
                aria-label={formatLongDate(date)}
                className="sr-only"
              />
              {(day === 1 || date === gridStart) && (
                <span
                  className={cx(
                    "text-[10px] leading-none font-semibold uppercase",
                    isSelected ? "text-basil-100" : "text-stone-400",
                  )}
                >
                  {formatMonthShort(date)}
                </span>
              )}
              <span>{day}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function GroceryChoice({
  value,
  selected,
  onSelect,
  title,
  body,
}: {
  value: GroceryOption;
  selected: GroceryOption;
  onSelect: (value: GroceryOption) => void;
  title: string;
  body: string;
}) {
  const checked = value === selected;
  return (
    <label
      className={cx(
        "flex cursor-pointer gap-3 rounded-xl border bg-white p-4 transition has-focus-visible:ring-3 has-focus-visible:ring-basil-600/25",
        checked ? "border-basil-600 ring-1 ring-basil-600" : "border-stone-200 hover:border-stone-300",
      )}
    >
      <input
        type="radio"
        name="groceries"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-basil-700"
      />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-stone-600">{body}</span>
      </span>
    </label>
  );
}

function SummaryItem({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-basil-700" aria-hidden />
      <div>
        <p className="text-xs text-stone-500">{label}</p>
        {children}
      </div>
    </div>
  );
}

function PriceLine({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span>{formatMoney(cents)}</span>
    </div>
  );
}
