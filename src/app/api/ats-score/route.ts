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

export interface ATSScoreRequest {
  jobDescription: string;
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

export interface ATSScoreResponse {
  score: number;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingSkills: Array<{ name: string; importance: "required" | "preferred" | "nice-to-have" }>;
  weakAreas: WeakArea[];
  strengths: string[];
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  console.log("=== ATS Score API Called ===");
  try {
    const body: ATSScoreRequest = await request.json();
    const { jobDescription, resume } = body;

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required" },
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
    const prompt = getATSScorePrompt(jobDescription, resumeText, resume);

    // Log current skills being analyzed
    const currentSkills = resume.skills?.map(s => s.name).filter(Boolean) || [];
    console.log("Analyzing with skills:", currentSkills.join(", ") || "None");
    console.log("Calling Claude API for ATS Score analysis...");
    const message = await withRetry(() => anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }));
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

    let result: ATSScoreResponse;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error, attempting to fix truncated JSON...");
      console.error("Response length:", cleanedResponse.length);
      
      // Try to fix truncated JSON by closing open structures
      let fixedJson = cleanedResponse;
      
      // Count open brackets and braces
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/]/g) || []).length;
      
      // Remove incomplete last element if in array/object
      if (fixedJson.match(/,\s*$/)) {
        fixedJson = fixedJson.replace(/,\s*$/, '');
      }
      // Remove incomplete string
      if (fixedJson.match(/:\s*"[^"]*$/)) {
        fixedJson = fixedJson.replace(/:\s*"[^"]*$/, ': ""');
      }
      
      // Close arrays and objects
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
        // If still fails, return a minimal valid response
        console.error("Could not fix JSON, returning minimal response");
        result = {
          score: 50,
          summary: "Analysis was interrupted. Please try again with a shorter job description.",
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
    // This is a safety check in case AI didn't follow instructions
    const existingSkillNames = (resume.skills || [])
      .map(s => (s.name || "").toLowerCase())
      .filter(Boolean);
    
    // Extract core keywords from existing skills for fuzzy matching
    const extractKeywords = (skill: string): string[] => {
      const lower = skill.toLowerCase();
      // Split by common separators and extract meaningful words
      const words = lower.split(/[\s\/\-\(\)]+/).filter(w => w.length > 2);
      // Also keep the full normalized version
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
        
        // Check exact match
        if (existingSkillNames.includes(skillLower)) return false;
        
        // Check if any keyword from the missing skill exists in existing skills
        // e.g., "Airflow DAG Orchestration" contains "airflow" which is in "Apache Airflow"
        for (const keyword of skillKeywords) {
          if (keyword.length > 3 && existingKeywords.has(keyword)) {
            console.log(`Filtering "${skill.name}" - keyword "${keyword}" found in existing skills`);
            return false;
          }
        }
        
        // Check if existing skill contains the core of missing skill or vice versa
        for (const existing of existingSkillNames) {
          // "Apache Airflow" contains "airflow", "Airflow DAG..." also contains "airflow"
          const existingNorm = existing.replace(/[^a-z0-9]/g, '');
          const skillNorm = skillLower.replace(/[^a-z0-9]/g, '');
          
          // Check substring matches for longer strings
          if (existingNorm.length > 5 && skillNorm.includes(existingNorm)) return false;
          if (skillNorm.length > 5 && existingNorm.includes(skillNorm)) return false;
        }
        
        return true;
      });
      
      console.log("Filtered missingSkills:", result.missingSkills.map(s => s.name).join(", ") || "None");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("ATS Score error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate ATS score" },
      { status: 500 }
    );
  }
}

function formatResumeForAnalysis(resume: ATSScoreRequest["resume"]): string {
  const parts: string[] = [];

  if (resume.basics) {
    if (resume.basics.name) parts.push(`Name: ${resume.basics.name}`);
    if (resume.basics.label) parts.push(`Title: ${resume.basics.label}`);
    if (resume.basics.summary) parts.push(`Summary: ${resume.basics.summary}`);
  }

  if (resume.work && resume.work.length > 0) {
    parts.push("\nWork Experience:");
    resume.work.forEach((job, i) => {
      parts.push(`  ${i + 1}. ${job.position || "Unknown Position"} at ${job.name || "Unknown Company"}`);
      if (job.summary) parts.push(`     ${job.summary}`);
    });
  }

  if (resume.education && resume.education.length > 0) {
    parts.push("\nEducation:");
    resume.education.forEach((edu, i) => {
      parts.push(`  ${i + 1}. ${edu.studyType || ""} in ${edu.area || ""} at ${edu.institution || "Unknown Institution"}`);
      if (edu.summary) parts.push(`     ${edu.summary}`);
    });
  }

  if (resume.skills && resume.skills.length > 0) {
    parts.push("\nSkills:");
    const skillNames = resume.skills.map(s => s.name).filter(Boolean);
    parts.push(`  ${skillNames.join(", ")}`);
  }

  if (resume.projects && resume.projects.length > 0) {
    parts.push("\nProjects:");
    resume.projects.forEach((proj, i) => {
      parts.push(`  ${i + 1}. ${proj.name || "Unknown Project"}`);
      if (proj.description) parts.push(`     ${proj.description}`);
    });
  }

  if (resume.certificates && resume.certificates.length > 0) {
    parts.push("\nCertifications:");
    resume.certificates.forEach((cert, i) => {
      parts.push(`  ${i + 1}. ${cert.name || "Unknown Certificate"} (${cert.issuer || "Unknown Issuer"})`);
    });
  }

  return parts.join("\n");
}

function getATSScorePrompt(jobDescription: string, resumeText: string, resume: ATSScoreRequest["resume"]): string {
  return `You are an ATS analyst. Analyze resume-job match and return JSON.

**LANGUAGE:** Match the job description language (English/Turkish/German).

**CRITICAL: Keep responses CONCISE to avoid truncation:**
- matchedKeywords: max 10 items
- missingKeywords: max 10 items  
- missingSkills: LIST ALL MISSING SKILLS IN ONE RESPONSE (max 15 items). Use SHORT SPECIFIC NAMES.
- weakAreas: max 5 items (most important only)
- strengths: max 5 items
- recommendations: max 5 items
- Keep all text fields SHORT (1-2 sentences max)

**SKILL NAMING RULE:** For missingSkills, use SPECIFIC tool/technology names only.
WRONG: "Cloud ML platforms (AWS SageMaker etc.)", "CI/CD tools", "Container orchestration", "dbt Core (production)"
CORRECT: "AWS SageMaker", "Jenkins", "Kubernetes", "Docker", "TensorFlow", "dbt", "Pytest", "GitHub Actions"

**=== CRITICAL - EXISTING SKILLS CHECK ===**
CANDIDATE'S CURRENT SKILLS: ${resume.skills?.map(s => s.name).filter(Boolean).join(", ") || "None"}

ABSOLUTE RULES FOR missingSkills (MUST FOLLOW):
1. NEVER include any skill already in the list above - check EVERY skill before adding
2. If "XGBoost/LightGBM" exists → "XGBoost" and "LightGBM" are NOT missing
3. If "dbt" exists → "dbt Core", "dbt (production)" are NOT missing  
4. If "Git/Github" exists → "Git", "GitHub", "GitHub Actions" are NOT missing
5. If "A/B Testing Framework" exists → "A/B Testing", "Pytest" are NOT missing
6. Partial matches count: "Docker" in skills means Docker is NOT missing
7. The score should INCREASE if all required skills are present

**CONSISTENCY RULE:** List ALL missing skills in the FIRST analysis. Do NOT add new missing skills in subsequent analyses if the resume hasn't changed significantly.

JOB:
${jobDescription.slice(0, 3000)}

RESUME:
${resumeText.slice(0, 2000)}

EXISTING SKILLS (DO NOT LIST AS MISSING): ${resume.skills?.map(s => s.name).filter(Boolean).join(", ") || "None"}

Return ONLY this JSON (no markdown):
{
  "score": <0-100>,
  "summary": "<2 sentences max>",
  "matchedKeywords": ["..."],
  "missingKeywords": ["..."],
  "missingSkills": [{"name": "...", "importance": "required|preferred|nice-to-have"}],
  "weakAreas": [{"section": "professionalTitle|professionalSummary|workExperience|education|skills|projects", "field": "...", "currentValue": "...", "issue": "...", "suggestion": "...", "priority": "high|medium|low"}],
  "strengths": ["..."],
  "recommendations": ["..."]
}

Score: 90+=excellent, 75-89=good, 60-74=moderate, 40-59=weak, <40=poor`;
}
