import { NextRequest, NextResponse } from "next/server";

async function checkUrl(url: string): Promise<{ url: string; status: "valid" | "broken"; statusCode: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "LinImpact-LinkChecker/1.0",
      },
    });

    clearTimeout(timeout);
    return {
      url,
      status: res.ok ? "valid" : "broken",
      statusCode: res.status,
    };
  } catch {
    return { url, status: "broken", statusCode: 0 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = (await request.json()) as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    const limited = urls.slice(0, 10);
    const results = await Promise.all(limited.map(checkUrl));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Link check error:", error);
    return NextResponse.json({ error: "Link check failed" }, { status: 500 });
  }
}
