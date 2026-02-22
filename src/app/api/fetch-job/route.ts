import { NextRequest, NextResponse } from "next/server";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = "apimaestro~linkedin-job-detail";

interface LinkedInJobResponse {
  job_info: {
    title: string;
    description: string;
    location: string;
    employment_status: string;
    is_remote_allowed: boolean;
    experience_level: string;
    industries: string[];
    job_functions: string[];
    workplace_types: string[];
    job_url: string;
  };
  company_info: {
    name: string;
    description: string;
    industries: string[];
    url: string;
    logo_url?: string;
    background_cover_url?: string;
  };
}

function extractJobId(input: string): string | null {
  const trimmed = input.trim();
  
  // If it's just a number (Job ID directly)
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  
  // Match patterns like:
  // https://www.linkedin.com/jobs/view/4361758535
  // https://linkedin.com/jobs/view/4361758535/
  // https://www.linkedin.com/jobs/view/4361758535/?trk=...
  const match = trimmed.match(/linkedin\.com\/jobs\/view\/(\d+)/i);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  console.log("=== Fetch Job API Called ===");
  
  try {
    const body = await request.json();
    const { linkedinJobUrl, jobId: directJobId } = body;

    // Accept either linkedinJobUrl or jobId
    const inputValue = linkedinJobUrl || directJobId;

    if (!inputValue) {
      return NextResponse.json(
        { error: "LinkedIn job URL or Job ID is required" },
        { status: 400 }
      );
    }

    // Extract job ID from URL or direct input
    const jobId = extractJobId(inputValue);
    
    if (!jobId) {
      return NextResponse.json(
        { error: "Invalid input. Please provide a LinkedIn job URL or Job ID (e.g., 4361758535)" },
        { status: 400 }
      );
    }

    console.log("Job ID extracted:", jobId);

    if (!APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: "Apify API token is not configured" },
        { status: 500 }
      );
    }

    // Call Apify actor with job ID (must be array)
    console.log("Calling Apify actor...");
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: [jobId],
        }),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error("Apify API error:", runResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch job posting. Please try again." },
        { status: 502 }
      );
    }

    const results = await runResponse.json();
    console.log("Apify response received, items:", results?.length);

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "No job data found. Please check the LinkedIn job URL and try again." },
        { status: 404 }
      );
    }

    const jobData = results[0] as LinkedInJobResponse;

    if (!jobData.job_info) {
      console.error("Invalid job data structure:", jobData);
      return NextResponse.json(
        { error: "Could not retrieve job data. The job posting may have been removed." },
        { status: 404 }
      );
    }

    // Format the job description for the optimizer
    const formattedJobDescription = formatJobDescription(jobData);

    console.log("Job fetched successfully:", jobData.job_info.title);

    return NextResponse.json({
      success: true,
      jobTitle: jobData.job_info.title,
      companyName: jobData.company_info?.name || "",
      location: jobData.job_info.location,
      jobDescription: formattedJobDescription,
      logoUrl: jobData.company_info?.logo_url || "",
      backgroundUrl: jobData.company_info?.background_cover_url || "",
      rawData: jobData,
    });
  } catch (error) {
    console.error("Fetch job error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job posting. Please try again later." },
      { status: 500 }
    );
  }
}

function formatJobDescription(jobData: LinkedInJobResponse): string {
  const parts: string[] = [];
  
  const info = jobData.job_info;
  const company = jobData.company_info;

  // Title and company
  parts.push(`Position: ${info.title}`);
  if (company?.name) {
    parts.push(`Company: ${company.name}`);
  }
  if (info.location) {
    parts.push(`Location: ${info.location}`);
  }
  if (info.employment_status) {
    parts.push(`Employment Type: ${info.employment_status}`);
  }
  if (info.experience_level) {
    parts.push(`Experience Level: ${info.experience_level}`);
  }
  if (info.industries?.length > 0) {
    parts.push(`Industry: ${info.industries.join(", ")}`);
  }
  if (info.workplace_types?.length > 0) {
    parts.push(`Workplace: ${info.workplace_types.join(", ")}`);
  }
  
  parts.push("");
  parts.push("--- Job Description ---");
  parts.push(info.description);

  if (company?.description) {
    parts.push("");
    parts.push("--- About the Company ---");
    parts.push(company.description);
  }

  return parts.join("\n");
}
