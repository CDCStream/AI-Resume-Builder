"use client";

import { useState, useCallback, useEffect } from "react";

const AUTHORS = [
  "Sarah Chen",
  "Michael Ross",
  "Emma Williams",
];

const ADMIN_SECRET = "linimpact-blog-admin-2026";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractFromHtml(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const h1 = doc.querySelector("h1");
  const title = h1?.textContent?.trim() || "";

  const firstImg = doc.querySelector("img");
  const image = firstImg?.getAttribute("src") || "";

  const firstP = doc.querySelector("p");
  let description = "";
  if (firstP) {
    const text = firstP.textContent?.trim() || "";
    if (text.length > 10 && !firstP.querySelector("img")) {
      description = text.length > 160 ? text.slice(0, 157) + "..." : text;
    } else {
      const secondP = doc.querySelectorAll("p")[1];
      if (secondP) {
        const t2 = secondP.textContent?.trim() || "";
        description = t2.length > 160 ? t2.slice(0, 157) + "..." : t2;
      }
    }
  }

  return { title, image, description };
}

export default function AdminBlogNewPage() {
  const [html, setHtml] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState(AUTHORS[0]);
  const [image, setImage] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; url?: string; error?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [autoExtracted, setAutoExtracted] = useState(false);

  const handleHtmlChange = useCallback(
    (value: string) => {
      setHtml(value);
      setAutoExtracted(false);
    },
    []
  );

  useEffect(() => {
    if (html && !autoExtracted) {
      const extracted = extractFromHtml(html);
      if (extracted.title && !title) {
        setTitle(extracted.title);
        setSlug(generateSlug(extracted.title));
      }
      if (extracted.image && !image) setImage(extracted.image);
      if (extracted.description && !description) setDescription(extracted.description);
      setAutoExtracted(true);
    }
  }, [html, autoExtracted, title, image, description]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async () => {
    if (!slug || !title || !html) {
      setResult({ error: "Slug, title, and HTML content are required." });
      return;
    }

    setSaving(true);
    setResult(null);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/blog/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({
          slug,
          title,
          description,
          content: html,
          author,
          image,
          tags,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.error || "Save failed" });
      } else {
        setResult({ success: true, url: data.url });
      }
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setHtml("");
    setTitle("");
    setSlug("");
    setDescription("");
    setImage("");
    setTagsInput("");
    setResult(null);
    setAutoExtracted(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">
              B
            </div>
            <h1 className="text-lg font-semibold">Blog Post Editor</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !html || !title || !slug}
              className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Post"}
            </button>
          </div>
        </div>
      </header>

      {result && (
        <div className="max-w-[1600px] mx-auto px-6 pt-4">
          {result.success ? (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between">
              <span>Post saved successfully!</span>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-300 underline hover:text-emerald-200"
              >
                View post →
              </a>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {result.error}
            </div>
          )}
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title..."
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-friendly-slug"
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Author
            </label>
            <select
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {AUTHORS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "published" | "draft")}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Description (meta)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description for SEO..."
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ai, resume, career"
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-600"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Featured Image URL
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-600 font-mono"
            />
            {image && (
              <img
                src={image}
                alt="preview"
                className="w-10 h-10 rounded-lg object-cover border border-gray-700"
              />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-4">
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "editor"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            HTML Editor
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "preview"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            Preview
          </button>
        </div>

        {/* Content Area */}
        {activeTab === "editor" ? (
          <textarea
            value={html}
            onChange={(e) => handleHtmlChange(e.target.value)}
            placeholder="Paste your HTML content here..."
            className="w-full h-[600px] px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-600 resize-y"
            spellCheck={false}
          />
        ) : (
          <div className="rounded-lg border border-gray-700 bg-white min-h-[600px] overflow-auto">
            <div
              className="blog-content prose prose-lg max-w-none p-8"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
          <span>
            {html.length.toLocaleString()} characters
          </span>
          <span>
            ~{Math.ceil(html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200)} min read
          </span>
          <span>
            {html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length.toLocaleString()} words
          </span>
        </div>
      </div>
    </div>
  );
}
