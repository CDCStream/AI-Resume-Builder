import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getRedirectForUser(supabase: Awaited<ReturnType<typeof createClient>>, fallback: string): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fallback;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .single();

    if (!sub) return "/trial-checkout";

    const hasPaidPlan = sub.status === "active" && sub.plan !== "FREE" && sub.plan !== "TRIAL";
    const hasActiveTrial = sub.plan === "TRIAL" && sub.status === "active" &&
      sub.current_period_end && new Date(sub.current_period_end) > new Date();

    if (hasPaidPlan || hasActiveTrial) return fallback;

    return "/trial-checkout";
  } catch {
    return fallback;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const redirectTo = searchParams.get("redirect_to");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // Handle token-based verification (email confirmation with token hash)
  if (token && type === "signup") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "email",
    });
    
    if (!error) {
      const redirect = redirectTo || await getRedirectForUser(supabase, "/resume");
      return NextResponse.redirect(`${origin}${redirect}`);
    }
    
    console.error("Email verification error:", error);
    return NextResponse.redirect(`${origin}/login?error=verification_failed`);
  }

  // Handle PKCE code exchange (OAuth, magic link, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirect = await getRedirectForUser(supabase, next);
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
