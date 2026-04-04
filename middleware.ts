import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    /*
     * EXCLUDE these completely from middleware:
     * - _next (static)
     * - files (png, js, etc)
     * - robots.txt
     * - sitemap.xml
     */
    "/((?!_next|robots.txt|sitemap.xml|.*\\.(?:html?|css|js|jpg|jpeg|png|gif|svg|ttf|woff2?|ico|xml|txt)).*)",
    "/(api|trpc)(.*)",
  ],
};