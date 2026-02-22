import { NextRequest, NextResponse } from "next/server";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const ACTOR_ID = "scrapier~google-search-autocomplete-scraper";

export async function POST(request: NextRequest) {
  try {
    if (!APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: "Apify API token not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Add "jobs in" prefix to get location-relevant suggestions
    const searchQuery = `jobs in ${query}`;

    const input = {
      queries: [searchQuery],
      maxSuggestions: 10,
      languageCode: "en",
      countryCode: "us",
    };

    console.log("Fetching location autocomplete for:", query);

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
        { error: "Failed to fetch suggestions", details: errorText },
        { status: runResponse.status }
      );
    }

    const results = await runResponse.json();
    
    // Extract location names from suggestions
    const suggestions: string[] = [];
    
    if (Array.isArray(results) && results.length > 0) {
      const result = results[0];
      if (result.suggestions && Array.isArray(result.suggestions)) {
        for (const suggestion of result.suggestions) {
          // Remove "jobs in " prefix and clean up the suggestion
          let location = suggestion.replace(/^jobs\s+in\s+/i, "").trim();
          
          // Only add if it looks like a location (not a job title or company)
          if (location && !location.toLowerCase().includes("job") && 
              !location.toLowerCase().includes("career") &&
              !location.toLowerCase().includes("hiring") &&
              !location.toLowerCase().includes("work from home")) {
            // Capitalize properly
            location = location
              .split(" ")
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ");
            
            if (!suggestions.includes(location)) {
              suggestions.push(location);
            }
          }
        }
      }
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 8) });
  } catch (error) {
    console.error("Location autocomplete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
