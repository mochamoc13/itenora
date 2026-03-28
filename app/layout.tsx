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

export const metadata = {
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
            <div className="mx-auto max-w-6xl px-4">
              <div className="flex items-center justify-between py-4">
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

                <div className="flex items-center gap-2 sm:gap-3">
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
                      className="hidden rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:inline-flex"
                    >
                      My Trips
                    </Link>

                    <div className="hidden sm:block">
                      <AccountBillingArea />
                    </div>

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

              <SignedIn>
                <div className="border-t border-black/5 py-3 sm:hidden">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <Link
                      href="/itinerary"
                      className="inline-flex shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      My Trips
                    </Link>

                    <div className="shrink-0">
                      <AccountBillingArea />
                    </div>
                  </div>
                </div>
              </SignedIn>
            </div>
          </header>

          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}