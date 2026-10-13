import { Star } from "lucide-react";
import { cx } from "./ui";

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          aria-hidden
          className={n <= filled ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}
        />
      ))}
    </span>
  );
}

export function RatingBadge({
  rating,
  count,
  compact = false,
  className,
}: {
  rating: number | null;
  count: number;
  compact?: boolean;
  className?: string;
}) {
  if (rating === null || count === 0) {
    return (
      <span className={cx("rounded-full bg-basil-50 px-2 py-0.5 text-xs font-semibold text-basil-700", className)}>
        New
      </span>
    );
  }
  return (
    <span className={cx("inline-flex items-center gap-1 text-sm whitespace-nowrap", className)}>
      <Star size={16} aria-hidden className="fill-amber-400 text-amber-400" />
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      <span className="text-stone-500">
        {compact ? `(${count})` : `(${count} ${count === 1 ? "review" : "reviews"})`}
      </span>
    </span>
  );
}
