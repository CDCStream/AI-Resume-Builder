import { NextRequest, NextResponse } from "next/server";
import { Resume } from "@/lib/types/resume";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Dynamic import for pdf-parse to avoid Edge runtime issues
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default as (buffer: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF file");
  }
}

// Dynamic import for mammoth
async function extractTextFromWord(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("Word parsing error:", error);
    throw new Error("Failed to parse Word document");
  }
}

// Helper function to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for API calls
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
        ? (error as { status: number }).status 
        : 0;
      const isRetryable = status === 529 || status === 503 || status === 500 || status === 429;
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      const jitter = Math.random() * 1000;
      const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
      console.log(`API error ${status} (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

const PRIMARY_MODEL = "claude-sonnet-4-6";
const FALLBACK_MODEL = "claude-sonnet-4-20250514";
const FINAL_FALLBACK_MODEL = "claude-sonnet-4-5-20250514";

// Parse resume using Claude AI
async function parseResumeWithAI(text: string, model: string = PRIMARY_MODEL): Promise<Resume> {
  console.log(`=== Starting AI Parse (model: ${model}) ===`);
  console.log("Text length:", text.length);
  console.log("First 500 chars:", text.substring(0, 500));

  try {
    const message = await withRetry(() => anthropic.messages.create({
      model,
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `You are an expert CV/Resume parser. Extract ALL information from this resume into structured JSON.

EXTRACTION RULES:
1. Extract EVERYTHING - do not skip any section
2. For studyType use exactly: "High School", "Associate", "Bachelor's Degree", "Master", or "PhD"
3. Keep dates in their original format
4. For skills, extract each individual skill as a separate entry
5. Look for ALL sections including: Profile/Summary, Experience/Work, Education, Skills, Languages, Certifications, Projects, Awards, Volunteering, Publications, References, Hobbies/Interests
6. For REFERENCES: Parse each reference person's details separately - extract their name, job title/role, company, email, and phone number into separate fields. Do NOT put all info in one field.
7. Return ONLY valid JSON - no markdown code blocks, no explanations

JSON SCHEMA:
{
  "basics": {
    "name": "full name",
    "label": "professional title/headline (e.g., Data Scientist, Software Engineer)",
    "email": "email address",
    "phone": "phone number with country code if present",
    "summary": "professional summary/profile/objective/about section - full text",
    "location": {
      "address": "street address if present",
      "city": "city name",
      "region": "state/province/region",
      "countryCode": "country"
    },
    "profiles": [
      { "network": "LinkedIn", "url": "full URL", "username": "username" },
      { "network": "GitHub", "url": "full URL", "username": "username" }
    ]
  },
  "work": [
    {
      "name": "company/organization name",
      "position": "job title/role",
      "startDate": "start date as written",
      "endDate": "end date or Present/Current",
      "summary": "full job description and responsibilities",
      "highlights": ["key achievement 1", "key achievement 2"],
      "city": "work location city",
      "country": "work location country"
    }
  ],
  "education": [
    {
      "institution": "university/school name",
      "studyType": "Bachelor's Degree/Master/PhD/High School/Associate",
      "area": "field of study/major (e.g., Computer Science, Industrial Engineering)",
      "startDate": "start date",
      "endDate": "end date or expected graduation",
      "score": "GPA/grade if mentioned"
    }
  ],
  "skills": [
    { "name": "Python", "level": "Intermediate/Advanced/Expert if mentioned", "keywords": [] },
    { "name": "Machine Learning", "level": "", "keywords": [] }
  ],
  "languages": [
    { "language": "English", "fluency": "Native/Fluent/Intermediate/Basic" },
    { "language": "Turkish", "fluency": "Native" }
  ],
  "certificates": [
    { "name": "certificate name", "date": "date obtained", "issuer": "issuing organization", "url": "" }
  ],
  "projects": [
    { "name": "project name", "description": "project description", "startDate": "", "endDate": "", "url": "", "highlights": [] }
  ],
  "awards": [
    { "title": "award name", "date": "date", "awarder": "organization", "summary": "description" }
  ],
  "volunteer": [
    { "organization": "org name", "position": "role", "startDate": "", "endDate": "", "summary": "description" }
  ],
  "publications": [
    { "name": "publication title", "publisher": "publisher", "releaseDate": "", "url": "", "summary": "" }
  ],
  "references": [
    {
      "name": "reference person's full name",
      "role": "their job title (e.g., Engineering Manager, Founder, Software Engineer)",
      "company": "company/organization they work at",
      "email": "their email address",
      "phone": "their phone number",
      "reference": "any additional notes or relationship description"
    }
  ],
  "interests": [
    { "name": "hobby/interest name", "keywords": [] }
  ],
  "hobbies": [
    { "name": "hobby name", "description": "" }
  ]
}

RESUME TEXT:
"""
${text}
"""

Parse the above resume and return the complete JSON object:`
        }
      ]
    }));

    console.log("Claude API response received");
    console.log("Stop reason:", message.stop_reason);

    // Extract text content from response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map(block => block.text)
      .join("");

    console.log("Response length:", responseText.length);
    console.log("Response preview:", responseText.substring(0, 500));

    // Clean up the response - remove markdown code blocks if present
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

    // Parse the JSON
    const parsedResume = JSON.parse(cleanedResponse) as Resume;
    
    console.log("=== AI Parse Success ===");
    console.log("Parsed name:", parsedResume.basics?.name);
    console.log("Work count:", parsedResume.work?.length);
    console.log("Education count:", parsedResume.education?.length);
    console.log("Skills count:", parsedResume.skills?.length);
    
    return parsedResume;
  } catch (error) {
    console.error("=== AI Parse Error ===");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && 'status' in error) {
      console.error("Status:", (error as { status: number }).status);
    }
    throw error;
  }
}

// Simpler AI parsing prompt for retry
async function parseResumeWithAISimple(text: string, model: string = PRIMARY_MODEL): Promise<Resume> {
  console.log(`=== Starting Simple AI Parse (model: ${model}) ===`);

  try {
    const message = await withRetry(() => anthropic.messages.create({
      model,
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `Extract information from this CV/Resume text into JSON.

Return a JSON object with these fields (use empty string "" or empty array [] if not found):

{
  "basics": { "name": "", "label": "", "email": "", "phone": "", "summary": "", "location": { "city": "", "region": "", "countryCode": "" }, "profiles": [] },
  "work": [{ "name": "", "position": "", "startDate": "", "endDate": "", "summary": "", "highlights": [], "city": "", "country": "" }],
  "education": [{ "institution": "", "studyType": "", "area": "", "startDate": "", "endDate": "" }],
  "skills": [{ "name": "", "level": "" }],
  "languages": [{ "language": "", "fluency": "" }],
  "certificates": [{ "name": "", "issuer": "", "date": "" }],
  "references": [{ "name": "", "role": "", "company": "", "email": "", "phone": "" }],
  "projects": [],
  "awards": [],
  "hobbies": []
}

For studyType use: "High School", "Associate", "Bachelor's Degree", "Master", or "PhD"

CV TEXT:
${text}

JSON (no markdown, only the object):`
        }
      ]
    }));

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map(block => block.text)
      .join("");

    console.log("Simple parse response length:", responseText.length);

    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith("```json")) cleanedResponse = cleanedResponse.slice(7);
    else if (cleanedResponse.startsWith("```")) cleanedResponse = cleanedResponse.slice(3);
    if (cleanedResponse.endsWith("```")) cleanedResponse = cleanedResponse.slice(0, -3);
    cleanedResponse = cleanedResponse.trim();

    const parsedResume = JSON.parse(cleanedResponse) as Resume;
    
    console.log("Simple parse - Name:", parsedResume.basics?.name);
    console.log("Simple parse - Work:", parsedResume.work?.length);
    console.log("Simple parse - Education:", parsedResume.education?.length);
    
    return parsedResume;
  } catch (error) {
    console.error("Simple AI parse error:", error);
    throw error;
  }
}

// Validate parsed resume - check if it has meaningful content
function validateParsedResume(resume: Resume, originalText: string): { isValid: boolean; score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;
  
  // Check basics
  if (resume.basics?.name && resume.basics.name.length > 2) {
    score += 20;
  } else {
    issues.push("Name not found");
  }
  
  if (resume.basics?.email && resume.basics.email.includes("@")) {
    score += 10;
  }
  
  if (resume.basics?.phone && resume.basics.phone.length > 5) {
    score += 10;
  }
  
  if (resume.basics?.summary && resume.basics.summary.length > 50) {
    score += 15;
  } else if (originalText.toLowerCase().includes("summary") || originalText.toLowerCase().includes("profile") || originalText.toLowerCase().includes("about")) {
    issues.push("Summary section exists in text but not parsed");
  }
  
  // Check work experience
  if (resume.work && resume.work.length > 0) {
    score += 20;
    // Check if work entries have actual content
    const validWorkEntries = resume.work.filter(w => w.name || w.position);
    if (validWorkEntries.length < resume.work.length) {
      issues.push("Some work entries are empty");
    }
  } else if (originalText.toLowerCase().includes("experience") || originalText.toLowerCase().includes("employment")) {
    issues.push("Experience section exists in text but not parsed");
  }
  
  // Check education
  if (resume.education && resume.education.length > 0) {
    score += 15;
    const validEduEntries = resume.education.filter(e => e.institution || e.area);
    if (validEduEntries.length < resume.education.length) {
      issues.push("Some education entries are empty");
    }
  } else if (originalText.toLowerCase().includes("education") || originalText.toLowerCase().includes("university") || originalText.toLowerCase().includes("degree")) {
    issues.push("Education section exists in text but not parsed");
  }
  
  // Check skills
  if (resume.skills && resume.skills.length > 0) {
    score += 10;
  } else if (originalText.toLowerCase().includes("skills") || originalText.toLowerCase().includes("technologies")) {
    issues.push("Skills section exists in text but not parsed");
  }
  
  // Determine if valid (score >= 40 means at least basics + one major section)
  const isValid = score >= 40;
  
  console.log("=== Validation Results ===");
  console.log("Score:", score);
  console.log("Is Valid:", isValid);
  console.log("Issues:", issues);
  
  return { isValid, score, issues };
}

// Fallback regex-based parser (simplified)
function parseResumeTextFallback(text: string): Resume {
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

  // Extract name (first reasonable line)
  let name = "";
  for (const line of lines.slice(0, 5)) {
    if (line.length > 2 && line.length < 60) {
      if (!line.includes("@") && !line.includes("http") && !/^\+?\d[\d\s-]{6,}$/.test(line)) {
        name = line;
        break;
      }
    }
  }

  // Extract email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : "";

  // Extract phone
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // Extract LinkedIn URL
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const linkedinUrl = linkedinMatch ? `https://${linkedinMatch[0]}` : "";

  return {
    basics: {
      name,
      email,
      phone,
      summary: "",
      label: "",
      image: "",
      location: { city: "", region: "", countryCode: "" },
      profiles: linkedinUrl ? [{ network: "LinkedIn", url: linkedinUrl, username: "" }] : [],
    },
    work: [],
    education: [],
    skills: [],
    languages: [],
    certificates: [],
    volunteer: [],
    projects: [],
    publications: [],
    awards: [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine file type and extract text
    let text = "";
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".pdf")) {
      text = await extractTextFromPDF(buffer);
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      text = await extractTextFromWord(buffer);
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload PDF or Word document." },
        { status: 400 }
      );
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract text from the file. The file may be empty or image-based." },
        { status: 400 }
      );
    }

    console.log("=== Resume Upload ===");
    console.log("File:", file.name);
    console.log("Extracted text length:", text.length);
    console.log("=== Extracted Text Preview ===");
    console.log(text.substring(0, 1500));
    console.log("=== End Preview ===");

    // Try AI parsing with validation and retry
    let resume: Resume;
    let parseMethod = "unknown";
    let validationResult = { isValid: false, score: 0, issues: [] as string[] };

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("No ANTHROPIC_API_KEY found, using fallback parser");
      resume = parseResumeTextFallback(text);
      parseMethod = "fallback-no-api-key";
    } else {
      // First attempt with primary model
      try {
        console.log(`Attempt 1: Parsing with ${PRIMARY_MODEL}...`);
        resume = await parseResumeWithAI(text, PRIMARY_MODEL);
        parseMethod = "ai-attempt-1";
        
        validationResult = validateParsedResume(resume, text);
        
        if (!validationResult.isValid) {
          console.log("AI parsing result is incomplete, trying again with simpler prompt...");
          try {
            resume = await parseResumeWithAISimple(text, PRIMARY_MODEL);
            parseMethod = "ai-attempt-2-simple";
            validationResult = validateParsedResume(resume, text);
          } catch (retryError) {
            console.error("Retry also failed:", retryError);
          }
        }
      } catch (aiError) {
        const isOverloaded = aiError instanceof Error && 'status' in aiError &&
          ((aiError as { status: number }).status === 529 || (aiError as { status: number }).status === 503);

        if (isOverloaded) {
          console.log(`Primary model overloaded, trying fallback model: ${FALLBACK_MODEL}...`);
          try {
            resume = await parseResumeWithAI(text, FALLBACK_MODEL);
            parseMethod = "ai-fallback-model";
            validationResult = validateParsedResume(resume, text);

            if (!validationResult.isValid) {
              try {
                resume = await parseResumeWithAISimple(text, FALLBACK_MODEL);
                parseMethod = "ai-fallback-model-simple";
                validationResult = validateParsedResume(resume, text);
              } catch (retryError) {
                console.error("Fallback simple retry also failed:", retryError);
              }
            }
          } catch (fallbackError) {
            const fallbackStatus = fallbackError instanceof Error && 'status' in fallbackError
              ? (fallbackError as { status: number }).status : 0;
            if (fallbackStatus === 529 || fallbackStatus === 503) {
              console.log(`Fallback model also overloaded, trying final fallback: ${FINAL_FALLBACK_MODEL}...`);
              try {
                resume = await parseResumeWithAI(text, FINAL_FALLBACK_MODEL);
                parseMethod = "ai-final-fallback-model";
                validationResult = validateParsedResume(resume, text);

                if (!validationResult.isValid) {
                  try {
                    resume = await parseResumeWithAISimple(text, FINAL_FALLBACK_MODEL);
                    parseMethod = "ai-final-fallback-model-simple";
                    validationResult = validateParsedResume(resume, text);
                  } catch (retryError) {
                    console.error("Final fallback simple retry also failed:", retryError);
                  }
                }
              } catch (finalFallbackError) {
                console.error("Final fallback model also failed:", finalFallbackError);
                resume = parseResumeTextFallback(text);
                parseMethod = "fallback-after-all-models-failed";
              }
            } else {
              console.error("Fallback model failed (non-overload):", fallbackError);
              resume = parseResumeTextFallback(text);
              parseMethod = "fallback-after-all-models-failed";
            }
          }
        } else {
          console.error("AI parsing failed completely:", aiError);
          resume = parseResumeTextFallback(text);
          parseMethod = "fallback-after-error";
        }
      }

      // If still not valid, enhance with regex fallback
      if (!validationResult.isValid) {
        console.log("AI parsing still incomplete (score: " + validationResult.score + "), enhancing with fallback...");
        const fallbackResume = parseResumeTextFallback(text);
        
        if (!resume.basics?.name && fallbackResume.basics?.name) {
          resume.basics = { ...resume.basics, name: fallbackResume.basics.name };
        }
        if (!resume.basics?.email && fallbackResume.basics?.email) {
          resume.basics = { ...resume.basics, email: fallbackResume.basics.email };
        }
        if (!resume.basics?.phone && fallbackResume.basics?.phone) {
          resume.basics = { ...resume.basics, phone: fallbackResume.basics.phone };
        }
        parseMethod += "+fallback-enhanced";
      }
    }

    console.log("=== Final Result ===");
    console.log("Parse method:", parseMethod);
    console.log("Validation score:", validationResult.score);
    console.log("Name:", resume.basics?.name);
    console.log("Work entries:", resume.work?.length);
    console.log("Education entries:", resume.education?.length);
    console.log("Skills:", resume.skills?.length);
    console.log("Languages:", resume.languages?.length);
    console.log("References:", resume.references?.length);

    // Return with metadata about parsing quality
    return NextResponse.json({ 
      resume,
      _meta: {
        parseMethod,
        validationScore: validationResult.score,
        issues: validationResult.issues,
        textLength: text.length
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process resume file" },
      { status: 500 }
    );
  }
}
