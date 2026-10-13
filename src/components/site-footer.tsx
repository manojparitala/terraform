import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-stone-200/70 bg-white/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-stone-600">
            Personal chefs who cook your week of meals in your own kitchen.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm">
          <p className="font-semibold text-ink">For customers</p>
          <p className="font-semibold text-ink">For chefs</p>
          <Link href="/chefs" className="text-stone-600 hover:text-ink">
            Find a chef
          </Link>
          <Link href="/signup?role=chef" className="text-stone-600 hover:text-ink">
            Join as a chef
          </Link>
          <Link href="/bookings" className="text-stone-600 hover:text-ink">
            My bookings
          </Link>
          <Link href="/chef/dashboard" className="text-stone-600 hover:text-ink">
            Chef dashboard
          </Link>
        </div>
      </div>
      <div className="border-t border-stone-200/70 py-5 text-center text-xs text-stone-500">
        © {APP_NAME}. Made for people who would rather eat well than meal prep.
      </div>
    </footer>
  );
}
