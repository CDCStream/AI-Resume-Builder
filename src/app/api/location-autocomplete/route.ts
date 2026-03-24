import { NextRequest, NextResponse } from "next/server";
import { isFreeMode } from "@/lib/app-config";
import { fuzzySearchCities } from "@/lib/static-cities";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const ACTOR_ID = "scrapier~google-search-autocomplete-scraper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Free mode: use static city list with fuzzy search
    if (isFreeMode) {
      const suggestions = fuzzySearchCities(query);
      return NextResponse.json({ suggestions });
    }

    // Premium mode: use Apify Google autocomplete
    if (!APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: "Apify API token not configured" },
        { status: 500 }
      );
    }

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
    
    const suggestions: string[] = [];
    
    if (Array.isArray(results) && results.length > 0) {
      const result = results[0];
      if (result.suggestions && Array.isArray(result.suggestions)) {
        for (const suggestion of result.suggestions) {
          let location = suggestion.replace(/^jobs\s+in\s+/i, "").trim();
          
          if (location && !location.toLowerCase().includes("job") && 
              !location.toLowerCase().includes("career") &&
              !location.toLowerCase().includes("hiring") &&
              !location.toLowerCase().includes("work from home")) {
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
