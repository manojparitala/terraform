import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "light";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-basil-700 text-white shadow-sm hover:bg-basil-800",
  secondary: "bg-white text-ink ring-1 ring-stone-300 ring-inset hover:bg-stone-50 hover:ring-stone-400",
  ghost: "text-stone-700 hover:bg-stone-900/5",
  danger: "bg-white text-red-700 ring-1 ring-red-200 ring-inset hover:bg-red-50",
  light: "bg-white text-basil-900 shadow-sm hover:bg-basil-50",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cx(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-basil-600 disabled:pointer-events-none disabled:opacity-50",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-2xl border border-stone-200/80 bg-white shadow-xs", className)}>{children}</div>
  );
}

const TAG_TONES = {
  neutral: "bg-stone-100 text-stone-700",
  green: "bg-basil-50 text-basil-800 ring-1 ring-basil-600/15 ring-inset",
  orange: "bg-orange-50 text-orange-800 ring-1 ring-orange-600/15 ring-inset",
};

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof TAG_TONES }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TAG_TONES[tone])}>
      {children}
    </span>
  );
}

const ALERT_TONES = {
  info: "bg-sky-50 text-sky-900 ring-sky-600/20",
  success: "bg-basil-50 text-basil-900 ring-basil-600/20",
  error: "bg-red-50 text-red-800 ring-red-600/20",
};

export function Alert({ tone = "info", children }: { tone?: keyof typeof ALERT_TONES; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("rounded-xl px-4 py-3 text-sm ring-1 ring-inset", ALERT_TONES[tone])}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-semibold text-basil-700">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-stone-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeading({ title, count, action }: { title: string; count?: number; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold sm:text-2xl">
        {title}
        {count !== undefined && (
          <span className="rounded-full bg-stone-200/70 px-2 py-0.5 font-sans text-xs font-semibold text-stone-700">
            {count}
          </span>
        )}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-basil-50 text-basil-700">{icon}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
