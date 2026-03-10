"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LinkedInUrlHowTo } from "@/components/ui/LinkedInUrlHowTo";

interface ATSChange {
  before: string;
  after: string;
  reason: string;
}

interface ATSOptimizeResponse {
  optimizedValue: string;
  changes: ATSChange[];
  suggestedSkills?: { name: string; level: string }[];
  suggestedLanguages?: { language: string; fluency: string }[];
}

interface SavedJobDescription {
  jobDescription: string;
  jobInfo: {
    title: string;
    company: string;
    logoUrl?: string;
    backgroundUrl?: string;
  } | null;
}

let globalSavedJobDescription: SavedJobDescription = {
  jobDescription: "",
  jobInfo: null,
};

interface ATSOptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "quick" | "tailored";
  field: "professionalTitle" | "professionalSummary" | "workExperience" | "education" | "project" | "skill" | "volunteer" | "award" | "certificate" | "skillsSuggestion";
  fieldLabel: string;
  currentValue: string;
  context?: {
    name?: string;
    currentTitle?: string;
    skills?: string[];
    experience?: { position: string; company: string; summary: string }[];
  };
  onApply: (
    newValue: string,
    suggestedSkills?: { name: string; level: string }[],
    suggestedLanguages?: { language: string; fluency: string }[]
  ) => void;
}

export default function ATSOptimizeModal({
  isOpen,
  onClose,
  type,
  field,
  fieldLabel,
  currentValue,
  context,
  onApply,
}: ATSOptimizeModalProps) {
  const [jobDescription, setJobDescription] = useState(globalSavedJobDescription.jobDescription);
  const [linkedinJobId, setLinkedinJobId] = useState("");
  const [linkedinJobUrl, setLinkedinJobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingJob, setIsFetchingJob] = useState(false);
  const [fetchedJobInfo, setFetchedJobInfo] = useState<{ 
    title: string; 
    company: string; 
    logoUrl?: string;
    backgroundUrl?: string;
  } | null>(globalSavedJobDescription.jobInfo);
  const [result, setResult] = useState<ATSOptimizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const hasTriggeredRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync with global state when modal opens
  useEffect(() => {
    if (isOpen && type === "tailored") {
      setJobDescription(globalSavedJobDescription.jobDescription);
      setFetchedJobInfo(globalSavedJobDescription.jobInfo);
    }
  }, [isOpen, type]);

  // Save to global state when job description changes
  const updateJobDescription = (value: string, jobInfo?: typeof fetchedJobInfo) => {
    setJobDescription(value);
    globalSavedJobDescription.jobDescription = value;
    if (jobInfo !== undefined) {
      setFetchedJobInfo(jobInfo);
      globalSavedJobDescription.jobInfo = jobInfo;
    }
  };

  const runOptimize = useCallback(async (jobDesc?: string) => {
    console.log("runOptimize called", { type, field, currentValue: currentValue?.substring(0, 50) });
    
    setIsLoading(true);
    setError(null);
    setStep("preview");

    try {
      const response = await fetch("/api/ats-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          field,
          currentValue,
          jobDescription: jobDesc,
          context,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to optimize");
      }

      const data: ATSOptimizeResponse = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Optimize error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [type, field, currentValue, context]);

  const handleOptimize = () => {
    if (type === "tailored" && !jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }
    runOptimize(type === "tailored" ? jobDescription : undefined);
  };

  const handleApply = () => {
    if (result) {
      onApply(result.optimizedValue, result.suggestedSkills, result.suggestedLanguages);
      handleClose();
    }
  };

  const handleFetchLinkedInJob = async (inputValue: string, inputType: "id" | "url") => {
    if (!inputValue.trim()) {
      setError(inputType === "id" ? "Please enter a Job ID" : "Please enter a LinkedIn job URL");
      return;
    }

    setIsFetchingJob(true);
    setError(null);

    try {
      const response = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinJobUrl: inputValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch job posting");
      }

      const data = await response.json();
      const newJobInfo = { 
        title: data.jobTitle, 
        company: data.companyName,
        logoUrl: data.logoUrl,
        backgroundUrl: data.backgroundUrl,
      };
      updateJobDescription(data.jobDescription, newJobInfo);
      // Clear the inputs after successful fetch
      setLinkedinJobId("");
      setLinkedinJobUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job posting");
    } finally {
      setIsFetchingJob(false);
    }
  };

  const handleCloseRequest = () => {
    if (isLoading || isFetchingJob) {
      setShowCloseConfirm(true);
    } else {
      handleClose();
    }
  };

  const handleConfirmClose = () => {
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setShowCloseConfirm(false);
    handleClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  const handleClose = () => {
    // Don't reset jobDescription and fetchedJobInfo - keep them for reuse
    setLinkedinJobId("");
    setLinkedinJobUrl("");
    setResult(null);
    setError(null);
    setIsLoading(false);
    setIsFetchingJob(false);
    hasTriggeredRef.current = false;
    setShowCloseConfirm(false);
    setStep("input");
    onClose();
  };

  const handleClearJobDescription = () => {
    updateJobDescription("", null);
  };

  // Auto-trigger for quick optimize when modal opens
  useEffect(() => {
    if (isOpen && type === "quick" && !hasTriggeredRef.current) {
      console.log("Auto-triggering quick optimize");
      hasTriggeredRef.current = true;
      runOptimize();
    }
  }, [isOpen, type, runOptimize]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasTriggeredRef.current = false;
    }
  }, [isOpen]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Custom Close Button */}
        <button
          type="button"
          onClick={handleCloseRequest}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "quick" ? (
              <>
                <span className="text-lg">⚡</span>
                Quick ATS Optimize
              </>
            ) : (
              <>
                <span className="text-lg">🎯</span>
                Tailored ATS Optimize
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === "quick"
              ? `Optimizing your ${fieldLabel} for ATS compatibility`
              : `Tailor your ${fieldLabel} to match the job description`}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && type === "tailored" && (
          <div className="space-y-4">
            {/* LinkedIn Quick Import Section */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-sm font-medium text-blue-700">Import from LinkedIn</span>
              </div>
              
              <div className="space-y-3">
                {/* Job ID Input */}
                <div className="space-y-1">
                  <Label htmlFor="linkedinJobId" className="text-xs text-blue-600">Job ID</Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="linkedinJobId"
                      value={linkedinJobId}
                      onChange={(e) => setLinkedinJobId(e.target.value)}
                      placeholder="4361758535"
                      className="flex-1 min-w-0 h-9 px-3 rounded-md border border-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleFetchLinkedInJob(linkedinJobId, "id")}
                      disabled={isFetchingJob || !linkedinJobId.trim()}
                      className="h-9 px-4 shrink-0"
                    >
                      {isFetchingJob ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        "Fetch"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Job URL Input */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="linkedinJobUrl" className="text-xs text-blue-600">Job URL</Label>
                    <LinkedInUrlHowTo />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="linkedinJobUrl"
                      value={linkedinJobUrl}
                      onChange={(e) => setLinkedinJobUrl(e.target.value)}
                      placeholder="https://linkedin.com/jobs/view/4361758535"
                      className="flex-1 min-w-0 h-9 px-3 rounded-md border border-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleFetchLinkedInJob(linkedinJobUrl, "url")}
                      disabled={isFetchingJob || !linkedinJobUrl.trim()}
                      className="h-9 px-4 shrink-0"
                    >
                      {isFetchingJob ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        "Fetch"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or paste manually</span>
              </div>
            </div>

            {/* Job Description Section */}
            <div className="space-y-2">
              {/* Fetched Job Info Card */}
              {fetchedJobInfo && (
                <div className="rounded-lg overflow-hidden border border-green-200">
                  {/* Background Cover */}
                  {fetchedJobInfo.backgroundUrl && (
                    <div 
                      className="h-16 bg-cover bg-center"
                      style={{ backgroundImage: `url(${fetchedJobInfo.backgroundUrl})` }}
                    />
                  )}
                  {/* Job Info Card */}
                  <div className={`p-3 bg-green-50 flex items-center gap-3 ${!fetchedJobInfo.backgroundUrl ? '' : '-mt-6 mx-2 mb-2 rounded-lg shadow-sm'}`}>
                    {/* Company Logo */}
                    {fetchedJobInfo.logoUrl && (
                      <img 
                        src={fetchedJobInfo.logoUrl} 
                        alt={fetchedJobInfo.company}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm bg-white"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                        <span className="text-green-500">✓</span> Job loaded from LinkedIn
                      </p>
                      <p className="text-sm text-gray-800 font-semibold truncate">
                        {fetchedJobInfo.title}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        at {fetchedJobInfo.company}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearJobDescription}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Clear job description"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="jobDescription">Job Description</Label>
                {jobDescription && !fetchedJobInfo && (
                  <button
                    type="button"
                    onClick={handleClearJobDescription}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => updateJobDescription(e.target.value, null)}
                placeholder="Paste the full job description here..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {jobDescription 
                  ? "✓ Job description saved - will be used for all fields in this session"
                  : "The AI will analyze the job requirements and tailor your content to match"}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleOptimize} 
                disabled={isLoading || !jobDescription.trim()}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  "Optimize"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-gray-700 font-medium">AI is analyzing your content...</p>
                  <p className="text-gray-500 text-sm">This may take a few seconds</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></span>
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleCloseRequest}
                  className="mt-2"
                >
                  Cancel
                </Button>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                <p className="font-medium">Optimization Failed</p>
                <p className="text-sm mt-1">{error}</p>
                <Button variant="outline" onClick={handleClose} className="mt-4">
                  Close
                </Button>
              </div>
            ) : result ? (
              <>
                {/* Before/After Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Before
                    </Label>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {currentValue || <span className="text-gray-400 italic">Empty</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      After (Optimized)
                    </Label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {result.optimizedValue}
                    </div>
                  </div>
                </div>

                {/* Changes Made */}
                <div className="space-y-3">
                  <Label className="text-blue-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Changes Made
                  </Label>
                  <div className="space-y-3">
                    {result.changes.map((change, index) => (
                      <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs line-through">
                                {change.before}
                              </span>
                              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                {change.after}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 italic">
                              💡 {change.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Skills */}
                {result.suggestedSkills && result.suggestedSkills.length > 0 && (
                  <div className="space-y-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Label className="text-purple-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Suggested Skills to Add
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {result.suggestedSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {skill.name}{skill.level && skill.level !== "–" && skill.level !== "-" ? ` (${skill.level})` : ""}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-purple-600">
                      These skills will be added to your Skills section when you apply
                    </p>
                  </div>
                )}

                {/* Suggested Languages */}
                {result.suggestedLanguages && result.suggestedLanguages.length > 0 && (
                  <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Label className="text-amber-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Suggested Languages
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {result.suggestedLanguages.map((lang, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                        >
                          {lang.language}{lang.fluency && lang.fluency !== "–" && lang.fluency !== "-" ? ` (${lang.fluency})` : ""}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-amber-600">
                      These languages will be added to your Languages section when you apply
                    </p>
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Discard
                  </Button>
                  <Button onClick={handleApply} className="bg-green-600 hover:bg-green-700">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply Changes
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Close Confirmation Modal */}
    <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Cancel Optimization?
          </DialogTitle>
          <DialogDescription>
            AI is currently processing your content. Are you sure you want to cancel and close?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancelClose}>
            Continue Waiting
          </Button>
          <Button variant="destructive" onClick={handleConfirmClose}>
            Yes, Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
