import { NextRequest, NextResponse } from "next/server";
import { Resume } from "@/lib/types/resume";

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

    // TODO: Integrate with Apify to fetch LinkedIn data
    // For now, return a mock response
    const mockResume: Resume = {
      basics: {
        name: "Imported User",
        label: "Professional",
        email: "user@example.com",
        summary: "Profile imported from LinkedIn",
      },
      work: [],
      education: [],
      skills: [],
    };

    return NextResponse.json({ resume: mockResume });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import profile" },
      { status: 500 }
    );
  }
}



