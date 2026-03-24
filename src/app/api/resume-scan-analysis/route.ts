import { NextRequest, NextResponse } from "next/server";
import { generateText, cleanJsonResponse } from "@/lib/ai-provider";

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

1. **Scan Zones**: Identify the key areas recruiters look at, in order of attention
2. **Attention Level**: Rate each zone (high/medium/low/none) based on typical recruiter behavior
3. **Time Allocation**: Distribute 6 seconds across zones realistically
4. **Readability Issues**: Check for common problems that hurt scannability

**MANDATORY SCAN ZONES (always include ALL of these if present in the resume):**
1. Name & Title (section: "basics") — always first, high attention
2. Current/Most Recent Job (section: "experience") — always second, high attention
3. Summary/Profile (section: "summary") — if present
4. Skills (section: "skills") — if present
5. Education (section: "education") — if present
6. Contact Info & Location (section: "contact") — ALWAYS include this, recruiters ALWAYS glance at location/email
7. Projects (section: "projects") — if present
8. Certificates (section: "certificates") — if present

**EYE-TRACKING RESEARCH FACTS:**
- Recruiters spend 80% of time on: Name, current title, current company, start/end dates, previous company, education
- Professional title gets ~1.5-2 seconds
- Most recent job gets ~1.5-2 seconds  
- Skills section gets ~0.5-1 second
- Summary gets ~0.5-1 second
- Contact info & location gets ~0.5 second (recruiter ALWAYS checks location for commute/relocation)
- Education gets ~0.5-1 second
- Projects/Certificates get ~0.5-1 second depending on size

**CRITICAL TIME RULE:**
- MINIMUM timeSpent for ANY zone must be 0.5 seconds. No zone can have less than 0.5s.
- Total time must add up to exactly 6.0 seconds (including scroll time if resume is multi-page)
- Larger sections with more content should get proportionally more time

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

    const resumeText = formatResumeForAnalysis(resume);
    const prompt = getScanAnalysisPrompt(resumeText, resume, jobDescription);

    console.log("Calling AI for scan analysis...");
    const { text: responseText } = await generateText({ user: prompt, maxTokens: 4096 });
    console.log("AI response received");

    const cleanedResponse = cleanJsonResponse(responseText);

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

    // Enforce minimum 0.5s per zone and redistribute to total 6.0s
    if (result.scanZones && result.scanZones.length > 0) {
      const MIN_TIME = 0.5;
      const TOTAL = 6.0;

      // Clamp all zones to minimum
      result.scanZones.forEach(z => {
        if (z.timeSpent < MIN_TIME) z.timeSpent = MIN_TIME;
      });

      // Redistribute: scale proportionally to hit TOTAL
      const rawTotal = result.scanZones.reduce((s, z) => s + z.timeSpent, 0);
      if (Math.abs(rawTotal - TOTAL) > 0.01) {
        const ratio = TOTAL / rawTotal;
        result.scanZones.forEach(z => {
          z.timeSpent = Math.round(z.timeSpent * ratio * 10) / 10;
        });

        // Re-enforce minimum after scaling
        for (let pass = 0; pass < 3; pass++) {
          const below = result.scanZones.filter(z => z.timeSpent < MIN_TIME);
          const above = result.scanZones.filter(z => z.timeSpent > MIN_TIME);
          if (below.length === 0 || above.length === 0) break;

          let deficit = 0;
          below.forEach(z => { deficit += MIN_TIME - z.timeSpent; z.timeSpent = MIN_TIME; });
          const surplus = above.reduce((s, z) => s + (z.timeSpent - MIN_TIME), 0);
          if (surplus <= 0) break;
          above.forEach(z => {
            const share = ((z.timeSpent - MIN_TIME) / surplus) * deficit;
            z.timeSpent = Math.round((z.timeSpent - share) * 10) / 10;
          });
        }

        // Final rounding fix
        const adjusted = result.scanZones.reduce((s, z) => s + z.timeSpent, 0);
        if (Math.abs(adjusted - TOTAL) > 0.01) {
          result.scanZones[0].timeSpent = Math.round((result.scanZones[0].timeSpent + (TOTAL - adjusted)) * 10) / 10;
        }
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
