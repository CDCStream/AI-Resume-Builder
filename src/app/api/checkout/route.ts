import { NextRequest, NextResponse } from "next/server";
import { polar, POLAR_PRODUCTS } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { plan } = await request.json();

    // Map plan to Polar product ID
    let productId: string;
    let successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`;
    switch (plan) {
      case "TRIAL":
        productId = POLAR_PRODUCTS.TRIAL;
        successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/resume?checkout=trial-success`;
        break;
      case "PRO_MONTHLY":
        productId = POLAR_PRODUCTS.PRO_MONTHLY;
        break;
      case "PRO_QUARTERLY":
        productId = POLAR_PRODUCTS.PRO_QUARTERLY;
        break;
      case "PRO_SEMI_ANNUAL":
        productId = POLAR_PRODUCTS.PRO_SEMI_ANNUAL;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid plan" },
          { status: 400 }
        );
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product not configured" },
        { status: 500 }
      );
    }

    // Create checkout session with Polar
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl,
      customerEmail: user.email || undefined,
      metadata: {
        userId: user.id,
        plan,
      },
    });

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
