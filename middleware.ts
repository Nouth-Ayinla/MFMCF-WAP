import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdmin } from "@/lib/roles";
import { verifyToken } from "@/lib/jwt";

const SESSION_COOKIE = "admin_session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isManagePage = request.nextUrl.pathname.startsWith("/admin/manage");

  if (!user) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isManagePage && !isSuperAdmin(user)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
