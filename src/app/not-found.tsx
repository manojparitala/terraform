import { CookingPot } from "lucide-react";
import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-basil-100 text-basil-700">
        <CookingPot size={26} aria-hidden />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-stone-600">
        It may have been moved, or the link might be out of date. Let&apos;s get you back to the good stuff.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/chefs">Browse chefs</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Home
        </ButtonLink>
      </div>
    </Container>
  );
}
