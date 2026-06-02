import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/leads") || req.nextUrl.pathname.startsWith("/admin/invoices")) {
    const token = req.cookies.get("earls_admin")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/leads/:path*", "/admin/invoices/:path*"]
};

