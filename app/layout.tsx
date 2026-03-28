import "./globals.css";
import Link from "next/link";
import AccountBillingArea from "@/components/AccountBillingArea";
import ManageBillingButton from "@/components/ManageBillingButton";
import UsageSummary from "@/components/UsageSummary";
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
          <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/95 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
            <div className="mx-auto max-w-6xl px-4">
              <div className="flex items-center justify-between py-4">
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
                  <a href="/#how-it-works" className="transition hover:text-gray-900">
                    How it works
                  </a>
                  <a href="/#features" className="transition hover:text-gray-900">
                    Features
                  </a>
                  <a href="/#pricing" className="transition hover:text-gray-900">
                    Pricing
                  </a>
                  <a href="/#contact" className="transition hover:text-gray-900">
                    Contact
                  </a>

                  <SignedIn>
                    <Link href="/itinerary" className="transition hover:text-gray-900">
                      My Trips
                    </Link>
                  </SignedIn>
                </nav>

                <div className="flex items-center gap-3">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                        Sign in
                      </button>
                    </SignInButton>
                  </SignedOut>

                  <SignedIn>
                    <div className="hidden max-w-[260px] md:block">
                      <UsageSummary />
                    </div>

                    <div className="hidden md:block">
                      <ManageBillingButton />
                    </div>

                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                </div>
              </div>

              <SignedIn>
                <div className="space-y-3 border-t border-black/5 py-3 md:hidden">
                  <div className="max-w-full overflow-hidden">
                    <UsageSummary />
                  </div>

                  <div className="flex gap-2 overflow-x-auto">
                    <Link
                      href="/itinerary"
                      className="inline-flex shrink-0 items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      My Trips
                    </Link>

                    <ManageBillingButton className="inline-flex shrink-0 items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50" />
                  </div>
                </div>
              </SignedIn>
            </div>
          </header>

          <main className="pt-44 md:pt-24">{children}</main>

          <AccountBillingArea />
        </body>
      </html>
    </ClerkProvider>
  );
}