import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const redirectTo = searchParams.get("redirect_to");
  const next = searchParams.get("next") ?? "/resume";

  const supabase = await createClient();

  // Handle token-based verification (email confirmation with token hash)
  if (token && type === "signup") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "email",
    });
    
    if (!error) {
      // Send verified users directly to the resume editor
      const redirect = redirectTo || "/resume";
      return NextResponse.redirect(`${origin}${redirect}`);
    }
    
    console.error("Email verification error:", error);
    return NextResponse.redirect(`${origin}/login?error=verification_failed`);
  }

  // Handle PKCE code exchange (OAuth, magic link, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
