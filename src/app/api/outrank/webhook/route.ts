import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Outrank webhook secret for security
const WEBHOOK_SECRET = process.env.OUTRANK_WEBHOOK_SECRET;

// Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default authors mapping
const AUTHORS: Record<string, { name: string; role: string; avatar: string }> = {
  "Sarah Chen": {
    name: "Sarah Chen",
    role: "Career Coach & Resume Expert",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
  },
  "Michael Ross": {
    name: "Michael Ross", 
    role: "HR Director & Hiring Consultant",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  },
  "Emma Williams": {
    name: "Emma Williams",
    role: "Resume Specialist & Interview Coach", 
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
  }
};

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
  const metaMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (metaMatch) return metaMatch[1].slice(0, maxLength);

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
  if (imgMatch) return imgMatch[1];

  const bgMatch = content.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/i);
  if (bgMatch) return bgMatch[1];

  return "";
}

function extractTags(content: string, categories?: string[]): string[] {
  const predefinedTags = [
    "resume", "cover letter", "job search", "interview", "career",
    "ats", "linkedin", "skills", "experience", "education",
    "networking", "salary", "remote work", "freelance", "internship",
    "entry level", "executive", "tech", "marketing", "finance"
  ];

  const foundTags: string[] = [];
  const lowerContent = content.toLowerCase();

  for (const tag of predefinedTags) {
    if (lowerContent.includes(tag)) {
      foundTags.push(tag);
    }
  }

  if (categories && categories.length > 0) {
    foundTags.push(...categories.map(c => c.toLowerCase()));
  }

  return [...new Set(foundTags)].slice(0, 5);
}

function mapAuthor(authorName?: string): string {
  if (!authorName) return DEFAULT_AUTHOR;
  
  if (AUTHORS[authorName]) return authorName;
  
  const lowerAuthor = authorName.toLowerCase();
  for (const key of Object.keys(AUTHORS)) {
    if (key.toLowerCase().includes(lowerAuthor) || lowerAuthor.includes(key.toLowerCase())) {
      return key;
    }
  }
  
  return DEFAULT_AUTHOR;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if set
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get("x-webhook-signature") || 
                       request.headers.get("x-outrank-signature") ||
                       request.headers.get("authorization")?.replace("Bearer ", "");
      
      if (signature !== WEBHOOK_SECRET) {
        console.error("Webhook signature mismatch");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await request.json();
    
    // Log the full payload for debugging
    console.log("Outrank webhook full payload:", JSON.stringify(payload));

    // Handle Outrank's { articles: [...] } format
    let articleData: Record<string, unknown>;
    
    if (payload.articles && Array.isArray(payload.articles) && payload.articles.length > 0) {
      articleData = payload.articles[0];
      console.log("Found article in articles array, keys:", Object.keys(articleData));
      console.log("Article data sample:", JSON.stringify(articleData).substring(0, 500));
    } else if (payload.data) {
      articleData = payload.data;
    } else if (payload.article) {
      articleData = payload.article;
    } else if (payload.post) {
      articleData = payload.post;
    } else if (payload.title || payload.content || payload.html || payload.body) {
      articleData = payload;
    } else {
      console.error("Could not find article data. Payload keys:", Object.keys(payload));
      // Return full payload structure for debugging
      return NextResponse.json({ 
        error: "Invalid payload format", 
        received: Object.keys(payload),
        payload_preview: JSON.stringify(payload).substring(0, 1000)
      }, { status: 400 });
    }
    
    console.log("Article data keys:", Object.keys(articleData));
    
    const eventType = payload.event || payload.type || payload.action || "publish";

    // Extract fields with multiple possible names
    const title = (articleData.title || articleData.headline || articleData.name || "Untitled Post") as string;
    const content = (articleData.content || articleData.html || articleData.body || articleData.text || "") as string;
    const slug = (articleData.slug || articleData.url_slug || generateSlug(title)) as string;
    const description = (articleData.description || articleData.excerpt || articleData.summary || articleData.meta_description || extractDescription(content)) as string;
    const coverImage = (articleData.featured_image || articleData.cover_image || articleData.image || articleData.thumbnail || articleData.og_image || extractCoverImage(content)) as string;
    const author = mapAuthor(articleData.author as string | undefined);
    const rawTags = articleData.tags || articleData.keywords || articleData.categories;
    const tags = Array.isArray(rawTags) ? rawTags : extractTags(content, Array.isArray(articleData.categories) ? articleData.categories as string[] : undefined);
    const publishDate = (articleData.published_at || articleData.publish_date || articleData.created_at || new Date().toISOString()) as string;
    const status = (articleData.status || "published") as string;

    // Check if this is a delete event
    if (eventType.includes("delete") || eventType.includes("unpublish") || eventType.includes("remove")) {
      const { error } = await supabaseAdmin
        .from("blog_posts")
        .delete()
        .eq("slug", slug);

      if (error) {
        console.error("Supabase delete error:", error);
        return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
      }

      console.log(`Blog post deleted: ${slug}`);
      return NextResponse.json({ success: true, message: "Blog post deleted", slug });
    }

    // Validate required fields
    if (!title || title === "Untitled Post") {
      console.warn("No title found, using default");
    }
    
    if (!content) {
      console.error("No content found in payload");
      return NextResponse.json({ 
        error: "Content is required",
        received_fields: Object.keys(articleData)
      }, { status: 400 });
    }

    // Upsert to Supabase
    const { error } = await supabaseAdmin
      .from("blog_posts")
      .upsert({
        slug,
        title,
        description,
        content,
        author,
        image: coverImage,
        tags,
        published_at: publishDate,
        updated_at: new Date().toISOString(),
        status: status === "draft" ? "draft" : "published"
      }, {
        onConflict: "slug"
      });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
    }

    console.log(`Blog post created/updated: ${slug}`);

    return NextResponse.json({ 
      success: true, 
      message: "Blog post saved successfully",
      slug,
      url: `/blog/${slug}`
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

  return NextResponse.json({ 
    status: "ok",
    message: "Outrank webhook endpoint is active",
    endpoints: {
      publish: "POST /api/outrank/webhook",
      verify: "GET /api/outrank/webhook"
    }
  });
}
