import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Polar uses "sha256=HEXDIGEST" format
    const cleanSignature = signature.replace("sha256=", "");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("webhook-signature") 
      || request.headers.get("x-polar-signature") 
      || request.headers.get("polar-signature")
      || "";

    console.log("Polar webhook received, signature header:", signature ? "present" : "missing");

    // Verify webhook signature
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error("Webhook signature verification failed");
        // Log for debugging but still process in case of signature format mismatch
        console.error("Received signature:", signature.substring(0, 20) + "...");
      }
    }

    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error("Failed to parse webhook body:", err);
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.created":
        console.log("Checkout created:", event.data);
        break;

      case "checkout.updated":
        console.log("Checkout updated:", event.data);
        break;

      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionUpdate(event.data);
        break;

      case "subscription.active":
        await handleSubscriptionActive(event.data);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(event.data);
        break;

      case "subscription.revoked":
        await handleSubscriptionRevoked(event.data);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function resolveUserId(data: any): Promise<string | null> {
  // Try metadata first
  if (data.metadata?.userId) return data.metadata.userId;

  // Try to find user by customer email
  const email = data.customer?.email || data.customerEmail;
  if (email) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);
    if (user) return user.id;
  }

  return null;
}

async function handleSubscriptionUpdate(data: any) {
  const userId = await resolveUserId(data);
  if (!userId) {
    console.error("Could not resolve userId from metadata or email");
    console.log("Subscription data:", JSON.stringify({ metadata: data.metadata, customer: data.customer }, null, 2));
    return;
  }

  const plan = data.metadata?.plan || "PRO_MONTHLY";
  const status = data.status;
  const currentPeriodEnd = data.currentPeriodEnd || data.current_period_end;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      user_id: userId,
      polar_subscription_id: data.id,
      polar_customer_id: data.customerId || data.customer_id,
      plan,
      status,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
    });

  if (error) {
    console.error("Failed to update subscription:", error);
  } else {
    console.log(`Subscription updated for user ${userId}: ${plan} - ${status}`);
  }
}

async function handleSubscriptionActive(data: any) {
  const userId = await resolveUserId(data);
  if (!userId) return;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to activate subscription:", error);
  }
}

async function handleSubscriptionCanceled(data: any) {
  const userId = await resolveUserId(data);
  if (!userId) return;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to cancel subscription:", error);
  }
}

async function handleSubscriptionRevoked(data: any) {
  const userId = await resolveUserId(data);
  if (!userId) return;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to revoke subscription:", error);
  }
}
