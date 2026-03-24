import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface SalaryPage {
  slug: string;
  job_title: string;
  keyword: string;
  avg_salary: number;
  median_salary: number;
  min_salary: number;
  max_salary: number;
  total_listings: number;
  salary_by_location: { location: string; avgSalary: number; count: number }[];
  salary_by_type: { jobType: string; avgSalary: number; count: number }[];
  salary_by_experience: { level: string; avgSalary: number; count: number }[];
  top_companies: { company: string; avgSalary: number; rating: number; count: number }[];
  remote_stats: { remoteAvg: number; onsiteAvg: number; remoteCount: number; onsiteCount: number };
  sample_listings: { jobTitle: string; company: string; location: string; salary: string; annualAvg: number; jobType: string; isRemote: boolean; companyRating: number; datePosted: string }[];
  last_synced_at: string;
  updated_at: string;
}

const ALL_SLUGS = [
  "dental-hygienist", "software-engineer", "registered-nurse", "project-manager",
  "data-analyst", "cyber-security", "administrative-assistant", "marketing-manager",
  "product-manager", "financial-analyst", "ux-designer", "devops-engineer",
  "scrum-master", "solutions-architect", "systems-administrator", "executive-assistant",
];

export const revalidate = 60;

export async function generateStaticParams() {
  return ALL_SLUGS.map((slug) => ({ slug }));
}

async function getSalaryData(slug: string): Promise<SalaryPage | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("salary_pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as SalaryPage;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSalaryData(slug);
  const title = data?.job_title || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avg = data?.avg_salary ? `$${(data.avg_salary / 1000).toFixed(0)}K` : "";
  const year = new Date().getFullYear();

  return {
    title: `${title} Salary in ${year}: How Much Do They Make? | LinImpact.ai`,
    description: `${title} salary ranges from ${data?.min_salary ? "$" + data.min_salary.toLocaleString() : "varies"} to ${data?.max_salary ? "$" + data.max_salary.toLocaleString() : "varies"} per year${avg ? `, with an average of ${avg}` : ""}. See salary by location, experience, and company.`,
    alternates: { canonical: `https://www.linimpact.ai/salary/${slug}` },
    openGraph: {
      title: `${title} Salary ${year} — Average Pay, Ranges & More`,
      description: `How much does a ${title} make? See real salary data from ${data?.total_listings || 0}+ job listings.`,
      url: `https://www.linimpact.ai/salary/${slug}`,
      siteName: "LinImpact.ai",
      type: "article",
    },
  };
}

function fmt(n: number | undefined | null): string {
  if (!n) return "$0";
  return "$" + n.toLocaleString("en-US");
}

function pct(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(2, Math.min(98, ((value - min) / (max - min)) * 100));
}

function SalaryGauge({ min, avg, median, max }: { min: number; avg: number; median: number; max: number }) {
  const avgPos = pct(avg, min, max);
  const medianPos = pct(median, min, max);

  return (
    <div className="relative mt-6 mb-10">
      <div className="h-4 rounded-full bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 relative overflow-visible">
        <div className="absolute -top-1 w-6 h-6 rounded-full bg-white border-[3px] border-emerald-500 shadow-lg transform -translate-x-1/2" style={{ left: `${avgPos}%` }} />
        <div className="absolute -top-1 w-5 h-5 rounded-full bg-white border-[3px] border-amber-500 shadow-lg transform -translate-x-1/2" style={{ left: `${medianPos}%` }} />
      </div>
      <div className="flex justify-between mt-3 text-sm">
        <span className="text-gray-500">{fmt(min)}</span>
        <span className="text-gray-500">{fmt(max)}</span>
      </div>
      <div className="flex items-center gap-6 mt-2 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-white inline-block" /> Average</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-amber-500 bg-white inline-block" /> Median</span>
      </div>
    </div>
  );
}

function BarChart({ items, label }: { items: { name: string; value: number; count?: number }[]; label: string }) {
  if (items.length === 0) return null;
  const maxVal = Math.max(...items.map((i) => i.value));

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">{label}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 font-medium">{item.name}</span>
              <span className="text-gray-900 font-semibold">{fmt(item.value)}{item.count ? <span className="text-gray-400 font-normal ml-1">({item.count})</span> : ""}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all" style={{ width: `${(item.value / maxVal) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function SalaryPageRoute({ params }: Props) {
  const { slug } = await params;
  const data = await getSalaryData(slug);

  if (!data) {
    // If no data yet, show placeholder for valid slugs
    if (!ALL_SLUGS.includes(slug)) notFound();

    const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title} Salary</h1>
          <p className="text-gray-500 mb-6">Salary data is being collected. Please check back soon.</p>
          <Link href="/" className="text-blue-600 hover:underline">← Back to LinImpact.ai</Link>
        </div>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const otherSlugs = ALL_SLUGS.filter((s) => s !== slug).slice(0, 8);

  // FAQ items for AEO
  const faqs = [
    {
      q: `How much does a ${data.job_title} make per year?`,
      a: `The average ${data.job_title} salary is ${fmt(data.avg_salary)} per year in the United States. Salaries range from ${fmt(data.min_salary)} to ${fmt(data.max_salary)} depending on experience, location, and company.`,
    },
    {
      q: `What is the highest paying city for ${data.job_title}s?`,
      a: data.salary_by_location.length > 0
        ? `${data.salary_by_location[0].location} is the highest paying city for ${data.job_title}s with an average salary of ${fmt(data.salary_by_location[0].avgSalary)} per year.`
        : `Salary varies by location. Major metropolitan areas typically offer higher compensation.`,
    },
    {
      q: `Do remote ${data.job_title}s earn more?`,
      a: data.remote_stats.remoteCount > 0
        ? `Remote ${data.job_title}s earn an average of ${fmt(data.remote_stats.remoteAvg)} per year compared to ${fmt(data.remote_stats.onsiteAvg)} for on-site positions.`
        : `Remote salary data is limited for this role. Generally, remote positions may offer competitive compensation.`,
    },
    {
      q: `What skills increase a ${data.job_title}'s salary?`,
      a: `Specialized certifications, leadership experience, and in-demand technical skills typically command higher salaries. Senior-level ${data.job_title}s earn significantly more than entry-level professionals. Check the BLS Occupational Outlook Handbook for detailed skill requirements.`,
    },
    {
      q: `How can I negotiate a higher ${data.job_title} salary?`,
      a: `Research market rates (you're already doing that!), highlight your unique skills, quantify your achievements, and consider the total compensation package. A well-crafted, ATS-optimized resume that showcases your value can strengthen your negotiating position.`,
    },
  ];

  // Schema.org structured data for GEO/AEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const occupationSchema = {
    "@context": "https://schema.org",
    "@type": "Occupation",
    name: data.job_title,
    estimatedSalary: {
      "@type": "MonetaryAmountDistribution",
      name: `${data.job_title} Salary`,
      currency: "USD",
      duration: "P1Y",
      percentile10: fmt(data.min_salary),
      median: fmt(data.median_salary),
      percentile90: fmt(data.max_salary),
    },
    occupationLocation: {
      "@type": "Country",
      name: "United States",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.linimpact.ai" },
      { "@type": "ListItem", position: 2, name: "Salary Guide", item: "https://www.linimpact.ai/salary" },
      { "@type": "ListItem", position: 3, name: `${data.job_title} Salary`, item: `https://www.linimpact.ai/salary/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(occupationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Nav */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="LinImpact.ai" className="w-10 h-10 object-contain" />
              <span className="text-xl font-extrabold tracking-tight -ml-2" style={{ fontFamily: "var(--font-poppins)" }}>
                <span className="text-cyan-500">Lin</span>
                <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 bg-clip-text text-transparent">Impact</span>
                <span className="text-slate-500 font-semibold">.ai</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">Blog</Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Get Started Free</Link>
            </div>
          </div>
        </nav>

        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
              <li>/</li>
              <li><Link href="/salary/software-engineer" className="hover:text-blue-600">Salary Guide</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">{data.job_title}</li>
            </ol>
          </nav>
        </div>

        {/* Hero */}
        <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-10">
          <p className="text-sm font-semibold text-blue-600 mb-2">SALARY GUIDE {year}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4" style={{ fontFamily: "var(--font-poppins)" }}>
            {data.job_title} Salary
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
            How much does a {data.job_title} make? Based on analysis of <strong>{data.total_listings.toLocaleString()} real job listings</strong> from{" "}
            <a href="https://www.indeed.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Indeed</a> in the United States,
            the average {data.job_title} earns <strong>{fmt(data.avg_salary)}</strong> per year, with salaries ranging from {fmt(data.min_salary)} to {fmt(data.max_salary)}.
          </p>

          {/* Quick Answer Box for AEO */}
          <div className="mt-8 p-6 rounded-2xl bg-blue-50 border border-blue-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Average</p>
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900">{fmt(data.avg_salary)}</p>
                <p className="text-xs text-gray-500">per year</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Median</p>
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900">{fmt(data.median_salary)}</p>
                <p className="text-xs text-gray-500">per year</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Low End</p>
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900">{fmt(data.min_salary)}</p>
                <p className="text-xs text-gray-500">per year</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">High End</p>
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900">{fmt(data.max_salary)}</p>
                <p className="text-xs text-gray-500">per year</p>
              </div>
            </div>
            <SalaryGauge min={data.min_salary} avg={data.avg_salary} median={data.median_salary} max={data.max_salary} />
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          {/* Salary by Location */}
          {data.salary_by_location.length > 0 && (
            <section className="mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{data.job_title} Salary by Location</h2>
              <p className="text-gray-600 mb-6">Compensation varies significantly by city. Here are the top-paying locations for {data.job_title}s.</p>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">Location</th>
                      <th className="text-right px-6 py-3 font-semibold text-gray-600">Avg. Salary</th>
                      <th className="text-right px-6 py-3 font-semibold text-gray-600 hidden sm:table-cell">Listings</th>
                      <th className="text-right px-6 py-3 font-semibold text-gray-600 hidden md:table-cell">vs. Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.salary_by_location.map((loc, i) => {
                      const diff = loc.avgSalary - data.avg_salary;
                      const diffPct = ((diff / data.avg_salary) * 100).toFixed(1);
                      return (
                        <tr key={loc.location} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-6 py-3 font-medium text-gray-900">{loc.location}</td>
                          <td className="px-6 py-3 text-right font-semibold text-gray-900">{fmt(loc.avgSalary)}</td>
                          <td className="px-6 py-3 text-right text-gray-500 hidden sm:table-cell">{loc.count}</td>
                          <td className={`px-6 py-3 text-right font-medium hidden md:table-cell ${diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {diff >= 0 ? "+" : ""}{diffPct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Experience & Type side by side */}
          <div className="grid md:grid-cols-2 gap-10 mb-14">
            {data.salary_by_experience.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
                <BarChart
                  label={`${data.job_title} Salary by Experience`}
                  items={data.salary_by_experience.map((e) => ({ name: e.level, value: e.avgSalary, count: e.count }))}
                />
              </section>
            )}
            {data.salary_by_type.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6">
                <BarChart
                  label="Salary by Employment Type"
                  items={data.salary_by_type.map((t) => ({ name: t.jobType, value: t.avgSalary, count: t.count }))}
                />
              </section>
            )}
          </div>

          {/* Remote vs On-site */}
          {(data.remote_stats.remoteCount > 0 || data.remote_stats.onsiteCount > 0) && (
            <section className="mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Remote vs. On-Site {data.job_title} Salary</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {data.remote_stats.remoteCount > 0 && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🏠</span>
                      <h3 className="text-lg font-bold text-gray-900">Remote</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-gray-900">{fmt(data.remote_stats.remoteAvg)}</p>
                    <p className="text-sm text-gray-500 mt-1">Based on {data.remote_stats.remoteCount} remote listings</p>
                  </div>
                )}
                {data.remote_stats.onsiteCount > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🏢</span>
                      <h3 className="text-lg font-bold text-gray-900">On-Site</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-gray-900">{fmt(data.remote_stats.onsiteAvg)}</p>
                    <p className="text-sm text-gray-500 mt-1">Based on {data.remote_stats.onsiteCount} on-site listings</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Top Companies */}
          {data.top_companies.length > 0 && (
            <section className="mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Top Paying Companies for {data.job_title}s</h2>
              <p className="text-gray-600 mb-6">These companies offer the highest compensation for {data.job_title} positions.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.top_companies.slice(0, 9).map((c) => (
                  <div key={c.company} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-gray-900 mb-1 truncate">{c.company}</h4>
                    <p className="text-2xl font-extrabold text-blue-600">{fmt(c.avgSalary)}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {c.rating > 0 && <span>⭐ {c.rating.toFixed(1)}</span>}
                      <span>{c.count} listing{c.count > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sample Listings */}
          {data.sample_listings.length > 0 && (
            <section className="mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sample {data.job_title} Job Listings</h2>
              <div className="space-y-3">
                {data.sample_listings.map((l, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{l.jobTitle}</h4>
                      <p className="text-sm text-gray-500">{l.company} • {l.location}{l.isRemote ? " (Remote)" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{fmt(l.annualAvg)}</p>
                      <p className="text-xs text-gray-400">{l.datePosted}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ for AEO/GEO */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="bg-white rounded-xl border border-gray-200 group" open={i === 0}>
                  <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:text-blue-600 transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform ml-4 shrink-0">▼</span>
                  </summary>
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Methodology & Sources */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Methodology & Data Sources</h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-sm text-gray-600 leading-relaxed space-y-3">
              <p>
                Our salary data is aggregated from <strong>{data.total_listings.toLocaleString()}+ real job listings</strong> sourced from{" "}
                <a href="https://www.indeed.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Indeed</a>,
                one of the largest job boards in the world. Data is validated against federal statistics from the{" "}
                <a href="https://www.bls.gov/oes/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">U.S. Bureau of Labor Statistics (BLS)</a>{" "}
                Occupational Employment and Wage Statistics program.
              </p>
              <p>
                For additional salary benchmarking, we recommend cross-referencing with{" "}
                <a href="https://www.glassdoor.com/Salaries/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Glassdoor Salary Explorer</a>,{" "}
                <a href="https://www.payscale.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">PayScale</a>, and{" "}
                <a href="https://www.salary.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Salary.com</a>.
                Salary figures represent annualized estimates and may vary based on benefits, bonuses, and equity compensation.
              </p>
              <p>
                Last updated: {data.last_synced_at ? new Date(data.last_synced_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recently"}.
                Learn more about career planning in our{" "}
                <Link href="/blog" className="text-blue-600 hover:underline">career insights blog</Link>.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 md:p-12 text-center text-white mb-14">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Land a {data.job_title} Role?</h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">
              Build a professional, ATS-optimized resume that highlights your value and helps you negotiate the salary you deserve.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Build Your Resume →
              </Link>
              <Link
                href="/blog/how-to-write-a-resume"
                className="inline-block px-6 py-3 border border-white/40 text-white font-medium rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Resume Writing Tips
              </Link>
            </div>
          </section>

          {/* Related Salary Pages (internal linking for SEO) */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Other Salary Guides</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {otherSlugs.map((s) => {
                const name = s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <Link
                    key={s}
                    href={`/salary/${s}`}
                    className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    {name} Salary →
                  </Link>
                );
              })}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/" className="hover:text-white transition-colors">Resume Builder</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Get Started Free</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/blog" className="hover:text-white transition-colors">Career Blog</Link></li>
                  <li><Link href="/blog/how-to-write-a-resume" className="hover:text-white transition-colors">Resume Writing Guide</Link></li>
                  <li><Link href="/blog/skills-examples-for-resume" className="hover:text-white transition-colors">Skills for Resume</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Salary Guides</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/salary/software-engineer" className="hover:text-white transition-colors">Software Engineer</Link></li>
                  <li><Link href="/salary/data-analyst" className="hover:text-white transition-colors">Data Analyst</Link></li>
                  <li><Link href="/salary/project-manager" className="hover:text-white transition-colors">Project Manager</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">External Sources</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="https://www.bls.gov/oes/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Bureau of Labor Statistics</a></li>
                  <li><a href="https://www.indeed.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Indeed</a></li>
                  <li><a href="https://www.glassdoor.com/Salaries/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Glassdoor</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center">
                <img src="/logo.png" alt="LinImpact.ai" className="w-8 h-8" />
                <span className="text-white font-bold ml-2">LinImpact.ai</span>
              </Link>
              <p className="text-sm text-center">Salary data sourced from Indeed job listings. Updated {data.last_synced_at ? new Date(data.last_synced_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "regularly"}.</p>
              <div className="flex items-center gap-4 text-xs">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">&copy; {new Date().getFullYear()} LinImpact.ai. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
