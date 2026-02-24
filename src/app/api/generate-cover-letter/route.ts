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

interface JobDetails {
  title?: string;
  company?: string;
  description?: string;
  requirements?: string[];
  location?: string;
}

interface ResumeBasics {
  name?: string;
  email?: string;
  phone?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  professionalTitle?: string;
  summary?: string;
}

interface ResumeData {
  basics?: ResumeBasics;
  work?: Array<{
    company?: string;
    position?: string;
    summary?: string;
    highlights?: string[];
  }>;
  skills?: Array<{
    name?: string;
    level?: string;
  }>;
  education?: Array<{
    institution?: string;
    area?: string;
    studyType?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDetails, resumeData, language = "en" } = body as {
      jobDetails: JobDetails;
      resumeData: ResumeData;
      language?: string;
    };

    if (!jobDetails || !resumeData) {
      return NextResponse.json(
        { error: "Job details and resume data are required" },
        { status: 400 }
      );
    }

    const prompt = buildCoverLetterPrompt(jobDetails, resumeData, language);

    let message;
    try {
      message = await withRetry(() => anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }));
    } catch (err) {
      const st = err instanceof Error && 'status' in err ? (err as { status: number }).status : 0;
      if (st === 529 || st === 503) {
        console.log("Primary model overloaded, trying claude-sonnet-4-5-20250514...");
        message = await withRetry(() => anthropic.messages.create({
          model: "claude-sonnet-4-5-20250514",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }));
      } else throw err;
    }

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let coverLetterData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        coverLetterData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      // If parsing fails, create a structured response from the text
      coverLetterData = {
        recipientName: "Hiring Manager",
        recipientTitle: "Hiring Manager",
        companyName: jobDetails.company || "Company",
        companyAddress: jobDetails.location || "",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        subject: `Application for ${jobDetails.title || "Position"}`,
        greeting: "Dear Hiring Manager,",
        body: responseText,
        closing: "Sincerely,",
        senderName: resumeData.basics?.name || "",
        senderTitle: resumeData.basics?.professionalTitle || "",
      };
    }

    return NextResponse.json({
      success: true,
      coverLetter: coverLetterData,
    });
  } catch (error) {
    console.error("Cover letter generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}

function buildCoverLetterPrompt(
  jobDetails: JobDetails,
  resumeData: ResumeData,
  language: string
): string {
  const languageInstruction = language === "tr" 
    ? "Write the cover letter in Turkish (Türkçe)."
    : language === "de"
    ? "Write the cover letter in German (Deutsch)."
    : language === "fr"
    ? "Write the cover letter in French (Français)."
    : language === "es"
    ? "Write the cover letter in Spanish (Español)."
    : "Write the cover letter in English.";

  return `You are an expert career coach and professional cover letter writer. Generate a compelling, personalized cover letter based on the following job posting and candidate's resume.

${languageInstruction}

## Job Details:
- Position: ${jobDetails.title || "Not specified"}
- Company: ${jobDetails.company || "Not specified"}
- Location: ${jobDetails.location || "Not specified"}
- Description: ${jobDetails.description || "Not provided"}
${jobDetails.requirements ? `- Requirements: ${jobDetails.requirements.join(", ")}` : ""}

## Candidate Information:
- Name: ${resumeData.basics?.name || "Not provided"}
- Professional Title: ${resumeData.basics?.professionalTitle || "Not provided"}
- Location: ${resumeData.basics?.location?.city || ""}, ${resumeData.basics?.location?.region || ""}, ${resumeData.basics?.location?.country || ""}
- Summary: ${resumeData.basics?.summary || "Not provided"}

### Work Experience:
${resumeData.work?.map(w => `- ${w.position} at ${w.company}: ${w.summary || ""}`).join("\n") || "Not provided"}

### Skills:
${resumeData.skills?.map(s => s.name).join(", ") || "Not provided"}

### Education:
${resumeData.education?.map(e => `- ${e.studyType} in ${e.area} from ${e.institution}`).join("\n") || "Not provided"}

## Instructions:
1. Write a professional, compelling cover letter (3-4 paragraphs)
2. Highlight relevant skills and experiences that match the job requirements
3. Show enthusiasm for the company and role
4. Be specific - mention the company name and position
5. Keep it concise but impactful (250-350 words for body)
6. Do NOT include generic phrases like "I am writing to apply..."
7. Start with a strong hook that grabs attention

## Output Format:
Return a JSON object with the following structure:
{
  "recipientName": "Hiring Manager or specific name if known",
  "recipientTitle": "Hiring Manager",
  "companyName": "${jobDetails.company || "Company"}",
  "companyAddress": "${jobDetails.location || ""}",
  "date": "${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}",
  "subject": "Application for [Position Title]",
  "greeting": "Dear [Name/Hiring Manager],",
  "body": "The full cover letter body with proper paragraphs separated by \\n\\n",
  "closing": "Sincerely,",
  "senderName": "${resumeData.basics?.name || ""}",
  "senderTitle": "${resumeData.basics?.professionalTitle || ""}"
}

Return ONLY the JSON object, no additional text.`;
}
