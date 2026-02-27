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

interface OutrankWebhookPayload {
  event: string;
  data: {
    id?: string;
    title: string;
    slug?: string;
    content: string;
    excerpt?: string;
    description?: string;
    author?: string;
    featured_image?: string;
    cover_image?: string;
    image?: string;
    tags?: string[];
    categories?: string[];
    published_at?: string;
    status?: string;
    meta_title?: string;
    meta_description?: string;
  };
}

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

    const payload: OutrankWebhookPayload = await request.json();
    console.log("Outrank webhook received:", payload.event);

    // Handle different event types
    if (payload.event === "post.published" || payload.event === "article.published" || payload.event === "content.published") {
      const data = payload.data;
      
      const title = data.title || data.meta_title || "Untitled Post";
      const slug = data.slug || generateSlug(title);
      const content = data.content;
      const description = data.description || data.excerpt || data.meta_description || extractDescription(content);
      const coverImage = data.featured_image || data.cover_image || data.image || extractCoverImage(content);
      const author = mapAuthor(data.author);
      const tags = data.tags || extractTags(content, data.categories);
      const publishDate = data.published_at || new Date().toISOString();

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
          status: "published"
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
        message: "Blog post created successfully",
        slug,
        url: `/blog/${slug}`
      });
    }

    // Handle post updates
    if (payload.event === "post.updated" || payload.event === "article.updated" || payload.event === "content.updated") {
      const data = payload.data;
      const slug = data.slug || (data.title ? generateSlug(data.title) : null);
      
      if (!slug) {
        return NextResponse.json({ error: "Slug or title required for updates" }, { status: 400 });
      }

      const title = data.title || "Untitled Post";
      const content = data.content;
      const description = data.description || data.excerpt || extractDescription(content);
      const coverImage = data.featured_image || data.cover_image || data.image || extractCoverImage(content);
      const author = mapAuthor(data.author);
      const tags = data.tags || extractTags(content, data.categories);

      const { error } = await supabaseAdmin
        .from("blog_posts")
        .update({
          title,
          description,
          content,
          author,
          image: coverImage,
          tags,
          updated_at: new Date().toISOString()
        })
        .eq("slug", slug);

      if (error) {
        console.error("Supabase update error:", error);
        return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
      }

      console.log(`Blog post updated: ${slug}`);

      return NextResponse.json({ 
        success: true, 
        message: "Blog post updated successfully",
        slug,
        url: `/blog/${slug}`
      });
    }

    // Handle post deletion
    if (payload.event === "post.deleted" || payload.event === "article.deleted" || payload.event === "content.deleted") {
      const data = payload.data;
      const slug = data.slug || (data.title ? generateSlug(data.title) : null);
      
      if (!slug) {
        return NextResponse.json({ error: "Slug or title required" }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from("blog_posts")
        .delete()
        .eq("slug", slug);

      if (error) {
        console.error("Supabase delete error:", error);
        return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
      }

      console.log(`Blog post deleted: ${slug}`);

      return NextResponse.json({ 
        success: true, 
        message: "Blog post deleted successfully",
        slug
      });
    }

    console.log(`Unknown webhook event: ${payload.event}`);
    return NextResponse.json({ 
      success: true, 
      message: `Event ${payload.event} received but not processed`
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
