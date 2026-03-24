import "./globals.css";

import Link from "next/link";

import AccountBillingArea from "@/components/AccountBillingArea";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-gray-900">
          <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/90 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="group flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/10 transition-transform duration-200 group-hover:scale-105">
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

              <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
                <a href="/#how" className="transition hover:text-gray-900">
                  How it works
                </a>
                <a href="/#features" className="transition hover:text-gray-900">
                  Features
                </a>
                <a href="/#pricing" className="transition hover:text-gray-900">
                  Pricing
                </a>
              </nav>

              <div className="flex items-center gap-3">
                <SignedOut>
                  <a
                    href="/#planner"
                    className="hidden rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black sm:inline-flex"
                  >
                    Start planning
                  </a>

                  <SignInButton mode="modal">
                    <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>

                <SignedIn>
                  <Link
                    href="/itinerary"
                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
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

          <main className="pt-[88px]">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}