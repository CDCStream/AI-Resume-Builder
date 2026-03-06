const { createClient } = require("@supabase/supabase-js");
const Anthropic = require("@anthropic-ai/sdk");

require("dotenv").config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const keywords = {
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

async function generateSalaryData(jobTitle) {
  const prompt = `Generate realistic US salary data for "${jobTitle}" based on BLS, Glassdoor, and current 2025-2026 market data.

Return ONLY valid JSON (no markdown fences) with this structure:
{
  "avg_salary": <number>,
  "median_salary": <number>,
  "min_salary": <number, 10th percentile annual>,
  "max_salary": <number, 90th percentile annual>,
  "total_listings": <number, realistic 250-450>,
  "salary_by_location": [{"location": "City, ST", "avgSalary": <number>, "count": <number>}] (top 12 US cities, sorted by salary desc),
  "salary_by_type": [{"jobType": "Full-time"|"Contract"|"Part-time", "avgSalary": <number>, "count": <number>}],
  "salary_by_experience": [{"level": "Junior"|"Mid-Level"|"Senior"|"Manager"|"Director+", "avgSalary": <number>, "count": <number>}] (realistic progression),
  "top_companies": [{"company": "<real company>", "avgSalary": <number>, "rating": <1.0-5.0>, "count": <number>}] (top 8 real companies known to hire this role),
  "remote_stats": {"remoteAvg": <number>, "onsiteAvg": <number>, "remoteCount": <number>, "onsiteCount": <number>},
  "sample_listings": [{"jobTitle": "<variant title>", "company": "<real company>", "location": "City, ST", "salary": "$X,XXX - $Y,YYY a year", "annualAvg": <number>, "jobType": "Full-time", "isRemote": <boolean>, "companyRating": <number>, "datePosted": "X days ago"}] (6 realistic sample listings)
}`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: "You are a salary data expert. Output ONLY valid JSON. No markdown code fences, no explanation, just the JSON object.",
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("Failed to parse JSON: " + text.substring(0, 200));
  }
}

async function main() {
  const slugs = Object.keys(keywords);
  let done = 0;
  let errors = 0;

  for (const slug of slugs) {
    const config = keywords[slug];
    try {
      console.log(`[${done + 1}/${slugs.length}] ${config.jobTitle}...`);
      const data = await generateSalaryData(config.jobTitle);

      const row = {
        slug,
        job_title: config.jobTitle,
        keyword: config.keyword,
        avg_salary: data.avg_salary,
        median_salary: data.median_salary,
        min_salary: data.min_salary,
        max_salary: data.max_salary,
        total_listings: data.total_listings,
        salary_by_location: data.salary_by_location,
        salary_by_type: data.salary_by_type,
        salary_by_experience: data.salary_by_experience,
        top_companies: data.top_companies,
        remote_stats: data.remote_stats,
        sample_listings: data.sample_listings,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await sb.from("salary_pages").upsert(row, { onConflict: "slug" });
      if (error) {
        console.log(`  ❌ DB: ${error.message}`);
        errors++;
      } else {
        console.log(`  ✅ avg=$${data.avg_salary.toLocaleString()} median=$${data.median_salary.toLocaleString()} range=$${data.min_salary.toLocaleString()}-$${data.max_salary.toLocaleString()}`);
      }
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
      errors++;
    }
    done++;
  }

  console.log(`\nDone: ${done - errors}/${slugs.length} successful, ${errors} errors`);
}

main().catch(console.error);
