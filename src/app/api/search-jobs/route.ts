import { NextRequest, NextResponse } from "next/server";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const ACTOR_ID = "fantastic-jobs~advanced-linkedin-job-search-api";

interface SearchJobsRequest {
  titleSearch?: string[];
  titleExclusionSearch?: string[];
  locationSearch?: string[];
  locationExclusionSearch?: string[];
  descriptionSearch?: string[];
  descriptionExclusionSearch?: string[];
  organizationSearch?: string[];
  organizationExclusionSearch?: string[];
  organizationDescriptionSearch?: string[];
  organizationDescriptionExclusionSearch?: string[];
  organizationSlugFilter?: string[];
  organizationSlugExclusionFilter?: string[];
  industryFilter?: string[];
  timeRange?: "24h" | "7d" | "30d" | "6m";
  maxJobs?: number;
  remote?: boolean;
  seniorityLevel?: string[];
  employmentType?: string[];
  minCompanySize?: number;
  maxCompanySize?: number;
  easyApplyOnly?: boolean;
  includeAIFields?: boolean;
}

interface LinkedInJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  description: string;
  postedAt: string;
  applicationsCount?: number;
  url: string;
  easyApply?: boolean;
  remote?: boolean;
  workArrangement?: string; // Remote Solely, Remote OK, Hybrid, On-site
  employmentType?: string;
  seniorityLevel?: string;
  industry?: string;
  companySize?: string;
  salary?: string;
  skills?: string[];
}

export async function POST(request: NextRequest) {
  try {
    if (!APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: "Apify API token not configured" },
        { status: 500 }
      );
    }

    const body: SearchJobsRequest = await request.json();

    const input: Record<string, unknown> = {
      timeRange: body.timeRange || "7d",
      maxJobsPerApiCall: body.maxJobs || 25,
      includeAIFields: body.includeAIFields ?? true,
      removeAgencyJobs: false,
      descriptionType: "text",
    };

    if (body.titleSearch?.length) {
      input.titleSearch = body.titleSearch;
    }
    if (body.titleExclusionSearch?.length) {
      input.titleExclusionSearch = body.titleExclusionSearch;
    }
    if (body.locationSearch?.length) {
      // Parse location to extract city for more precise search
      // "Izmir, Turkey" -> send just "Izmir" to API for better results
      // "Turkey" -> send "Turkey" as is (country search)
      const processedLocations = body.locationSearch.map((loc: string) => {
        const parts = loc.split(",").map((p: string) => p.trim());
        if (parts.length >= 2) {
          // Has comma - first part is likely the city
          return parts[0];
        }
        return loc;
      });
      input.locationSearch = processedLocations;
      console.log("Location search: original:", body.locationSearch, "-> processed:", processedLocations);
    }
    if (body.locationExclusionSearch?.length) {
      input.locationExclusionSearch = body.locationExclusionSearch;
    }
    if (body.descriptionSearch?.length) {
      input.descriptionSearch = body.descriptionSearch;
    }
    if (body.descriptionExclusionSearch?.length) {
      input.descriptionExclusionSearch = body.descriptionExclusionSearch;
    }
    if (body.organizationSearch?.length) {
      input.organizationSearch = body.organizationSearch;
    }
    if (body.organizationExclusionSearch?.length) {
      input.organizationExclusionSearch = body.organizationExclusionSearch;
    }
    if (body.organizationDescriptionSearch?.length) {
      input.organizationDescriptionSearch = body.organizationDescriptionSearch;
    }
    if (body.organizationDescriptionExclusionSearch?.length) {
      input.organizationDescriptionExclusionSearch = body.organizationDescriptionExclusionSearch;
    }
    if (body.organizationSlugFilter?.length) {
      input.organizationSlugFilter = body.organizationSlugFilter;
    }
    if (body.organizationSlugExclusionFilter?.length) {
      input.organizationSlugExclusionFilter = body.organizationSlugExclusionFilter;
    }
    if (body.industryFilter?.length) {
      input.industryFilter = body.industryFilter;
    }
    if (body.remote !== undefined) {
      input.remote = body.remote;
    }
    if (body.seniorityLevel?.length) {
      input.seniorityLevel = body.seniorityLevel;
    }
    if (body.employmentType?.length) {
      input.employmentType = body.employmentType;
    }
    if (body.minCompanySize !== undefined) {
      input.minCompanySize = body.minCompanySize;
    }
    if (body.maxCompanySize !== undefined) {
      input.maxCompanySize = body.maxCompanySize;
    }
    if (body.easyApplyOnly !== undefined) {
      input.easyApplyOnly = body.easyApplyOnly;
    }

    console.log("Searching jobs with input:", JSON.stringify(input, null, 2));

    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error("Apify API error:", errorText);
      return NextResponse.json(
        { error: "Failed to search jobs", details: errorText },
        { status: runResponse.status }
      );
    }

    const rawJobs = await runResponse.json();
    console.log(`Found ${rawJobs.length} jobs`);
    
    // Debug: Log first job to see actual field names and location data
    if (rawJobs.length > 0) {
      const sample = rawJobs[0];
      console.log("Sample raw job keys:", Object.keys(sample));
      console.log("Location fields:", {
        locations_derived: sample.locations_derived,
        cities_derived: sample.cities_derived,
        countries_derived: sample.countries_derived,
        locations_raw: sample.locations_raw,
        location: sample.location,
        location_type: sample.location_type,
        organization: sample.organization,
        organization_logo: sample.organization_logo,
      });
    }

    const jobs: LinkedInJob[] = rawJobs.map((job: Record<string, unknown>) => {
      // Extract company name - field is "organization" (string)
      const companyName = (job.organization || "Unknown Company") as string;
      
      // Extract company logo - field is "organization_logo"
      const companyLogo = job.organization_logo as string | undefined;
      
      // Extract location - try multiple approaches
      let finalLocation = "Unknown Location";
      
      // Approach 1: cities_derived + countries_derived (most specific)
      const citiesDerived = job.cities_derived as string[] | undefined;
      const countriesDerived = job.countries_derived as string[] | undefined;
      const regionsDerived = job.regions_derived as string[] | undefined;
      
      // Build location from city, region, country
      const locationParts: string[] = [];
      if (citiesDerived && Array.isArray(citiesDerived) && citiesDerived.length > 0) {
        locationParts.push(citiesDerived[0]);
      }
      if (regionsDerived && Array.isArray(regionsDerived) && regionsDerived.length > 0) {
        locationParts.push(regionsDerived[0]);
      }
      if (countriesDerived && Array.isArray(countriesDerived) && countriesDerived.length > 0) {
        locationParts.push(countriesDerived[0]);
      }
      
      if (locationParts.length > 0) {
        finalLocation = locationParts.join(", ");
      }
      
      // Approach 2: locations_derived (can be string array or object array)
      if (finalLocation === "Unknown Location") {
        const locationsDerived = job.locations_derived as Array<string | {city?: string; admin?: string; country?: string}> | undefined;
        if (locationsDerived && Array.isArray(locationsDerived) && locationsDerived.length > 0) {
          const loc = locationsDerived[0];
          if (typeof loc === 'string' && loc.trim()) {
            finalLocation = loc;
          } else if (typeof loc === 'object' && loc !== null) {
            const parts = [loc.city, loc.admin, loc.country].filter(Boolean);
            if (parts.length > 0) {
              finalLocation = parts.join(", ");
            }
          }
        }
      }
      
      // Approach 3: locations_raw (Google Jobs format)
      if (finalLocation === "Unknown Location") {
        const locationsRaw = job.locations_raw as Array<Record<string, unknown>> | undefined;
        if (locationsRaw && Array.isArray(locationsRaw) && locationsRaw.length > 0) {
          const rawLoc = locationsRaw[0];
          const addressLocality = rawLoc.addressLocality || rawLoc.addressRegion || rawLoc.addressCountry;
          if (addressLocality) {
            finalLocation = String(addressLocality);
          }
        }
      }
      
      // Check for remote
      const isRemote = job.remote_derived === true || job.location_type === "TELECOMMUTE";
      if (isRemote && finalLocation === "Unknown Location") {
        finalLocation = "Remote";
      }

      // Extract description - field is "description_text" or "description_html"
      const description = (job.description_text || job.description_html || "") as string;
      
      // Extract employment type (array)
      const employmentTypeArr = job.employment_type as string[] | undefined;
      const employmentType = employmentTypeArr && employmentTypeArr.length > 0 
        ? employmentTypeArr[0] 
        : undefined;

      // Extract salary from salary_raw or AI fields
      let salary: string | undefined;
      const salaryRaw = job.salary_raw as Record<string, unknown> | undefined;
      if (salaryRaw) {
        const minValue = salaryRaw.minValue || salaryRaw.value;
        const maxValue = salaryRaw.maxValue;
        const currency = salaryRaw.currency || "";
        if (minValue && maxValue) {
          salary = `${currency}${minValue} - ${currency}${maxValue}`;
        } else if (minValue) {
          salary = `${currency}${minValue}`;
        }
      } else if (job.ai_salary_minvalue || job.ai_salary_maxvalue || job.ai_salary_value) {
        const currency = job.ai_salary_currency || "";
        const minVal = job.ai_salary_minvalue || job.ai_salary_value;
        const maxVal = job.ai_salary_maxvalue;
        if (minVal && maxVal) {
          salary = `${currency}${minVal} - ${currency}${maxVal}`;
        } else if (minVal) {
          salary = `${currency}${minVal}`;
        }
      }

      // Extract skills from AI fields
      const skills = (job.ai_key_skills || []) as string[];

      // Work arrangement from AI field
      const workArrangement = job.ai_work_arrangement as string | undefined;

      return {
        id: (job.id || String(Math.random())) as string,
        title: (job.title || "Unknown Position") as string,
        company: companyName,
        companyLogo: companyLogo,
        location: finalLocation,
        description: description,
        postedAt: (job.date_posted || job.date_created || new Date().toISOString()) as string,
        applicationsCount: 0, // Not available in this API
        url: (job.url || `https://www.linkedin.com/jobs/view/${job.id}`) as string,
        easyApply: job.directapply === true,
        remote: isRemote,
        workArrangement: workArrangement,
        employmentType: employmentType,
        seniorityLevel: job.seniority as string | undefined,
        industry: job.linkedin_org_industry as string | undefined,
        companySize: job.linkedin_org_size as string | undefined,
        salary: salary,
        skills: skills,
      };
    });

    // Client-side location filtering
    // If user specified a city (not just country), filter out jobs from other cities
    const locationSearchTerms = body.locationSearch || [];
    let filteredJobs = jobs;
    
    // Check if user explicitly wants on-site only (remote === false)
    const onSiteOnly = body.remote === false;
    
    if (locationSearchTerms.length > 0) {
      // Check if any search term looks like a city (contains comma or is not a common country name)
      const commonCountries = ["turkey", "united states", "united kingdom", "germany", "france", "canada", "australia", "netherlands", "spain", "italy", "remote"];
      const hasCitySearch = locationSearchTerms.some((term: string) => {
        const lowerTerm = term.toLowerCase().trim();
        // If it contains a comma, it's likely "City, Country" format
        if (lowerTerm.includes(",")) return true;
        // If it's not a common country name, assume it's a city
        return !commonCountries.includes(lowerTerm);
      });
      
      console.log("Location filtering:", { locationSearchTerms, hasCitySearch, onSiteOnly });
      
      if (hasCitySearch) {
        filteredJobs = jobs.filter(job => {
          const jobLocation = job.location.toLowerCase();
          
          // If on-site only is selected, skip remote jobs
          if (onSiteOnly && job.remote) {
            return false;
          }
          
          // Remote jobs can match any location search (unless on-site only)
          if (!onSiteOnly && job.remote && (jobLocation.includes("remote") || job.workArrangement?.toLowerCase().includes("remote"))) {
            return true;
          }
          
          // Check if the city part matches the job location
          return locationSearchTerms.some((term: string) => {
            const searchParts = term.toLowerCase().split(",").map((p: string) => p.trim());
            // The city part (first part) must match
            const cityPart = searchParts[0];
            const matches = jobLocation.includes(cityPart);
            if (!matches) {
              console.log(`Filtering out: "${job.location}" does not contain "${cityPart}"`);
            }
            return matches;
          });
        });
        
        console.log(`Filtered from ${jobs.length} to ${filteredJobs.length} jobs`);
      }
    }
    
    // Sort by posted date (newest first)
    filteredJobs.sort((a, b) => {
      const dateA = new Date(a.postedAt).getTime();
      const dateB = new Date(b.postedAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ jobs: filteredJobs, total: filteredJobs.length });
  } catch (error) {
    console.error("Search jobs error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search jobs" },
      { status: 500 }
    );
  }
}
