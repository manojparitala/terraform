"use client";

import { Archive, CircleCheck, Pencil, Plus } from "lucide-react";
import { useState, type ChangeEvent, type ReactNode } from "react";
import { archivePackage, saveAvailability, saveChefProfile, savePackage } from "@/actions/chef";
import { WEEKDAYS } from "@/lib/config";
import type { FormState } from "@/lib/forms";
import { formatDuration, formatMoney, formatTime, pluralize } from "@/lib/format";
import type { AvailabilityWindow, MealPackage } from "@/lib/types";
import { buttonStyles } from "./ui";
import { useFormAction } from "./use-form-action";

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

function FormFooter({ state, pending, label }: { state: FormState; pending: boolean; label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-stone-100 pt-5">
      {state?.error && (
        <p role="alert" className="mr-auto text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && !pending && (
        <p role="status" className="mr-auto flex items-center gap-1.5 text-sm font-medium text-basil-700">
          <CircleCheck size={16} aria-hidden />
          {state.success}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonStyles()}>
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}

function ChipGroup({
  legend,
  name,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  name: string;
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="chip">
            <input
              type="checkbox"
              name={name}
              value={option}
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const toggle = (list: string[], item: string) =>
  list.includes(item) ? list.filter((value) => value !== item) : [...list, item];

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface ProfileValues {
  name: string;
  headline: string;
  city: string;
  yearsExperience: string;
  bio: string;
  cuisines: string[];
  dietary: string[];
}

export function ProfileForm({
  initial,
  cuisines,
  dietaryOptions,
}: {
  initial: ProfileValues;
  cuisines: readonly string[];
  dietaryOptions: readonly string[];
}) {
  const { state, isPending, onSubmit } = useFormAction(saveChefProfile);
  const [values, setValues] = useState(initial);
  const update =
    (field: "name" | "headline" | "city" | "yearsExperience" | "bio") =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <input id="name" name="name" required maxLength={80} value={values.name} onChange={update("name")} className="input" />
        </Field>
        <Field label="City" htmlFor="city">
          <input
            id="city"
            name="city"
            required
            maxLength={60}
            placeholder="Austin, TX"
            value={values.city}
            onChange={update("city")}
            className="input"
          />
        </Field>
        <Field label="Headline" htmlFor="headline" hint="One line that sums up your cooking." className="sm:col-span-2">
          <input
            id="headline"
            name="headline"
            required
            maxLength={100}
            placeholder="Plant-forward Indian meals that reheat beautifully"
            value={values.headline}
            onChange={update("headline")}
            className="input"
          />
        </Field>
        <Field label="Years of professional experience" htmlFor="yearsExperience">
          <input
            id="yearsExperience"
            name="yearsExperience"
            type="number"
            inputMode="numeric"
            required
            min={0}
            max={60}
            value={values.yearsExperience}
            onChange={update("yearsExperience")}
            className="input"
          />
        </Field>
        <Field
          label="About you"
          htmlFor="bio"
          hint="Your background, what you love to cook and what customers can expect. Leave a blank line between paragraphs."
          className="sm:col-span-2"
        >
          <textarea id="bio" name="bio" rows={6} maxLength={2000} value={values.bio} onChange={update("bio")} className="input" />
        </Field>
      </div>
      <ChipGroup
        legend="Cuisines you cook"
        name="cuisines"
        options={cuisines}
        selected={values.cuisines}
        onToggle={(option) => setValues((current) => ({ ...current, cuisines: toggle(current.cuisines, option) }))}
      />
      <ChipGroup
        legend="Dietary specialties"
        name="dietary"
        options={dietaryOptions}
        selected={values.dietary}
        onToggle={(option) => setValues((current) => ({ ...current, dietary: toggle(current.dietary, option) }))}
      />
      <FormFooter state={state} pending={isPending} label="Save profile" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Weekly hours
// ---------------------------------------------------------------------------

const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];
const TIME_OPTIONS = Array.from({ length: 37 }, (_, index) => 5 * 60 + index * 30); // 5:00 AM – 11:00 PM

export function AvailabilityForm({ initial }: { initial: AvailabilityWindow[] }) {
  const { state, isPending, onSubmit } = useFormAction(saveAvailability);
  const [days, setDays] = useState(() =>
    MONDAY_FIRST.map((weekday) => {
      const window = initial.find((w) => w.weekday === weekday);
      return {
        weekday,
        enabled: Boolean(window),
        start: window?.startMinute ?? 9 * 60,
        end: window?.endMinute ?? 17 * 60,
      };
    }),
  );
  const change = (weekday: number, patch: Partial<(typeof days)[number]>) =>
    setDays((current) => current.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <ul className="divide-y divide-stone-100">
        {days.map((day) => (
          <li key={day.weekday} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <label className="flex w-36 cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                name={`day-${day.weekday}`}
                checked={day.enabled}
                onChange={(event) => change(day.weekday, { enabled: event.target.checked })}
                className="h-4 w-4 accent-basil-700"
              />
              {WEEKDAYS[day.weekday]}
            </label>
            {day.enabled ? (
              <div className="flex items-center gap-2 text-sm">
                <TimeSelect
                  name={`start-${day.weekday}`}
                  label={`${WEEKDAYS[day.weekday]} start time`}
                  value={day.start}
                  onChange={(start) => change(day.weekday, { start })}
                />
                <span className="text-stone-500">to</span>
                <TimeSelect
                  name={`end-${day.weekday}`}
                  label={`${WEEKDAYS[day.weekday]} end time`}
                  value={day.end}
                  onChange={(end) => change(day.weekday, { end })}
                />
              </div>
            ) : (
              <span className="text-sm text-stone-400">Unavailable</span>
            )}
          </li>
        ))}
      </ul>
      <FormFooter state={state} pending={isPending} label="Save hours" />
    </form>
  );
}

function TimeSelect({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <select
      name={name}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="input w-32 py-2"
    >
      {TIME_OPTIONS.map((minute) => (
        <option key={minute} value={minute}>
          {formatTime(minute)}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

const DURATIONS = Array.from({ length: 15 }, (_, index) => 60 + index * 30); // 1 – 8 hours

export function PackageManager({ packages }: { packages: MealPackage[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(packages.length === 0);

  return (
    <div className="space-y-4">
      {packages.map((pkg) =>
        editingId === pkg.id ? (
          <PackageForm key={pkg.id} pkg={pkg} onDone={() => setEditingId(null)} />
        ) : (
          <PackageSummary key={pkg.id} pkg={pkg} onEdit={() => setEditingId(pkg.id)} />
        ),
      )}
      {adding ? (
        <PackageForm onDone={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={buttonStyles({ variant: "secondary" })}>
          <Plus size={16} aria-hidden />
          Add a package
        </button>
      )}
    </div>
  );
}

function PackageSummary({ pkg, onEdit }: { pkg: MealPackage; onEdit: () => void }) {
  const { state, isPending, onSubmit } = useFormAction(archivePackage);
  return (
    <div className="rounded-xl border border-stone-200 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{pkg.name}</p>
          <p className="mt-0.5 text-sm text-stone-600">
            {pluralize(pkg.dishes, "dish", "dishes")} × {pkg.portionsPerDish} portions ·{" "}
            {formatDuration(pkg.durationMinutes)} · groceries ≈ {formatMoney(pkg.groceryEstimateCents)}
          </p>
        </div>
        <p className="text-lg font-semibold">{formatMoney(pkg.priceCents)}</p>
      </div>
      {pkg.description && <p className="mt-2 text-sm text-stone-600">{pkg.description}</p>}
      <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-center gap-2">
        <input type="hidden" name="packageId" value={pkg.id} />
        <button type="button" onClick={onEdit} className={buttonStyles({ variant: "secondary", size: "sm" })}>
          <Pencil size={14} aria-hidden />
          Edit
        </button>
        <button
          type="submit"
          disabled={isPending}
          onClick={(event) => {
            if (!window.confirm(`Remove "${pkg.name}" from your menu? Existing bookings keep their details.`)) {
              event.preventDefault();
            }
          }}
          className={buttonStyles({ variant: "ghost", size: "sm" })}
        >
          <Archive size={14} aria-hidden />
          {isPending ? "Removing…" : "Remove"}
        </button>
        {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      </form>
    </div>
  );
}

function PackageForm({ pkg, onDone }: { pkg?: MealPackage; onDone: () => void }) {
  const { state, isPending, onSubmit } = useFormAction(async (previous: FormState, formData: FormData) => {
    const result = await savePackage(previous, formData);
    if (result?.success) onDone();
    return result;
  });
  const [values, setValues] = useState({
    name: pkg?.name ?? "",
    description: pkg?.description ?? "",
    dishes: String(pkg?.dishes ?? 4),
    portionsPerDish: String(pkg?.portionsPerDish ?? 4),
    durationMinutes: String(pkg?.durationMinutes ?? 180),
    price: pkg ? String(pkg.priceCents / 100) : "",
    groceryEstimate: pkg ? String(pkg.groceryEstimateCents / 100) : "",
  });
  const update =
    (field: keyof typeof values) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const meals = Number(values.dishes) * Number(values.portionsPerDish);
  const price = Number(values.price);
  const perMeal = meals > 0 && price > 0 ? formatMoney(Math.round((price * 100) / meals)) : null;
  const id = pkg?.id ?? "new";

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-basil-600/30 bg-basil-50/30 p-4 sm:p-5">
      {pkg && <input type="hidden" name="packageId" value={pkg.id} />}
      <p className="font-semibold">{pkg ? `Edit “${pkg.name}”` : "New package"}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Package name" htmlFor={`name-${id}`} className="sm:col-span-2">
          <input
            id={`name-${id}`}
            name="name"
            required
            maxLength={60}
            placeholder="Weekday Essentials"
            value={values.name}
            onChange={update("name")}
            className="input"
          />
        </Field>
        <Field label="Description" htmlFor={`description-${id}`} className="sm:col-span-2">
          <textarea
            id={`description-${id}`}
            name="description"
            rows={2}
            maxLength={300}
            placeholder="What's included, and who it's great for"
            value={values.description}
            onChange={update("description")}
            className="input"
          />
        </Field>
        <Field label="Dishes" htmlFor={`dishes-${id}`}>
          <input
            id={`dishes-${id}`}
            name="dishes"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={12}
            value={values.dishes}
            onChange={update("dishes")}
            className="input"
          />
        </Field>
        <Field label="Portions per dish" htmlFor={`portions-${id}`}>
          <input
            id={`portions-${id}`}
            name="portionsPerDish"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={12}
            value={values.portionsPerDish}
            onChange={update("portionsPerDish")}
            className="input"
          />
        </Field>
        <Field label="Session length" htmlFor={`duration-${id}`}>
          <select
            id={`duration-${id}`}
            name="durationMinutes"
            value={values.durationMinutes}
            onChange={update("durationMinutes")}
            className="input"
          >
            {DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Your price (USD)" htmlFor={`price-${id}`} hint={perMeal ? `About ${perMeal} per meal` : undefined}>
          <input
            id={`price-${id}`}
            name="price"
            type="number"
            inputMode="decimal"
            required
            min={0}
            max={5000}
            step="0.01"
            placeholder="150"
            value={values.price}
            onChange={update("price")}
            className="input"
          />
        </Field>
        <Field
          label="Grocery estimate (USD)"
          htmlFor={`groceries-${id}`}
          hint="Shown to customers who'd like you to shop. Billed at cost."
          className="sm:col-span-2"
        >
          <input
            id={`groceries-${id}`}
            name="groceryEstimate"
            type="number"
            inputMode="decimal"
            required
            min={0}
            max={2000}
            step="0.01"
            placeholder="70"
            value={values.groceryEstimate}
            onChange={update("groceryEstimate")}
            className="input"
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {state?.error && (
          <p role="alert" className="mr-auto text-sm text-red-700">
            {state.error}
          </p>
        )}
        <button type="button" onClick={onDone} className={buttonStyles({ variant: "ghost", size: "sm" })}>
          Cancel
        </button>
        <button type="submit" disabled={isPending} className={buttonStyles({ size: "sm" })}>
          {isPending ? "Saving…" : pkg ? "Save changes" : "Add package"}
        </button>
      </div>
    </form>
  );
}
