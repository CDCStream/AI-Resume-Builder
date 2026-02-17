import { NextRequest, NextResponse } from "next/server";
import { Resume } from "@/lib/types/resume";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = "harvestapi~linkedin-profile-scraper";

// Updated interface based on the new comprehensive Apify response format
interface ApifyLinkedInProfile {
  // Basic info
  id?: string;
  publicIdentifier?: string;
  linkedinUrl?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  headline?: string;
  about?: string | null;
  premium?: boolean;
  verified?: boolean;

  // Location
  location?: {
    linkedinText?: string;
    countryCode?: string;
    parsed?: {
      text?: string;
      countryCode?: string;
      country?: string;
      countryFull?: string;
    };
  };

  // Profile picture
  photo?: string;
  profilePicture?: {
    url?: string;
    sizes?: Array<{ url?: string; width?: number; height?: number }>;
  };

  // Experience - new format
  experience?: Array<{
    position?: string;
    location?: string;
    employmentType?: string;
    companyName?: string;
    companyLinkedinUrl?: string;
    companyId?: string;
    duration?: string;
    description?: string | null;
    skills?: string[] | null;
    startDate?: {
      month?: string;
      year?: number;
      text?: string;
    };
    endDate?: {
      month?: string;
      year?: number;
      text?: string;
    };
    companyLogo?: {
      url?: string;
    };
  }>;

  // Education - new format
  education?: Array<{
    schoolName?: string;
    schoolLinkedinUrl?: string;
    schoolId?: string;
    degree?: string;
    fieldOfStudy?: string;
    skills?: string[];
    insights?: string;
    startDate?: {
      year?: number;
      text?: string;
    };
    endDate?: {
      year?: number;
      text?: string;
    };
    period?: string;
  }>;

  // Skills - new format (array of objects with name)
  skills?: Array<{
    name?: string;
    title?: string; // fallback for old format
  }>;

  // Certifications - new comprehensive format
  certifications?: Array<{
    title?: string;
    issuedAt?: string; // "Issued Aug 2023 · Expired Nov 2023" or "Issued Feb 2022"
    link?: string | null;
    issuedBy?: string;
    issuedByLink?: string;
  }>;

  // Languages
  languages?: Array<{
    name?: string;
    proficiency?: string;
  }>;

  // Projects
  projects?: Array<{
    title?: string;
    description?: string;
    url?: string;
    startDate?: { year?: number; month?: string };
    endDate?: { year?: number; month?: string };
  }>;

  // Volunteering
  volunteering?: Array<{
    role?: string;
    organization?: string;
    description?: string;
    startDate?: { year?: number; month?: string };
    endDate?: { year?: number; month?: string };
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

  // Courses
  courses?: Array<{
    name?: string;
    number?: string;
  }>;

  // Old format fallbacks (for backwards compatibility)
  experiences?: Array<{
    title?: string;
    companyName?: string | null;
    jobDescription?: string | null;
    jobStartedOn?: string | null;
    jobEndedOn?: string | null;
    jobLocation?: string;
    jobStillWorking?: boolean;
  }>;

  educations?: Array<{
    title?: string;
    subtitle?: string;
    period?: {
      startedOn?: string | null;
      endedOn?: string | null;
    };
  }>;

  licenseAndCertificates?: Array<{
    title?: string;
    subtitle?: string;
    caption?: string;
  }>;

  volunteerAndAwards?: Array<{
    title?: string;
    subtitle?: string;
    description?: string;
  }>;

  profilePicHighQuality?: string;
  profilePic?: string;
  addressWithCountry?: string;
  linkedinPublicUrl?: string;

  // Allow other properties
  [key: string]: unknown;
}

// Month name to number mapping
const monthNames: Record<string, string> = {
  jan: "01", january: "01", feb: "02", february: "02",
  mar: "03", march: "03", apr: "04", april: "04",
  may: "05", jun: "06", june: "06", jul: "07", july: "07",
  aug: "08", august: "08", sep: "09", september: "09",
  oct: "10", october: "10", nov: "11", november: "11",
  dec: "12", december: "12",
};

function parseDate(dateStr?: string | null | unknown): string {
  if (!dateStr) return "";
  // Ensure we have a string
  if (typeof dateStr !== "string") return "";
  const str = dateStr.trim();

  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(str)) return str;

  // Just a year
  if (/^\d{4}$/.test(str)) return `${str}-01`;

  // "Present" or "current"
  if (/present|current|now/i.test(str)) return "Present";

  // Month Year format: "Jan 2020", "January 2020"
  const monthYearMatch = str.match(/^(\w+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const m = monthNames[monthYearMatch[1].toLowerCase()];
    if (m) return `${monthYearMatch[2]}-${m}`;
  }

  // Try parsing with Date
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  return "";
}

// Parse new format date object { month: "Jan", year: 2026, text: "Jan 2026" }
function parseDateObject(dateObj?: { month?: string; year?: number; text?: string }): string {
  if (!dateObj) return "";

  // Check text field first
  if (dateObj.text) {
    if (dateObj.text === "Present") return "Present";
    return parseDate(dateObj.text);
  }

  // Build from month and year
  if (dateObj.year) {
    if (dateObj.month) {
      const m = monthNames[dateObj.month.toLowerCase()];
      if (m) return `${dateObj.year}-${m}`;
    }
    return `${dateObj.year}-01`;
  }

  return "";
}

// Parse issuedAt string: "Issued Aug 2023 · Expired Nov 2023" or "Issued Feb 2022"
function parseCertificationIssuedAt(issuedAt?: string): { startDate: string; endDate: string } {
  if (!issuedAt) return { startDate: "", endDate: "" };

  const issuedMatch = issuedAt.match(/Issued\s+(\w+\s+\d{4})/i);
  const expiredMatch = issuedAt.match(/Expired\s+(\w+\s+\d{4})/i);

  return {
    startDate: issuedMatch ? parseDate(issuedMatch[1]) : "",
    endDate: expiredMatch ? parseDate(expiredMatch[1]) : "",
  };
}

function mapToResume(profile: ApifyLinkedInProfile): Resume {
  // Parse location - new format has location object
  let locationCity = "";
  let locationRegion = "";
  let locationCountry = "";

  if (profile.location?.parsed) {
    locationCity = profile.location.linkedinText || "";
    locationCountry = profile.location.parsed.countryCode || "";
  } else if (profile.addressWithCountry) {
    const parts = profile.addressWithCountry.split(",").map(s => s.trim());
    locationCity = parts[0] || "";
    locationRegion = parts[1] || "";
  }

  // Map skills - new format uses "name" field
  const skillGroups: { name: string; keywords: string[] }[] = [];
  if (Array.isArray(profile.skills)) {
    profile.skills.forEach((s) => {
      if (s && typeof s === "object") {
        const skillName = s.name || s.title || "";
        if (skillName) {
          skillGroups.push({
            name: skillName,
            keywords: [],
          });
        }
      }
    });
  }

  // Map languages
  const languages: { language: string; fluency: string }[] = [];
  if (Array.isArray(profile.languages)) {
    profile.languages.forEach((l) => {
      if (l && typeof l === "object") {
        languages.push({
          language: l.name || "",
          fluency: l.proficiency || ""
        });
      }
    });
  }

  // Get profile image - new format has photo and profilePicture
  const profileImage = profile.photo ||
    profile.profilePicture?.url ||
    profile.profilePicHighQuality ||
    profile.profilePic || "";

  // Build LinkedIn URL
  const linkedinUrl = profile.linkedinUrl || profile.linkedinPublicUrl || "";

  // Map experience - new format
  const workExperience = (profile.experience || []).map((exp) => {
    const locationParts = (exp.location || "").split(",").map(s => s.trim());
    return {
      name: exp.companyName || "",
      position: exp.position || "",
      startDate: parseDateObject(exp.startDate),
      endDate: exp.endDate?.text === "Present" ? "Present" : parseDateObject(exp.endDate),
      summary: exp.description || "",
      city: locationParts[0] || "",
      country: locationParts[locationParts.length - 1] || "",
      highlights: [],
    };
  });

  // Fallback to old experiences format if new format is empty
  if (workExperience.length === 0 && profile.experiences) {
    profile.experiences.forEach((exp) => {
      const locationParts = (exp.jobLocation || "").split(",").map(s => s.trim());
      workExperience.push({
        name: exp.companyName || "",
        position: exp.title || "",
        startDate: parseDate(exp.jobStartedOn),
        endDate: exp.jobStillWorking ? "Present" : parseDate(exp.jobEndedOn),
        summary: exp.jobDescription || "",
        city: locationParts[0] || "",
        country: locationParts[locationParts.length - 1] || "",
        highlights: [],
      });
    });
  }

  // Map education - new format
  const educationList = (profile.education || []).map((edu) => ({
    institution: edu.schoolName || "",
    studyType: edu.degree || "",
    area: edu.fieldOfStudy || "",
    startDate: edu.startDate?.year ? `${edu.startDate.year}-01` : "",
    endDate: edu.endDate?.year ? `${edu.endDate.year}-01` : "",
  }));

  // Fallback to old educations format
  if (educationList.length === 0 && profile.educations) {
    profile.educations.forEach((edu) => {
      // Parse subtitle for degree and field
      const parts = (edu.subtitle || "").split(",").map(s => s.trim());
      educationList.push({
        institution: edu.title || "",
        studyType: parts[0] || "",
        area: parts[1] || "",
        startDate: parseDate(edu.period?.startedOn),
        endDate: parseDate(edu.period?.endedOn),
      });
    });
  }

  // Map certifications - new format
  const certificates = (profile.certifications || []).map((cert) => {
    const { startDate, endDate } = parseCertificationIssuedAt(cert.issuedAt);
    return {
      name: cert.title || "",
      issuer: cert.issuedBy || "",
      date: startDate,
      endDate: endDate,
      url: cert.link || "",
    };
  });

  // Fallback to old licenseAndCertificates format
  if (certificates.length === 0 && profile.licenseAndCertificates) {
    profile.licenseAndCertificates.forEach((cert) => {
      const { startDate, endDate } = parseCertificationIssuedAt(cert.caption);
      certificates.push({
        name: cert.title || "",
        issuer: cert.subtitle || "",
        date: startDate,
        endDate: endDate,
        url: "",
      });
    });
  }

  // Map volunteering - new format
  const volunteer = (profile.volunteering || []).map((vol) => ({
    organization: vol.organization || "",
    position: vol.role || "",
    startDate: "",
    endDate: "",
    summary: vol.description || "",
  }));

  // Fallback to old volunteerAndAwards format
  if (volunteer.length === 0 && profile.volunteerAndAwards) {
    profile.volunteerAndAwards.forEach((vol) => {
      volunteer.push({
        organization: vol.subtitle || "",
        position: vol.title || "",
        startDate: "",
        endDate: "",
        summary: vol.description || "",
      });
    });
  }

  const resume: Resume = {
    basics: {
      name: profile.fullName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
      label: profile.headline || "",
      email: "",
      phone: "",
      summary: profile.about || "",
      image: profileImage,
      location: {
        city: locationCity,
        region: locationRegion,
        countryCode: locationCountry,
      },
      profiles: linkedinUrl ? [{
        network: "LinkedIn",
        url: linkedinUrl,
        username: profile.fullName || "",
      }] : [],
    },
    work: workExperience,
    education: educationList,
    skills: skillGroups,
    languages: languages,
    certificates: certificates,
    volunteer: volunteer,
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
    // HarvestAPI actor uses "urls" array parameter
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: [linkedinUrl],
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

    // Debug logging
    console.log("=== LinkedIn Import Debug ===");
    console.log("Name:", resume.basics?.name);
    console.log("Work experiences:", resume.work?.length || 0);
    console.log("Education:", resume.education?.length || 0);
    console.log("Skills:", resume.skills?.length || 0);
    console.log("Certifications:", resume.certificates?.length || 0);
    console.log("Certificates data:", JSON.stringify(resume.certificates, null, 2));

    return NextResponse.json({
      resume,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import profile. Please try again later." },
      { status: 500 }
    );
  }
}
