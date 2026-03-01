import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/coming-soon",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE === "true";

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;

  // 🚧 Maintenance gate
  if (MAINTENANCE_MODE && !pathname.startsWith("/coming-soon")) {
    return NextResponse.redirect(new URL("/coming-soon", req.url));
  }

  // 🔐 Auth protection (when not in maintenance)
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/(api|trpc)(.*)"],
};