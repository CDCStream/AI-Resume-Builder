import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isRetryable = error instanceof Error && 
        ('status' in error && ((error as { status: number }).status === 529 || (error as { status: number }).status === 503 || (error as { status: number }).status === 500));
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`API overloaded (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

interface ResumeData {
  basics?: {
    name?: string;
    label?: string;
    summary?: string;
    email?: string;
    phone?: string;
    location?: { city?: string; country?: string };
  };
  work?: Array<{
    position?: string;
    name?: string;
    summary?: string;
    startDate?: string;
    endDate?: string;
  }>;
  education?: Array<{
    institution?: string;
    area?: string;
    studyType?: string;
  }>;
  skills?: Array<{
    name?: string;
    level?: string;
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
  }>;
  certificates?: Array<{
    name?: string;
  }>;
  languages?: Array<{
    language?: string;
  }>;
}

interface ScanZone {
  id: string;
  name: string;
  section: string;
  attention: "high" | "medium" | "low" | "none";
  timeSpent: number;
  issue?: string;
  suggestion?: string;
}

interface ReadabilityIssue {
  type: "font" | "density" | "length" | "structure" | "whitespace";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  suggestion: string;
}

interface ScanAnalysisResponse {
  overallScore: number;
  scanZones: ScanZone[];
  readabilityScore: number;
  readabilityIssues: ReadabilityIssue[];
  firstImpressionSummary: string;
  attentionFlow: string[];
  recommendations: string[];
}

function formatResumeForAnalysis(resume: ResumeData): string {
  let text = "";
  
  if (resume.basics) {
    if (resume.basics.name) text += `Name: ${resume.basics.name}\n`;
    if (resume.basics.label) text += `Title: ${resume.basics.label}\n`;
    if (resume.basics.email) text += `Email: ${resume.basics.email}\n`;
    if (resume.basics.phone) text += `Phone: ${resume.basics.phone}\n`;
    if (resume.basics.location) {
      text += `Location: ${resume.basics.location.city || ""}, ${resume.basics.location.country || ""}\n`;
    }
    if (resume.basics.summary) text += `Summary: ${resume.basics.summary}\n`;
  }
  
  if (resume.work && resume.work.length > 0) {
    text += "\nWork Experience:\n";
    resume.work.forEach((w, i) => {
      text += `${i + 1}. ${w.position || "Position"} at ${w.name || "Company"}`;
      if (w.startDate || w.endDate) {
        text += ` (${w.startDate || "?"} - ${w.endDate || "Present"})`;
      }
      text += "\n";
      if (w.summary) text += `   ${w.summary}\n`;
    });
  }
  
  if (resume.education && resume.education.length > 0) {
    text += "\nEducation:\n";
    resume.education.forEach((e, i) => {
      text += `${i + 1}. ${e.studyType || "Degree"} in ${e.area || "Field"} from ${e.institution || "Institution"}\n`;
    });
  }
  
  if (resume.skills && resume.skills.length > 0) {
    text += "\nSkills:\n";
    text += resume.skills.map(s => s.name).filter(Boolean).join(", ");
    text += "\n";
  }
  
  if (resume.projects && resume.projects.length > 0) {
    text += "\nProjects:\n";
    resume.projects.forEach((p, i) => {
      text += `${i + 1}. ${p.name || "Project"}\n`;
      if (p.description) text += `   ${p.description}\n`;
    });
  }
  
  if (resume.certificates && resume.certificates.length > 0) {
    text += "\nCertifications:\n";
    text += resume.certificates.map(c => c.name).filter(Boolean).join(", ");
    text += "\n";
  }
  
  if (resume.languages && resume.languages.length > 0) {
    text += "\nLanguages:\n";
    text += resume.languages.map(l => l.language).filter(Boolean).join(", ");
    text += "\n";
  }
  
  return text;
}

function getScanAnalysisPrompt(resumeText: string, resume: ResumeData, jobDescription?: string): string {
  const hasName = !!resume.basics?.name;
  const hasTitle = !!resume.basics?.label;
  const hasSummary = !!resume.basics?.summary;
  const hasContact = !!(resume.basics?.email || resume.basics?.phone);
  const workCount = resume.work?.length || 0;
  const skillCount = resume.skills?.length || 0;
  const eduCount = resume.education?.length || 0;
  
  const hasJob = !!jobDescription?.trim();
  const jobSection = hasJob
    ? `\n**TARGET JOB POSTING:**\n${jobDescription!.trim().substring(0, 2000)}\n\nYou are the recruiter who posted this job. Evaluate the resume from the perspective of whether this candidate fits THIS specific role.\n`
    : "";

  return `You are an expert in recruiter behavior and eye-tracking research.${hasJob ? " You are hiring for a specific role." : ""} Analyze this resume to simulate what a recruiter sees during a 6-second initial scan.

**RESUME STRUCTURE:**
- Has Name: ${hasName}
- Has Professional Title: ${hasTitle}
- Has Summary: ${hasSummary}
- Has Contact Info: ${hasContact}
- Work Experience Count: ${workCount}
- Skills Count: ${skillCount}
- Education Count: ${eduCount}

**RESUME CONTENT:**
${resumeText}${jobSection}

**TASK:** Based on eye-tracking research (F-pattern scanning, Ladders study showing 7.4 sec average scan time), analyze:

1. **Scan Zones**: Identify 5-8 key areas recruiters look at, in order of attention
2. **Attention Level**: Rate each zone (high/medium/low/none) based on typical recruiter behavior
3. **Time Allocation**: Distribute 6 seconds across zones realistically
4. **Readability Issues**: Check for common problems that hurt scannability

**EYE-TRACKING RESEARCH FACTS TO USE:**
- Recruiters spend 80% of time on: Name, current title, current company, start/end dates, previous company, education
- Professional title gets ~2 seconds
- Most recent job gets ~2 seconds
- Skills section gets ~1 second
- Summary often skipped if too long (>4 lines)
- Contact info scanned in ~0.5 seconds
- Education checked briefly (~0.5 seconds)

**READABILITY FACTORS TO CHECK:**
- Summary length (>4 sentences = hard to scan)
- Bullet point usage (walls of text = bad)
- Section clarity (clear headers?)
- Information density (too cramped?)
- Key achievements visibility
- Quantified results presence

**LANGUAGE RULE:** 
- Use the SAME language as the resume content for all text fields
- If resume is in Turkish, respond in Turkish. If in English, respond in English.

Return ONLY valid JSON:
{
  "overallScore": <0-100 overall scan-friendliness score>,
  "scanZones": [
    {
      "id": "zone-1",
      "name": "Name & Title",
      "section": "basics",
      "attention": "high|medium|low|none",
      "timeSpent": <seconds, e.g. 1.5>,
      "issue": "optional issue text",
      "suggestion": "optional fix suggestion"
    }
  ],
  "readabilityScore": <0-100>,
  "readabilityIssues": [
    {
      "type": "font|density|length|structure|whitespace",
      "severity": "critical|warning|info",
      "title": "Issue title",
      "description": "What's wrong",
      "suggestion": "How to fix"
    }
  ],
  "firstImpressionSummary": "<2-3 sentence summary of first impression in 6 seconds>",
  "attentionFlow": ["Name", "Title", "Current Company", "Skills", "Education"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

**KEEP CONCISE:**
- scanZones: 5-8 items max
- readabilityIssues: 5 items max
- recommendations: 5 items max
- All text fields: 1-2 sentences max`;
}

export async function POST(request: NextRequest) {
  console.log("=== Resume Scan Analysis API Called ===");
  try {
    const body = await request.json();
    const { resume, jobDescription } = body;

    if (!resume) {
      return NextResponse.json(
        { error: "Resume data is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const resumeText = formatResumeForAnalysis(resume);
    const prompt = getScanAnalysisPrompt(resumeText, resume, jobDescription);

    console.log("Calling Claude API for scan analysis...");
    let message;
    try {
      message = await withRetry(() => anthropic.messages.create({
        model: "claude-sonnet-4-6",
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
    console.log("Claude API response received, stop_reason:", message.stop_reason);

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

    let result: ScanAnalysisResponse;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error, attempting to fix...");
      
      let fixedJson = cleanedResponse;
      
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/]/g) || []).length;
      
      if (fixedJson.match(/,\s*$/)) {
        fixedJson = fixedJson.replace(/,\s*$/, '');
      }
      if (fixedJson.match(/:\s*"[^"]*$/)) {
        fixedJson = fixedJson.replace(/:\s*"[^"]*$/, ': ""');
      }
      
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += '}';
      }
      
      try {
        result = JSON.parse(fixedJson);
        console.log("Successfully fixed truncated JSON");
      } catch {
        console.error("Could not fix JSON, returning minimal response");
        result = {
          overallScore: 50,
          scanZones: [],
          readabilityScore: 50,
          readabilityIssues: [],
          firstImpressionSummary: "Analysis was interrupted. Please try again.",
          attentionFlow: [],
          recommendations: ["Please try the analysis again."]
        };
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Resume Scan Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
