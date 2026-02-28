"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Resume } from "@/lib/types/resume";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Play,
  RotateCcw,
  Download,
  Loader2,
  Sparkles,
  X,
  Briefcase,
  GraduationCap,
  Star,
  Target,
  Zap,
  AlertTriangle,
  XCircle,
  Clock,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import html2canvas from "html2canvas";

interface HeatmapZoneData {
  sectionId: string;
  intensity: number;
  timeSpent: number;
  scanOrder: number;
  pattern: "focus" | "skim" | "glance" | "skip";
}

interface SectionRect {
  id: string;
  type: string;
  label: string;
  pageIndex: number;
  top: number;
  left: number;
  width: number;
  height: number;
  yPercent: number;
  heightPercent: number;
  contentPreview: string;
}

interface VerdictItem {
  icon: string;
  title: string;
  detail: string;
}

interface RecruiterVerdict {
  probability: number;
  verdict: string;
  positives: VerdictItem[];
  negatives: VerdictItem[];
  tip: string;
}

interface ScanZoneInput {
  id: string;
  name: string;
  section: string;
  attention: "high" | "medium" | "low" | "none";
  timeSpent: number;
  issue?: string;
  suggestion?: string;
}

interface HeatmapScanModalProps {
  open: boolean;
  onClose: () => void;
  resume: Resume;
  selectedTemplate: string;
  jobDescription?: string;
  scanZones?: ScanZoneInput[];
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1122;

const SECTION_TYPE_MAP: Record<string, string> = {
  header: "Header / Name & Title",
  basics: "Contact Information",
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certificates: "Certifications",
  languages: "Languages",
  awards: "Awards",
  volunteering: "Volunteering",
  interests: "Interests",
  references: "References",
  courses: "Courses",
  internships: "Internships",
  activities: "Activities",
  hobbies: "Hobbies",
  publications: "Publications",
  strengths: "Strengths",
  philosophy: "Philosophy",
  books: "Books",
  socialLinks: "Social Links",
  industryExpertise: "Industry Expertise",
  custom: "Custom Section",
};

function getIntensityColor(intensity: number, opacity: number = 0.6): string {
  if (intensity >= 0.8) return `rgba(255, 0, 0, ${opacity})`;
  if (intensity >= 0.6) return `rgba(255, 80, 0, ${opacity})`;
  if (intensity >= 0.4) return `rgba(255, 165, 0, ${opacity})`;
  if (intensity >= 0.2) return `rgba(255, 255, 0, ${opacity})`;
  if (intensity > 0) return `rgba(0, 180, 255, ${opacity * 0.6})`;
  return `rgba(100, 100, 100, ${opacity * 0.2})`;
}

function getPatternLabel(pattern: string): string {
  switch (pattern) {
    case "focus": return "Deep Focus";
    case "skim": return "Skimmed";
    case "glance": return "Quick Glance";
    case "skip": return "Likely Skipped";
    default: return pattern;
  }
}

export default function HeatmapScanModal({
  open,
  onClose,
  resume,
  selectedTemplate,
  jobDescription = "",
  scanZones: externalScanZones,
}: HeatmapScanModalProps) {
  const [phase, setPhase] = useState<"loading" | "ready" | "animating" | "complete">("loading");
  const [heatmapData, setHeatmapData] = useState<HeatmapZoneData[]>([]);
  const [sectionRects, setSectionRects] = useState<SectionRect[]>([]);
  const [currentScanIndex, setCurrentScanIndex] = useState(-1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllHeat, setShowAllHeat] = useState(false);
  const [verdict, setVerdict] = useState<RecruiterVerdict | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);

  const resumeContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const zoneElementRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const extractSections = useCallback(() => {
    if (!resumeContainerRef.current) return [];

    const container = resumeContainerRef.current;
    const pageWrappers = container.querySelectorAll(".page-content-wrapper");
    const rects: SectionRect[] = [];
    const seenTypes = new Set<string>();

    pageWrappers.forEach((pageWrapper, pageIndex) => {
      const pageRect = pageWrapper.getBoundingClientRect();

      const sections = pageWrapper.querySelectorAll("[data-section]");
      sections.forEach((section) => {
        const el = section as HTMLElement;
        const sectionType = el.getAttribute("data-section") || "unknown";
        const rect = el.getBoundingClientRect();

        const relTop = rect.top - pageRect.top;
        const relLeft = rect.left - pageRect.left;

        // Only include sections actually visible within this page's bounds
        const visibleTop = Math.max(0, relTop);
        const visibleBottom = Math.min(A4_HEIGHT, relTop + rect.height);
        const visibleHeight = visibleBottom - visibleTop;

        if (visibleHeight < 20) return; // Too small / not visible on this page

        // Deduplicate: each section type should appear only once (on the page where it's most visible)
        const uniqueKey = `${sectionType}-p${pageIndex}`;
        if (seenTypes.has(uniqueKey)) return;
        seenTypes.add(uniqueKey);

        rects.push({
          id: `p${pageIndex}-${sectionType}`,
          type: sectionType,
          label: SECTION_TYPE_MAP[sectionType] || sectionType,
          pageIndex,
          top: visibleTop,
          left: Math.max(0, relLeft),
          width: rect.width,
          height: visibleHeight,
          yPercent: Math.round((visibleTop / A4_HEIGHT) * 100),
          heightPercent: Math.round((visibleHeight / A4_HEIGHT) * 100),
          contentPreview: el.textContent?.substring(0, 80) || "",
        });
      });

      // Detect header on first page
      if (pageIndex === 0) {
        const header = pageWrapper.querySelector("header");
        if (header) {
          const rect = header.getBoundingClientRect();
          const relTop = rect.top - pageRect.top;
          const relLeft = rect.left - pageRect.left;

          if (relTop >= 0 && relTop < A4_HEIGHT) {
            const alreadyHasHeader = rects.some(r => r.type === "header");
            if (!alreadyHasHeader) {
              rects.unshift({
                id: `p0-header`,
                type: "header",
                label: "Header / Name & Title",
                pageIndex: 0,
                top: Math.max(0, relTop),
                left: Math.max(0, relLeft),
                width: rect.width,
                height: Math.min(rect.height, A4_HEIGHT - relTop),
                yPercent: Math.round((relTop / A4_HEIGHT) * 100),
                heightPercent: Math.round((rect.height / A4_HEIGHT) * 100),
                contentPreview: header.textContent?.substring(0, 80) || "",
              });
            }
          }
        }
      }
    });

    return rects;
  }, []);

  const convertScanZonesToHeatmap = useCallback((zones: ScanZoneInput[], sections: SectionRect[]): HeatmapZoneData[] => {
    const attentionToIntensity: Record<string, number> = {
      high: 1.0,
      medium: 0.7,
      low: 0.4,
      none: 0.15,
    };
    const attentionToPattern: Record<string, "focus" | "skim" | "glance" | "skip"> = {
      high: "focus",
      medium: "skim",
      low: "glance",
      none: "skip",
    };

    const sectionAliases: Record<string, string[]> = {
      header: ["header", "basics"],
      basics: ["basics", "header"],
      experience: ["experience", "work"],
      work: ["experience", "work"],
      summary: ["summary"],
      education: ["education"],
      skills: ["skills"],
      projects: ["projects"],
      certificates: ["certificates"],
      languages: ["languages"],
      awards: ["awards"],
      volunteering: ["volunteering"],
      interests: ["interests"],
      references: ["references"],
      courses: ["courses"],
    };

    const result: HeatmapZoneData[] = [];
    const usedSectionIds = new Set<string>();

    zones.forEach((zone, idx) => {
      const sectionKey = zone.section.toLowerCase();
      const aliases = sectionAliases[sectionKey] || [sectionKey];

      const match = sections.find(s => aliases.includes(s.type) && !usedSectionIds.has(s.id));
      if (!match) return;

      usedSectionIds.add(match.id);

      // Override label with the scan analysis name for consistency
      match.label = zone.name;

      result.push({
        sectionId: match.id,
        intensity: attentionToIntensity[zone.attention] ?? 0.5,
        timeSpent: zone.timeSpent,
        scanOrder: idx + 1,
        pattern: attentionToPattern[zone.attention] ?? "glance",
      });
    });

    return result;
  }, []);

  const fetchHeatmapData = useCallback(async (sections: SectionRect[]) => {
    if (externalScanZones && externalScanZones.length > 0) {
      return convertScanZonesToHeatmap(externalScanZones, sections);
    }

    const totalPages = new Set(sections.map(s => s.pageIndex)).size;

    const apiSections = sections.map(s => ({
      id: s.id,
      type: s.type,
      label: s.label,
      pageIndex: s.pageIndex,
      yPercent: s.yPercent,
      heightPercent: s.heightPercent,
    }));

    const response = await fetch("/api/heatmap-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: apiSections, totalPages }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to analyze");
    }

    const { heatmapData: data } = await response.json();
    return (data as HeatmapZoneData[]).sort((a, b) => a.scanOrder - b.scanOrder);
  }, [externalScanZones, convertScanZonesToHeatmap]);

  useEffect(() => {
    if (!open) {
      setPhase("loading");
      setHeatmapData([]);
      setSectionRects([]);
      setCurrentScanIndex(-1);
      setElapsedTime(0);
      setError(null);
      setActivePage(0);
      setShowAllHeat(false);
      setVerdict(null);
      setVerdictLoading(false);
      setShowVerdict(false);
      return;
    }

    let cancelled = false;
    let retries = 0;

    const tryExtract = async () => {
      if (cancelled) return;

      const sections = extractSections();
      if (sections.length === 0 && retries < 10) {
        retries++;
        setTimeout(tryExtract, 300);
        return;
      }

      if (sections.length === 0) {
        setError("Could not detect resume sections. Make sure resume has content.");
        return;
      }

      try {
        setSectionRects(sections);
        const uniquePages = [...new Set(sections.map(s => s.pageIndex))].sort();
        setPages(uniquePages);

        const data = await fetchHeatmapData(sections);
        if (!cancelled) {
          setHeatmapData(data);
          setPhase("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Analysis failed");
        }
      }
    };

    setTimeout(tryExtract, 800);

    return () => { cancelled = true; };
  }, [open, extractSections, fetchHeatmapData]);

  const startAnimation = useCallback(() => {
    if (heatmapData.length === 0) return;

    setPhase("animating");
    setCurrentScanIndex(0);
    setElapsedTime(0);
    setShowAllHeat(false);
    startTimeRef.current = performance.now();

    let zoneIndex = 0;

    const animate = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      setElapsedTime(Math.min(elapsed, 6));

      let cumulative = 0;
      for (let i = 0; i < heatmapData.length; i++) {
        cumulative += heatmapData[i].timeSpent;
        if (elapsed < cumulative) {
          if (i !== zoneIndex) {
            zoneIndex = i;
            setCurrentScanIndex(i);
          }
          break;
        }
      }

      if (elapsed >= 6) {
        setPhase("complete");
        setShowAllHeat(true);
        setCurrentScanIndex(-1);
        setElapsedTime(6);
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [heatmapData]);

  // Auto-scroll to active zone when currentScanIndex changes
  useEffect(() => {
    if (currentScanIndex < 0 || !heatmapData[currentScanIndex]) return;

    const sectionId = heatmapData[currentScanIndex].sectionId;

    const tryScroll = (attempt: number) => {
      const zoneEl = zoneElementRefs.current.get(sectionId);
      const container = scrollContainerRef.current;
      if (zoneEl && container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = zoneEl.getBoundingClientRect();
        const scrollTop = container.scrollTop;
        const targetY = scrollTop + elRect.top - containerRect.top - containerRect.height / 3;
        container.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
      } else if (attempt < 5) {
        setTimeout(() => tryScroll(attempt + 1), 100);
      }
    };

    // Small delay to let the DOM render the overlay element first
    setTimeout(() => tryScroll(0), 50);
  }, [currentScanIndex, heatmapData]);

  // Auto-fetch recruiter verdict when animation completes
  useEffect(() => {
    if (phase !== "complete" || verdict || verdictLoading) return;

    const fetchVerdict = async () => {
      setVerdictLoading(true);
      try {
        const body: Record<string, unknown> = {
          resume: {
            basics: resume.basics,
            work: resume.work,
            education: resume.education,
            skills: resume.skills,
          },
        };
        if (jobDescription.trim()) {
          body.jobDescription = jobDescription.trim();
        }

        const res = await fetch("/api/recruiter-verdict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          setVerdict(data);
          setTimeout(() => setShowVerdict(true), 500);
        }
      } catch (err) {
        console.error("Verdict fetch failed:", err);
      } finally {
        setVerdictLoading(false);
      }
    };

    fetchVerdict();
  }, [phase, verdict, verdictLoading, resume, jobDescription]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const resetAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setPhase("ready");
    setCurrentScanIndex(-1);
    setElapsedTime(0);
    setShowAllHeat(false);
  };

  const handleDownloadImage = async () => {
    if (!resumeContainerRef.current) return;
    setIsDownloading(true);

    try {
      const container = resumeContainerRef.current;
      const pageWrappers = container.querySelectorAll(".page-content-wrapper");

      const canvases: HTMLCanvasElement[] = [];

      for (let i = 0; i < pageWrappers.length; i++) {
        const wrapper = pageWrappers[i] as HTMLElement;

        const canvas = await html2canvas(wrapper, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: A4_WIDTH,
          height: A4_HEIGHT,
        });

        const overlayCanvas = document.createElement("canvas");
        overlayCanvas.width = canvas.width;
        overlayCanvas.height = canvas.height;
        const ctx = overlayCanvas.getContext("2d")!;

        ctx.drawImage(canvas, 0, 0);

        const scaleX = canvas.width / A4_WIDTH;
        const scaleY = canvas.height / A4_HEIGHT;

        for (const zone of heatmapData) {
          const section = sectionRects.find(s => s.id === zone.sectionId && s.pageIndex === i);
          if (!section) continue;

          const x = section.left * scaleX;
          const y = section.top * scaleY;
          const w = section.width * scaleX;
          const h = section.height * scaleY;

          const gradient = ctx.createRadialGradient(
            x + w / 2, y + h / 2, 0,
            x + w / 2, y + h / 2, Math.max(w, h) / 1.5
          );
          gradient.addColorStop(0, getIntensityColor(zone.intensity, 0.45));
          gradient.addColorStop(1, getIntensityColor(zone.intensity, 0.05));

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, w, h);

          ctx.strokeStyle = getIntensityColor(zone.intensity, 0.7);
          ctx.lineWidth = 2 * scaleX;
          ctx.setLineDash([6 * scaleX, 4 * scaleX]);
          ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
          ctx.setLineDash([]);

          ctx.fillStyle = "rgba(0,0,0,0.7)";
          const fontSize = 11 * scaleX;
          ctx.font = `bold ${fontSize}px sans-serif`;
          const labelText = `#${zone.scanOrder} ${section.label} (${zone.timeSpent}s)`;
          const textMetrics = ctx.measureText(labelText);
          const padding = 4 * scaleX;

          ctx.fillStyle = "rgba(0,0,0,0.75)";
          ctx.beginPath();
          const rx = x + 4 * scaleX;
          const ry = y + 4 * scaleY;
          const rw = textMetrics.width + padding * 2;
          const rh = fontSize + padding * 2;
          const radius = 4 * scaleX;
          ctx.moveTo(rx + radius, ry);
          ctx.lineTo(rx + rw - radius, ry);
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
          ctx.lineTo(rx + rw, ry + rh - radius);
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
          ctx.lineTo(rx + radius, ry + rh);
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
          ctx.lineTo(rx, ry + radius);
          ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.fillText(labelText, rx + padding, ry + fontSize + padding * 0.5);
        }

        canvases.push(overlayCanvas);
      }

      if (canvases.length === 1) {
        canvases[0].toBlob(blob => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `resume-heatmap-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }, "image/png");
      } else {
        const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0) + (canvases.length - 1) * 20;
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = canvases[0].width;
        finalCanvas.height = totalHeight;
        const ctx = finalCanvas.getContext("2d")!;
        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        let offsetY = 0;
        for (const c of canvases) {
          ctx.drawImage(c, 0, offsetY);
          offsetY += c.height + 20;
        }

        finalCanvas.toBlob(blob => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `resume-heatmap-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }, "image/png");
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentZone = currentScanIndex >= 0 ? heatmapData[currentScanIndex] : null;
  const currentSection = currentZone ? sectionRects.find(s => s.id === currentZone.sectionId) : null;
  const totalPages = pages.length || 1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-3 sm:inset-6 bg-gray-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-red-500 rounded-lg text-white">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">6-Second Recruiter Scan Heatmap</h2>
              <p className="text-xs text-gray-500">AI-powered eye-tracking simulation</p>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl">
              <span className="text-xs text-gray-400">Time:</span>
              <span className="font-mono text-lg font-bold tabular-nums">
                {elapsedTime.toFixed(1)}s
              </span>
              <span className="text-xs text-gray-400">/ 6.0s</span>
            </div>

            <div className="h-2 w-48 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-100"
                style={{ width: `${(elapsedTime / 6) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Resume Preview with Heatmap - scrollable container */}
          <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-gray-100 p-6">
            <div ref={resumeContainerRef} className="flex flex-col items-center gap-6">
              <ResumeRendererWithOverlay
                resume={resume}
                selectedTemplate={selectedTemplate}
                sectionRects={sectionRects}
                heatmapData={heatmapData}
                currentScanIndex={currentScanIndex}
                showAll={showAllHeat || phase === "complete"}
                phase={phase}
                zoneElementRefs={zoneElementRefs}
              />
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[340px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
            {/* Controls */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              {phase === "loading" && (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="mt-3 text-sm text-gray-600">Analyzing resume sections...</p>
                  <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {phase === "ready" && (
                <div className="space-y-3">
                  {jobDescription.trim() && (
                    <div className="px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="text-[11px] text-indigo-700 font-medium truncate">
                        Target job loaded — verdict will evaluate for this role
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={startAnimation}
                    className="w-full bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white h-12"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start 6-Second Scan
                  </Button>
                </div>
              )}

              {phase === "animating" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (animationRef.current) cancelAnimationFrame(animationRef.current);
                      setPhase("complete");
                      setShowAllHeat(true);
                      setCurrentScanIndex(-1);
                      setElapsedTime(6);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Skip to End
                  </Button>
                </div>
              )}

              {phase === "complete" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button onClick={resetAnimation} variant="outline" className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Replay
                    </Button>
                    <Button
                      onClick={handleDownloadImage}
                      disabled={isDownloading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download
                    </Button>
                  </div>

                  {/* Verdict button / loading */}
                  {verdictLoading && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                      <span className="text-sm text-amber-700">Analyzing recruiter decision...</span>
                    </div>
                  )}
                  {verdict && !showVerdict && (
                    <Button
                      onClick={() => setShowVerdict(true)}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Recruiter Verdict ({verdict.probability}%)
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Current Focus */}
            {phase === "animating" && currentZone && currentSection && (
              <div className="p-4 border-b border-gray-200 bg-amber-50">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">Currently Viewing</span>
                </div>
                <p className="font-semibold text-gray-900">{currentSection.label}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: getIntensityColor(currentZone.intensity, 1) }}
                    />
                    {getPatternLabel(currentZone.pattern)}
                  </span>
                  <span>{currentZone.timeSpent}s attention</span>
                </div>
              </div>
            )}

            {/* Zone Legend */}
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {jobDescription.trim() && (phase === "animating" || phase === "complete") && (
                <div className="mb-3 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-[11px] text-indigo-700 font-medium truncate">
                    Evaluating for target job
                  </span>
                </div>
              )}
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Attention Zones
              </h3>

              {heatmapData.length > 0 ? (
                heatmapData.map((zone, idx) => {
                  const section = sectionRects.find(s => s.id === zone.sectionId);
                  if (!section) return null;

                  const isActive = currentScanIndex === idx;
                  const isVisited = phase === "animating" ? idx < currentScanIndex : phase === "complete";

                  return (
                    <div
                      key={`legend-${zone.sectionId || idx}`}
                      className={`p-3 rounded-xl border transition-all ${
                        isActive
                          ? "border-amber-400 bg-amber-50 shadow-md scale-[1.02]"
                          : isVisited
                          ? "border-gray-200 bg-white"
                          : "border-gray-100 bg-gray-50 opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                            style={{ background: getIntensityColor(zone.intensity, 1) }}
                          >
                            {zone.scanOrder}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {section.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{zone.timeSpent}s</span>
                      </div>
                      <div className="flex items-center gap-2 ml-7">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${zone.intensity * 100}%`,
                              background: getIntensityColor(zone.intensity, 1),
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 w-16 text-right">
                          {getPatternLabel(zone.pattern)}
                        </span>
                      </div>
                      {section.pageIndex > 0 && (
                        <span className="text-[10px] text-gray-400 ml-7 mt-1 block">
                          Page {section.pageIndex + 1}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : phase !== "loading" ? (
                <p className="text-sm text-gray-400 text-center py-4">No zones detected</p>
              ) : null}
            </div>

            {/* Heat Legend */}
            {(phase === "complete" || phase === "animating") && (
              <div className="p-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Heat Intensity</p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400">Cold</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden flex">
                    <div className="flex-1" style={{ background: "rgba(0, 180, 255, 0.5)" }} />
                    <div className="flex-1" style={{ background: "rgba(255, 255, 0, 0.6)" }} />
                    <div className="flex-1" style={{ background: "rgba(255, 165, 0, 0.7)" }} />
                    <div className="flex-1" style={{ background: "rgba(255, 80, 0, 0.8)" }} />
                    <div className="flex-1" style={{ background: "rgba(255, 0, 0, 0.9)" }} />
                  </div>
                  <span className="text-[10px] text-gray-400">Hot</span>
                </div>
              </div>
            )}
          </div>
        </div>
          </motion.div>
        </div>
      )}
      {/* Recruiter Verdict Modal */}
      {showVerdict && verdict && (
        <div className="fixed inset-0 z-[300]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowVerdict(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-0 flex items-center justify-center p-6"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-auto">
              {/* Header */}
              <div className="p-6 pb-4 text-center border-b border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 mb-4">
                  <Eye className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Recruiter&apos;s Verdict</h3>
                <p className="text-sm text-gray-500">
                  {jobDescription.trim() ? "Evaluated for the target job position" : "After the 6-second scan..."}
                </p>
              </div>

              {/* Probability Ring */}
              <div className="px-6 py-5 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-3">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke={verdict.probability >= 70 ? "#22c55e" : verdict.probability >= 40 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(verdict.probability / 100) * 327} 327`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold" style={{
                      color: verdict.probability >= 70 ? "#22c55e" : verdict.probability >= 40 ? "#f59e0b" : "#ef4444"
                    }}>
                      {verdict.probability}%
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Read-on</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 font-medium text-center px-4">{verdict.verdict}</p>
              </div>

              {/* Positives */}
              {verdict.positives?.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <h4 className="text-sm font-semibold text-gray-700">What Caught Their Eye</h4>
                  </div>
                  <div className="space-y-2">
                    {verdict.positives.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <VerdictIcon icon={item.icon} className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Negatives */}
              {verdict.negatives?.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-semibold text-gray-700">What They Missed / Weak Points</h4>
                  </div>
                  <div className="space-y-2">
                    {verdict.negatives.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <VerdictIcon icon={item.icon} className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tip */}
              {verdict.tip && (
                <div className="px-6 pb-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Pro Tip</p>
                      <p className="text-xs text-blue-700 mt-0.5">{verdict.tip}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="px-6 pb-6 pt-2">
                <Button
                  onClick={() => setShowVerdict(false)}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white h-11"
                >
                  Got It
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Verdict Icon Mapper ── */
function VerdictIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case "briefcase": return <Briefcase className={className} />;
    case "graduation-cap": return <GraduationCap className={className} />;
    case "star": return <Star className={className} />;
    case "target": return <Target className={className} />;
    case "zap": return <Zap className={className} />;
    case "alert-triangle": return <AlertTriangle className={className} />;
    case "x-circle": return <XCircle className={className} />;
    case "clock": return <Clock className={className} />;
    case "help-circle": return <HelpCircle className={className} />;
    case "trending-up": return <TrendingUp className={className} />;
    default: return <Star className={className} />;
  }
}

/* ── Resume Renderer with Per-Page Heatmap Overlay ── */
function ResumeRendererWithOverlay({
  resume,
  selectedTemplate,
  sectionRects,
  heatmapData,
  currentScanIndex,
  showAll,
  phase,
  zoneElementRefs,
}: {
  resume: Resume;
  selectedTemplate: string;
  sectionRects: SectionRect[];
  heatmapData: HeatmapZoneData[];
  currentScanIndex: number;
  showAll: boolean;
  phase: string;
  zoneElementRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const [TemplateComponent, setTemplateComponent] = useState<React.ComponentType<{ resume: Resume }> | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const [totalHeight, setTotalHeight] = useState(A4_HEIGHT);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    import("@/components/templates").then(mod => {
      const tmpl = mod.templates.find(t => t.id === selectedTemplate);
      if (tmpl) setTemplateComponent(() => tmpl.component);
    });
  }, [selectedTemplate]);

  useEffect(() => {
    const measure = () => {
      const el = measureRef.current;
      if (!el) return;
      const height = el.scrollHeight;
      setTotalHeight(height);
      if (height <= A4_HEIGHT) {
        setPageBreaks([]);
        setMeasured(true);
        return;
      }
      const breaks: number[] = [];
      let currentBreak = A4_HEIGHT;
      while (currentBreak < height) {
        const sections = el.querySelectorAll("[data-section], section, .resume-item");
        let bestBreak = currentBreak;
        sections.forEach(section => {
          const rect = section.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const sectionTop = rect.top - elRect.top;
          if (sectionTop > currentBreak - 100 && sectionTop < currentBreak + 50) {
            bestBreak = sectionTop;
          }
        });
        breaks.push(bestBreak);
        currentBreak = bestBreak + A4_HEIGHT;
      }
      setPageBreaks(breaks);
      setMeasured(true);
    };
    const timer = setTimeout(measure, 200);
    return () => clearTimeout(timer);
  }, [TemplateComponent, resume]);

  if (!TemplateComponent) {
    return (
      <div className="flex items-center justify-center" style={{ width: A4_WIDTH, height: A4_HEIGHT }}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  const numPages = pageBreaks.length + 1;
  const showHeat = phase === "animating" || phase === "complete" || showAll;

  return (
    <>
      {/* Hidden measurement container */}
      <div
        ref={measureRef}
        style={{
          width: A4_WIDTH,
          position: "absolute",
          left: -9999,
          top: 0,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <TemplateComponent resume={resume} />
      </div>

      {/* Visible pages stacked */}
      {measured && Array.from({ length: numPages }, (_, pageIndex) => {
        const startY = pageIndex === 0 ? 0 : pageBreaks[pageIndex - 1];
        const pageSections = sectionRects.filter(s => s.pageIndex === pageIndex);

        return (
          <div key={pageIndex} className="relative">
            {/* Page label */}
            {numPages > 1 && (
              <div className="text-center mb-2">
                <span className="text-xs font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
                  Page {pageIndex + 1} / {numPages}
                </span>
              </div>
            )}
            <div
              className="page-content-wrapper relative shadow-xl"
              style={{
                width: A4_WIDTH,
                height: A4_HEIGHT,
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              <div
                className="page-content"
                style={{
                  transform: `translateY(-${startY}px)`,
                  position: "relative",
                }}
              >
                <TemplateComponent resume={resume} />
              </div>

              {/* Heatmap overlay for this page */}
              {showHeat && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {heatmapData.map((zone, idx) => {
                    const section = pageSections.find(s => s.id === zone.sectionId);
                    if (!section) return null;

                    const isActive = currentScanIndex === idx;
                    const isVisited = showAll || idx < currentScanIndex;
                    if (!isActive && !isVisited) return null;

                    const opacity = isActive ? 0.55 : showAll ? 0.4 : 0.25;

                    return (
                      <div
                        key={`${pageIndex}-${zone.sectionId || idx}`}
                        ref={(el) => {
                          if (el) zoneElementRefs.current.set(zone.sectionId, el);
                        }}
                        className="absolute transition-all duration-500"
                        style={{
                          top: section.top,
                          left: section.left,
                          width: section.width,
                          height: section.height,
                        }}
                      >
                        <div
                          className="absolute inset-0 rounded-sm"
                          style={{
                            background: `radial-gradient(ellipse at center, ${getIntensityColor(zone.intensity, opacity)} 0%, ${getIntensityColor(zone.intensity, opacity * 0.15)} 100%)`,
                          }}
                        />
                        <div
                          className="absolute inset-0 rounded-sm"
                          style={{
                            border: `2px ${isActive ? "solid" : "dashed"} ${getIntensityColor(zone.intensity, isActive ? 0.9 : 0.5)}`,
                          }}
                        />
                        {(isActive || showAll) && (
                          <div
                            className="absolute top-1 left-1 px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap"
                            style={{ background: "rgba(0,0,0,0.75)" }}
                          >
                            #{zone.scanOrder} {section.label} ({zone.timeSpent}s)
                          </div>
                        )}
                        {isActive && (
                          <div
                            className="absolute inset-0 rounded-sm animate-pulse"
                            style={{
                              border: `3px solid ${getIntensityColor(zone.intensity, 0.8)}`,
                              boxShadow: `0 0 20px ${getIntensityColor(zone.intensity, 0.4)}`,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
