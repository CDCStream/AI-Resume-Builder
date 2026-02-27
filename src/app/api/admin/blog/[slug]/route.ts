import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET - Get single post (MDX or HTML)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    
    // Check both file types
    const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
    const htmlPath = path.join(BLOG_DIR, `${slug}.html`);
    
    let filePath: string;
    let isHtml = false;
    
    if (fs.existsSync(mdxPath)) {
      filePath = mdxPath;
    } else if (fs.existsSync(htmlPath)) {
      filePath = htmlPath;
      isHtml = true;
    } else {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const stats = readingTime(content);

    return NextResponse.json({
      slug,
      title: data.title || "Untitled",
      description: data.description || "",
      date: data.date || new Date().toISOString(),
      author: data.author || "LinImpact.ai Team",
      image: data.image || "",
      tags: data.tags || [],
      readingTime: stats.text,
      content,
      contentType: data.contentType || (isHtml ? "html" : "mdx"),
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

// DELETE - Delete post (MDX or HTML)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    
    // Check both file types
    const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
    const htmlPath = path.join(BLOG_DIR, `${slug}.html`);
    
    let filePath: string | null = null;
    
    if (fs.existsSync(mdxPath)) {
      filePath = mdxPath;
    } else if (fs.existsSync(htmlPath)) {
      filePath = htmlPath;
    }

    if (!filePath) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
