import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AvailabilityForm, PackageManager, ProfileForm } from "@/components/chef-forms";
import { Alert, ButtonLink, Card, Container, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getAvailability, getChefByUserId, getPackages } from "@/lib/chefs";
import { APP_NAME, CUISINES, DIETARY_OPTIONS } from "@/lib/config";
import { getDb } from "@/lib/db";
import { firstName } from "@/lib/format";

export const metadata: Metadata = { title: "Profile & menu" };

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "hours", label: "Weekly hours" },
  { id: "packages", label: "Packages" },
];

export default async function ChefProfilePage({ searchParams }: PageProps<"/chef/profile">) {
  const { welcome } = await searchParams;
  const user = await requireUser({ role: "chef", returnTo: "/chef/profile" });
  const db = getDb();
  const chef = getChefByUserId(db, user.id);
  if (!chef) notFound();

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        eyebrow="Profile & menu"
        title="How customers see you"
        description="Keep your profile, weekly hours and packages up to date. Changes appear on your public profile right away."
        actions={
          <ButtonLink href={`/chefs/${chef.id}`} variant="secondary">
            View public profile
          </ButtonLink>
        }
      />

      {welcome === "1" && (
        <div className="mt-6">
          <Alert tone="success">
            <strong className="font-semibold">Welcome to {APP_NAME}, {firstName(user.name)}!</strong> Fill in your
            profile, set your weekly hours and add at least one package. Customers can book you as soon as you have
            hours and a package.
          </Alert>
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-lg px-3 py-2 font-medium text-stone-600 hover:bg-stone-900/5 hover:text-ink"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-8">
          <EditorSection id="profile" title="Profile" description="Your name, location and the kind of food you cook.">
            <ProfileForm
              initial={{
                name: chef.name,
                headline: chef.headline,
                city: chef.city,
                yearsExperience: String(chef.yearsExperience),
                bio: chef.bio,
                cuisines: chef.cuisines,
                dietary: chef.dietary,
              }}
              cuisines={CUISINES}
              dietaryOptions={DIETARY_OPTIONS}
            />
          </EditorSection>

          <EditorSection
            id="hours"
            title="Weekly hours"
            description="When you're available to cook. Customers only see start times that fit a whole session."
          >
            <AvailabilityForm initial={getAvailability(db, chef.id)} />
          </EditorSection>

          <EditorSection
            id="packages"
            title="Packages"
            description="What customers can book. Price is for your time; groceries are added separately when you shop."
          >
            <PackageManager packages={getPackages(db, chef.id)} />
          </EditorSection>
        </div>
      </div>
    </Container>
  );
}

function EditorSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-stone-600">{description}</p>
        <div className="mt-6">{children}</div>
      </Card>
    </section>
  );
}
