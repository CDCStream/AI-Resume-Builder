import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const WEBHOOK_SECRET = process.env.OUTRANK_WEBHOOK_SECRET;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_AUTHOR = "Sarah Chen";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractDescription(content: string, maxLength: number = 160): string {
  const pMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);
  if (pMatch) {
    const text = pMatch[1].replace(/\s+/g, " ").trim();
    return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;
  }
  const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plainText.length > maxLength ? plainText.slice(0, maxLength - 3) + "..." : plainText;
}

function extractCoverImage(content: string): string {
  const imgMatch = content.match(/<img[^>]*src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : "";
}

function extractTags(content: string): string[] {
  const predefinedTags = [
    "resume", "cover letter", "job search", "interview", "career",
    "ats", "linkedin", "skills", "experience", "education",
    "networking", "salary", "remote work", "freelance", "internship"
  ];
  const lowerContent = content.toLowerCase();
  return predefinedTags.filter(tag => lowerContent.includes(tag)).slice(0, 5);
}

function findString(obj: unknown, keys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    if (typeof record[key] === "string" && record[key]) return record[key] as string;
  }
  return "";
}

function findArray(obj: unknown, keys: string[]): string[] {
  if (!obj || typeof obj !== "object") return [];
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as string[];
  }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get("x-webhook-signature") || 
                       request.headers.get("x-outrank-signature") ||
                       request.headers.get("authorization")?.replace("Bearer ", "");
      if (signature !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await request.json();
    const payloadStr = JSON.stringify(payload);
    console.log("OUTRANK_RAW_PAYLOAD:", payloadStr.substring(0, 2000));

    // Strategy: try to find article data from any structure
    let articles: Record<string, unknown>[] = [];

    // If payload.articles is an array of objects
    if (Array.isArray(payload.articles)) {
      for (const item of payload.articles) {
        if (typeof item === "object" && item !== null) {
          articles.push(item as Record<string, unknown>);
        } else if (typeof item === "string") {
          // articles is array of HTML strings
          articles.push({ content: item, title: "Blog Post" });
        }
      }
    }
    // If payload.articles is a single object
    else if (payload.articles && typeof payload.articles === "object") {
      articles.push(payload.articles);
    }
    // If payload.articles is a string (HTML content)
    else if (typeof payload.articles === "string") {
      articles.push({ content: payload.articles, title: "Blog Post" });
    }
    // If payload.data exists
    else if (payload.data && typeof payload.data === "object") {
      articles.push(Array.isArray(payload.data) ? payload.data[0] : payload.data);
    }
    // If payload.article exists
    else if (payload.article && typeof payload.article === "object") {
      articles.push(payload.article);
    }
    // If payload itself has content
    else if (payload.title || payload.content || payload.html || payload.body) {
      articles.push(payload);
    }

    // If still nothing, save the raw payload for debugging and accept it
    if (articles.length === 0) {
      // Save raw payload to database for debugging
      await supabaseAdmin.from("blog_posts").insert({
        slug: `debug-webhook-${Date.now()}`,
        title: "DEBUG: Raw Webhook Payload",
        description: "Raw payload for debugging",
        content: `<pre>${payloadStr}</pre>`,
        author: DEFAULT_AUTHOR,
        image: "",
        tags: ["debug"],
        status: "draft"
      });

      return NextResponse.json({ 
        success: true,
        message: "Payload saved for debugging",
        payload_keys: Object.keys(payload),
        payload_types: Object.fromEntries(
          Object.entries(payload).map(([k, v]) => [k, typeof v])
        )
      });
    }

    const results = [];

    for (const articleData of articles) {
      console.log("Processing article with keys:", Object.keys(articleData));

      const title = findString(articleData, ["title", "headline", "name", "meta_title"]) || "Untitled Post";
      const content = findString(articleData, ["content", "html", "body", "text", "article_html", "article_content", "markup"]);
      const slug = findString(articleData, ["slug", "url_slug", "permalink"]) || generateSlug(title);
      const description = findString(articleData, ["description", "excerpt", "summary", "meta_description"]) || (content ? extractDescription(content) : "");
      const coverImage = findString(articleData, ["featured_image", "cover_image", "image", "thumbnail", "og_image", "featuredImage", "coverImage"]);
      const tags = findArray(articleData, ["tags", "keywords", "categories"]);

      // If STILL no content, try to find it recursively in nested objects
      let finalContent = content;
      if (!finalContent) {
        for (const value of Object.values(articleData)) {
          if (typeof value === "string" && value.length > 100 && (value.includes("<") || value.includes("\n"))) {
            finalContent = value;
            break;
          }
        }
      }

      if (!finalContent) {
        console.log("No content found. Article keys:", Object.keys(articleData));
        console.log("Article values preview:", Object.fromEntries(
          Object.entries(articleData).map(([k, v]) => [k, typeof v === "string" ? v.substring(0, 100) : typeof v])
        ));
        
        // Save the article data as debug
        finalContent = `<pre>${JSON.stringify(articleData, null, 2)}</pre>`;
      }

      const { error } = await supabaseAdmin
        .from("blog_posts")
        .upsert({
          slug,
          title,
          description,
          content: finalContent,
          author: DEFAULT_AUTHOR,
          image: coverImage || extractCoverImage(finalContent),
          tags: tags.length > 0 ? tags : extractTags(finalContent),
          published_at: findString(articleData, ["published_at", "publish_date", "created_at", "publishedAt"]) || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "published"
        }, { onConflict: "slug" });

      if (error) {
        console.error("Supabase error:", error);
        results.push({ slug, error: error.message });
      } else {
        console.log(`Blog post saved: ${slug}`);
        results.push({ slug, success: true, url: `/blog/${slug}` });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Processed ${articles.length} article(s)`,
      results
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge") || searchParams.get("hub.challenge");
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ status: "ok", message: "Outrank webhook endpoint is active" });
}
