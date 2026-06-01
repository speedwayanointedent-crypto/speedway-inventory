import { NextResponse, type NextRequest } from "next/server";

export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|icons|manifest.json|robots.txt|sitemap.xml|receipt).*)",
  ],
};
