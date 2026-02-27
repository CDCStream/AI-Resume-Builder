export interface ParsedBlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  author: string;
  image: string;
  tags: string[];
  published_at: string;
}

/**
 * Parses a blog_posts row from Supabase.
 * Handles the case where the content column contains the raw Outrank
 * webhook JSON payload wrapped in <pre> tags.
 */
export function parseBlogPost(row: Record<string, unknown>): ParsedBlogPost {
  const rawContent = (row.content as string) || "";

  // Check if content is a <pre>-wrapped JSON payload from the webhook debug path
  const jsonPayload = extractJsonFromContent(rawContent);

  if (jsonPayload) {
    // Content has the raw Outrank payload - extract article data from it
    const article = extractArticleFromPayload(jsonPayload);
    if (article) {
      return {
        slug: (article.slug as string) || (row.slug as string) || "untitled",
        title: (article.title as string) || (row.title as string) || "Untitled Post",
        description: (article.meta_description as string) || (article.description as string) || (row.description as string) || "",
        content: (article.content_html as string) || (article.content as string) || (article.content_markdown as string) || "",
        author: (row.author as string) || "Sarah Chen",
        image: (article.image_url as string) || (article.featured_image as string) || (row.image as string) || "",
        tags: (article.tags as string[]) || (row.tags as string[]) || [],
        published_at: (article.created_at as string) || (row.published_at as string) || new Date().toISOString(),
      };
    }
  }

  // Normal row - use columns directly
  return {
    slug: (row.slug as string) || "untitled",
    title: (row.title as string) || "Untitled Post",
    description: (row.description as string) || "",
    content: rawContent,
    author: (row.author as string) || "Sarah Chen",
    image: (row.image as string) || "",
    tags: (row.tags as string[]) || [],
    published_at: (row.published_at as string) || new Date().toISOString(),
  };
}

function extractJsonFromContent(content: string): unknown | null {
  // Try raw content as JSON first
  if (content.trim().startsWith("{") || content.trim().startsWith("[")) {
    try {
      return JSON.parse(content.trim());
    } catch { /* not JSON */ }
  }

  // Try <pre>-wrapped JSON
  const preMatch = content.match(/<pre>([\s\S]*?)<\/pre>/i);
  if (preMatch) {
    try {
      return JSON.parse(preMatch[1].trim());
    } catch { /* not valid JSON inside pre */ }
  }

  return null;
}

function extractArticleFromPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;

  const obj = payload as Record<string, unknown>;

  // { articles: [{ ... }] }
  if (Array.isArray(obj.articles) && obj.articles.length > 0) {
    return obj.articles[0] as Record<string, unknown>;
  }

  // { data: { ... } }
  if (obj.data && typeof obj.data === "object") {
    return obj.data as Record<string, unknown>;
  }

  // { article: { ... } }
  if (obj.article && typeof obj.article === "object") {
    return obj.article as Record<string, unknown>;
  }

  // Direct article object (has title + content_html)
  if (obj.title && (obj.content_html || obj.content)) {
    return obj;
  }

  return null;
}
