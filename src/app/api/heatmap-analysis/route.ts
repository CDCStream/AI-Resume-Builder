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
// Recruiters follow an F-pattern, ordered by page then priority within each page.
// Time is adjusted by section size and scroll cost between pages is deducted.
function generateHeatmap(sections: ResumeSection[]) {
  const SCROLL_TIME_PER_PAGE = 0.5;
  const TOTAL_TIME = 6.0;

  const MIN_TIME = 0.5;

  const priorities: {
    types: string[];
    baseIntensity: number;
    baseTime: number;
    priority: number;
    pattern: string;
    sizeWeight: number;
  }[] = [
    { types: ["header", "basics"],                baseIntensity: 1.0,  baseTime: 1.0,  priority: 1,  pattern: "focus",  sizeWeight: 0.2 },
    { types: ["experience", "work"],              baseIntensity: 0.95, baseTime: 1.5,  priority: 2,  pattern: "focus",  sizeWeight: 0.5 },
    { types: ["summary", "profile", "objective"], baseIntensity: 0.7,  baseTime: 0.8,  priority: 3,  pattern: "skim",   sizeWeight: 0.3 },
    { types: ["skills", "skill"],                 baseIntensity: 0.65, baseTime: 0.7,  priority: 4,  pattern: "skim",   sizeWeight: 0.4 },
    { types: ["education"],                       baseIntensity: 0.55, baseTime: 0.6,  priority: 5,  pattern: "skim",   sizeWeight: 0.4 },
    { types: ["projects", "project"],             baseIntensity: 0.5,  baseTime: 0.6,  priority: 6,  pattern: "skim",   sizeWeight: 0.6 },
    { types: ["contact", "location", "info"],     baseIntensity: 0.4,  baseTime: 0.5,  priority: 7,  pattern: "glance", sizeWeight: 0.1 },
    { types: ["certificates", "certificate"],     baseIntensity: 0.35, baseTime: 0.5,  priority: 8,  pattern: "glance", sizeWeight: 0.3 },
    { types: ["awards"],                          baseIntensity: 0.3,  baseTime: 0.5,  priority: 9,  pattern: "glance", sizeWeight: 0.2 },
    { types: ["languages"],                       baseIntensity: 0.3,  baseTime: 0.5,  priority: 10, pattern: "glance", sizeWeight: 0.1 },
  ];

  // Match sections to priorities
  interface MatchedZone {
    sectionId: string;
    pageIndex: number;
    intensity: number;
    timeSpent: number;
    priority: number;
    pattern: string;
  }
  const matched: MatchedZone[] = [];

  for (const p of priorities) {
    const match = sections.find(s => p.types.includes(s.type));
    if (!match) continue;

    const sizeFactor = Math.max(0.5, Math.min(2.5, match.heightPercent / 15));
    const adjustedTime = p.baseTime * (1 - p.sizeWeight) + p.baseTime * p.sizeWeight * sizeFactor;
    const pageDecay = match.pageIndex > 0 ? 0.85 : 1.0;

    matched.push({
      sectionId: match.id,
      pageIndex: match.pageIndex,
      intensity: Math.round(p.baseIntensity * pageDecay * 100) / 100,
      timeSpent: Math.round(adjustedTime * 10) / 10,
      priority: p.priority,
      pattern: p.pattern,
    });
  }

  // Sort by page first, then by priority within each page
  matched.sort((a, b) => a.pageIndex !== b.pageIndex ? a.pageIndex - b.pageIndex : a.priority - b.priority);

  // Calculate scroll cost: count distinct page transitions in scan order
  let scrollCost = 0;
  for (let i = 1; i < matched.length; i++) {
    if (matched[i].pageIndex !== matched[i - 1].pageIndex) {
      scrollCost += SCROLL_TIME_PER_PAGE;
    }
  }

  const availableTime = Math.max(TOTAL_TIME - scrollCost, TOTAL_TIME * 0.5);

  // If too many sections to fit with MIN_TIME each, drop lowest-priority ones
  while (matched.length > 0 && matched.length * MIN_TIME > availableTime) {
    matched.pop();
  }

  // Redistribute section times to fill available time
  if (matched.length > 0) {
    const totalRaw = matched.reduce((s, m) => s + m.timeSpent, 0);
    if (totalRaw > 0) {
      const ratio = availableTime / totalRaw;
      matched.forEach(m => {
        m.timeSpent = Math.round(m.timeSpent * ratio * 10) / 10;
      });

      // Enforce minimum time: steal from sections above minimum
      for (let pass = 0; pass < 5; pass++) {
        const belowMin = matched.filter(m => m.timeSpent < MIN_TIME);
        if (belowMin.length === 0) break;

        const aboveMin = matched.filter(m => m.timeSpent > MIN_TIME);
        if (aboveMin.length === 0) break;

        let deficit = 0;
        belowMin.forEach(m => {
          deficit += MIN_TIME - m.timeSpent;
          m.timeSpent = MIN_TIME;
        });

        const totalAbove = aboveMin.reduce((s, m) => s + (m.timeSpent - MIN_TIME), 0);
        if (totalAbove <= 0) break;

        aboveMin.forEach(m => {
          const share = ((m.timeSpent - MIN_TIME) / totalAbove) * deficit;
          m.timeSpent = Math.round((m.timeSpent - share) * 10) / 10;
        });
      }

      // Final adjustment to hit exact available time
      const adjusted = matched.reduce((s, m) => s + m.timeSpent, 0);
      if (Math.abs(adjusted - availableTime) > 0.01) {
        matched[0].timeSpent = Math.round((matched[0].timeSpent + (availableTime - adjusted)) * 10) / 10;
      }
    }
  }

  // Assign final scanOrder
  return matched.map((m, i) => ({
    sectionId: m.sectionId,
    intensity: m.intensity,
    timeSpent: m.timeSpent,
    scanOrder: i + 1,
    pattern: m.pattern,
  }));
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
