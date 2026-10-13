"use client";

import { CircleAlert } from "lucide-react";
import { buttonStyles, Container } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-700">
        <CircleAlert size={26} aria-hidden />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-stone-600">
        Sorry about that. Please try again, and if it keeps happening, come back in a few minutes.
      </p>
      <button type="button" onClick={reset} className={buttonStyles({ className: "mt-8" })}>
        Try again
      </button>
    </Container>
  );
}
