import { ChefHat } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-basil-600">
      <span
        className={
          tone === "dark"
            ? "grid h-9 w-9 place-items-center rounded-xl bg-basil-700 text-white shadow-sm"
            : "grid h-9 w-9 place-items-center rounded-xl bg-white text-basil-800"
        }
      >
        <ChefHat size={20} aria-hidden />
      </span>
      <span className={tone === "dark" ? "font-display text-xl font-semibold text-ink" : "font-display text-xl font-semibold text-white"}>
        {APP_NAME}
      </span>
    </Link>
  );
}
