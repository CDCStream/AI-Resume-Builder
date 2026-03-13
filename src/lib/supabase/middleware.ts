import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected routes
  const protectedRoutes = ["/resume", "/find-jobs", "/dashboard"];
  const authRoutes = ["/login", "/register", "/forgot-password"];
  const resetPasswordRoute = "/reset-password";

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isResetPasswordRoute = request.nextUrl.pathname.startsWith(resetPasswordRoute);

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth routes (except reset-password)
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    // Check if user has an active subscription before redirecting
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .single();

    const hasPaidPlan = sub?.status === "active" && sub.plan !== "FREE" && sub.plan !== "TRIAL";
    const hasActiveTrial = sub?.plan === "TRIAL" && sub?.status === "active" &&
      sub?.current_period_end && new Date(sub.current_period_end) > new Date();

    if (hasPaidPlan || hasActiveTrial) {
      url.pathname = "/dashboard";
    } else {
      url.pathname = "/trial-checkout";
    }
    return NextResponse.redirect(url);
  }

  // Allow reset-password for both authenticated (password recovery flow) and unauthenticated users

  return supabaseResponse;
}
