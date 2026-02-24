import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 3000
): Promise<T> {
  let lastError: Error | unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error instanceof Error && 'status' in error
        ? (error as { status: number }).status : 0;
      const isRetryable = status === 529 || status === 503 || status === 500 || status === 429;
      if (!isRetryable || attempt === maxRetries) throw error;
      const jitter = Math.random() * 1000;
      const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
      console.log(`API error ${status} (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
  throw lastError;
}

interface AutoFixRequest {
  resumeData: {
    basics?: {
      name?: string;
      label?: string;
      summary?: string;
    };
    work?: Array<{
      position?: string;
      name?: string;
      summary?: string;
      highlights?: string[];
    }>;
    skills?: Array<{
      name?: string;
      level?: string;
    }>;
  };
  jobDescription: string;
  missingSkills?: string[];
}

interface AutoFixResponse {
  addedSkills: Array<{
    name: string;
    reason: string;
  }>;
  summaryAdditions: {
    original: string;
    improved: string;
    reason: string;
  } | null;
  experienceAdditions: Array<{
    position: string;
    addition: string;
    reason: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: AutoFixRequest = await request.json();
    const { resumeData, jobDescription, missingSkills } = body;

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: "Resume data and job description are required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const existingSkills = resumeData.skills?.map(s => s.name).filter(Boolean) || [];
    const currentSummary = resumeData.basics?.summary || "";
    const workExperiences = resumeData.work || [];

    const prompt = `You are an expert resume optimization specialist. Analyze the job description and suggest specific improvements to the candidate's resume to increase ATS compatibility and relevance.

JOB DESCRIPTION:
${jobDescription}

MISSING SKILLS IDENTIFIED:
${missingSkills?.join(", ") || "None identified"}

CANDIDATE'S CURRENT RESUME:

Name: ${resumeData.basics?.name || "Not provided"}
Title: ${resumeData.basics?.label || "Not provided"}

Current Summary:
${currentSummary || "No summary provided"}

Current Skills:
${existingSkills.join(", ") || "No skills listed"}

Work Experience:
${workExperiences.map((w, i) => `${i + 1}. ${w.position} at ${w.name}
   Summary: ${w.summary || "None"}
   Highlights: ${w.highlights?.join("; ") || "None"}`).join("\n\n")}

Based on this analysis, suggest improvements in JSON format:

{
  "addedSkills": [
    {
      "name": "Skill name from job description that candidate likely has based on experience",
      "reason": "Why this skill is relevant and why candidate likely has it"
    }
  ],
  "summaryAdditions": {
    "original": "The current summary text",
    "improved": "An improved summary that incorporates job-relevant keywords while maintaining truthfulness",
    "reason": "Why these changes improve ATS compatibility"
  },
  "experienceAdditions": [
    {
      "position": "Job title where this addition applies",
      "addition": "A new highlight/bullet point to add that emphasizes relevant skills",
      "reason": "Why this addition is relevant to the target job"
    }
  ]
}

IMPORTANT RULES:
1. Only suggest skills the candidate LIKELY has based on their experience (don't invent skills)
2. Focus on the top 3-5 most impactful skill additions
3. For summary, keep changes minimal but impactful - add relevant keywords naturally
4. For experience additions, suggest 1-2 highlights max that align with job requirements
5. If the summary is already good, set summaryAdditions to null
6. Be truthful - don't suggest adding false information
7. Prioritize skills from the "MISSING SKILLS" list if they seem relevant to candidate's background
8. Write in the same language as the resume content

Return ONLY valid JSON, no additional text.`;

    console.log("Calling Claude for auto-fix...");
    
    let message;
    try {
      message = await withRetry(() => anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }));
    } catch (err) {
      const st = err instanceof Error && 'status' in err ? (err as { status: number }).status : 0;
      if (st === 529 || st === 503) {
        console.log("Primary model overloaded, trying claude-sonnet-4-5-20250514...");
        message = await withRetry(() => anthropic.messages.create({
          model: "claude-sonnet-4-5-20250514",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        }));
      } else throw err;
    }

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map(block => block.text)
      .join("");

    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.slice(7);
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    let result: AutoFixResponse;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Ensure all required fields exist
    if (!result.addedSkills) result.addedSkills = [];
    if (!result.experienceAdditions) result.experienceAdditions = [];

    console.log("Auto-fix suggestions generated:", {
      skillCount: result.addedSkills.length,
      hasSummaryChanges: !!result.summaryAdditions,
      experienceAdditionCount: result.experienceAdditions.length
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Auto-fix resume error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
