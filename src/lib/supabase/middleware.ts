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

  // Define protected routes that require an active subscription
  const paidRoutes = ["/resume", "/find-jobs", "/dashboard", "/cover-letter", "/interview-prep", "/settings", "/billing"];
  const authRoutes = ["/login", "/register", "/forgot-password"];
  const resetPasswordRoute = "/reset-password";
  const trialCheckoutRoute = "/trial-checkout";

  const isPaidRoute = paidRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isTrialCheckout = request.nextUrl.pathname.startsWith(trialCheckoutRoute);

  // If user is not authenticated and trying to access paid route
  if (!user && isPaidRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // For authenticated users on paid routes or auth routes, check subscription
  if (user && (isPaidRoute || isAuthRoute || isTrialCheckout)) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .single();

    const hasPaidPlan = sub?.status === "active" && sub.plan !== "FREE" && sub.plan !== "TRIAL";
    const hasActiveTrial = sub?.plan === "TRIAL" && sub?.status === "active" &&
      sub?.current_period_end && new Date(sub.current_period_end) > new Date();
    const hasAccess = hasPaidPlan || hasActiveTrial;

    // Allow checkout=trial-success to pass through so verify can run
    const isTrialSuccessCallback = request.nextUrl.pathname === "/resume" &&
      request.nextUrl.searchParams.get("checkout") === "trial-success";

    if (isPaidRoute && !hasAccess && !isTrialSuccessCallback) {
      const url = request.nextUrl.clone();
      url.pathname = "/trial-checkout";
      return NextResponse.redirect(url);
    }

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = hasAccess ? "/dashboard" : "/trial-checkout";
      return NextResponse.redirect(url);
    }

    // If user already has access and visits trial-checkout, send to dashboard
    if (isTrialCheckout && hasAccess) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
