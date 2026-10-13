import { CookingPot, Croissant, Fish, Leaf, Salad, Soup, Wheat, Carrot } from "lucide-react";
import { initials } from "@/lib/format";
import { cx } from "./ui";

const GRADIENTS = [
  "from-basil-400 to-basil-700",
  "from-orange-300 to-rose-500",
  "from-amber-300 to-orange-500",
  "from-sky-300 to-indigo-500",
  "from-teal-300 to-emerald-600",
  "from-fuchsia-300 to-purple-600",
  "from-rose-300 to-red-500",
  "from-lime-300 to-green-600",
];

const COVERS = [
  "from-basil-100 via-basil-50 to-amber-50",
  "from-orange-100 via-rose-50 to-amber-50",
  "from-amber-100 via-orange-50 to-yellow-50",
  "from-sky-100 via-indigo-50 to-cream",
  "from-teal-100 via-emerald-50 to-cream",
  "from-fuchsia-100 via-purple-50 to-cream",
  "from-rose-100 via-red-50 to-orange-50",
  "from-lime-100 via-green-50 to-cream",
];

const COVER_ICONS = [CookingPot, Salad, Soup, Leaf, Wheat, Fish, Croissant, Carrot];

const SIZES = {
  sm: "h-9 w-9 text-xs ring-2",
  md: "h-12 w-12 text-sm ring-2",
  lg: "h-16 w-16 text-lg ring-4",
  xl: "h-24 w-24 text-2xl ring-4 sm:h-28 sm:w-28 sm:text-3xl",
};

/** Initials on a gradient picked from `seed`, so each chef keeps the same colors. */
export function Avatar({
  name,
  seed,
  size = "md",
  className,
}: {
  name: string;
  seed: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        // `relative` keeps the avatar above the (positioned) cover it overlaps.
        "relative grid shrink-0 place-items-center rounded-full bg-linear-to-br font-semibold tracking-wide text-white shadow-sm ring-white",
        GRADIENTS[seed % GRADIENTS.length],
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** A soft decorative banner used behind chef avatars. */
export function Cover({ seed, className }: { seed: number; className?: string }) {
  const Icon = COVER_ICONS[seed % COVER_ICONS.length];
  return (
    <div aria-hidden className={cx("relative overflow-hidden bg-linear-to-br", COVERS[seed % COVERS.length], className)}>
      <Icon className="absolute -right-3 -bottom-4 h-28 w-28 rotate-[-12deg] text-white/70" strokeWidth={1.25} />
      <Icon className="absolute top-3 right-24 h-10 w-10 rotate-12 text-white/60" strokeWidth={1.5} />
    </div>
  );
}
