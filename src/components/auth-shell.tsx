import { CircleCheck, CookingPot, Quote } from "lucide-react";
import type { ReactNode } from "react";
import { Container } from "./ui";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Container className="py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm lg:grid-cols-2">
        <div className="p-6 sm:p-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-stone-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
        <div className="relative hidden flex-col justify-between overflow-hidden bg-basil-800 p-10 text-white lg:flex">
          <CookingPot
            aria-hidden
            strokeWidth={1}
            className="absolute -right-16 -bottom-16 h-80 w-80 rotate-[-12deg] text-white/10"
          />
          <div className="relative">
            <Quote aria-hidden size={32} className="text-basil-300" />
            <blockquote className="mt-4 font-display text-2xl leading-snug">
              I come home on Monday to a fridge full of food I actually want to eat. It&apos;s the best money I
              spend all week.
            </blockquote>
            <p className="mt-4 text-sm text-basil-200">Taylor B., booked with Chef Maria</p>
          </div>
          <ul className="relative mt-12 space-y-3 text-sm text-basil-100">
            {["Local chefs with real reviews", "Menus built around your diet", "Groceries handled if you like"].map(
              (point) => (
                <li key={point} className="flex items-center gap-2">
                  <CircleCheck size={17} aria-hidden className="text-basil-300" />
                  {point}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </Container>
  );
}
