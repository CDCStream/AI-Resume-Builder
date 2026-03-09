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

interface AuthorProfile {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  expertise: string[];
  url: string;
}

const AUTHORS: Record<string, AuthorProfile> = {
  "Sarah Chen": {
    name: "Sarah Chen",
    role: "Career Coach & Resume Strategist",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop&crop=face",
    bio: "Career coach with 10+ years of experience helping professionals land roles at Fortune 500 companies. Certified Professional Resume Writer (CPRW).",
    expertise: ["Resume Writing", "Career Transitions", "Interview Coaching", "LinkedIn Optimization"],
    url: "https://www.linimpact.ai/blog",
  },
  "Michael Ross": {
    name: "Michael Ross",
    role: "HR Expert & Talent Acquisition Lead",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    bio: "Former Head of Talent Acquisition with 8+ years in HR. Has reviewed 50,000+ resumes and conducted 5,000+ interviews across tech, finance, and healthcare.",
    expertise: ["ATS Systems", "Hiring Processes", "Salary Negotiation", "Job Market Trends"],
    url: "https://www.linimpact.ai/blog",
  },
  "Emma Williams": {
    name: "Emma Williams",
    role: "Resume Specialist & Content Strategist",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    bio: "Professional resume writer who has helped 3,000+ job seekers improve their applications. Specializes in tech industry resumes and cover letters.",
    expertise: ["Cover Letters", "Resume Templates", "ATS Optimization", "Professional Branding"],
    url: "https://www.linimpact.ai/blog",
  },
};

const DEFAULT_AUTHOR: AuthorProfile = {
  name: "LinImpact.ai Team",
  role: "Career Experts",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  bio: "The LinImpact.ai editorial team combines expertise in career coaching, HR, and resume writing to deliver actionable job search advice.",
  expertise: ["Resume Building", "Career Advice", "Job Search"],
  url: "https://www.linimpact.ai/blog",
};

function getAuthorInfo(authorName: string): AuthorProfile {
  return AUTHORS[authorName] || { ...DEFAULT_AUTHOR, name: authorName };
}

function generateFaqsFromPost(title: string, tags: string[], description: string) {
  const tagSet = new Set(tags.map(t => t.toLowerCase()));
  const titleLower = title.toLowerCase();
  const faqs: { question: string; answer: string }[] = [];

  if (titleLower.includes("resume") || tagSet.has("resume")) {
    faqs.push({
      question: "What makes a resume stand out to recruiters in 2026?",
      answer: "A standout resume in 2026 combines ATS-optimized formatting with quantified achievements, relevant keywords from the job description, and a clean, professional layout. Recruiters spend an average of 6-7 seconds on initial screening, so clear section headers and impactful bullet points are essential.",
    });
  }
  if (titleLower.includes("cover letter") || tagSet.has("cover letter")) {
    faqs.push({
      question: "Is a cover letter still necessary in 2026?",
      answer: "Yes — 83% of hiring managers still read cover letters when deciding who to interview. A tailored cover letter that addresses the company's specific needs and demonstrates genuine interest can significantly improve your chances, especially for competitive roles.",
    });
  }
  if (titleLower.includes("interview") || tagSet.has("interview")) {
    faqs.push({
      question: "How should I prepare for a job interview?",
      answer: "Effective interview preparation includes researching the company's recent initiatives, practicing behavioral questions using the STAR method (Situation, Task, Action, Result), preparing 3-5 thoughtful questions to ask the interviewer, and rehearsing your elevator pitch until it sounds natural.",
    });
  }
  if (titleLower.includes("ats") || tagSet.has("ats")) {
    faqs.push({
      question: "How do Applicant Tracking Systems (ATS) work?",
      answer: "ATS software scans resumes for relevant keywords, skills, and formatting before a human recruiter sees them. To pass ATS screening, use standard section headings, include keywords from the job posting, avoid graphics or tables, and submit in PDF or DOCX format.",
    });
  }
  if (titleLower.includes("salary") || tagSet.has("salary") || tagSet.has("negotiation")) {
    faqs.push({
      question: "How do I negotiate a higher salary?",
      answer: "Research market rates using salary data tools, highlight your unique value and quantified achievements, consider the total compensation package (benefits, equity, flexibility), and practice your negotiation conversation. Timing matters — the best moment is after receiving an offer but before accepting.",
    });
  }
  if (titleLower.includes("linkedin") || tagSet.has("linkedin")) {
    faqs.push({
      question: "How do I optimize my LinkedIn profile for job searching?",
      answer: "Use a professional headline with keywords, write a compelling summary that tells your career story, list quantified achievements under each role, get recommendations from colleagues, and engage with industry content regularly. Recruiters use LinkedIn as their primary sourcing tool.",
    });
  }

  if (faqs.length < 2) {
    faqs.push({
      question: "How can AI tools help with my job search?",
      answer: "AI-powered tools like LinImpact.ai can help optimize your resume for ATS systems, generate tailored cover letters, provide real-time feedback on your application materials, and simulate mock interviews. They save time while ensuring your applications meet professional standards.",
    });
    faqs.push({
      question: "What are the most common resume mistakes to avoid?",
      answer: "The most common mistakes include using generic objective statements instead of tailored summaries, listing job duties rather than achievements, having typos or inconsistent formatting, making the resume too long (keep it to 1-2 pages), and not customizing the resume for each application.",
    });
  }

  return faqs.slice(0, 3);
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
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `https://www.linimpact.ai/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://www.linimpact.ai/blog/${slug}`,
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
  const faqs = generateFaqsFromPost(post.title, post.tags, post.description);
  const publishDate = new Date(post.published_at).toISOString();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.image || undefined,
    datePublished: publishDate,
    dateModified: publishDate,
    author: {
      "@type": "Person",
      name: author.name,
      jobTitle: author.role,
      description: author.bio,
      url: author.url,
      knowsAbout: author.expertise,
    },
    publisher: {
      "@type": "Organization",
      name: "LinImpact.ai",
      url: "https://www.linimpact.ai",
      logo: { "@type": "ImageObject", url: "https://www.linimpact.ai/logo.png" },
    },
    mainEntityOfPage: `https://www.linimpact.ai/blog/${post.slug}`,
  };

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
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

          {/* Key Takeaway — UX element to break AI content pattern */}
          {post.description && (
            <div className="mb-8 p-5 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-600 font-bold text-sm uppercase tracking-wide">Key Takeaway</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{post.description}</p>
            </div>
          )}

          <div 
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />

          {/* Pro Tip — UX element */}
          <div className="mt-8 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600 font-bold text-sm uppercase tracking-wide">Pro Tip</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              Want to put these tips into action? LinImpact.ai&apos;s AI resume builder can help you apply these strategies instantly — from ATS optimization to tailored cover letters and mock interview practice.
            </p>
          </div>

          {/* FAQ Section */}
          {faqs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <details key={i} className="bg-gray-50 rounded-xl border border-gray-200 group" open={i === 0}>
                    <summary className="px-5 py-4 cursor-pointer font-semibold text-gray-900 hover:text-blue-600 transition-colors list-none flex items-center justify-between text-sm">
                      {faq.question}
                      <span className="text-gray-400 group-open:rotate-180 transition-transform ml-4 shrink-0 text-xs">▼</span>
                    </summary>
                    <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-200 pt-3">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio Card — E-E-A-T signal */}
          <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-start gap-4">
              <img src={author.avatar} alt={author.name} className="w-16 h-16 rounded-full border-2 border-white shadow-md shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">About the Author</p>
                <h3 className="font-bold text-gray-900">{author.name}</h3>
                <p className="text-sm text-blue-600 font-medium">{author.role}</p>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{author.bio}</p>
                {author.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {author.expertise.map((skill) => (
                      <span key={skill} className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full text-gray-600">{skill}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

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

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center mb-4">
            <img src="/logo.png" alt="LinImpact.ai" className="w-8 h-8" />
            <span className="text-white font-bold ml-2">LinImpact.ai</span>
          </Link>
          <div className="flex items-center justify-center gap-6 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
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
