"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Loader2,
  FileText,
  Calendar,
  Image as ImageIcon,
  Tag,
  Youtube,
  Info,
  Lightbulb,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ChevronDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Authors with realistic AI-generated avatars
const AUTHORS = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    role: "Career Coach",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "michael-ross",
    name: "Michael Ross",
    role: "HR Expert",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "emma-williams",
    name: "Emma Williams",
    role: "Resume Specialist",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
  },
];

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
  readingTime: string;
  content?: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isNewPost, setIsNewPost] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    author: "Sarah Chen",
    image: "",
    tags: "",
    content: "",
    contentType: "html" as "mdx" | "html",
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/admin/blog");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPost = () => {
    setIsNewPost(true);
    setEditingPost(null);
    setFormData({
      slug: "",
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      author: "Sarah Chen",
      image: "",
      tags: "",
      content: "",
      contentType: "html",
    });
  };

  const handleEditPost = async (slug: string) => {
    try {
      const response = await fetch(`/api/admin/blog/${slug}`);
      if (response.ok) {
        const post = await response.json();
        setEditingPost(post);
        setIsNewPost(false);
        // Detect content type from file extension or content
        const isHtml = post.contentType === "html" || slug.endsWith("-html");
        setFormData({
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: post.date.split("T")[0],
          author: post.author,
          image: post.image,
          tags: post.tags.join(", "),
          content: post.content,
          contentType: isHtml ? "html" : "mdx",
        });
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      
      const response = await fetch("/api/admin/blog", {
        method: isNewPost ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setEditingPost(null);
        setIsNewPost(false);
        fetchPosts();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to save post");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(`/api/admin/blog/${postToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const insertSnippet = (snippet: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + "\n\n" + snippet,
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Extract title from HTML content
  const extractTitle = (html: string): string => {
    // Try h1 first
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      return h1Match[1].trim();
    }
    // Try title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
    // Try first heading of any level
    const headingMatch = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim();
    }
    return "";
  };

  // Extract description from HTML content
  const extractDescription = (html: string): string => {
    // Try meta description
    const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (metaMatch && metaMatch[1]) {
      return metaMatch[1].trim();
    }
    // Try first paragraph
    const pMatch = html.match(/<p[^>]*>([^<]{20,})<\/p>/i);
    if (pMatch && pMatch[1]) {
      // Clean and truncate
      const text = pMatch[1].replace(/<[^>]+>/g, '').trim();
      return text.length > 160 ? text.substring(0, 157) + "..." : text;
    }
    // Extract first 160 chars of text content
    const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (textContent.length > 20) {
      return textContent.length > 160 ? textContent.substring(0, 157) + "..." : textContent;
    }
    return "";
  };

  // Extract cover image from HTML content
  const extractCoverImage = (html: string): string => {
    // Try to find first img tag
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
    // Try to find background-image in style
    const bgMatch = html.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
    if (bgMatch && bgMatch[1]) {
      return bgMatch[1];
    }
    return "";
  };

  // Extract tags from HTML content based on common resume/career keywords
  const extractTags = (html: string, title: string): string[] => {
    const text = (title + " " + html).toLowerCase();
    const possibleTags: { keyword: string; tag: string }[] = [
      { keyword: "resume", tag: "Resume Tips" },
      { keyword: "cv", tag: "CV Writing" },
      { keyword: "ats", tag: "ATS" },
      { keyword: "interview", tag: "Interview" },
      { keyword: "cover letter", tag: "Cover Letter" },
      { keyword: "job search", tag: "Job Search" },
      { keyword: "career", tag: "Career Advice" },
      { keyword: "linkedin", tag: "LinkedIn" },
      { keyword: "skill", tag: "Skills" },
      { keyword: "experience", tag: "Experience" },
      { keyword: "salary", tag: "Salary" },
      { keyword: "remote", tag: "Remote Work" },
      { keyword: "freelance", tag: "Freelancing" },
      { keyword: "hiring", tag: "Hiring" },
      { keyword: "recruiter", tag: "Recruiters" },
      { keyword: "template", tag: "Templates" },
      { keyword: "format", tag: "Formatting" },
      { keyword: "tips", tag: "Tips" },
      { keyword: "mistakes", tag: "Common Mistakes" },
      { keyword: "professional", tag: "Professional Development" },
    ];

    const foundTags: string[] = [];
    for (const { keyword, tag } of possibleTags) {
      if (text.includes(keyword) && !foundTags.includes(tag)) {
        foundTags.push(tag);
        if (foundTags.length >= 4) break; // Max 4 tags
      }
    }
    return foundTags;
  };

  // Auto-extract metadata when HTML content changes
  const handleContentChange = (content: string) => {
    setFormData(prev => {
      const newData = { ...prev, content };
      
      // Only auto-extract for HTML mode and if fields are empty
      if (prev.contentType === "html" && content.length > 100) {
        // Extract title if not set
        if (!prev.title) {
          const extractedTitle = extractTitle(content);
          if (extractedTitle) {
            newData.title = extractedTitle;
            // Auto-generate slug from title
            newData.slug = extractedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          }
        }

        // Extract description if not set
        if (!prev.description) {
          const extractedDesc = extractDescription(content);
          if (extractedDesc) {
            newData.description = extractedDesc;
          }
        }

        // Extract cover image if not set
        if (!prev.image) {
          const extractedImage = extractCoverImage(content);
          if (extractedImage) {
            newData.image = extractedImage;
          }
        }
        
        // Extract tags if not set
        if (!prev.tags) {
          const extractedTags = extractTags(content, newData.title || prev.title);
          if (extractedTags.length > 0) {
            newData.tags = extractedTags.join(", ");
          }
        }
      }
      
      return newData;
    });
  };

  // Editor view
  if (editingPost || isNewPost) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => { setEditingPost(null); setIsNewPost(false); }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Posts
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={async () => {
                  const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                  
                  // Save first, then preview
                  setSaving(true);
                  try {
                    const response = await fetch("/api/admin/blog", {
                      method: isNewPost ? "POST" : "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...formData,
                        slug,
                        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
                      }),
                    });

                    if (response.ok) {
                      // Update form with saved slug
                      setFormData(prev => ({ ...prev, slug }));
                      if (isNewPost) {
                        setIsNewPost(false);
                        setEditingPost({ ...formData, slug, tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean), readingTime: "1 min read" } as any);
                      }
                      fetchPosts();
                      // Open preview
                      window.open(`/blog/${slug}`, '_blank');
                    } else {
                      const error = await response.json();
                      alert(error.message || "Failed to save post");
                    }
                  } catch (error) {
                    console.error("Error saving post:", error);
                    alert("Failed to save post");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || !formData.title}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                Save & Preview
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isNewPost ? "Create Post" : "Save Changes"}
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{isNewPost ? "New Blog Post" : "Edit Post"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title">Title</Label>
                      {formData.contentType === "html" && formData.title && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Auto-detected
                        </span>
                      )}
                    </div>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={formData.contentType === "html" ? "HTML'den otomatik algılanır..." : "Enter post title..."}
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="auto-generated-from-title"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL: /blog/{formData.slug || "your-post-slug"}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Description</Label>
                      {formData.contentType === "html" && formData.description && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Auto-detected
                        </span>
                      )}
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={formData.contentType === "html" ? "HTML'den otomatik algılanır..." : "Brief description for SEO and previews..."}
                      rows={2}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="content">Content</Label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, contentType: "html" })}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            formData.contentType === "html"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          HTML (Writesonic)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, contentType: "mdx" })}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            formData.contentType === "mdx"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          MDX (Advanced)
                        </button>
                      </div>
                    </div>
                    {formData.contentType === "html" && (
                      <p className="text-xs text-green-600 mb-2 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Writesonic'ten HTML'i direkt yapıştırın - Author otomatik eklenir
                      </p>
                    )}
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder={formData.contentType === "html" 
                        ? "Writesonic'ten kopyaladığınız HTML içeriği buraya yapıştırın - Cover Image ve Tags otomatik algılanır!" 
                        : "Write your blog post content here..."
                      }
                      rows={20}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Meta */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Post Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Author</Label>
                    <Select
                      value={formData.author}
                      onValueChange={(value) => setFormData({ ...formData, author: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select author" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTHORS.map((author) => (
                          <SelectItem key={author.id} value={author.name}>
                            <div className="flex items-center gap-2">
                              <img
                                src={author.avatar}
                                alt={author.name}
                                className="w-6 h-6 rounded-full"
                              />
                              <div>
                                <span className="font-medium">{author.name}</span>
                                <span className="text-xs text-gray-500 ml-1">({author.role})</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="image">Cover Image URL</Label>
                      {formData.contentType === "html" && formData.image && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Auto-detected
                        </span>
                      )}
                    </div>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder={formData.contentType === "html" ? "HTML'den otomatik algılanır..." : "https://images.unsplash.com/..."}
                    />
                    {formData.image && (
                      <img src={formData.image} alt="Preview" className="mt-2 rounded-lg w-full h-32 object-cover" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      {formData.contentType === "html" && formData.tags && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Auto-detected
                        </span>
                      )}
                    </div>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder={formData.contentType === "html" ? "İçerikten otomatik algılanır..." : "Resume Tips, Career, ATS"}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* HTML Mode Tips */}
              {formData.contentType === "html" && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-base text-green-800">HTML Mode</CardTitle>
                    <CardDescription className="text-green-700">Writesonic ile kolay entegrasyon</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-green-700 space-y-2">
                    <p><strong>Adımlar:</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Writesonic'te blog yazınızı oluşturun</li>
                      <li>HTML olarak export edin veya kopyalayın</li>
                      <li>Yukarıdaki alana yapıştırın</li>
                      <li>Author'ı seçin</li>
                      <li>Save'e tıklayın!</li>
                    </ol>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs font-medium text-green-800 mb-1">✨ Otomatik Algılanan:</p>
                      <ul className="text-xs text-green-600 space-y-0.5">
                        <li>• Title (H1 veya ilk başlık)</li>
                        <li>• Description (ilk paragraf)</li>
                        <li>• Cover Image (ilk görsel)</li>
                        <li>• Tags (anahtar kelimeler)</li>
                        <li>• URL Slug (title'dan)</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* MDX Snippets - only show in MDX mode */}
              {formData.contentType === "mdx" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Insert Snippets</CardTitle>
                    <CardDescription>Click to add to content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertSnippet('<YouTube id="VIDEO_ID" title="Video Title" />')}
                    >
                      <Youtube className="w-4 h-4 mr-2 text-red-500" />
                      YouTube Video
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertSnippet('![Image description](https://image-url.jpg)')}
                    >
                      <ImageIcon className="w-4 h-4 mr-2 text-green-500" />
                      Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertSnippet('<Callout type="info">\nYour info text here\n</Callout>')}
                    >
                      <Info className="w-4 h-4 mr-2 text-blue-500" />
                      Info Callout
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertSnippet('<Callout type="tip">\nYour tip here\n</Callout>')}
                    >
                      <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                      Tip Callout
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertSnippet('<Callout type="warning">\nYour warning here\n</Callout>')}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                      Warning Callout
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Markdown Help - only show in MDX mode */}
              {formData.contentType === "mdx" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Markdown Reference</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2 text-gray-600">
                    <p><code className="bg-gray-100 px-1"># Heading 1</code></p>
                    <p><code className="bg-gray-100 px-1">## Heading 2</code></p>
                    <p><code className="bg-gray-100 px-1">**bold**</code></p>
                    <p><code className="bg-gray-100 px-1">*italic*</code></p>
                    <p><code className="bg-gray-100 px-1">[link](url)</code></p>
                    <p><code className="bg-gray-100 px-1">- bullet point</code></p>
                    <p><code className="bg-gray-100 px-1">1. numbered list</code></p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Blog Admin</h1>
          </div>
          <Button onClick={handleNewPost} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts yet</h3>
              <p className="text-gray-500 mb-4">Create your first blog post to get started</p>
              <Button onClick={handleNewPost}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.slug} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {post.image && (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-24 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                      <p className="text-sm text-gray-500 truncate">{post.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                        <span>{post.readingTime}</span>
                        {post.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {post.tags.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPost(post.slug)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setPostToDelete(post.slug);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Post
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
