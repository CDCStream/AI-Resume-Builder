import { NextRequest, NextResponse } from "next/server";
import { generateText, cleanJsonResponse } from "@/lib/ai-provider";

interface AutoFixRequest {
  resumeData: {
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
    skills?: Array<{
      name?: string;
      level?: string;
    }>;
  };
  jobDescription: string;
  missingSkills?: string[];
}

interface AutoFixResponse {
  addedSkills: Array<{
    name: string;
    reason: string;
  }>;
  summaryAdditions: {
    original: string;
    improved: string;
    reason: string;
  } | null;
  experienceAdditions: Array<{
    position: string;
    addition: string;
    reason: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: AutoFixRequest = await request.json();
    const { resumeData, jobDescription, missingSkills } = body;

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: "Resume data and job description are required" },
        { status: 400 }
      );
    }

    const existingSkills = resumeData.skills?.map(s => s.name).filter(Boolean) || [];
    const currentSummary = resumeData.basics?.summary || "";
    const workExperiences = resumeData.work || [];

    const prompt = `You are an expert resume optimization specialist. Analyze the job description and suggest specific improvements to the candidate's resume to increase ATS compatibility and relevance.

JOB DESCRIPTION:
${jobDescription}

MISSING SKILLS IDENTIFIED:
${missingSkills?.join(", ") || "None identified"}

CANDIDATE'S CURRENT RESUME:

Name: ${resumeData.basics?.name || "Not provided"}
Title: ${resumeData.basics?.label || "Not provided"}

Current Summary:
${currentSummary || "No summary provided"}

Current Skills:
${existingSkills.join(", ") || "No skills listed"}

Work Experience:
${workExperiences.map((w, i) => `${i + 1}. ${w.position} at ${w.name}
   Summary: ${w.summary || "None"}
   Highlights: ${w.highlights?.join("; ") || "None"}`).join("\n\n")}

Based on this analysis, suggest improvements in JSON format:

{
  "addedSkills": [
    {
      "name": "Skill name from job description that candidate likely has based on experience",
      "reason": "Why this skill is relevant and why candidate likely has it"
    }
  ],
  "summaryAdditions": {
    "original": "The current summary text",
    "improved": "An improved summary that incorporates job-relevant keywords while maintaining truthfulness",
    "reason": "Why these changes improve ATS compatibility"
  },
  "experienceAdditions": [
    {
      "position": "Job title where this addition applies",
      "addition": "A new highlight/bullet point to add that emphasizes relevant skills",
      "reason": "Why this addition is relevant to the target job"
    }
  ]
}

IMPORTANT RULES:
1. Only suggest skills the candidate LIKELY has based on their experience (don't invent skills)
2. Focus on the top 3-5 most impactful skill additions
3. For summary, keep changes minimal but impactful - add relevant keywords naturally
4. For experience additions, suggest 1-2 highlights max that align with job requirements
5. If the summary is already good, set summaryAdditions to null
6. Be truthful - don't suggest adding false information
7. Prioritize skills from the "MISSING SKILLS" list if they seem relevant to candidate's background
8. Write in the same language as the resume content
9. CRITICAL - SYNONYM/DUPLICATE CHECK: Before suggesting a skill, check if the candidate ALREADY has it under a different name or abbreviation. Examples of duplicates to avoid:
   - "ML" = "Machine Learning"
   - "JS" = "JavaScript"
   - "TS" = "TypeScript"
   - "K8s" = "Kubernetes"
   - "Postgres" = "PostgreSQL"
   - "React.js" = "React" = "ReactJS"
   - "Node" = "Node.js" = "NodeJS"
   - "TF" = "TensorFlow"
   - "PyTorch" = "Torch"
   - "AWS" = "Amazon Web Services"
   - "GCP" = "Google Cloud Platform" = "Google Cloud"
   - "DL" = "Deep Learning"
   - "NLP" = "Natural Language Processing"
   - "CV" = "Computer Vision"
   - "CI/CD" = "Continuous Integration/Continuous Deployment"
   - "OOP" = "Object-Oriented Programming"
   - "SQL Server" = "MSSQL" = "Microsoft SQL Server"
   - "Mongo" = "MongoDB"
   - "Stats" = "Statistics" = "Statistical Analysis" = "Statistical Modeling" = "Statistical Inference"
   Do NOT suggest adding a skill if any synonym, abbreviation, or variation of it already exists in the candidate's current skills list. This includes partial matches (e.g., if "Statistical Modeling" exists, don't suggest "Statistics" or "Statistical Inference").

Return ONLY valid JSON, no additional text.`;

    console.log("Calling AI for auto-fix...");

    const { text: responseText } = await generateText({ user: prompt, maxTokens: 4096 });
    const cleanedResponse = cleanJsonResponse(responseText);

    let result: AutoFixResponse;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Ensure all required fields exist
    if (!result.addedSkills) result.addedSkills = [];
    if (!result.experienceAdditions) result.experienceAdditions = [];

    // Server-side synonym deduplication
    const normalizeSkill = (s: string): string =>
      s.toLowerCase()
        .replace(/[.\-\/\s]+/g, "")
        .replace(/^(the|a|an)\s+/i, "");

    const synonymMap: Record<string, string[]> = {
      machinelearning: ["ml", "machinelearning"],
      deeplearning: ["dl", "deeplearning"],
      javascript: ["js", "javascript", "ecmascript"],
      typescript: ["ts", "typescript"],
      kubernetes: ["k8s", "kubernetes", "kube"],
      postgresql: ["postgres", "postgresql", "psql"],
      react: ["react", "reactjs"],
      node: ["node", "nodejs"],
      tensorflow: ["tf", "tensorflow"],
      pytorch: ["pytorch", "torch"],
      aws: ["aws", "amazonwebservices"],
      gcp: ["gcp", "googlecloudplatform", "googlecloud"],
      nlp: ["nlp", "naturallanguageprocessing"],
      computervision: ["cv", "computervision"],
      cicd: ["cicd", "continuousintegrationcontinuousdeployment", "continuousintegration"],
      oop: ["oop", "objectorientedprogramming"],
      mssql: ["mssql", "sqlserver", "microsoftsqlserver"],
      mongodb: ["mongo", "mongodb"],
      statistics: ["stats", "statistics", "statisticalanalysis", "statisticalmodeling", "statisticalinference", "statisticalmethods"],
      python: ["python", "py"],
      r: ["rlanguage", "rprogramming"],
      docker: ["docker", "containerization"],
      apache: ["apacheairflow", "airflow"],
      spark: ["spark", "apachespark", "pyspark"],
      kafka: ["kafka", "apachekafka"],
      tableau: ["tableau"],
      git: ["git", "github", "gitgithub"],
    };

    const existingNormalized = existingSkills.filter((s): s is string => !!s).map(normalizeSkill);

    const getCanonicalKeys = (normalized: string): string[] => {
      const keys: string[] = [normalized];
      for (const [canonical, aliases] of Object.entries(synonymMap)) {
        if (aliases.includes(normalized)) {
          keys.push(canonical);
          keys.push(...aliases);
        }
      }
      return keys;
    };

    const existingKeySet = new Set<string>();
    for (const norm of existingNormalized) {
      existingKeySet.add(norm);
      for (const key of getCanonicalKeys(norm)) {
        existingKeySet.add(key);
      }
    }

    const beforeCount = result.addedSkills.length;
    result.addedSkills = result.addedSkills.filter(skill => {
      const norm = normalizeSkill(skill.name);
      const keys = getCanonicalKeys(norm);
      const isDuplicate = keys.some(k => existingKeySet.has(k));
      if (isDuplicate) {
        console.log(`Filtered duplicate skill: "${skill.name}" (matches existing skill)`);
      }
      return !isDuplicate;
    });

    console.log("Auto-fix suggestions generated:", {
      skillCount: result.addedSkills.length,
      filteredDuplicates: beforeCount - result.addedSkills.length,
      hasSummaryChanges: !!result.summaryAdditions,
      experienceAdditionCount: result.experienceAdditions.length,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Auto-fix resume error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
