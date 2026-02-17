import { NextRequest, NextResponse } from "next/server";
import { Resume } from "@/lib/types/resume";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = "dev_fusion~linkedin-profile-scraper";

// Updated interface based on actual Apify dev_fusion~linkedin-profile-scraper response
interface ApifyLinkedInProfile {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  about?: string;
  email?: string | null;
  mobileNumber?: string | null;
  profilePic?: string;
  profilePicHighQuality?: string;
  addressWithCountry?: string;
  addressWithoutCountry?: string;
  linkedinUrl?: string;
  linkedinPublicUrl?: string;

  // Experiences array with different field names
  experiences?: Array<{
    title?: string;
    companyName?: string | null;
    companyLink1?: string;
    jobDescription?: string | null;
    jobStartedOn?: string | null;
    jobEndedOn?: string | null;
    jobLocation?: string;
    jobStillWorking?: boolean;
    logo?: string;
  }>;

  // Educations array
  educations?: Array<{
    title?: string; // School name
    subtitle?: string; // "Degree, Field of Study"
    description?: string | null;
    grade?: string | null;
    period?: {
      startedOn?: string | null;
      endedOn?: string | null;
    };
    logo?: string;
  }>;

  // Skills array
  skills?: Array<{
    title?: string;
  }>;

  // Languages array
  languages?: Array<{
    title?: string;
    proficiency?: string;
  }>;

  // Certifications
  licenseAndCertificates?: Array<{
    title?: string;
    subtitle?: string; // Issuer
    caption?: string; // "Issued Aug 2023 · Expired Nov 2023"
    logo?: string;
  }>;

  // Courses
  courses?: Array<{
    title?: string;
    subtitle?: string;
  }>;

  // Volunteer
  volunteerAndAwards?: Array<{
    title?: string;
    subtitle?: string;
    description?: string;
  }>;

  // Projects
  projects?: Array<{
    title?: string;
    description?: string;
    url?: string;
  }>;

  // Publications
  publications?: Array<{
    title?: string;
    publisher?: string;
    description?: string;
    url?: string;
  }>;

  // Honors and Awards
  honorsAndAwards?: Array<{
    title?: string;
    issuer?: string;
    description?: string;
  }>;

  // Allow other properties
  [key: string]: unknown;
}

function parseDate(dateStr?: string | null | unknown): string {
  if (!dateStr) return "";
  // Ensure we have a string
  if (typeof dateStr !== "string") return "";
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
  // Parse location from addressWithCountry
  const location = profile.addressWithCountry || profile.addressWithoutCountry || "";
  const locationParts = location.split(",").map((s) => s.trim());

  // Map skills - new format uses "title" instead of "name"
  const skillNames: string[] = [];
  if (Array.isArray(profile.skills)) {
    profile.skills.forEach((s) => {
      if (s && typeof s === "object" && "title" in s) {
        skillNames.push(s.title || "");
      }
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

  // Map languages - new format uses "title" instead of "name"
  const languages: { language: string; fluency: string }[] = [];
  if (Array.isArray(profile.languages)) {
    profile.languages.forEach((l) => {
      if (l && typeof l === "object") {
        languages.push({ language: l.title || "", fluency: l.proficiency || "" });
      }
    });
  }

  // Parse education subtitle to get degree and field
  // Format: "Master's degree, Data Science" or "Bachelor's degree, Industrial Engineering"
  const parseEducationSubtitle = (subtitle?: string) => {
    if (!subtitle) return { degree: "", field: "" };
    const parts = subtitle.split(",").map(s => s.trim());
    return {
      degree: parts[0] || "",
      field: parts[1] || "",
    };
  };

  // Parse certification caption to get dates
  // Format: "Issued Aug 2023 · Expired Nov 2023" or "Issued Aug 2023"
  const parseCertificationCaption = (caption?: string) => {
    if (!caption) return { startDate: "", endDate: "" };
    const issuedMatch = caption.match(/Issued\s+(\w+\s+\d{4})/i);
    const expiredMatch = caption.match(/Expired\s+(\w+\s+\d{4})/i);
    return {
      startDate: issuedMatch ? parseDate(issuedMatch[1]) : "",
      endDate: expiredMatch ? parseDate(expiredMatch[1]) : "",
    };
  };

  // Parse date from format "01-2026" to "2026-01"
  const parseLinkedInDate = (dateStr?: string | null): string => {
    if (!dateStr) return "";
    // Format: "01-2026" -> "2026-01"
    const match = dateStr.match(/^(\d{2})-(\d{4})$/);
    if (match) {
      return `${match[2]}-${match[1]}`;
    }
    return parseDate(dateStr);
  };

  const resume: Resume = {
    basics: {
      name: profile.fullName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
      label: profile.headline || "",
      email: profile.email || "",
      phone: profile.mobileNumber || "",
      summary: profile.about || "",
      image: profile.profilePicHighQuality || profile.profilePic || "",
      location: {
        city: locationParts[0] || "",
        region: locationParts[1] || "",
        countryCode: "",
      },
      profiles: profile.linkedinPublicUrl ? [{
        network: "LinkedIn",
        url: profile.linkedinPublicUrl,
        username: profile.fullName || "",
      }] : [],
    },
    work: (profile.experiences || []).map((exp) => {
      const locationParts = (exp.jobLocation || "").split(",").map(s => s.trim());
      return {
        name: exp.companyName || "",
        position: exp.title || "",
        startDate: parseLinkedInDate(exp.jobStartedOn),
        endDate: exp.jobStillWorking ? "Present" : parseLinkedInDate(exp.jobEndedOn),
        summary: exp.jobDescription || "",
        city: locationParts[0] || "",
        country: locationParts[locationParts.length - 1] || "",
        highlights: [],
      };
    }),
    education: (profile.educations || []).map((edu) => {
      const { degree, field } = parseEducationSubtitle(edu.subtitle);
      return {
        institution: edu.title || "",
        studyType: degree,
        area: field,
        startDate: parseDate(edu.period?.startedOn || ""),
        endDate: parseDate(edu.period?.endedOn || ""),
      };
    }),
    skills: skillGroups.length > 0 ? skillGroups : [],
    languages: languages,
    certificates: (profile.licenseAndCertificates || []).map((cert) => {
      const { startDate, endDate } = parseCertificationCaption(cert.caption);
      return {
        name: cert.title || "",
        issuer: cert.subtitle || "",
        date: startDate,
        endDate: endDate,
      };
    }),
    volunteer: (profile.volunteerAndAwards || []).map((vol) => ({
      organization: vol.subtitle || "",
      position: vol.title || "",
      startDate: "",
      endDate: "",
      summary: vol.description || "",
    })),
    projects: (profile.projects || []).map((proj) => ({
      name: proj.title || "",
      description: proj.description || "",
      startDate: "",
      endDate: "",
      url: proj.url || "",
    })),
    publications: (profile.publications || []).map((pub) => ({
      name: pub.title || "",
      publisher: pub.publisher || "",
      releaseDate: "",
      summary: pub.description || "",
      url: pub.url || "",
    })),
    awards: (profile.honorsAndAwards || []).map((honor) => ({
      title: honor.title || "",
      awarder: honor.issuer || "",
      date: "",
      summary: honor.description || "",
    })),
  };

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
