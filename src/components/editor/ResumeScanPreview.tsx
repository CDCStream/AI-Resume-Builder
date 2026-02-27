"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Resume } from "@/lib/types/resume";
import { 
  Eye,
  AlertCircle, 
  CheckCircle2, 
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Clock,
  AlertTriangle,
  Type,
  LayoutList,
  Scan,
  Lightbulb,
  Lock,
  Crown
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface ScanZone {
  id: string;
  name: string;
  section: string;
  attention: "high" | "medium" | "low" | "none";
  timeSpent: number; // seconds
  issue?: string;
  suggestion?: string;
}

interface ReadabilityIssue {
  type: "font" | "density" | "length" | "structure" | "whitespace";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  suggestion: string;
}

interface ScanAnalysisResponse {
  overallScore: number;
  scanZones: ScanZone[];
  readabilityScore: number;
  readabilityIssues: ReadabilityIssue[];
  firstImpressionSummary: string;
  attentionFlow: string[];
  recommendations: string[];
}

interface ResumeScanPreviewProps {
  resume: Resume;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onHighlightZone?: (zone: ScanZone | null) => void;
}

export default function ResumeScanPreview({
  resume,
  isExpanded,
  onToggleExpand,
  onHighlightZone,
}: ResumeScanPreviewProps) {
  const { isPro, trialExpired } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["zones", "readability"]));
  const [isAnimating, setIsAnimating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/resume-scan-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: {
            basics: resume.basics,
            work: resume.work,
            education: resume.education,
            skills: resume.skills,
            projects: resume.projects,
            certificates: resume.certificates,
            languages: resume.languages,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      setResult(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAnimation = () => {
    if (!result) return;
    
    setIsAnimating(true);
    let index = 0;
    
    const animate = () => {
      if (index < result.scanZones.length) {
        const zone = result.scanZones[index];
        setActiveZone(zone.id);
        onHighlightZone?.(zone);
        
        setTimeout(() => {
          index++;
          if (index < result.scanZones.length) {
            animate();
          } else {
            setIsAnimating(false);
            setActiveZone(null);
            onHighlightZone?.(null);
          }
        }, zone.timeSpent * 1000);
      }
    };
    
    animate();
  };

  const handleStopAnimation = () => {
    setIsAnimating(false);
    setActiveZone(null);
    onHighlightZone?.(null);
  };

  const handleZoneHover = (zone: ScanZone | null) => {
    if (!isAnimating) {
      setActiveZone(zone?.id || null);
      onHighlightZone?.(zone);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleCloseRequest = () => {
    if (isLoading) {
      setShowCloseConfirm(true);
    } else {
      onToggleExpand();
    }
  };

  const handleConfirmClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setShowCloseConfirm(false);
    setIsLoading(false);
    onToggleExpand();
  };

  const getAttentionColor = (attention: string) => {
    switch (attention) {
      case "high": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-orange-500";
      case "none": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getAttentionLabel = (attention: string) => {
    switch (attention) {
      case "high": return "High Attention";
      case "medium": return "Medium Attention";
      case "low": return "Low Attention";
      case "none": return "Often Missed";
      default: return "Unknown";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 border-red-300 text-red-800";
      case "warning": return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "info": return "bg-blue-100 border-blue-300 text-blue-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "info": return <Lightbulb className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    if (score >= 60) return "Needs Work";
    return "Poor";
  };

  if (!isExpanded) {
    if (trialExpired) {
      return (
        <button
          onClick={() => window.location.href = "/pricing"}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 rounded-xl border border-gray-200 transition-all duration-200 group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-300 rounded-lg text-gray-500">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-500 flex items-center gap-2">
                6-Second Resume Scan Preview
                <span className="inline-flex items-center text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  <Crown className="w-3 h-3 mr-1" /> Pro
                </span>
              </h3>
              <p className="text-xs text-gray-400">Trial expired - Upgrade to Pro to continue</p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-300" />
        </button>
      );
    }
    return (
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-xl border border-amber-200 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg text-white">
            <Eye className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">6-Second Resume Scan Preview</h3>
            <p className="text-xs text-gray-500">See what recruiters see in 6 seconds</p>
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </button>
    );
  }

  return (
    <>
      <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Analysis?</DialogTitle>
            <DialogDescription>
              Analysis is in progress. Are you sure you want to cancel?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseConfirm(false)}>
              Continue
            </Button>
            <Button variant="destructive" onClick={handleConfirmClose}>
              Cancel Analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg text-white">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">6-Second Resume Scan Preview</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Simulate recruiter eye-tracking</p>
              </div>
            </div>
            <button
              onClick={handleCloseRequest}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronUp className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Initial State - Analysis Button */}
          {!result && !isLoading && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">The 6-Second Rule</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Recruiters spend an average of 6-7 seconds scanning a resume before deciding 
                      to read more or move on. This analysis shows exactly what they see and what they miss.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                  <Scan className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Eye-tracking Simulation</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                  <Type className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Readability Score</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                  <LayoutList className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Layout Analysis</p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Resume Scan
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-amber-200 rounded-full animate-pulse" />
                  <Eye className="w-8 h-8 text-amber-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-4 text-sm text-gray-600">Simulating recruiter eye-tracking...</p>
                <p className="text-xs text-gray-400 mt-1">Analyzing attention zones & readability</p>
              </div>
              <Button
                variant="outline"
                onClick={handleCloseRequest}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Score Overview */}
              <div className="grid grid-cols-2 gap-3">
                {/* Scan Score */}
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-gray-500">Scan Score</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}>
                      {result.overallScore}
                    </span>
                    <span className="text-sm text-gray-400">/100</span>
                  </div>
                  <p className={`text-xs mt-1 ${getScoreColor(result.overallScore)}`}>
                    {getScoreLabel(result.overallScore)}
                  </p>
                </div>

                {/* Readability Score */}
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Type className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-gray-500">Readability</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${getScoreColor(result.readabilityScore)}`}>
                      {result.readabilityScore}
                    </span>
                    <span className="text-sm text-gray-400">/100</span>
                  </div>
                  <p className={`text-xs mt-1 ${getScoreColor(result.readabilityScore)}`}>
                    {getScoreLabel(result.readabilityScore)}
                  </p>
                </div>
              </div>

              {/* First Impression Summary */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <p className="text-sm text-gray-700">{result.firstImpressionSummary}</p>
              </div>

              {/* Animate Scan Button */}
              <Button
                onClick={isAnimating ? handleStopAnimation : handleStartAnimation}
                variant={isAnimating ? "destructive" : "default"}
                className={`w-full ${!isAnimating ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : ""}`}
              >
                {isAnimating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Stop Simulation
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Play 6-Second Scan Simulation
                  </>
                )}
              </Button>

              {/* Attention Zones */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleSection("zones")}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-sm">Attention Zones</span>
                    <span className="text-xs text-gray-500">({result.scanZones.length} areas)</span>
                  </div>
                  {expandedSections.has("zones") ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.has("zones") && (
                  <div className="px-3 pb-3 space-y-2">
                    {result.scanZones.map((zone) => (
                      <div
                        key={zone.id}
                        onMouseEnter={() => handleZoneHover(zone)}
                        onMouseLeave={() => handleZoneHover(null)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          activeZone === zone.id
                            ? "border-amber-400 bg-amber-50 shadow-sm"
                            : "border-gray-100 bg-gray-50 hover:border-amber-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getAttentionColor(zone.attention)}`} />
                            <span className="text-sm font-medium">{zone.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{zone.timeSpent}s</span>
                          </div>
                        </div>
                        <p className={`text-xs ${
                          zone.attention === "high" ? "text-green-600" :
                          zone.attention === "medium" ? "text-yellow-600" :
                          zone.attention === "low" ? "text-orange-600" :
                          "text-red-600"
                        }`}>
                          {getAttentionLabel(zone.attention)}
                        </p>
                        {zone.issue && (
                          <p className="text-xs text-red-600 mt-1">{zone.issue}</p>
                        )}
                        {zone.suggestion && (
                          <p className="text-xs text-green-600 mt-1 flex items-start gap-1">
                            <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                            {zone.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Readability Issues */}
              {result.readabilityIssues.length > 0 && (
                <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("readability")}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-sm">Readability Issues</span>
                      <span className="text-xs text-gray-500">({result.readabilityIssues.length})</span>
                    </div>
                    {expandedSections.has("readability") ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has("readability") && (
                    <div className="px-3 pb-3 space-y-2">
                      {result.readabilityIssues.map((issue, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {getSeverityIcon(issue.severity)}
                            <span className="text-sm font-medium">{issue.title}</span>
                          </div>
                          <p className="text-xs opacity-80">{issue.description}</p>
                          <p className="text-xs mt-2 flex items-start gap-1">
                            <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                            {issue.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Attention Flow */}
              {result.attentionFlow.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("flow")}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-sm">Eye Movement Flow</span>
                    </div>
                    {expandedSections.has("flow") ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has("flow") && (
                    <div className="px-3 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {result.attentionFlow.map((step, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                              {i + 1}. {step}
                            </span>
                            {i < result.attentionFlow.length - 1 && (
                              <span className="text-gray-300">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("recommendations")}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm">Recommendations</span>
                      <span className="text-xs text-gray-500">({result.recommendations.length})</span>
                    </div>
                    {expandedSections.has("recommendations") ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has("recommendations") && (
                    <div className="px-3 pb-3">
                      <ul className="space-y-1.5">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-gray-400 text-center px-4">
                This simulation is based on eye-tracking research and industry studies. 
                Actual recruiter behavior may vary.
              </p>

              {/* New Analysis Button */}
              <Button
                variant="outline"
                onClick={() => setResult(null)}
                className="w-full"
              >
                Run New Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
