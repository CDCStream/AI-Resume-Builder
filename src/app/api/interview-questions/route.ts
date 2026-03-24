import { NextRequest, NextResponse } from "next/server";
import { generateText, cleanJsonResponse } from "@/lib/ai-provider";

interface InterviewQuestionsRequest {
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
    }>;
  };
  questionCount?: number;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: "behavioral" | "technical" | "situational" | "general";
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number; // in seconds
  tips: string[];
  bestAnswer: string;
  keyPoints: string[];
}

function formatResumeForAnalysis(resume: InterviewQuestionsRequest["resume"]): string {
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
      sections.push(`${index + 1}. ${job.position || "Position"} at ${job.name || "Company"}`);
      if (job.summary) sections.push(`   Summary: ${job.summary}`);
      if (job.highlights && job.highlights.length > 0) {
        sections.push(`   Highlights: ${job.highlights.join("; ")}`);
      }
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
    });
  }

  return sections.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body: InterviewQuestionsRequest = await request.json();
    const { jobDescription, jobTitle, company, resume, questionCount = 10 } = body;

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

    const prompt = `You are an experienced interviewer conducting an interview for the following position. Generate ${questionCount} interview questions that would realistically be asked in this interview.

JOB TITLE: ${jobTitle || "Not specified"}
COMPANY: ${company || "Not specified"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

Generate a mix of questions:
- 30% Behavioral questions (past experiences, STAR format expected)
- 30% Technical questions (skills, knowledge, problem-solving)
- 25% Situational questions (hypothetical scenarios)
- 15% General questions (motivation, career goals, company fit)

For each question, also provide the BEST possible answer that this specific candidate should give, based on their resume.

Return a JSON array with this structure:
[
  {
    "id": "q1",
    "question": "The interview question",
    "category": "behavioral|technical|situational|general",
    "difficulty": "easy|medium|hard",
    "timeLimit": 120,
    "tips": ["Tip for answering well", "Another tip"],
    "bestAnswer": "A complete, detailed answer (200-300 words) that this candidate should give, referencing their actual experience from the resume. Use first person ('I'). Be specific with examples, metrics, and outcomes.",
    "keyPoints": ["Key point 1 to include", "Key point 2", "Key point 3"]
  }
]

REQUIREMENTS:
1. Questions should progress from easier to harder
2. Include questions about specific items in their resume
3. Include questions about skills required in the job description
4. Best answers must be personalized using the candidate's ACTUAL experiences
5. Time limits: easy=90s, medium=120s, hard=180s
6. Use the same language as the job description
7. Make questions realistic and commonly asked in real interviews

Return ONLY the JSON array, no additional text.`;

    console.log("Generating interview questions...");

    const { text: responseText } = await generateText({ user: prompt, maxTokens: 8192 });
    const cleanedResponse = cleanJsonResponse(responseText);

    let questions: InterviewQuestion[];
    try {
      questions = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    console.log(`Generated ${questions.length} interview questions`);
    return NextResponse.json({ questions });

  } catch (error) {
    console.error("Interview questions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate questions" },
      { status: 500 }
    );
  }
}
