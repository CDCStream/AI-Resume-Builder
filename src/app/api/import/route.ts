import { NextRequest, NextResponse } from "next/server";
import { Resume } from "@/lib/types/resume";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = "dev_fusion~linkedin-profile-scraper";

interface ApifyLinkedInProfile {
  fullName?: string;
  headline?: string;
  summary?: string;
  location?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  experiences?: Array<{
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{
    school?: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  skills?: Array<{
    name?: string;
  }> | string[];
  languages?: Array<{
    name?: string;
    proficiency?: string;
  }> | string[];
  certifications?: Array<{
    name?: string;
    authority?: string;
    startDate?: string;
    endDate?: string;
  }>;
  courses?: Array<{
    name?: string;
    institution?: string;
  }>;
  volunteerExperiences?: Array<{
    role?: string;
    organization?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  projects?: Array<{
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    url?: string;
  }>;
  publications?: Array<{
    title?: string;
    publisher?: string;
    date?: string;
    description?: string;
    url?: string;
  }>;
  honors?: Array<{
    title?: string;
    issuer?: string;
    date?: string;
    description?: string;
  }>;
  websites?: string[];
  // Some scrapers return data in different shapes
  [key: string]: unknown;
}

function parseDate(dateStr?: string): string {
  if (!dateStr) return "";
  // Handle formats like "Jan 2020", "2020", "January 2020", "2020-01"
  const str = dateStr.trim();

  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(str)) return str;

  // Just a year
  if (/^\d{4}$/.test(str)) return `${str}-01`;

  // "Present" or "current"
  if (/present|current|now/i.test(str)) return "Present";

  // Try parsing with Date
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  // Month Year format: "Jan 2020", "January 2020"
  const monthYearMatch = str.match(/^(\w+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthNames: Record<string, string> = {
      jan: "01", january: "01", feb: "02", february: "02",
      mar: "03", march: "03", apr: "04", april: "04",
      may: "05", jun: "06", june: "06", jul: "07", july: "07",
      aug: "08", august: "08", sep: "09", september: "09",
      oct: "10", october: "10", nov: "11", november: "11",
      dec: "12", december: "12",
    };
    const m = monthNames[monthYearMatch[1].toLowerCase()];
    if (m) return `${monthYearMatch[2]}-${m}`;
  }

  return "";
}

function mapToResume(profile: ApifyLinkedInProfile): Resume {
  // Parse location
  const locationParts = (profile.location || "").split(",").map((s) => s.trim());

  // Map skills - handle both array of objects and array of strings
  const skillNames: string[] = [];
  if (Array.isArray(profile.skills)) {
    profile.skills.forEach((s) => {
      if (typeof s === "string") skillNames.push(s);
      else if (s && typeof s === "object" && "name" in s) skillNames.push(s.name || "");
    });
  }

  // Group skills into categories of ~6
  const skillGroups = [];
  for (let i = 0; i < skillNames.length; i += 6) {
    skillGroups.push({
      name: i === 0 ? "Skills" : `Skills ${Math.floor(i / 6) + 1}`,
      keywords: skillNames.slice(i, i + 6),
    });
  }

  // Map languages
  const languages: { language: string; fluency: string }[] = [];
  if (Array.isArray(profile.languages)) {
    profile.languages.forEach((l) => {
      if (typeof l === "string") languages.push({ language: l, fluency: "" });
      else if (l && typeof l === "object") languages.push({ language: l.name || "", fluency: l.proficiency || "" });
    });
  }

  const resume: Resume = {
    basics: {
      name: profile.fullName || "",
      label: profile.headline || "",
      email: profile.email || "",
      phone: profile.phone || "",
      summary: profile.summary || "",
      image: profile.profilePicture || "",
      location: {
        city: locationParts[0] || "",
        region: locationParts[1] || "",
        countryCode: locationParts[2] || "",
      },
      profiles: [],
    },
    work: (profile.experiences || []).map((exp) => ({
      name: exp.company || "",
      position: exp.title || "",
      startDate: parseDate(exp.startDate),
      endDate: parseDate(exp.endDate),
      summary: exp.description || "",
      city: (exp.location || "").split(",")[0]?.trim() || "",
      country: (exp.location || "").split(",")[1]?.trim() || "",
      highlights: [],
    })),
    education: (profile.education || []).map((edu) => ({
      institution: edu.school || "",
      studyType: edu.degree || "",
      area: edu.fieldOfStudy || "",
      startDate: parseDate(edu.startDate),
      endDate: parseDate(edu.endDate),
    })),
    skills: skillGroups.length > 0 ? skillGroups : [],
    languages: languages,
    certificates: (profile.certifications || []).map((cert) => ({
      name: cert.name || "",
      issuer: cert.authority || "",
      date: parseDate(cert.startDate),
      endDate: parseDate(cert.endDate),
    })),
    volunteer: (profile.volunteerExperiences || []).map((vol) => ({
      organization: vol.organization || "",
      position: vol.role || "",
      startDate: parseDate(vol.startDate),
      endDate: parseDate(vol.endDate),
      summary: vol.description || "",
    })),
    projects: (profile.projects || []).map((proj) => ({
      name: proj.title || "",
      description: proj.description || "",
      startDate: parseDate(proj.startDate),
      endDate: parseDate(proj.endDate),
      url: proj.url || "",
    })),
    publications: (profile.publications || []).map((pub) => ({
      name: pub.title || "",
      publisher: pub.publisher || "",
      releaseDate: parseDate(pub.date),
      summary: pub.description || "",
      url: pub.url || "",
    })),
    awards: (profile.honors || []).map((honor) => ({
      title: honor.title || "",
      awarder: honor.issuer || "",
      date: parseDate(honor.date),
      summary: honor.description || "",
    })),
  };

  // Add website profiles
  if (profile.websites && Array.isArray(profile.websites)) {
    resume.basics!.profiles = profile.websites.map((url) => ({
      network: new URL(url).hostname.replace("www.", ""),
      url: url,
      username: "",
    }));
  }

  return resume;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkedinUrl } = body;

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: "LinkedIn URL is required" },
        { status: 400 }
      );
    }

    if (!APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: "Apify API token is not configured" },
        { status: 500 }
      );
    }

    // Validate LinkedIn URL
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
    if (!linkedinRegex.test(linkedinUrl)) {
      return NextResponse.json(
        { error: "Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)" },
        { status: 400 }
      );
    }

    // Start the Apify actor run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileUrls: [linkedinUrl],
        }),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error("Apify API error:", runResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch LinkedIn profile. Please try again." },
        { status: 502 }
      );
    }

    const results = await runResponse.json();
    
    // Debug: Log raw API response
    console.log("Apify raw response:", JSON.stringify(results, null, 2));

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "No profile data found. Please check the LinkedIn URL and try again." },
        { status: 404 }
      );
    }

    // Check for Apify error response
    const firstResult = results[0];
    if (firstResult && firstResult.error) {
      console.error("Apify actor error:", firstResult.error);
      return NextResponse.json(
        { error: "LinkedIn import service requires a paid Apify plan. Please upgrade your Apify subscription or try a different import method." },
        { status: 402 }
      );
    }

    // Use the first result
    const profileData = firstResult as ApifyLinkedInProfile;
    
    // Validate that we have actual profile data
    if (!profileData.fullName && !profileData.headline && !profileData.experiences) {
      console.error("Empty profile data received:", profileData);
      return NextResponse.json(
        { error: "Could not retrieve profile data. The profile may be private or the URL may be incorrect." },
        { status: 404 }
      );
    }
    
    const resume = mapToResume(profileData);
    console.log("Mapped resume basics:", JSON.stringify(resume.basics, null, 2));

    return NextResponse.json({
      resume,
      rawProfile: profileData, // Include raw data for debugging
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import profile. Please try again later." },
      { status: 500 }
    );
  }
}
