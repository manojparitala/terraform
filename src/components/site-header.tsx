import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { firstName } from "@/lib/format";
import { Logo } from "./logo";
import { NavLink } from "./nav-link";
import { ButtonLink } from "./ui";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1">
          {user?.role === "chef" ? (
            <>
              <NavLink href="/chef/dashboard">Dashboard</NavLink>
              <NavLink href="/chef/profile">
                <span className="sm:hidden">Profile</span>
                <span className="hidden sm:inline">Profile &amp; menu</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink href="/chefs" className={user ? undefined : "hidden min-[400px]:inline-flex"}>
                <span className="sm:hidden">Chefs</span>
                <span className="hidden sm:inline">Find a chef</span>
              </NavLink>
              {user ? (
                <NavLink href="/bookings">
                  <span className="sm:hidden">Bookings</span>
                  <span className="hidden sm:inline">My bookings</span>
                </NavLink>
              ) : (
                <NavLink href="/signup?role=chef" className="hidden md:inline-flex">
                  Become a chef
                </NavLink>
              )}
            </>
          )}

          {user ? (
            <form action={logout} className="ml-1 flex items-center gap-2 border-l border-stone-200 pl-2 sm:ml-2 sm:pl-3">
              <span className="hidden text-sm text-stone-600 lg:inline">Hi, {firstName(user.name)}</span>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-900/5 hover:text-ink"
              >
                <LogOut size={16} aria-hidden />
                <span className="sr-only sm:not-sr-only">Log out</span>
              </button>
            </form>
          ) : (
            <>
              <NavLink href="/login">Log in</NavLink>
              <ButtonLink href="/signup" size="sm" className="ml-1">
                Sign up
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
