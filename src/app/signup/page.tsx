import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser, homePathFor } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/forms";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { role, next } = await searchParams;
  const nextPath = safeRedirectPath(next, "");
  const user = await getCurrentUser();
  if (user) redirect(nextPath || homePathFor(user));
  const asChef = role === "chef";

  return (
    <AuthShell
      title={asChef ? "Cook for local clients" : "Create your account"}
      subtitle={
        asChef
          ? "Set up your chef profile, menu and hours. Customers can book you as soon as you're ready."
          : "Book a personal chef and get a week of meals cooked in your kitchen."
      }
    >
      <SignupForm initialRole={asChef ? "chef" : "customer"} next={nextPath} />
      <p className="mt-6 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link
          href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
          className="font-semibold text-basil-700 hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
