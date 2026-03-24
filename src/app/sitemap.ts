import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.linimpact.ai';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  // Get all blog posts from Supabase
  let blogPosts: MetadataRoute.Sitemap = [];
  let salaryPages: MetadataRoute.Sitemap = [];

  if (supabase) {
    try {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, published_at, updated_at')
        .eq('status', 'published');

      if (posts) {
        blogPosts = posts.map((post) => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: new Date(post.updated_at || post.published_at),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }));
      }
    } catch (e) {
      console.error('Error fetching blog posts for sitemap:', e);
    }

    try {
      const { data: pages } = await supabase
        .from('salary_pages')
        .select('slug, updated_at');

      if (pages) {
        salaryPages = pages.map((page) => ({
          url: `${baseUrl}/salary/${page.slug}`,
          lastModified: new Date(page.updated_at),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
      }
    } catch (e) {
      console.error('Error fetching salary pages for sitemap:', e);
    }
  }

  return [
    // Main pages - highest priority
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },

    // Blog index
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },

    // Blog posts
    ...blogPosts,

    // Salary guide pages
    ...salaryPages,
  ];
}
