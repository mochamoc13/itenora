import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname === "/trips" ||
    pathname.startsWith("/trips/") && !pathname.startsWith("/trips/share/") ||
    pathname.startsWith("/generate") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/billing");

  if (isProtected) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)",
    "/(api|trpc)(.*)",
  ],
};