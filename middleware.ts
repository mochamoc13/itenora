import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/generate(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/coming-soon(.*)",

  "/sitemap.xml",
  "/robots.txt",
  "/favicon.ico",

  "/trips/share(.*)",
  "/itinerary(.*)",

  "/api/generate(.*)",
  "/api/destination-lookup(.*)",
  "/api/agoda-search(.*)",
  "/api/stripe/webhook(.*)",
  "/api/stripe/session(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};