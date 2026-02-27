import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  // If there's an error from Supabase, redirect to reset-password page with error
  if (error || errorCode) {
    const errorMsg = encodeURIComponent(
      errorCode === "otp_expired"
        ? "This reset link has expired. Please request a new one."
        : errorDescription || "Invalid reset link."
    );
    return NextResponse.redirect(`${origin}/reset-password?error_message=${errorMsg}`);
  }

  const supabase = await createClient();

  // Handle token-based verification (email link with token)
  if (token && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    });
    
    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password?verified=true`);
    }
    
    console.error("Token verification error:", error);
    return NextResponse.redirect(
      `${origin}/reset-password?error_message=${encodeURIComponent("Invalid or expired reset link. Please request a new one.")}`
    );
  }

  // Handle PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password?verified=true`);
    }
    
    console.error("Reset password code exchange error:", error);
    return NextResponse.redirect(
      `${origin}/reset-password?error_message=${encodeURIComponent("Invalid or expired reset link. Please request a new one.")}`
    );
  }

  return NextResponse.redirect(`${origin}/reset-password?error_message=${encodeURIComponent("No reset code provided.")}`);
}
