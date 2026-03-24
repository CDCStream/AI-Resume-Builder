import { NextRequest, NextResponse } from "next/server";
import { generateText, cleanJsonResponse } from "@/lib/ai-provider";

interface ResumeData {
  basics?: {
    name?: string;
    label?: string;
    summary?: string;
    email?: string;
    phone?: string;
    location?: { city?: string; country?: string; region?: string };
  };
  work?: Array<{
    position?: string;
    name?: string;
    summary?: string;
    startDate?: string;
    endDate?: string;
    highlights?: string[];
  }>;
  education?: Array<{
    institution?: string;
    area?: string;
    studyType?: string;
    startDate?: string;
    endDate?: string;
  }>;
  skills?: Array<{ name?: string; level?: string; keywords?: string[] }>;
  projects?: Array<{ name?: string; description?: string }>;
  certificates?: Array<{ name?: string }>;
  languages?: Array<{ language?: string; fluency?: string }>;
}

function formatResume(resume: ResumeData): string {
  let text = "";

  if (resume.basics) {
    if (resume.basics.name) text += `Name: ${resume.basics.name}\n`;
    if (resume.basics.label) text += `Title: ${resume.basics.label}\n`;
    if (resume.basics.location) {
      text += `Location: ${resume.basics.location.city || ""}, ${resume.basics.location.country || ""}\n`;
    }
    if (resume.basics.summary) text += `Summary: ${resume.basics.summary}\n`;
  }

  if (resume.work && resume.work.length > 0) {
    text += "\nWork Experience:\n";
    resume.work.forEach((w, i) => {
      text += `${i + 1}. ${w.position || "?"} at ${w.name || "?"}`;
      if (w.startDate || w.endDate) text += ` (${w.startDate || "?"} - ${w.endDate || "Present"})`;
      text += "\n";
      if (w.summary) text += `   ${w.summary.substring(0, 200)}\n`;
      if (w.highlights?.length) text += `   Key: ${w.highlights.slice(0, 3).join("; ")}\n`;
    });
  }

  if (resume.education && resume.education.length > 0) {
    text += "\nEducation:\n";
    resume.education.forEach((e, i) => {
      text += `${i + 1}. ${e.studyType || "Degree"} in ${e.area || "?"} from ${e.institution || "?"}\n`;
    });
  }

  if (resume.skills && resume.skills.length > 0) {
    text += "\nSkills: " + resume.skills.map(s => s.name).filter(Boolean).join(", ") + "\n";
  }

  return text;
}

export async function POST(request: NextRequest) {
  try {
    const { resume, jobDescription } = await request.json();

    if (!resume) {
      return NextResponse.json({ error: "Resume data is required" }, { status: 400 });
    }

    const resumeText = formatResume(resume);
    const hasJob = !!jobDescription?.trim();

    const jobContext = hasJob
      ? `\nTARGET JOB POSTING:\n${jobDescription.trim().substring(0, 2000)}\n\nYou are the recruiter who posted THIS specific job. Evaluate this resume from the perspective of whether this candidate fits THIS role. Compare their title, experience, skills, and education against what the job requires.`
      : "";

    const evaluationFocus = hasJob
      ? "Focus on role fit: Does the candidate's title match? Do they have relevant industry experience? Is their education aligned with the job requirements? Do they have the key skills mentioned in the job posting?"
      : "Focus on what caught the eye in 6 seconds (job titles, company names, school prestige, title clarity).";

    const prompt = `You are a senior headhunter / recruiter with 15 years of experience. You just spent 6 seconds scanning this resume.${hasJob ? " You are hiring for a specific role." : ""} Based on ONLY what you saw in those 6 seconds (Name/Title, Work Experience headlines, Education), decide:

Would you continue reading this resume or move on to the next one?

RESUME:
${resumeText}${jobContext}

IMPORTANT: Respond in the SAME LANGUAGE as the resume content. If the resume is in Turkish, respond in Turkish. If English, respond in English.

Return ONLY valid JSON:
{
  "probability": <number 0-100, likelihood of continuing to read>,
  "verdict": "<one short sentence: would you read more or pass?>",
  "positives": [
    { "icon": "briefcase|graduation-cap|star|target|zap", "title": "<short title>", "detail": "<1 sentence why this is good>" }
  ],
  "negatives": [
    { "icon": "alert-triangle|x-circle|clock|help-circle", "title": "<short title>", "detail": "<1 sentence what's missing or weak>" }
  ],
  "tip": "<1 actionable tip to improve the 6-second impression>"
}

Rules:
- probability: Be realistic. Average resumes get 30-50%. Strong ones get 60-80%. Exceptional ones get 80%+.${hasJob ? " If the candidate is clearly not a fit for the role, probability should be under 20%." : ""}
- positives: 2-4 items. ${evaluationFocus}
- negatives: 1-3 items. What was missing, unclear, or misaligned${hasJob ? " with the job requirements" : ""} in those 6 seconds.
- icon: Use one of the allowed values exactly.
- Keep all text concise — max 1 sentence each.`;

    const { text: responseText } = await generateText({ user: prompt, maxTokens: 2048 });

    let cleaned = cleanJsonResponse(responseText);

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      let fixed = cleaned;
      if (fixed.match(/,\s*$/)) fixed = fixed.replace(/,\s*$/, "");
      const ob = (fixed.match(/{/g) || []).length;
      const cb = (fixed.match(/}/g) || []).length;
      const oq = (fixed.match(/\[/g) || []).length;
      const cq = (fixed.match(/]/g) || []).length;
      for (let i = 0; i < ob - cb; i++) fixed += "}";
      for (let i = 0; i < oq - cq; i++) fixed += "]";
      result = JSON.parse(fixed);
    }

    // Server-side location mismatch check
    if (hasJob && resume.basics?.location) {
      const candidateCity = (resume.basics.location.city || "").toLowerCase().trim();
      const candidateCountry = (resume.basics.location.country || "").toLowerCase().trim();
      const candidateRegion = (resume.basics.location.region || "").toLowerCase().trim();
      const jobText = jobDescription.trim().toLowerCase();

      const isRemote = /\b(remote|uzaktan|home\s*office|work\s*from\s*home|fully\s*remote|100%\s*remote)\b/i.test(jobText);

      if (!isRemote && (candidateCity || candidateCountry)) {
        const candidateTokens = [candidateCity, candidateCountry, candidateRegion].filter(Boolean);
        const locationMatch = candidateTokens.some(token => token && jobText.includes(token));

        if (!locationMatch) {
          const alreadyHasLocationWarning = result.negatives?.some(
            (n: { title?: string; detail?: string }) =>
              /(location|şehir|lokasyon|city|relocation|taşınma)/i.test((n.title || "") + " " + (n.detail || ""))
          );

          if (!alreadyHasLocationWarning) {
            const locationLabel = [candidateCity, candidateRegion, candidateCountry].filter(Boolean).join(", ");
            if (!result.negatives) result.negatives = [];
            result.negatives.push({
              icon: "alert-triangle",
              title: "Location Mismatch",
              detail: `Candidate is in ${locationLabel} — the job posting does not mention this location and is not listed as remote.`,
            });
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Recruiter verdict error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze" },
      { status: 500 }
    );
  }
}
