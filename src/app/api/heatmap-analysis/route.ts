import { NextRequest, NextResponse } from "next/server";

interface ResumeSection {
  id: string;
  type: string;
  label: string;
  pageIndex: number;
  yPercent: number;
  heightPercent: number;
}

// Realistic recruiter eye-tracking scan based on Ladders 2018 study.
// Recruiters follow an F-pattern: Name/Title → Current Role → Summary → Skills → Education → Contact → Other
function generateHeatmap(sections: ResumeSection[]) {
  const page1 = sections.filter(s => s.pageIndex === 0);

  const targetTypes: { types: string[]; intensity: number; timeSpent: number; scanOrder: number; pattern: string }[] = [
    { types: ["header", "basics"],                intensity: 1.0,  timeSpent: 1.0,  scanOrder: 1, pattern: "focus" },
    { types: ["experience", "work"],              intensity: 0.95, timeSpent: 1.5,  scanOrder: 2, pattern: "focus" },
    { types: ["summary", "profile", "objective"], intensity: 0.7,  timeSpent: 0.8,  scanOrder: 3, pattern: "skim" },
    { types: ["skills", "skill"],                 intensity: 0.65, timeSpent: 1.0,  scanOrder: 4, pattern: "skim" },
    { types: ["education"],                       intensity: 0.55, timeSpent: 0.5,  scanOrder: 5, pattern: "skim" },
    { types: ["contact", "location", "info"],     intensity: 0.4,  timeSpent: 0.4,  scanOrder: 6, pattern: "glance" },
    { types: ["projects", "project", "certificates", "certificate", "awards", "languages"], intensity: 0.3, timeSpent: 0.3, scanOrder: 7, pattern: "glance" },
  ];

  const result = [];

  for (const target of targetTypes) {
    const match = page1.find(s => target.types.includes(s.type));
    if (match) {
      result.push({
        sectionId: match.id,
        intensity: target.intensity,
        timeSpent: target.timeSpent,
        scanOrder: target.scanOrder,
        pattern: target.pattern,
      });
    }
  }

  // Redistribute remaining time to fill 6 seconds total
  if (result.length > 0) {
    const totalAssigned = result.reduce((sum, r) => sum + r.timeSpent, 0);
    if (Math.abs(totalAssigned - 6.0) > 0.01) {
      const ratio = 6.0 / totalAssigned;
      result.forEach(r => {
        r.timeSpent = Math.round(r.timeSpent * ratio * 10) / 10;
      });
      const adjusted = result.reduce((sum, r) => sum + r.timeSpent, 0);
      if (Math.abs(adjusted - 6.0) > 0.01) {
        result[0].timeSpent = Math.round((result[0].timeSpent + (6.0 - adjusted)) * 10) / 10;
      }
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { sections } = await request.json();

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: "sections array is required" }, { status: 400 });
    }

    const heatmapData = generateHeatmap(sections);

    return NextResponse.json({ heatmapData });
  } catch (error) {
    console.error("Heatmap analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze" },
      { status: 500 }
    );
  }
}
