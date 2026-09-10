import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Supabase may fall back to the site's root URL when a callback isn't allowlisted yet.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone(); url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }
  let response = NextResponse.next({request});
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({name,value}) => request.cookies.set(name,value));
        response = NextResponse.next({request});
        values.forEach(({name,value,options}) => response.cookies.set(name,value,options));
        Object.entries(headers ?? {}).forEach(([key,value])=>response.headers.set(key,value));
      },
    },
  });
  await supabase.auth.getClaims();
  response.headers.set("Cache-Control","private, no-store");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)$).*)"] };
