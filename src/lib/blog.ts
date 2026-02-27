import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
  readingTime: string;
  content: string;
  contentType: 'mdx' | 'html';
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
  readingTime: string;
  contentType: 'mdx' | 'html';
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR);
  
  const posts = files
    .filter(file => file.endsWith('.mdx') || file.endsWith('.html'))
    .map(file => {
      const isHtml = file.endsWith('.html');
      const slug = file.replace('.mdx', '').replace('.html', '');
      const filePath = path.join(BLOG_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);
      const stats = readingTime(content);

      return {
        slug,
        title: data.title || 'Untitled',
        description: data.description || '',
        date: data.date || new Date().toISOString(),
        author: data.author || 'LinImpact.ai Team',
        image: data.image || '/blog/default.jpg',
        tags: data.tags || [],
        readingTime: stats.text,
        contentType: (data.contentType || (isHtml ? 'html' : 'mdx')) as 'mdx' | 'html',
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
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
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title || 'Untitled',
    description: data.description || '',
    date: data.date || new Date().toISOString(),
    author: data.author || 'LinImpact.ai Team',
    image: data.image || '/blog/default.jpg',
    tags: data.tags || [],
    readingTime: stats.text,
    content,
    contentType: (data.contentType || (isHtml ? 'html' : 'mdx')) as 'mdx' | 'html',
  };
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  
  posts.forEach(post => {
    post.tags.forEach(tag => tags.add(tag));
  });

  return Array.from(tags).sort();
}
