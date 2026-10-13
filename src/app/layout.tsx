import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";

import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} · Personal chefs for your weekly meal prep`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Book a local personal chef to shop, cook and portion your meals for the week, tailored to your diet.",
};

// Every page reads the database and the session cookie, so nothing is prerendered at build time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-cream font-sans text-ink antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
