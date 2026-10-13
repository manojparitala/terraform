import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { ChefSummary } from "@/lib/types";
import { Avatar, Cover } from "./avatar";
import { RatingBadge } from "./rating";
import { Tag } from "./ui";

export function ChefCard({ chef }: { chef: ChefSummary }) {
  return (
    <Link
      href={`/chefs/${chef.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-basil-600"
    >
      <Cover seed={chef.id} className="h-24" />
      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="-mt-8 flex items-end justify-between">
          <Avatar name={chef.name} seed={chef.id} size="lg" />
          <RatingBadge rating={chef.rating} count={chef.reviewCount} compact className="mb-1" />
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold">{chef.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-stone-600">{chef.headline}</p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-stone-500">
          <MapPin size={15} aria-hidden />
          {chef.city} · {chef.yearsExperience} yrs experience
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {chef.cuisines.slice(0, 2).map((cuisine) => (
            <Tag key={cuisine}>{cuisine}</Tag>
          ))}
          {chef.dietary.slice(0, 2).map((diet) => (
            <Tag key={diet} tone="green">
              {diet}
            </Tag>
          ))}
        </div>
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-stone-100 pt-4">
            <p className="text-sm text-stone-600">
              From{" "}
              <span className="text-base font-semibold text-ink">
                {chef.startingPriceCents === null ? "—" : formatMoney(chef.startingPriceCents)}
              </span>{" "}
              / session
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-basil-700 transition-all group-hover:gap-2">
              View
              <ArrowRight size={16} aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
