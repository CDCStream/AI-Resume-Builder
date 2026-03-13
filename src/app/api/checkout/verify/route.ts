import { NextRequest, NextResponse } from "next/server";
import { polar } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const requestedPlan = body.plan;

    // If this is a trial verification, check if already activated via webhook
    if (requestedPlan === "TRIAL") {
      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .single();

      if (existing?.plan === "TRIAL" && existing?.status === "active") {
        return NextResponse.json({ success: true, plan: "TRIAL", status: "active" });
      }

      // Webhook hasn't fired yet — activate trial directly
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      const { error } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan: "TRIAL",
          status: "active",
          current_period_end: trialEnd.toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("Failed to activate trial:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      return NextResponse.json({ success: true, plan: "TRIAL", status: "active" });
    }

    // For recurring subscriptions, find via Polar API
    const subscriptions = await polar.subscriptions.list({
      active: true,
    });

    let userSubscription = null;

    for (const sub of subscriptions.result.items) {
      if (sub.metadata && (sub.metadata as Record<string, string>).userId === user.id) {
        userSubscription = sub;
        break;
      }
    }

    if (!userSubscription && user.email) {
      for (const sub of subscriptions.result.items) {
        if (sub.customer && sub.customer.email === user.email) {
          userSubscription = sub;
          break;
        }
      }
    }

    if (!userSubscription) {
      return NextResponse.json({ 
        error: "No active subscription found",
        message: "Subscription may still be processing. Please wait a moment and try again."
      }, { status: 404 });
    }

    const plan = (userSubscription.metadata as Record<string, string>)?.plan || "PRO_MONTHLY";

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        polar_subscription_id: userSubscription.id,
        polar_customer_id: userSubscription.customerId,
        plan,
        status: "active",
        current_period_end: userSubscription.currentPeriodEnd,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (error) {
      console.error("Failed to update subscription:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      plan,
      status: "active",
    });
  } catch (error) {
    console.error("Checkout verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify checkout" },
      { status: 500 }
    );
  }
}
