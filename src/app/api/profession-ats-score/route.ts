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

export interface ProfessionATSScoreRequest {
  profession: string;
  resume: {
    basics?: {
      name?: string;
      label?: string;
      summary?: string;
    };
    work?: Array<{
      position?: string;
      name?: string;
      summary?: string;
    }>;
    education?: Array<{
      institution?: string;
      area?: string;
      studyType?: string;
      summary?: string;
    }>;
    skills?: Array<{
      name?: string;
      level?: string;
      keywords?: string[];
    }>;
    projects?: Array<{
      name?: string;
      description?: string;
    }>;
    certificates?: Array<{
      name?: string;
      issuer?: string;
    }>;
  };
}

export interface WeakArea {
  section: string;
  field: string;
  currentValue: string;
  issue: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export interface ProfessionATSScoreResponse {
  score: number;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingSkills: Array<{ name: string; importance: "required" | "preferred" | "nice-to-have" }>;
  weakAreas: WeakArea[];
  strengths: string[];
  recommendations: string[];
}

function formatResumeForAnalysis(resume: ProfessionATSScoreRequest["resume"]): string {
  let text = "";
  
  if (resume.basics) {
    if (resume.basics.label) text += `Title: ${resume.basics.label}\n`;
    if (resume.basics.summary) text += `Summary: ${resume.basics.summary}\n`;
  }
  
  if (resume.work && resume.work.length > 0) {
    text += "\nWork Experience:\n";
    resume.work.forEach((w: any, i: number) => {
      text += `${i + 1}. ${w.position || "Position"} at ${w.name || "Company"}\n`;
      if (w.summary) text += `   ${w.summary}\n`;
      if (w.highlights && w.highlights.length > 0) {
        w.highlights.forEach((h: string) => {
          text += `   - ${h}\n`;
        });
      }
    });
  }
  
  if (resume.education && resume.education.length > 0) {
    text += "\nEducation:\n";
    resume.education.forEach((e, i) => {
      text += `${i + 1}. ${e.studyType || "Degree"} in ${e.area || "Field"} from ${e.institution || "Institution"}\n`;
      if (e.summary) text += `   ${e.summary}\n`;
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
    resume.certificates.forEach((c, i) => {
      text += `${i + 1}. ${c.name || "Certificate"} from ${c.issuer || "Issuer"}\n`;
    });
  }
  
  return text.substring(0, 3000);
}

function getProfessionATSScorePrompt(
  profession: string,
  resumeText: string,
  resume: ProfessionATSScoreRequest["resume"]
): string {
  const existingSkills = resume.skills?.map(s => s.name).filter(Boolean).join(", ") || "None";
  
  return `You are an expert ATS (Applicant Tracking System) analyzer and career coach specializing in "${profession}" roles.

Analyze this resume for compatibility with a typical "${profession}" position.

**RESUME:**
${resumeText}

**TASK:** Evaluate how well this resume matches the typical requirements for a "${profession}" role.

Based on your knowledge of what companies typically look for in "${profession}" candidates, analyze:
1. Essential technical skills for this role
2. Common soft skills expected
3. Typical experience requirements
4. Industry-standard tools and technologies
5. Educational background preferences

**CRITICAL: Keep responses CONCISE to avoid truncation:**
- matchedKeywords: max 10 items
- missingKeywords: max 10 items  
- missingSkills: LIST ALL MISSING SKILLS IN ONE RESPONSE (max 15 items). Use SHORT SPECIFIC NAMES.
- weakAreas: max 5 items (most important only)
- strengths: max 5 items
- recommendations: max 5 items
- Keep all text fields SHORT (1-2 sentences max)

**SKILL NAMING RULE:** For missingSkills, use SPECIFIC tool/technology names only.
WRONG: "Cloud ML platforms (AWS SageMaker etc.)", "CI/CD tools", "Container orchestration"
CORRECT: "AWS SageMaker", "Jenkins", "Kubernetes", "Docker", "TensorFlow", "dbt", "Pytest"

**=== CRITICAL - EXISTING SKILLS CHECK ===**
CANDIDATE'S CURRENT SKILLS: ${existingSkills}

ABSOLUTE RULES FOR missingSkills (MUST FOLLOW):
1. NEVER include any skill already in the list above - check EVERY skill before adding
2. If "XGBoost/LightGBM" exists → "XGBoost" and "LightGBM" are NOT missing
3. If "dbt" exists → "dbt Core", "dbt (production)" are NOT missing  
4. If "Git/Github" exists → "Git", "GitHub", "GitHub Actions" are NOT missing
5. Partial matches count: "Docker" in skills means Docker is NOT missing
6. The score should INCREASE if all required skills are present

**LANGUAGE RULE:** 
- summary, recommendations, weakAreas issue/suggestion: Use the SAME language as the resume content
- If resume is in Turkish, respond in Turkish. If in English, respond in English.

Return ONLY valid JSON:
{
  "score": <0-100 compatibility score>,
  "summary": "<1-2 sentence overall assessment in resume's language>",
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "missingSkills": [
    {"name": "SkillName", "importance": "required|preferred|nice-to-have"}
  ],
  "weakAreas": [
    {
      "section": "professionalTitle|professionalSummary|workExperience|education|skills|projects",
      "field": "Field name",
      "currentValue": "current text or 'empty'",
      "issue": "What's wrong (in resume's language)",
      "suggestion": "How to fix (in resume's language)",
      "priority": "high|medium|low"
    }
  ],
  "strengths": ["strength1", "strength2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;
}

export async function POST(request: NextRequest) {
  console.log("=== Profession ATS Score API Called ===");
  try {
    const body: ProfessionATSScoreRequest = await request.json();
    const { profession, resume } = body;

    if (!profession) {
      return NextResponse.json(
        { error: "Profession is required" },
        { status: 400 }
      );
    }

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
    const prompt = getProfessionATSScorePrompt(profession, resumeText, resume);

    const currentSkills = resume.skills?.map(s => s.name).filter(Boolean) || [];
    console.log(`Analyzing for profession: ${profession}`);
    console.log("Analyzing with skills:", currentSkills.join(", ") || "None");
    console.log("Calling Claude API for Profession ATS Score analysis...");
    
    let message;
    try {
      message = await withRetry(() => anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
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
          max_tokens: 8192,
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

    let result: ProfessionATSScoreResponse;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error, attempting to fix truncated JSON...");
      console.error("Response length:", cleanedResponse.length);
      
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
          score: 50,
          summary: "Analysis was interrupted. Please try again.",
          matchedKeywords: [],
          missingKeywords: [],
          missingSkills: [],
          weakAreas: [],
          strengths: [],
          recommendations: ["Please try the analysis again."]
        };
      }
    }

    // Post-process: Filter out any missingSkills that are actually in the resume
    const existingSkillNames = (resume.skills || [])
      .map(s => (s.name || "").toLowerCase())
      .filter(Boolean);
    
    const extractKeywords = (skill: string): string[] => {
      const lower = skill.toLowerCase();
      const words = lower.split(/[\s\/\-\(\)]+/).filter(w => w.length > 2);
      const normalized = lower.replace(/[^a-z0-9]/g, '');
      return [...words, normalized];
    };
    
    const existingKeywords = new Set<string>();
    for (const skill of existingSkillNames) {
      for (const keyword of extractKeywords(skill)) {
        existingKeywords.add(keyword);
      }
    }
    
    if (result.missingSkills && result.missingSkills.length > 0) {
      result.missingSkills = result.missingSkills.filter(skill => {
        const skillLower = (skill.name || "").toLowerCase();
        const skillKeywords = extractKeywords(skillLower);
        
        if (existingSkillNames.includes(skillLower)) return false;
        
        for (const keyword of skillKeywords) {
          if (keyword.length > 3 && existingKeywords.has(keyword)) {
            console.log(`Filtering "${skill.name}" - keyword "${keyword}" found in existing skills`);
            return false;
          }
        }
        
        for (const existing of existingSkillNames) {
          const existingNorm = existing.replace(/[^a-z0-9]/g, '');
          const skillNorm = skillLower.replace(/[^a-z0-9]/g, '');
          
          if (existingNorm.length > 5 && skillNorm.includes(existingNorm)) return false;
          if (skillNorm.length > 5 && existingNorm.includes(skillNorm)) return false;
        }
        
        return true;
      });
      
      console.log("Filtered missingSkills:", result.missingSkills.map(s => s.name).join(", ") || "None");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Profession ATS Score error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
