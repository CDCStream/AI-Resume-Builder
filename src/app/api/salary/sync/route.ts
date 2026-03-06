import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BLOG_ADMIN_SECRET =
  process.env.BLOG_ADMIN_SECRET || "linimpact-blog-admin-2026";
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

interface IndeedListing {
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  salaryPeriod: string;
  jobType: string;
  jobDescription: string;
  datePosted: string;
  jobUrl: string;
  isRemote: boolean;
  companyRating: number;
  benefits: string[];
  searchQuery: string;
  scrapedAt: string;
}

const SALARY_KEYWORDS: Record<string, { jobTitle: string; keyword: string }> = {
  "dental-hygienist": { jobTitle: "Dental Hygienist", keyword: "Dental Hygienist Salary" },
  "software-engineer": { jobTitle: "Software Engineer", keyword: "Software Engineer Salary" },
  "registered-nurse": { jobTitle: "Registered Nurse", keyword: "Registered Nurse Salary" },
  "project-manager": { jobTitle: "Project Manager", keyword: "Project Manager Salary" },
  "data-analyst": { jobTitle: "Data Analyst", keyword: "Data Analyst Salary" },
  "cyber-security": { jobTitle: "Cyber Security Analyst", keyword: "Cyber Security Salary" },
  "administrative-assistant": { jobTitle: "Administrative Assistant", keyword: "Administrative Assistant Salary" },
  "marketing-manager": { jobTitle: "Marketing Manager", keyword: "Marketing Manager Salary" },
  "product-manager": { jobTitle: "Product Manager", keyword: "Product Manager Salary" },
  "financial-analyst": { jobTitle: "Financial Analyst", keyword: "Financial Analyst Salary" },
  "ux-designer": { jobTitle: "UX Designer", keyword: "UX Designer Salary" },
  "devops-engineer": { jobTitle: "DevOps Engineer", keyword: "DevOps Engineer Salary" },
  "scrum-master": { jobTitle: "Scrum Master", keyword: "Scrum Master Salary" },
  "solutions-architect": { jobTitle: "Solutions Architect", keyword: "Solutions Architect Salary" },
  "systems-administrator": { jobTitle: "Systems Administrator", keyword: "Systems Administrator Salary" },
  "executive-assistant": { jobTitle: "Executive Assistant", keyword: "Executive Assistant Salary" },
};

function normalizeToAnnual(min: number, max: number, period: string): { min: number; max: number } | null {
  if (!min && !max) return null;
  const p = (period || "").toLowerCase();
  let factor = 1;
  if (p.includes("hour")) factor = 2080;
  else if (p.includes("week")) factor = 52;
  else if (p.includes("month")) factor = 12;
  else if (p.includes("day")) factor = 260;
  else if (!p.includes("year")) return null;
  return { min: Math.round(min * factor), max: Math.round(max * factor) };
}

function detectExperienceLevel(title: string): string {
  const t = title.toLowerCase();
  if (/\b(intern|internship|trainee)\b/.test(t)) return "Intern";
  if (/\b(junior|jr\.?|entry[- ]?level|associate)\b/.test(t)) return "Junior";
  if (/\b(senior|sr\.?|lead|principal|staff)\b/.test(t)) return "Senior";
  if (/\b(director|vp|vice president|head of|chief)\b/.test(t)) return "Director+";
  if (/\b(manager|supervisor)\b/.test(t)) return "Manager";
  return "Mid-Level";
}

function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function aggregateListings(listings: IndeedListing[]) {
  const withSalary = listings
    .map((l) => {
      const annual = normalizeToAnnual(l.salaryMin, l.salaryMax, l.salaryPeriod);
      return annual ? { ...l, annualMin: annual.min, annualMax: annual.max, annualAvg: Math.round((annual.min + annual.max) / 2) } : null;
    })
    .filter(Boolean) as (IndeedListing & { annualMin: number; annualMax: number; annualAvg: number })[];

  if (withSalary.length === 0) {
    return null;
  }

  const allAvgs = withSalary.map((l) => l.annualAvg);
  const allMins = withSalary.map((l) => l.annualMin);
  const allMaxs = withSalary.map((l) => l.annualMax);

  // By location
  const locMap = new Map<string, number[]>();
  for (const l of withSalary) {
    const loc = l.location || "Unknown";
    if (!locMap.has(loc)) locMap.set(loc, []);
    locMap.get(loc)!.push(l.annualAvg);
  }
  const salaryByLocation = [...locMap.entries()]
    .map(([location, salaries]) => ({
      location,
      avgSalary: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
      count: salaries.length,
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary)
    .slice(0, 15);

  // By job type
  const typeMap = new Map<string, number[]>();
  for (const l of withSalary) {
    const jt = l.jobType || "Not specified";
    if (!typeMap.has(jt)) typeMap.set(jt, []);
    typeMap.get(jt)!.push(l.annualAvg);
  }
  const salaryByType = [...typeMap.entries()]
    .map(([jobType, salaries]) => ({
      jobType,
      avgSalary: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
      count: salaries.length,
    }))
    .sort((a, b) => b.count - a.count);

  // By experience
  const expMap = new Map<string, number[]>();
  for (const l of withSalary) {
    const level = detectExperienceLevel(l.jobTitle);
    if (!expMap.has(level)) expMap.set(level, []);
    expMap.get(level)!.push(l.annualAvg);
  }
  const salaryByExperience = [...expMap.entries()]
    .map(([level, salaries]) => ({
      level,
      avgSalary: Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length),
      count: salaries.length,
    }))
    .sort((a, b) => {
      const order = ["Intern", "Junior", "Mid-Level", "Senior", "Manager", "Director+"];
      return order.indexOf(a.level) - order.indexOf(b.level);
    });

  // Top companies
  const compMap = new Map<string, { salaries: number[]; rating: number; count: number }>();
  for (const l of withSalary) {
    const c = l.company || "Unknown";
    if (!compMap.has(c)) compMap.set(c, { salaries: [], rating: 0, count: 0 });
    const entry = compMap.get(c)!;
    entry.salaries.push(l.annualAvg);
    if (l.companyRating) entry.rating = l.companyRating;
    entry.count++;
  }
  const topCompanies = [...compMap.entries()]
    .map(([company, data]) => ({
      company,
      avgSalary: Math.round(data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length),
      rating: data.rating,
      count: data.count,
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary)
    .slice(0, 10);

  // Remote stats
  const remoteListings = withSalary.filter((l) => l.isRemote);
  const onsiteListings = withSalary.filter((l) => !l.isRemote);
  const remoteStats = {
    remoteAvg: remoteListings.length > 0 ? Math.round(remoteListings.reduce((a, l) => a + l.annualAvg, 0) / remoteListings.length) : 0,
    onsiteAvg: onsiteListings.length > 0 ? Math.round(onsiteListings.reduce((a, l) => a + l.annualAvg, 0) / onsiteListings.length) : 0,
    remoteCount: remoteListings.length,
    onsiteCount: onsiteListings.length,
  };

  // Sample listings (top 6 by salary)
  const sampleListings = withSalary
    .sort((a, b) => b.annualAvg - a.annualAvg)
    .slice(0, 6)
    .map((l) => ({
      jobTitle: l.jobTitle,
      company: l.company,
      location: l.location,
      salary: l.salary,
      annualAvg: l.annualAvg,
      jobType: l.jobType,
      isRemote: l.isRemote,
      companyRating: l.companyRating,
      datePosted: l.datePosted,
    }));

  return {
    avg_salary: Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length),
    median_salary: median(allAvgs),
    min_salary: Math.min(...allMins),
    max_salary: Math.max(...allMaxs),
    total_listings: withSalary.length,
    salary_by_location: salaryByLocation,
    salary_by_type: salaryByType,
    salary_by_experience: salaryByExperience,
    top_companies: topCompanies,
    remote_stats: remoteStats,
    sample_listings: sampleListings,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-admin-secret");
    if (authHeader !== BLOG_ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!APIFY_API_TOKEN) {
      return NextResponse.json({ error: "APIFY_API_TOKEN not configured" }, { status: 500 });
    }

    const body = await request.json();
    const slugs: string[] = body.slugs || Object.keys(SALARY_KEYWORDS);

    const results: Record<string, { success?: boolean; error?: string; listings?: number }> = {};

    for (const slug of slugs) {
      const config = SALARY_KEYWORDS[slug];
      if (!config) {
        results[slug] = { error: "Unknown slug" };
        continue;
      }

      console.log(`Syncing salary data for: ${config.jobTitle}`);

      try {
        // Call Apify Indeed Scraper
        const runResponse = await fetch(
          `https://api.apify.com/v2/acts/renzomacar~indeed-jobs/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              searchQueries: [config.jobTitle.toLowerCase()],
              country: "us",
              maxResultsPerQuery: 300,
              datePosted: "14",
              maxConcurrency: 3,
            }),
          }
        );

        if (!runResponse.ok) {
          const errText = await runResponse.text();
          results[slug] = { error: `Apify error: ${runResponse.status} - ${errText.substring(0, 200)}` };
          continue;
        }

        const listings: IndeedListing[] = await runResponse.json();
        console.log(`Got ${listings.length} listings for ${config.jobTitle}`);

        const aggregated = aggregateListings(listings);
        if (!aggregated) {
          results[slug] = { error: "No listings with salary data found" };
          continue;
        }

        const { error } = await supabaseAdmin
          .from("salary_pages")
          .upsert(
            {
              slug,
              job_title: config.jobTitle,
              keyword: config.keyword,
              ...aggregated,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "slug" }
          );

        if (error) {
          results[slug] = { error: error.message };
        } else {
          results[slug] = { success: true, listings: aggregated.total_listings };
        }
      } catch (err) {
        results[slug] = { error: err instanceof Error ? err.message : "Unknown error" };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Salary sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
