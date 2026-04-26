import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/dashboard";
  const next = requestedNext.startsWith("/") ? requestedNext : "/dashboard";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login?error=missing_supabase_config", request.url));
  }

  // Neither code nor token_hash present
  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  let response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.redirect(new URL(next, request.url));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let error;

  if (tokenHash && type) {
    // email_change, signup, recovery, etc. confirmations
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as never }));
  } else if (code) {
    // OAuth / magic link PKCE flow
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  }

  if (error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "auth_callback_failed");
    loginUrl.searchParams.set("message", error.message);
    return NextResponse.redirect(loginUrl);
  }

  // For email_change, redirect to settings so user sees the updated email
  if (type === "email_change") {
    response = NextResponse.redirect(new URL("/dashboard/settings", request.url));
  }

  return response;
}
