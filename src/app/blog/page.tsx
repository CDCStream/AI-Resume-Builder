import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { parseBlogPost, type ParsedBlogPost } from "@/lib/blog-parser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AUTHORS: Record<string, { name: string; role: string; avatar: string }> = {
  "Sarah Chen": {
    name: "Sarah Chen",
    role: "Career Coach & Resume Strategist",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop&crop=face",
  },
  "Michael Ross": {
    name: "Michael Ross",
    role: "HR Expert & Talent Acquisition Lead",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  "Emma Williams": {
    name: "Emma Williams",
    role: "Resume Specialist & Content Strategist",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
  },
};

function getAuthorInfo(authorName: string) {
  return AUTHORS[authorName] || {
    name: authorName,
    role: "Career Expert",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  };
}

function calculateReadingTime(content: string): string {
  const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText.split(" ").length;
  const minutes = Math.ceil(wordCount / 200);
  return `${minutes} min read`;
}

export const metadata = {
  title: "Career Insights & Expert Resume Tips — Blog",
  description: "Discover proven strategies for resume writing, job searching, and career growth. Expert advice from LinImpact.ai to help you land your dream job.",
  alternates: {
    canonical: "https://www.linimpact.ai/blog",
  },
};

export const revalidate = 60;

async function getPosts(): Promise<ParsedBlogPost[]> {
  const { data: rows, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !rows) {
    console.error("Error fetching posts:", error);
    return [];
  }

  return rows.map((row) => parseBlogPost(row));
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="LinImpact.ai Logo" className="w-10 h-10 object-contain" />
              <span className="text-xl font-extrabold tracking-tight -ml-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                <span className="text-cyan-500">Lin</span>
                <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 bg-clip-text text-transparent">Impact</span>
                <span className="text-slate-500 font-semibold">.ai</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <header className="py-16 px-4 text-center bg-gradient-to-b from-blue-50 to-transparent">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm font-semibold px-3 py-1 bg-blue-100 text-blue-700 rounded-full">LinImpact.ai Blog</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
          <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-800 bg-clip-text text-transparent">
            Career Insights & Expert Tips
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Discover proven strategies for resume writing, job searching, and accelerating your career growth
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📝</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No posts yet</h2>
            <p className="text-gray-500">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article 
                key={post.slug}
                className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-cyan-100">
                    {post.image ? (
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">📄</span>
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="p-6 flex flex-col flex-1">
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}

                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">{post.title}</h2>
                  </Link>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{post.description}</p>

                  <div className="flex items-center gap-3 mb-4">
                    <img src={getAuthorInfo(post.author).avatar} alt={post.author} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{post.author}</p>
                      <p className="text-xs text-gray-500">{getAuthorInfo(post.author).role}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {calculateReadingTime(post.content)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* How-to Guide for SEO content depth */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How to Build a Winning Resume in 2026</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 1: Choose the Right Format</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                The reverse-chronological format remains the most ATS-friendly choice in 2026. It lists your most recent experience first and is preferred by 75% of recruiters. If you&apos;re changing careers, consider a hybrid format that highlights transferable skills.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 2: Optimize for ATS</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Applicant Tracking Systems scan your resume before a human ever sees it. Use standard section headings, include relevant keywords from the job description, and avoid graphics or tables that confuse ATS parsers. LinImpact.ai&apos;s ATS scorer gives you real-time feedback.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 3: Write with Impact</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Replace generic descriptions with quantified achievements. Instead of &ldquo;managed a team,&rdquo; write &ldquo;led a 12-person engineering team that delivered 3 products ahead of schedule.&rdquo; Numbers grab attention and prove your impact.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 4: Craft a Tailored Cover Letter</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                A personalized cover letter increases your interview chances by 50%. Address the hiring manager by name, reference specific company initiatives, and explain why you&apos;re the right fit. LinImpact.ai generates job-matched cover letters in seconds.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 5: Prepare for Interviews</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Practice with AI mock interviews using the STAR method (Situation, Task, Action, Result). Prepare your elevator pitch, research common questions for your role, and rehearse your answers until they sound natural, not scripted.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 6: Add Proof of Work</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                In 2026, recruiters value verifiable work over keyword-stuffed resumes. Link your GitHub repos, portfolio projects, or published articles directly in your resume using LinImpact.ai&apos;s Digital Portfolio feature to build trust and credibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Salary Guides — Cross-linking for SEO */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Salary Guides by Role</h2>
          <p className="text-gray-600 text-center mb-8">Explore real salary data for popular roles based on job listings.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { slug: "software-engineer", label: "Software Engineer" },
              { slug: "data-analyst", label: "Data Analyst" },
              { slug: "product-manager", label: "Product Manager" },
              { slug: "project-manager", label: "Project Manager" },
              { slug: "ux-designer", label: "UX Designer" },
              { slug: "devops-engineer", label: "DevOps Engineer" },
              { slug: "cyber-security", label: "Cyber Security" },
              { slug: "marketing-manager", label: "Marketing Manager" },
              { slug: "financial-analyst", label: "Financial Analyst" },
              { slug: "registered-nurse", label: "Registered Nurse" },
              { slug: "dental-hygienist", label: "Dental Hygienist" },
              { slug: "scrum-master", label: "Scrum Master" },
              { slug: "solutions-architect", label: "Solutions Architect" },
              { slug: "systems-administrator", label: "Systems Administrator" },
              { slug: "administrative-assistant", label: "Administrative Assistant" },
              { slug: "executive-assistant", label: "Executive Assistant" },
            ].map((role) => (
              <Link
                key={role.slug}
                href={`/salary/${role.slug}`}
                className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all text-center"
              >
                {role.label} Salary
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Build Your Perfect Resume?</h2>
          <p className="text-blue-100 mb-8">Join thousands of job seekers who landed their dream jobs with LinImpact.ai</p>
          <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            <Link href="/register">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center mb-4">
            <img src="/logo.png" alt="LinImpact.ai" className="w-8 h-8" />
            <span className="text-white font-bold ml-2">LinImpact.ai</span>
          </Link>
          <div className="flex items-center justify-center gap-6 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} LinImpact.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
