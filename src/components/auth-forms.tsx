"use client";

import { ChefHat, Utensils, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { login, signup } from "@/actions/auth";
import type { Role } from "@/lib/types";
import { Alert, buttonStyles, cx } from "./ui";
import { useFormAction } from "./use-form-action";

interface DemoLogins {
  password: string;
  accounts: { label: string; email: string }[];
}

export function LoginForm({ next, demo }: { next: string; demo?: DemoLogins }) {
  const { state, isPending, onSubmit } = useFormAction(login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input"
        />
      </div>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <button type="submit" disabled={isPending} className={buttonStyles({ size: "lg", className: "w-full" })}>
        {isPending ? "Logging in…" : "Log in"}
      </button>

      {demo && (
        <div className="rounded-2xl border border-dashed border-basil-300 bg-basil-50/60 p-4">
          <p className="text-sm font-semibold text-basil-900">Trying out the demo?</p>
          <p className="mt-0.5 text-xs text-basil-800">
            Fill in a demo account, then log in. Every demo password is{" "}
            <code className="rounded bg-white px-1 py-0.5 font-mono">{demo.password}</code>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {demo.accounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(demo.password);
                }}
                className={buttonStyles({ variant: "secondary", size: "sm" })}
              >
                Demo {account.label.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

export function SignupForm({ initialRole, next }: { initialRole: Role; next: string }) {
  const { state, isPending, onSubmit } = useFormAction(signup);
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <fieldset>
        <legend className="label">I want to</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <RoleChoice
            value="customer"
            selected={role}
            onSelect={setRole}
            icon={Utensils}
            title="Book a chef"
            body="Get a week of meals cooked at home."
          />
          <RoleChoice
            value="chef"
            selected={role}
            onSelect={setRole}
            icon={ChefHat}
            title="Cook as a chef"
            body="Offer meal-prep sessions to local clients."
          />
        </div>
      </fieldset>
      <div>
        <label htmlFor="name" className="label">
          Full name
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input"
        />
        <p className="hint">At least 8 characters.</p>
      </div>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <button type="submit" disabled={isPending} className={buttonStyles({ size: "lg", className: "w-full" })}>
        {isPending ? "Creating your account…" : role === "chef" ? "Create chef account" : "Create account"}
      </button>
    </form>
  );
}

function RoleChoice({
  value,
  selected,
  onSelect,
  icon: Icon,
  title,
  body,
}: {
  value: Role;
  selected: Role;
  onSelect: (role: Role) => void;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  const checked = value === selected;
  return (
    <label
      className={cx(
        "flex cursor-pointer gap-3 rounded-xl border p-4 transition has-focus-visible:ring-3 has-focus-visible:ring-basil-600/25",
        checked ? "border-basil-600 bg-basil-50/50 ring-1 ring-basil-600" : "border-stone-200 hover:border-stone-300",
      )}
    >
      <input
        type="radio"
        name="role"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        className={cx(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          checked ? "bg-basil-700 text-white" : "bg-stone-100 text-stone-600",
        )}
      >
        <Icon size={18} aria-hidden />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-stone-600">{body}</span>
      </span>
    </label>
  );
}
