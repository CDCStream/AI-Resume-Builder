import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface PortfolioItem {
  platform?: string;
  url?: string;
  label?: string;
}

interface ResumeContext {
  name?: string;
  title?: string;
  skills?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { items, resumeContext } = (await request.json()) as {
      items: PortfolioItem[];
      resumeContext: ResumeContext;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No portfolio items provided" }, { status: 400 });
    }

    const validItems = items.filter((i) => i.url || i.platform);
    if (validItems.length === 0) {
      return NextResponse.json({ error: "No valid portfolio items" }, { status: 400 });
    }

    const itemsList = validItems
      .map(
        (item, i) =>
          `${i + 1}. Platform: ${item.platform || "Unknown"}, URL: ${item.url || "N/A"}, Label: ${item.label || "N/A"}`
      )
      .join("\n");

    const prompt = `You are a career advisor analyzing digital portfolio links for a resume. Evaluate each link's credibility and relevance as a "proof of work" signal for recruiters.

Resume context:
- Name: ${resumeContext.name || "Not provided"}
- Current Title: ${resumeContext.title || "Not provided"}
- Skills: ${resumeContext.skills?.join(", ") || "Not provided"}

Portfolio links to analyze:
${itemsList}

For each link, provide:
1. trustScore (0-100): How much credibility this adds to the resume
2. trustLevel: "Strong Signal" (70-100), "Good" (40-69), or "Needs Improvement" (0-39)

Scoring criteria:
- Platform reputation (GitHub, LinkedIn = high; unknown domains = lower)
- URL format professionalism (custom domain > subdomain > generic)
- Relevance to stated role/skills (a developer's GitHub > a developer's Pinterest)
- Completeness (having a URL vs just a platform name)

Respond in this exact JSON format:
{
  "results": [
    { "index": 0, "trustScore": 85, "trustLevel": "Strong Signal", "reason": "brief reason" }
  ]
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Portfolio trust analysis error:", error);
    return NextResponse.json({ error: "Trust analysis failed" }, { status: 500 });
  }
}
