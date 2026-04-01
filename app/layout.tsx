import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

import AccountBillingArea from "@/components/AccountBillingArea";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

export const metadata: Metadata = {
  metadataBase: new URL("https://itenora.com"),
  title: {
    default: "Itenora | AI Travel Itinerary Planner",
    template: "%s | Itenora",
  },
  description:
    "Itenora is an AI travel itinerary planner that helps families, couples, and solo travellers create smart personalised trip plans in seconds.",
  keywords: [
    "Itenora",
    "AI travel planner",
    "AI itinerary planner",
    "travel itinerary generator",
    "family trip planner",
    "couple trip planner",
    "solo travel planner",
    "trip planner",
    "holiday itinerary planner",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Itenora | AI Travel Itinerary Planner",
    description:
      "Plan smarter trips with Itenora. Create personalised itineraries for families, couples, and solo travellers.",
    url: "https://itenora.com",
    siteName: "Itenora",
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Itenora | AI Travel Itinerary Planner",
    description:
      "Create personalised travel itineraries in seconds with Itenora.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "agd-partner-manual-verification": "",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-gray-900">
          <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="group flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/10">
                  <img
                    src="/itenora-logo.svg"
                    alt="Itenora"
                    className="h-full w-full object-cover"
                  />
                </div>

                <span className="text-base font-semibold tracking-tight text-gray-900">
                  Itenora
                </span>
              </Link>

              <div className="flex items-center gap-3">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>

                <SignedIn>
                  <Link
                    href="/itinerary"
                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    My Trips
                  </Link>

                  <AccountBillingArea />

                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-10 w-10",
                      },
                    }}
                  />
                </SignedIn>
              </div>
            </div>
          </header>

          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}