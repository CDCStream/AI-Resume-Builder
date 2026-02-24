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

export interface ATSOptimizeRequest {
  type: "quick" | "tailored";
  field: "professionalTitle" | "professionalSummary" | "workExperience" | "education" | "project" | "skill" | "volunteer" | "award" | "certificate" | "skillsSuggestion" | "full_resume";
  currentValue: string;
  jobDescription?: string;
  context?: {
    name?: string;
    currentTitle?: string;
    skills?: string[];
    experience?: { position: string; company: string; summary: string }[];
  };
}

export interface ATSChange {
  before: string;
  after: string;
  reason: string;
}

export interface ATSOptimizeResponse {
  optimizedValue: string;
  changes: ATSChange[];
  suggestedSkills?: { name: string; level: string }[];
  suggestedLanguages?: { language: string; fluency: string }[];
}

export async function POST(request: NextRequest) {
  console.log("=== ATS Optimize API Called ===");
  try {
    const body: ATSOptimizeRequest = await request.json();
    const { type, field, currentValue, jobDescription, context } = body;

    console.log("Request:", { type, field, currentValueLength: currentValue?.length });

    if (!currentValue && type === "quick") {
      console.log("Error: No content to optimize");
      return NextResponse.json(
        { error: "No content to optimize" },
        { status: 400 }
      );
    }

    if (type === "tailored" && !jobDescription) {
      console.log("Error: Job description required");
      return NextResponse.json(
        { error: "Job description is required for tailored optimization" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("Error: API key not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    let prompt = "";
    
    if (type === "quick") {
      prompt = getQuickOptimizePrompt(field, currentValue, context);
    } else {
      prompt = getTailoredOptimizePrompt(field, currentValue, jobDescription!, context);
    }

    console.log("Calling Claude API...");
    const maxTokens = field === "full_resume" ? 8192 : 4096;
    let message;
    try {
      message = await withRetry(() => anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
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
          max_tokens: maxTokens,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        }));
      } else throw err;
    }
    console.log("Claude API response received");

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

    let result: ATSOptimizeResponse;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error, attempting to fix truncated JSON...");
      
      // Try to fix truncated JSON by finding valid JSON structure
      let fixedJson = cleanedResponse;
      
      // If JSON is truncated, try to close it properly
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/]/g) || []).length;
      
      // Remove any incomplete string at the end
      const lastCompleteStringEnd = fixedJson.lastIndexOf('",');
      const lastObjectEnd = fixedJson.lastIndexOf('}');
      const lastArrayEnd = fixedJson.lastIndexOf(']');
      
      if (lastCompleteStringEnd > lastObjectEnd && lastCompleteStringEnd > lastArrayEnd) {
        fixedJson = fixedJson.substring(0, lastCompleteStringEnd + 1);
      }
      
      // Close unclosed arrays and objects
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += "]";
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += "}";
      }
      
      try {
        result = JSON.parse(fixedJson);
        console.log("Successfully fixed truncated JSON");
      } catch (secondError) {
        // Last resort: return a minimal valid response
        console.error("Could not fix JSON, returning minimal response");
        result = {
          optimizedValue: currentValue,
          changes: [{
            before: "Original content",
            after: "Optimization was too large to process completely",
            reason: "The AI response was truncated. Please try optimizing smaller sections individually."
          }]
        };
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("ATS Optimize error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to optimize content" },
      { status: 500 }
    );
  }
}

function getQuickOptimizePrompt(
  field: string,
  currentValue: string,
  context?: ATSOptimizeRequest["context"]
): string {
  const fieldInstructions: Record<string, string> = {
    professionalTitle: `Optimize this professional title for ATS (Applicant Tracking Systems):
- Use standard, widely-recognized job titles
- Remove abbreviations or informal titles
- Make it clear and searchable
- Keep it concise (2-4 words typically)
- Use industry-standard terminology

Examples:
- "Sr. Dev" → "Senior Software Developer"
- "Full Stack Guy" → "Full Stack Developer"
- "Marketing Ninja" → "Marketing Specialist"`,

    professionalSummary: `Optimize this professional summary for ATS:
- Start with a strong professional identity statement
- Include years of experience if mentioned
- Add relevant action verbs (Led, Developed, Managed, Implemented, etc.)
- Include measurable achievements if possible
- Use industry keywords naturally
- Keep it 3-5 sentences, 400-600 characters
- Avoid personal pronouns (I, my, me)
- Make it scannable and impactful`,

    workExperience: `Optimize this work experience description for ATS:
- Start each bullet point with a strong action verb
- Include quantifiable achievements (%, $, numbers)
- Use industry-standard terminology
- Include relevant technical skills and tools
- Focus on results and impact, not just duties
- Keep descriptions concise but informative
- Use keywords that ATS systems look for`,

    education: `Optimize this education description for ATS:
- Highlight relevant coursework, thesis topics, or academic projects
- Include academic achievements (honors, GPA if strong, scholarships)
- Mention relevant skills or tools learned
- Use action verbs for research or projects (Researched, Analyzed, Developed)
- Keep it concise but impactful
- Include keywords relevant to your target field`,

    project: `Optimize this project description for ATS:
- Start with the project's purpose and your role
- Include technologies, tools, and methodologies used
- Highlight measurable outcomes or impact
- Use action verbs (Built, Designed, Implemented, Deployed)
- Include relevant technical keywords
- Focus on problem-solving and results`,

    skill: `Optimize this skill name for ATS:
- Use the full, standard name (no abbreviations)
- Use industry-recognized terminology
- Make it searchable by recruiters and ATS systems

Examples:
- "JS" → "JavaScript"
- "ML" → "Machine Learning"
- "K8s" → "Kubernetes"
- "AWS" → "Amazon Web Services (AWS)"`,

    volunteer: `Optimize this volunteer experience description for ATS:
- Highlight leadership and organizational skills
- Include measurable impact (people helped, funds raised, events organized)
- Use action verbs (Organized, Led, Coordinated, Managed)
- Connect volunteer work to transferable professional skills
- Include relevant keywords`,

    award: `Optimize this award/achievement description for ATS:
- Clearly state what the award was for
- Include the significance or selection criteria if notable
- Mention any quantifiable achievements that led to the award
- Use professional language
- Highlight skills demonstrated`,

    certificate: `Optimize this certification description for ATS:
- Include the full official name of the certification
- Mention the issuing organization clearly
- Highlight key skills or knowledge validated
- Include any notable achievements (scores, distinctions)
- Use industry-standard terminology`,

    full_resume: `Optimize this complete resume for ATS (Applicant Tracking Systems):
- Use industry-standard terminology throughout
- Ensure consistent formatting and structure
- Include relevant keywords for the candidate's field
- Use strong action verbs for all experience descriptions
- Include quantifiable achievements where possible
- Ensure professional titles are clear and searchable
- Make the professional summary impactful and keyword-rich
- Format skills with full names (no abbreviations)
- Ensure all sections are ATS-scannable

IMPORTANT: Return a summarized version with key changes. Focus on the most impactful improvements (top 5-10 changes). Do NOT return the entire optimized resume in the response to keep it concise.`
  };

  return `You are an expert resume writer and ATS optimization specialist.

**MANDATORY LANGUAGE DETECTION AND MATCHING:**
STEP 1: Analyze the "CURRENT CONTENT" section below and identify its primary language.
STEP 2: Your ENTIRE response must be written in that EXACT same language.

LANGUAGE RULES (STRICT - NO EXCEPTIONS):
- Detect the language from the CURRENT CONTENT
- ALL text output MUST be in the DETECTED language:
  * "optimizedValue" - in detected language
  * "before" and "after" - in detected language  
  * "reason" - MUST be in detected language (THIS IS CRITICAL!)
- The "reason" field is an explanation for the user - it MUST be readable in their language

LANGUAGE DETECTION EXAMPLES:
- If content is in ENGLISH → Write ALL fields in ENGLISH
- If content is in TURKISH → Write ALL fields in TURKISH (Türkçe)
- If content is in GERMAN → Write ALL fields in GERMAN (Deutsch)

CORRECT vs WRONG EXAMPLES:
✓ English content → reason: "ATS systems prefer standardized job titles for better keyword matching"
✗ English content → reason: "ATS sistemleri daha iyi anahtar kelime eşleşmesi için standart unvanları tercih eder" (WRONG - Turkish!)

✓ Turkish content → reason: "ATS sistemleri standart iş unvanlarını tercih eder"
✗ Turkish content → reason: "ATS systems prefer standard job titles" (WRONG - English!)

${fieldInstructions[field]}

CURRENT CONTENT:
"""
${currentValue}
"""

${context ? `
CONTEXT:
- Name: ${context.name || "Not provided"}
- Current Role: ${context.currentTitle || "Not provided"}
- Skills: ${context.skills?.join(", ") || "Not provided"}
` : ""}

Return a JSON object with this EXACT structure:
{
  "optimizedValue": "The improved, ATS-optimized version (keep in original language)",
  "changes": [
    {
      "before": "Original text/phrase that was changed",
      "after": "New optimized text/phrase",
      "reason": "Detailed explanation of WHY this change improves ATS compatibility (in content's language)"
    }
  ]
}

CRITICAL REMINDERS:
1. DETECT the language from CURRENT CONTENT
2. Write ALL "reason" fields in that DETECTED language - this is for the user to read!
3. Do NOT default to English or Turkish - match the content language exactly
4. Keep the meaning and core information intact
5. Only improve ATS compatibility and impact
6. List 2-5 specific changes with before/after/reason
7. Return ONLY valid JSON, no markdown`;
}

function getTailoredOptimizePrompt(
  field: string,
  currentValue: string,
  jobDescription: string,
  context?: ATSOptimizeRequest["context"]
): string {
  const fieldInstructions: Record<string, string> = {
    professionalTitle: `Tailor this professional title to match the target job:
- Align with the job title in the posting
- Use exact terminology from the job description
- Keep it professional and ATS-friendly
- Don't lie or exaggerate - keep it truthful`,

    professionalSummary: `Tailor this professional summary for the target job:
- Mirror key phrases from the job description
- Highlight relevant experience that matches requirements
- Include keywords and skills mentioned in the posting
- Show alignment with company values if mentioned
- Keep it 3-5 sentences, 400-600 characters
- Make the connection between your experience and their needs clear`,

    workExperience: `Tailor this work experience for the target job:
- Emphasize experiences relevant to the job requirements
- Use similar terminology and keywords from the job posting
- Highlight achievements that demonstrate required skills
- Quantify results that relate to job expectations
- Reorder or emphasize points that match job requirements`,

    education: `Tailor this education description for the target job:
- Highlight coursework or projects relevant to the job requirements
- Emphasize skills learned that match job requirements
- Include academic achievements that demonstrate relevant capabilities
- Use terminology from the job posting where appropriate`,

    project: `Tailor this project description for the target job:
- Emphasize technologies and tools mentioned in the job posting
- Highlight outcomes relevant to the role's responsibilities
- Use similar terminology from the job description
- Show how project experience transfers to job requirements`,

    skill: `Tailor this skill name for the target job:
- Use the exact terminology from the job description if applicable
- Ensure the skill name matches how it's listed in the job posting
- Use the industry-standard full name`,

    volunteer: `Tailor this volunteer experience for the target job:
- Highlight aspects relevant to the job requirements
- Emphasize transferable skills mentioned in the job posting
- Connect volunteer achievements to professional capabilities
- Use similar language from the job description`,

    award: `Tailor this award description for the target job:
- Emphasize aspects of the achievement relevant to the job
- Connect the award to skills or qualities mentioned in the posting
- Highlight how this recognition relates to job requirements`,

    certificate: `Tailor this certification for the target job:
- Emphasize how the certification relates to job requirements
- Highlight specific knowledge or skills validated that match the posting
- Use terminology consistent with the job description`,

    skillsSuggestion: `Analyze the job description and suggest skills to add:
- Identify required and preferred skills from the job posting
- Compare with the candidate's existing skills
- Suggest missing skills that the candidate likely has based on their experience
- Prioritize hard/technical skills over soft skills
- Use industry-standard skill names
- IMPORTANT: Skills are typically written in English. If the existing skills are in English, write ALL your response (including reasons) in English regardless of the job description language.`,

    full_resume: `Tailor this complete resume for the target job:
- Align professional title and summary with job requirements
- Emphasize relevant experience and skills mentioned in the job posting
- Use exact terminology and keywords from the job description
- Reorder or emphasize achievements that match job requirements
- Suggest additional skills from the job posting

IMPORTANT: Return a summarized version with key changes. Focus on the most impactful improvements (top 5-10 changes). Do NOT return the entire optimized resume in the response to keep it concise.`
  };

  return `You are an expert resume writer and ATS optimization specialist.

**MANDATORY LANGUAGE RULE:**
Detect the language from "CURRENT CONTENT TO OPTIMIZE" section below.
Your ENTIRE response (including ALL "reason" fields) MUST be written in THAT language.

CRITICAL: The language of your response is determined by the CURRENT CONTENT, NOT by the job description!

LANGUAGE RULES:
- If CURRENT CONTENT is in ENGLISH (e.g., skill names like "Python, SQL, Machine Learning") → Write ALL output in ENGLISH
- If CURRENT CONTENT is in TURKISH → Write ALL output in TURKISH
- If CURRENT CONTENT is in GERMAN → Write ALL output in GERMAN

IMPORTANT FOR SKILLS:
- Technical skill names (Python, SQL, AWS, etc.) are ALWAYS considered ENGLISH
- If the content contains English skill names, your response MUST be in ENGLISH
- Do NOT write Turkish/German explanations for English skills!

CORRECT:
✓ Skills: "Python, SQL, Machine Learning" → reason: "This skill is required in the job posting"
✗ Skills: "Python, SQL, Machine Learning" → reason: "Bu beceri iş ilanında gerekli" (WRONG!)

✓ Content in Turkish → reason: "Bu değişiklik ATS uyumluluğunu artırır"
✗ Content in Turkish → reason: "This change improves ATS compatibility" (WRONG!)

${fieldInstructions[field]}

TARGET JOB DESCRIPTION:
"""
${jobDescription}
"""

CURRENT CONTENT TO OPTIMIZE:
"""
${currentValue}
"""

${context ? `
CANDIDATE CONTEXT:
- Name: ${context.name || "Not provided"}
- Current Role: ${context.currentTitle || "Not provided"}
- Skills: ${context.skills?.join(", ") || "Not provided"}
` : ""}

Return a JSON object with this EXACT structure:
{
  "optimizedValue": "The tailored, ATS-optimized version",
  "changes": [
    {
      "before": "Original text/phrase that was changed",
      "after": "New optimized text/phrase",
      "reason": "Explanation in the SAME LANGUAGE as CURRENT CONTENT"
    }
  ],
  "suggestedSkills": [
    {"name": "Skill from job description not in resume", "level": "Intermediate"},
    ...
  ],
  "suggestedLanguages": [
    {"language": "Language if mentioned in job description", "fluency": "Intermediate"},
    ...
  ]
}

CRITICAL REMINDERS:
1. DETECT the language from CURRENT CONTENT TO OPTIMIZE
2. Write ALL "reason" fields in that DETECTED language - this is for the user to read!
3. If skills are in English (Python, SQL, etc.), write reasons in English
4. Keep truthful - don't add experience they don't have
5. Only suggest skills/languages if relevant to the job AND not already in their profile
6. Return ONLY valid JSON, no markdown`;
}
