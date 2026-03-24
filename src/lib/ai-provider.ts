import { GoogleGenerativeAI, Part, Content } from "@google/generative-ai";
import OpenAI from "openai";

const APP_MODE = process.env.APP_MODE || "premium";

// ---------- provider singletons (lazy) ----------

let _gemini: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!_gemini) {
    const key = process.env.GOOGLE_GEMINI_API_KEY;
    if (!key) throw new Error("GOOGLE_GEMINI_API_KEY is not set");
    _gemini = new GoogleGenerativeAI(key);
  }
  return _gemini;
}

let _deepseek: OpenAI | null = null;
function getDeepSeek(): OpenAI {
  if (!_deepseek) {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error("DEEPSEEK_API_KEY is not set");
    _deepseek = new OpenAI({ apiKey: key, baseURL: "https://api.deepseek.com" });
  }
  return _deepseek;
}

let _anthropicModule: typeof import("@anthropic-ai/sdk") | null = null;
let _anthropicClient: InstanceType<typeof import("@anthropic-ai/sdk").default> | null = null;

async function getAnthropic() {
  if (!_anthropicClient) {
    if (!_anthropicModule) _anthropicModule = await import("@anthropic-ai/sdk");
    const Anthropic = _anthropicModule.default;
    _anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropicClient;
}

// ---------- common types ----------

export interface GenerateTextOptions {
  system?: string;
  user: string;
  maxTokens?: number;
}

export interface GenerateTextResult {
  text: string;
}

export interface VisionImageInput {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

export interface VisionDocumentInput {
  base64: string;
  mediaType: "application/pdf";
}

export interface VisionContentPart {
  type: "text" | "image" | "document";
  text?: string;
  image?: VisionImageInput;
  document?: VisionDocumentInput;
}

export interface GenerateWithVisionOptions {
  system?: string;
  content: VisionContentPart[];
  maxTokens?: number;
}

// ---------- helpers ----------

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error instanceof Error && "status" in error
        ? (error as { status: number }).status : 0;
      const isRetryable = status === 429 || status === 500 || status === 503 || status === 529;
      if (!isRetryable || attempt === maxRetries) throw error;
      const jitter = Math.random() * 1000;
      const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
      console.log(`[ai-provider] retry ${attempt}/${maxRetries} after ${Math.round(delay)}ms (status ${status})`);
      await sleep(delay);
    }
  }
  throw lastError;
}

function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

// ---------- Gemini ----------

async function geminiGenerateText(opts: GenerateTextOptions): Promise<GenerateTextResult> {
  const genAI = getGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const parts: Part[] = [];
  if (opts.system) parts.push({ text: `System: ${opts.system}\n\n` });
  parts.push({ text: opts.user });
  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: { maxOutputTokens: opts.maxTokens || 4096 },
  });
  const text = result.response.text();
  return { text };
}

async function geminiGenerateWithVision(opts: GenerateWithVisionOptions): Promise<GenerateTextResult> {
  const genAI = getGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const parts: Part[] = [];
  if (opts.system) parts.push({ text: `System: ${opts.system}\n\n` });

  for (const part of opts.content) {
    if (part.type === "text" && part.text) {
      parts.push({ text: part.text });
    } else if (part.type === "image" && part.image) {
      parts.push({
        inlineData: {
          mimeType: part.image.mediaType,
          data: part.image.base64,
        },
      });
    } else if (part.type === "document" && part.document) {
      parts.push({
        inlineData: {
          mimeType: part.document.mediaType,
          data: part.document.base64,
        },
      });
    }
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: { maxOutputTokens: opts.maxTokens || 8192 },
  });
  const text = result.response.text();
  return { text };
}

// ---------- DeepSeek ----------

async function deepseekGenerateText(opts: GenerateTextOptions): Promise<GenerateTextResult> {
  const ds = getDeepSeek();
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.user });
  const completion = await ds.chat.completions.create({
    model: "deepseek-chat",
    messages,
    max_tokens: opts.maxTokens || 4096,
  });
  return { text: completion.choices[0]?.message?.content || "" };
}

// ---------- Claude ----------

async function claudeGenerateText(opts: GenerateTextOptions): Promise<GenerateTextResult> {
  const anthropic = await getAnthropic();
  const params: Record<string, unknown> = {
    model: "claude-sonnet-4-6",
    max_tokens: opts.maxTokens || 4096,
    messages: [{ role: "user", content: opts.user }],
  };
  if (opts.system) params.system = opts.system;

  let message;
  try {
    message = await withRetry(() => (anthropic as any).messages.create(params));
  } catch (err) {
    const st = err instanceof Error && "status" in err ? (err as { status: number }).status : 0;
    if (st === 529 || st === 503) {
      params.model = "claude-sonnet-4-5-20250514";
      message = await withRetry(() => (anthropic as any).messages.create(params));
    } else throw err;
  }
  const text = (message as any).content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
  return { text };
}

async function claudeGenerateWithVision(opts: GenerateWithVisionOptions): Promise<GenerateTextResult> {
  const anthropic = await getAnthropic();
  const contentParts: any[] = [];

  for (const part of opts.content) {
    if (part.type === "text" && part.text) {
      contentParts.push({ type: "text", text: part.text });
    } else if (part.type === "image" && part.image) {
      contentParts.push({
        type: "image",
        source: {
          type: "base64",
          media_type: part.image.mediaType,
          data: part.image.base64,
        },
      });
    } else if (part.type === "document" && part.document) {
      contentParts.push({
        type: "document",
        source: {
          type: "base64",
          media_type: part.document.mediaType,
          data: part.document.base64,
        },
      });
    }
  }

  const params: Record<string, unknown> = {
    model: "claude-sonnet-4-6",
    max_tokens: opts.maxTokens || 8192,
    messages: [{ role: "user", content: contentParts }],
  };
  if (opts.system) params.system = opts.system;

  const message = await withRetry(() => (anthropic as any).messages.create(params));
  const text = (message as any).content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
  return { text };
}

// ---------- public API ----------

export async function generateText(opts: GenerateTextOptions): Promise<GenerateTextResult> {
  if (APP_MODE === "premium") {
    return claudeGenerateText(opts);
  }

  // Free mode: Gemini primary, DeepSeek fallback
  try {
    return await withRetry(() => geminiGenerateText(opts));
  } catch (error) {
    console.log("[ai-provider] Gemini failed, falling back to DeepSeek:", (error as Error).message);
    return withRetry(() => deepseekGenerateText(opts));
  }
}

export async function generateWithVision(opts: GenerateWithVisionOptions): Promise<GenerateTextResult> {
  if (APP_MODE === "premium") {
    return claudeGenerateWithVision(opts);
  }

  // Free mode: Gemini only (DeepSeek has no vision)
  return withRetry(() => geminiGenerateWithVision(opts));
}

export { cleanJsonResponse };
