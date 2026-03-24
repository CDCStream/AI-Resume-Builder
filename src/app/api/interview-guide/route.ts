import { NextRequest, NextResponse } from "next/server";
import { generateText, cleanJsonResponse } from "@/lib/ai-provider";

interface InterviewGuideRequest {
  jobDescription: string;
  jobTitle?: string;
  company?: string;
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
      highlights?: string[];
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
      keywords?: string[];
    }>;
    projects?: Array<{
      name?: string;
      description?: string;
      highlights?: string[];
    }>;
    certificates?: Array<{
      name?: string;
      issuer?: string;
    }>;
  };
}

export interface InterviewGuideResponse {
  elevatorPitch: string;
  starStories: Array<{
    title: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    relevantFor: string[];
  }>;
  talkingPoints: Array<{
    point: string;
    explanation: string;
    howToMention: string;
  }>;
  expectedQuestions: Array<{
    question: string;
    category: "behavioral" | "technical" | "situational" | "general";
    bestAnswer: string;
    tips: string[];
  }>;
  questionsToAsk: Array<{
    question: string;
    purpose: string;
    whenToAsk: string;
  }>;
  companyInsights: {
    keyPoints: string[];
    culture: string;
    recentNews: string[];
    competitiveAdvantage: string;
  };
}

function formatResumeForAnalysis(resume: InterviewGuideRequest["resume"]): string {
  const sections: string[] = [];

  if (resume.basics) {
    sections.push(`NAME: ${resume.basics.name || "Not specified"}`);
    sections.push(`TITLE: ${resume.basics.label || "Not specified"}`);
    if (resume.basics.summary) {
      sections.push(`SUMMARY: ${resume.basics.summary}`);
    }
  }

  if (resume.work && resume.work.length > 0) {
    sections.push("\nWORK EXPERIENCE:");
    resume.work.forEach((job, index) => {
      sections.push(`${index + 1}. ${job.position || "Position"} at ${job.name || "Company"} (${job.startDate || ""} - ${job.endDate || "Present"})`);
      if (job.summary) sections.push(`   Summary: ${job.summary}`);
      if (job.highlights && job.highlights.length > 0) {
        sections.push(`   Highlights: ${job.highlights.join("; ")}`);
      }
    });
  }

  if (resume.education && resume.education.length > 0) {
    sections.push("\nEDUCATION:");
    resume.education.forEach((edu) => {
      sections.push(`- ${edu.studyType || ""} in ${edu.area || ""} from ${edu.institution || ""}`);
    });
  }

  if (resume.skills && resume.skills.length > 0) {
    sections.push("\nSKILLS:");
    const skillNames = resume.skills.map((s) => s.name).filter(Boolean);
    sections.push(skillNames.join(", "));
  }

  if (resume.projects && resume.projects.length > 0) {
    sections.push("\nPROJECTS:");
    resume.projects.forEach((proj) => {
      sections.push(`- ${proj.name}: ${proj.description || ""}`);
      if (proj.highlights && proj.highlights.length > 0) {
        sections.push(`  Highlights: ${proj.highlights.join("; ")}`);
      }
    });
  }

  if (resume.certificates && resume.certificates.length > 0) {
    sections.push("\nCERTIFICATES:");
    resume.certificates.forEach((cert) => {
      sections.push(`- ${cert.name} (${cert.issuer || ""})`);
    });
  }

  return sections.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body: InterviewGuideRequest = await request.json();
    const { jobDescription, jobTitle, company, resume } = body;

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

    const resumeText = formatResumeForAnalysis(resume);
    const candidateName = resume.basics?.name || "the candidate";

    const prompt = `You are an expert career coach and interview preparation specialist. Analyze the following job description and candidate's resume to create a comprehensive interview preparation guide.

JOB TITLE: ${jobTitle || "Not specified"}
COMPANY: ${company || "Not specified"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

Create a detailed interview preparation guide in JSON format with the following structure:

{
  "elevatorPitch": "A compelling 30-second introduction (about 75-100 words) that ${candidateName} can use to introduce themselves. It should highlight their most relevant experience and skills for THIS specific job, and end with enthusiasm about this opportunity.",
  
  "starStories": [
    {
      "title": "Story title summarizing the achievement",
      "situation": "The context and background (2-3 sentences)",
      "task": "The specific challenge or responsibility (1-2 sentences)",
      "action": "The specific actions taken (3-4 sentences, using 'I' statements)",
      "result": "Quantifiable outcomes and impact (2-3 sentences with metrics if possible)",
      "relevantFor": ["List of question types this story answers, e.g., 'leadership', 'problem-solving', 'teamwork']"
    }
  ],
  
  "talkingPoints": [
    {
      "point": "Key strength or achievement to highlight",
      "explanation": "Why this matters for this role",
      "howToMention": "Natural way to bring this up in conversation"
    }
  ],
  
  "expectedQuestions": [
    {
      "question": "Interview question they are likely to ask",
      "category": "behavioral|technical|situational|general",
      "bestAnswer": "A complete, well-structured answer (150-200 words) tailored to this candidate's experience",
      "tips": ["Tip 1 for delivering this answer", "Tip 2"]
    }
  ],
  
  "questionsToAsk": [
    {
      "question": "Smart question to ask the interviewer",
      "purpose": "What you'll learn from this question",
      "whenToAsk": "Best timing for this question"
    }
  ],
  
  "companyInsights": {
    "keyPoints": ["Key fact about the company relevant to the interview"],
    "culture": "Brief description of company culture based on job description",
    "recentNews": ["Inferred recent developments or focus areas"],
    "competitiveAdvantage": "What seems to set this company apart"
  }
}

REQUIREMENTS:
1. Create 5-7 STAR stories based on the candidate's ACTUAL work experience and projects
2. Generate 10-12 expected questions (mix of behavioral, technical, and situational)
3. Provide 8-10 key talking points
4. Suggest 5-7 smart questions to ask the interviewer
5. All content should be personalized to THIS candidate and THIS job
6. Use the same language as the job description for consistency
7. Be specific - reference actual technologies, companies, and achievements from the resume
8. Make the elevator pitch conversational and natural, not robotic

Return ONLY valid JSON, no additional text.`;

    console.log("Generating interview guide...");

    const { text: responseText } = await generateText({ user: prompt, maxTokens: 8192 });
    const cleanedResponse = cleanJsonResponse(responseText);

    let result: InterviewGuideResponse;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    console.log("Interview guide generated successfully");
    return NextResponse.json(result);

  } catch (error) {
    console.error("Interview guide error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate interview guide" },
      { status: 500 }
    );
  }
}
