import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/generate(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/coming-soon(.*)",
  "/sitemap.xml",
  "/robots.txt",

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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};