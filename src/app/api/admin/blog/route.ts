import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

function ensureBlogDir() {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }
}

// GET - List all posts (both MDX and HTML)
export async function GET() {
  try {
    ensureBlogDir();
    
    const files = fs.readdirSync(BLOG_DIR);
    
    const posts = files
      .filter(file => file.endsWith(".mdx") || file.endsWith(".html"))
      .map(file => {
        const isHtml = file.endsWith(".html");
        const slug = file.replace(".mdx", "").replace(".html", "");
        const filePath = path.join(BLOG_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(fileContent);
        const stats = readingTime(content);

        return {
          slug,
          title: data.title || "Untitled",
          description: data.description || "",
          date: data.date || new Date().toISOString(),
          author: data.author || "LinImpact.ai Team",
          image: data.image || "",
          tags: data.tags || [],
          readingTime: stats.text,
          contentType: isHtml ? "html" : "mdx",
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error listing posts:", error);
    return NextResponse.json({ error: "Failed to list posts" }, { status: 500 });
  }
}

// POST - Create new post (MDX or HTML)
export async function POST(request: NextRequest) {
  try {
    ensureBlogDir();
    
    const data = await request.json();
    const { slug, title, description, date, author, image, tags, content, contentType = "mdx" } = data;

    if (!slug || !title) {
      return NextResponse.json({ error: "Slug and title are required" }, { status: 400 });
    }

    const ext = contentType === "html" ? ".html" : ".mdx";
    const filePath = path.join(BLOG_DIR, `${slug}${ext}`);

    // Check both extensions
    if (fs.existsSync(path.join(BLOG_DIR, `${slug}.mdx`)) || fs.existsSync(path.join(BLOG_DIR, `${slug}.html`))) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 400 });
    }

    const frontmatter = `---
title: "${title}"
description: "${description || ""}"
date: "${date || new Date().toISOString().split("T")[0]}"
author: "${author || "LinImpact.ai Team"}"
image: "${image || ""}"
tags: [${(tags || []).map((t: string) => `"${t}"`).join(", ")}]
contentType: "${contentType}"
---

${content || ""}`;

    fs.writeFileSync(filePath, frontmatter);

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

// PUT - Update existing post (MDX or HTML)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { slug, title, description, date, author, image, tags, content, contentType = "mdx" } = data;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Find existing file (could be .mdx or .html)
    const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
    const htmlPath = path.join(BLOG_DIR, `${slug}.html`);
    const existingPath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(htmlPath) ? htmlPath : null;

    if (!existingPath) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Determine new extension based on contentType
    const ext = contentType === "html" ? ".html" : ".mdx";
    const newPath = path.join(BLOG_DIR, `${slug}${ext}`);

    // If changing content type, delete old file
    if (existingPath !== newPath) {
      fs.unlinkSync(existingPath);
    }

    const frontmatter = `---
title: "${title}"
description: "${description || ""}"
date: "${date || new Date().toISOString().split("T")[0]}"
author: "${author || "LinImpact.ai Team"}"
image: "${image || ""}"
tags: [${(tags || []).map((t: string) => `"${t}"`).join(", ")}]
contentType: "${contentType}"
---

${content || ""}`;

    fs.writeFileSync(newPath, frontmatter);

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}
