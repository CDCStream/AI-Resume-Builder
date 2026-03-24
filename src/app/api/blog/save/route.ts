import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BLOG_ADMIN_SECRET = process.env.BLOG_ADMIN_SECRET || "linimpact-blog-admin-2026";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-admin-secret");
    if (authHeader !== BLOG_ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, title, description, content, author, image, tags, status, published_at } = body;

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: "slug, title, and content are required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const postData = {
      slug: slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      title,
      description: description || "",
      content,
      author: author || "Sarah Chen",
      image: image || "",
      tags: tags || [],
      status: status || "published",
      published_at: published_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .upsert(postData, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ping search engines to re-crawl sitemap
    const sitemapUrl = "https://www.linimpact.ai/sitemap.xml";
    await Promise.allSettled([
      fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
      fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
    ]);

    return NextResponse.json({
      success: true,
      post: data,
      url: `/blog/${postData.slug}`,
    });
  } catch (error) {
    console.error("Blog save error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
