import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser, homePathFor } from "@/lib/auth";
import { APP_NAME } from "@/lib/config";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, demoDataEnabled } from "@/lib/demo";
import { safeRedirectPath } from "@/lib/forms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = safeRedirectPath(next, "");
  const user = await getCurrentUser();
  if (user) redirect(nextPath || homePathFor(user));

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        nextPath.includes("/book")
          ? "Log in to finish booking your chef."
          : "Log in to book chefs and manage your meal-prep sessions."
      }
    >
      <LoginForm
        next={nextPath}
        demo={
          demoDataEnabled()
            ? {
                password: DEMO_PASSWORD,
                accounts: DEMO_ACCOUNTS.map(({ label, email }) => ({ label, email })),
              }
            : undefined
        }
      />
      <p className="mt-6 text-center text-sm text-stone-600">
        New to {APP_NAME}?{" "}
        <Link
          href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"}
          className="font-semibold text-basil-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
