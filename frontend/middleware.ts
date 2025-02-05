import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { me } from "./app/actions";

export async function middleware(req: NextRequest) {
  const user = await me();
  const path = req.nextUrl.pathname;

  const protectedRoutes = ["/settings", "/threads"];

  // Redirect unauthenticated users
  if (protectedRoutes.includes(path) && user === null) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/settings", "/threads", "/threads/:threadId"],
};
