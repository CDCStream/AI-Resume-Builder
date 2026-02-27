import { notFound } from "next/navigation";
import Link from "next/link";
import { BlogPostTracker } from "@/components/blog/BlogPostTracker";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { parseBlogPost } from "@/lib/blog-parser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AUTHORS: Record<string, { name: string; role: string; avatar: string }> = {
  "Sarah Chen": {
    name: "Sarah Chen",
    role: "Career Coach",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop&crop=face",
  },
  "Michael Ross": {
    name: "Michael Ross",
    role: "HR Expert",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  "Emma Williams": {
    name: "Emma Williams",
    role: "Resume Specialist",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
  },
};

function getAuthorInfo(authorName: string) {
  return AUTHORS[authorName] || {
    name: authorName,
    role: "Writer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  };
}

function calculateReadingTime(content: string): string {
  const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText.split(" ").length;
  const minutes = Math.ceil(wordCount / 200);
  return `${minutes} min read`;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

async function getPost(slug: string) {
  // First try exact slug match
  let { data: row, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !row) {
    // If the slug from the URL doesn't match the DB slug, 
    // search all posts and find one whose parsed slug matches
    const { data: allRows } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published");

    if (allRows) {
      for (const r of allRows) {
        const parsed = parseBlogPost(r);
        if (parsed.slug === slug) {
          return parsed;
        }
      }
    }
    return null;
  }

  return parseBlogPost(row);
}

async function getAllPosts() {
  const { data: rows } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published");

  if (!rows) return [];
  return rows.map((row) => parseBlogPost(row));
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  
  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} | LinImpact.ai Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const author = getAuthorInfo(post.author);
  const readingTime = calculateReadingTime(post.content);

  return (
    <div className="min-h-screen bg-white">
      <BlogPostTracker slug={post.slug} title={post.title} author={post.author} />
      
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/blog" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Blog</span>
            </Link>
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="LinImpact.ai Logo" className="w-10 h-10 object-contain" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative h-[400px] bg-gradient-to-br from-blue-600 to-cyan-600">
        {post.image ? (
          <>
            <img src={post.image} alt={post.title} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl opacity-30">📄</span>
          </div>
        )}
      </div>

      <article className="max-w-3xl mx-auto px-4 -mt-32 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-600 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
              <div>
                <p className="font-semibold text-gray-900">{author.name}</p>
                <p className="text-xs text-gray-500">{author.role}</p>
              </div>
            </div>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {readingTime}
            </span>
          </div>

          <div 
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Share this article</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://www.linimpact.ai/blog/${post.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://www.linimpact.ai/blog/${post.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 mt-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Create Your Perfect Resume?</h2>
          <p className="text-blue-100 mb-6">Start building your ATS-optimized resume with AI assistance</p>
          <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>

        <div className="text-center py-12">
          <Button variant="outline" asChild>
            <Link href="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Posts
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
