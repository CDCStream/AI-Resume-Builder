"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useResumes, SavedResume } from "@/hooks/useResumes";
import {
  Search,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Building2,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Target,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
  Clock,
  Filter,
  SortAsc,
  SortDesc,
  Crown,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

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
  atsScore?: number;
  atsAnalysis?: ATSAnalysis;
}

interface ATSAnalysis {
  score: number;
  missingSkills: string[];
  matchedSkills: string[];
  suggestions: string[];
  keywordMatches: number;
  totalKeywords: number;
}

interface AIAddition {
  id: string;
  field: string;
  originalValue: string;
  newValue: string;
  type: "skill" | "experience" | "education" | "summary";
  approved: boolean | null;
}

// Popular locations for autocomplete
const POPULAR_LOCATIONS = [
  // Countries
  "United States", "United Kingdom", "Germany", "France", "Canada", "Australia",
  "Netherlands", "Switzerland", "Ireland", "Singapore", "Japan", "India",
  "Turkey", "Spain", "Italy", "Poland", "Sweden", "Norway", "Denmark", "Finland",
  "Belgium", "Austria", "Portugal", "Czech Republic", "Romania", "Hungary",
  "United Arab Emirates", "Saudi Arabia", "Israel", "Brazil", "Mexico",
  // Cities - US
  "New York, NY", "San Francisco, CA", "Los Angeles, CA", "Seattle, WA",
  "Austin, TX", "Boston, MA", "Chicago, IL", "Denver, CO", "Miami, FL",
  "Atlanta, GA", "Dallas, TX", "Washington, DC", "San Diego, CA", "Phoenix, AZ",
  // Cities - Europe
  "London, UK", "Berlin, Germany", "Amsterdam, Netherlands", "Paris, France",
  "Dublin, Ireland", "Munich, Germany", "Zurich, Switzerland", "Barcelona, Spain",
  "Madrid, Spain", "Milan, Italy", "Stockholm, Sweden", "Copenhagen, Denmark",
  "Vienna, Austria", "Brussels, Belgium", "Warsaw, Poland", "Prague, Czech Republic",
  // Cities - Turkey
  "Istanbul, Turkey", "Ankara, Turkey", "Izmir, Turkey", "Antalya, Turkey",
  "Bursa, Turkey", "Konya, Turkey", "Adana, Turkey", "Gaziantep, Turkey",
  // Cities - Other
  "Toronto, Canada", "Vancouver, Canada", "Sydney, Australia", "Melbourne, Australia",
  "Singapore", "Tokyo, Japan", "Hong Kong", "Dubai, UAE", "Tel Aviv, Israel",
  "Bangalore, India", "Mumbai, India", "São Paulo, Brazil", "Mexico City, Mexico",
  // Remote
  "Remote", "Worldwide", "Remote - US", "Remote - Europe", "Remote - Anywhere",
];

function FindJobsContent() {
  const router = useRouter();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const { trialExpired, isLoading: subscriptionLoading } = useSubscription();

  // Resume selection - now from Supabase
  const { resumes, loading: resumesLoading, createResume } = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");

  // Search form state
  const [titleSearch, setTitleSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [remote, setRemote] = useState<boolean | undefined>(undefined);
  const [seniorityLevel, setSeniorityLevel] = useState<string[]>([]);
  const [employmentType, setEmploymentType] = useState<string[]>([]);
  const [easyApplyOnly, setEasyApplyOnly] = useState(false);
  const [maxJobs, setMaxJobs] = useState(25);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search results
  const [jobs, setJobs] = useState<LinkedInJob[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ATS Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [analyzingJobIds, setAnalyzingJobIds] = useState<Set<string>>(new Set());
  const [atsScoreCache, setAtsScoreCache] = useState<Map<string, { score: number; analysis: ATSAnalysis }>>(new Map());
  const [lastAnalyzedResumeId, setLastAnalyzedResumeId] = useState<string>("");
  // Session ref to abort stale analyses when CV changes
  const analysisSessionRef = useRef<number>(0);

  // Sorting
  const [sortBy, setSortBy] = useState<"date" | "ats" | "applications">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected job for detail view
  const [selectedJob, setSelectedJob] = useState<LinkedInJob | null>(null);

  // Auto-fix resume
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [aiAdditions, setAiAdditions] = useState<AIAddition[]>([]);
  const [showAutoFixDialog, setShowAutoFixDialog] = useState(false);
  // Cache auto-fix suggestions by job ID + CV ID combination
  const [autoFixCache, setAutoFixCache] = useState<Map<string, AIAddition[]>>(new Map());

  // Cover letter
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string>("");
  const [showCoverLetterDialog, setShowCoverLetterDialog] = useState(false);
  const [coverLetterAIAdditions, setCoverLetterAIAdditions] = useState<AIAddition[]>([]);

  // Auto-select resume if only one exists
  useEffect(() => {
    const savedState = sessionStorage.getItem("findJobsState");
    if (!savedState && resumes.length === 1 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes, selectedResumeId]);

  // Track if we're restoring state (to prevent reset logic from triggering)
  const [isRestoringState, setIsRestoringState] = useState(true);
  const [stateRestored, setStateRestored] = useState(false);

  // Restore Find Jobs state from localStorage on mount
  useEffect(() => {
    console.log("=== Attempting to restore Find Jobs state ===");
    const savedState = sessionStorage.getItem("findJobsState");
    
    if (!savedState) {
      console.log("No saved state found");
      setIsRestoringState(false);
      return;
    }
    
    try {
      const state = JSON.parse(savedState);
      console.log("Parsed saved state:", {
        jobsCount: state.jobs?.length || 0,
        jobsWithATS: state.jobs?.filter((j: LinkedInJob) => j.atsScore !== undefined).length || 0,
        selectedResumeId: state.selectedResumeId,
        lastAnalyzedResumeId: state.lastAnalyzedResumeId,
        savedAt: new Date(state.savedAt).toISOString(),
      });
      
      // Check if state is recent (within last 30 minutes)
      const stateAge = Date.now() - (state.savedAt || 0);
      console.log("State age:", Math.round(stateAge / 1000), "seconds");
      
      if (stateAge < 30 * 60 * 1000) {
        // Set lastAnalyzedResumeId FIRST to prevent reset logic
        if (state.lastAnalyzedResumeId) {
          setLastAnalyzedResumeId(state.lastAnalyzedResumeId);
        }
        if (state.selectedResumeId) {
          setSelectedResumeId(state.selectedResumeId);
        }
        if (state.jobs?.length > 0) {
          // Make sure ATS scores are preserved
          const jobsToRestore = state.jobs.map((job: LinkedInJob) => ({
            ...job,
            atsScore: job.atsScore,
            atsAnalysis: job.atsAnalysis,
          }));
          setJobs(jobsToRestore);
          console.log("Restored jobs:", jobsToRestore.length);
          console.log("First job ATS score:", jobsToRestore[0]?.atsScore);
        }
        if (state.titleSearch) {
          setTitleSearch(state.titleSearch);
        }
        if (state.companySearch) {
          setCompanySearch(state.companySearch);
        }
        if (state.locationSearch) {
          setLocationSearch(state.locationSearch);
        }
        if (state.selectedJobId && state.jobs) {
          const job = state.jobs.find((j: LinkedInJob) => j.id === state.selectedJobId);
          if (job) {
            setSelectedJob(job);
          }
        }
        setStateRestored(true);
        console.log("=== State restoration complete ===");
      } else {
        console.log("State too old, clearing");
        sessionStorage.removeItem("findJobsState");
      }
    } catch (e) {
      console.error("Failed to restore Find Jobs state:", e);
      sessionStorage.removeItem("findJobsState");
    }
    
    // Mark restoration as complete after a short delay
    setTimeout(() => {
      setIsRestoringState(false);
      console.log("isRestoringState set to false");
    }, 1000);
  }, []);

  // Continue ATS analysis for jobs without scores after state restoration
  useEffect(() => {
    if (!isRestoringState && stateRestored && jobs.length > 0 && selectedResumeId) {
      const jobsWithoutScore = jobs.filter(j => j.atsScore === undefined);
      if (jobsWithoutScore.length > 0) {
        console.log(`Continuing ATS analysis for ${jobsWithoutScore.length} jobs without scores`);
        // Small delay to ensure UI is ready
        setTimeout(() => {
          analyzeJobsATS(jobsWithoutScore);
        }, 500);
        // Mark state as no longer "just restored" to prevent re-triggering
        setStateRestored(false);
      }
    }
  }, [isRestoringState, stateRestored, jobs, selectedResumeId]);

  // Save Find Jobs state to localStorage whenever jobs change
  useEffect(() => {
    // Don't save during restoration
    if (isRestoringState) return;
    
    if (jobs.length > 0) {
      const jobsWithScores = jobs.filter(j => j.atsScore !== undefined).length;
      console.log(`Saving Find Jobs state: ${jobs.length} jobs, ${jobsWithScores} with ATS scores`);
      
      const state = {
        jobs,
        selectedResumeId,
        lastAnalyzedResumeId,
        titleSearch,
        companySearch,
        locationSearch,
        selectedJobId: selectedJob?.id || null,
        savedAt: Date.now(),
      };
      sessionStorage.setItem("findJobsState", JSON.stringify(state));
    }
  }, [jobs, selectedResumeId, lastAnalyzedResumeId, titleSearch, companySearch, locationSearch, selectedJob, isRestoringState]);

  // Reset ATS scores and re-analyze when CV changes
  const cvChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRestoringState) return;
    if (stateRestored && selectedResumeId === lastAnalyzedResumeId) return;
    
    if (selectedResumeId && selectedResumeId !== lastAnalyzedResumeId && jobs.length > 0) {
      console.log("CV changed - aborting old analysis and triggering re-analysis");
      
      // Abort any running analysis
      analysisSessionRef.current++;
      setIsAnalyzing(false);
      
      // Show loading spinners on ALL jobs immediately
      const allJobIds = new Set(jobs.map(j => j.id));
      setAnalyzingJobIds(allJobIds);
      
      // Clear scores
      const resetJobs = jobs.map(job => ({
        ...job,
        atsScore: undefined as number | undefined,
        atsAnalysis: undefined as ATSAnalysis | undefined,
      }));
      setJobs(resetJobs);
      setAtsScoreCache(new Map());
      setAutoFixCache(new Map());
      
      // Clear any pending timer
      if (cvChangeTimerRef.current) clearTimeout(cvChangeTimerRef.current);
      
      // Start re-analysis after a brief delay
      cvChangeTimerRef.current = setTimeout(() => {
        analyzeJobsATS(resetJobs);
      }, 300);
    }
    
    return () => {
      if (cvChangeTimerRef.current) clearTimeout(cvChangeTimerRef.current);
    };
  }, [selectedResumeId, lastAnalyzedResumeId, jobs.length, isRestoringState, stateRestored]);

  // Search jobs
  const handleSearch = async () => {
    if (!selectedResumeId) {
      setSearchError("Please select a resume first");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setJobs([]);
    setSelectedJob(null);

    try {
      const searchParams: Record<string, unknown> = {
        timeRange,
        maxJobs,
        includeAIFields: true,
      };

      if (titleSearch.trim()) {
        searchParams.titleSearch = titleSearch.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (companySearch.trim()) {
        searchParams.organizationSearch = companySearch.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (locationSearch.trim()) {
        // Don't split by comma - location is a single value like "Izmir, Turkey"
        searchParams.locationSearch = [locationSearch.trim()];
      }
      if (remote !== undefined) {
        searchParams.remote = remote;
      }
      if (seniorityLevel.length > 0) {
        searchParams.seniorityLevel = seniorityLevel;
      }
      if (employmentType.length > 0) {
        searchParams.employmentType = employmentType;
      }
      if (easyApplyOnly) {
        searchParams.easyApplyOnly = true;
      }

      const response = await fetch("/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to search jobs");
      }

      const data = await response.json();
      setJobs(data.jobs || []);

      // Start ATS analysis for all jobs
      if (data.jobs?.length > 0) {
        analyzeJobsATS(data.jobs);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to search jobs");
    } finally {
      setIsSearching(false);
    }
  };

  // Analyze ATS scores for jobs
  const analyzeJobsATS = async (jobsToAnalyze: LinkedInJob[]) => {
    const selectedResume = resumes.find((r) => r.id === selectedResumeId);
    if (!selectedResume) return;

    // Create a unique session - aborts if CV changes or new analysis starts
    const sessionId = ++analysisSessionRef.current;

    setIsAnalyzing(true);
    setAnalyzedCount(0);
    setLastAnalyzedResumeId(selectedResumeId);
    
    const allJobIds = new Set(jobsToAnalyze.map(j => j.id));
    setAnalyzingJobIds(allJobIds);

    const newCache = new Map(atsScoreCache);

    for (let i = 0; i < jobsToAnalyze.length; i++) {
      // Abort if a newer session has started (CV changed)
      if (analysisSessionRef.current !== sessionId) {
        console.log(`Analysis session ${sessionId} aborted - CV changed`);
        return;
      }

      const job = jobsToAnalyze[i];
      const cacheKey = `${job.id}_${selectedResumeId}`;
      
      let updatedJob = { ...job };
      
      const cachedResult = newCache.get(cacheKey);
      if (cachedResult) {
        updatedJob = {
          ...job,
          atsScore: cachedResult.score,
          atsAnalysis: cachedResult.analysis,
        };
      } else {
        try {
          const response = await fetch("/api/ats-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobDescription: job.description,
              resume: selectedResume.resumeData,
            }),
          });

          // Check again after API call returns
          if (analysisSessionRef.current !== sessionId) {
            console.log(`Analysis session ${sessionId} aborted after API call - CV changed`);
            return;
          }

          if (response.ok) {
            const data = await response.json();
            const missingSkills = (data.missingSkills || []).map((skill: string | { name: string }) => 
              typeof skill === 'string' ? skill : skill.name
            );
            const matchedSkills = data.matchedKeywords || data.matchedSkills || [];
            
            const analysis: ATSAnalysis = {
              score: data.score || 0,
              missingSkills: missingSkills,
              matchedSkills: matchedSkills,
              suggestions: data.recommendations || data.suggestions || [],
              keywordMatches: data.matchedKeywords?.length || 0,
              totalKeywords: (data.matchedKeywords?.length || 0) + (data.missingKeywords?.length || 0),
            };
            
            updatedJob = {
              ...job,
              atsScore: data.score || 0,
              atsAnalysis: analysis,
            };
            
            newCache.set(cacheKey, { score: data.score || 0, analysis });
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error(`ATS API error for job ${job.id}:`, errorData);
          }
        } catch (error) {
          console.error(`Failed to analyze job ${job.id}:`, error);
        }
      }

      // Final check before updating state
      if (analysisSessionRef.current !== sessionId) return;

      setAnalyzingJobIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.id);
        return newSet;
      });
      
      setAnalyzedCount(i + 1);
      
      setJobs(prevJobs => {
        return prevJobs.map(existingJob => {
          if (existingJob.id === updatedJob.id) {
            return updatedJob;
          }
          return existingJob;
        });
      });
    }

    // Only finalize if this session is still active
    if (analysisSessionRef.current === sessionId) {
      setAtsScoreCache(newCache);
      setIsAnalyzing(false);
      setAnalyzingJobIds(new Set());
    }
  };

  // Sort jobs
  const sortedJobs = [...jobs].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "date":
        comparison = new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
        break;
      case "ats":
        comparison = (a.atsScore || 0) - (b.atsScore || 0);
        break;
      case "applications":
        comparison = (a.applicationsCount || 0) - (b.applicationsCount || 0);
        break;
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  // Auto-fix resume for selected job
  const handleAutoFix = async () => {
    if (!selectedJob || !selectedResumeId) return;

    const selectedResume = resumes.find((r) => r.id === selectedResumeId);
    if (!selectedResume) return;

    const cacheKey = `${selectedJob.id}_${selectedResumeId}`;
    
    // Check cache first
    const cachedAdditions = autoFixCache.get(cacheKey);
    if (cachedAdditions && cachedAdditions.length > 0) {
      // Reset approval status for cached items
      const resetAdditions = cachedAdditions.map(a => ({ ...a, approved: null as boolean | null }));
      setAiAdditions(resetAdditions);
      setShowAutoFixDialog(true);
      return;
    }

    setIsAutoFixing(true);
    setAiAdditions([]);

    try {
      const response = await fetch("/api/auto-fix-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: selectedResume.resumeData,
          jobDescription: selectedJob.description,
          missingSkills: selectedJob.atsAnalysis?.missingSkills || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to auto-fix resume");
      }

      const data = await response.json();

      // Create AI additions list for review
      const additions: AIAddition[] = [];

      // Process skill suggestions
      if (data.addedSkills?.length) {
        data.addedSkills.forEach((skill: { name: string; reason: string }, index: number) => {
          additions.push({
            id: `skill-${index}`,
            field: `Skill: ${skill.name}`,
            originalValue: "",
            newValue: skill.name,
            type: "skill",
            approved: null,
          });
        });
      }

      // Process summary improvements
      if (data.summaryAdditions) {
        additions.push({
          id: "summary",
          field: "Professional Summary",
          originalValue: data.summaryAdditions.original || selectedResume.resumeData.basics?.summary || "",
          newValue: data.summaryAdditions.improved,
          type: "summary",
          approved: null,
        });
      }

      // Process experience additions
      if (data.experienceAdditions?.length) {
        data.experienceAdditions.forEach((exp: { position: string; addition: string; reason: string }, index: number) => {
          additions.push({
            id: `exp-${index}`,
            field: `Experience: ${exp.position}`,
            originalValue: "",
            newValue: exp.addition,
            type: "experience",
            approved: null,
          });
        });
      }

      // Save to cache
      setAutoFixCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, additions);
        return newCache;
      });

      setAiAdditions(additions);
      setShowAutoFixDialog(true);
    } catch (error) {
      console.error("Auto-fix error:", error);
      alert(error instanceof Error ? error.message : "Failed to generate suggestions");
    } finally {
      setIsAutoFixing(false);
    }
  };

  // Handle job selection - auto-select optimized CV if exists
  const handleSelectJob = (job: LinkedInJob) => {
    setSelectedJob(job);
    
    // Check if there's an optimized CV for this job
    const jobResumeMapping = JSON.parse(sessionStorage.getItem("jobResumeMapping") || "{}");
    const mapping = jobResumeMapping[job.id];
    
    if (mapping && mapping.resumeId) {
      // Check if the mapped CV still exists
      const mappedResume = resumes.find(r => r.id === mapping.resumeId);
      if (mappedResume && selectedResumeId !== mapping.resumeId) {
        // Auto-select the optimized CV for this job
        setSelectedResumeId(mapping.resumeId);
      }
    }
  };

  // Apply approved additions and create new resume
  const applyAutoFix = async () => {
    const selectedResume = resumes.find((r) => r.id === selectedResumeId);
    if (!selectedResume || !selectedJob) return;

    const approvedAdditions = aiAdditions.filter((a) => a.approved === true);
    if (approvedAdditions.length === 0) {
      setShowAutoFixDialog(false);
      return;
    }

    const newResumeData = { ...selectedResume.resumeData };

    // Apply approved skills
    const approvedSkills = approvedAdditions
      .filter((a) => a.type === "skill")
      .map((a) => a.newValue);
    if (approvedSkills.length > 0) {
      const existingSkills = newResumeData.skills || [];
      const newSkillItems = approvedSkills.map((skill) => ({
        name: skill,
        level: "Intermediate" as const,
        keywords: [],
      }));
      newResumeData.skills = [...existingSkills, ...newSkillItems];
    }

    // Apply approved summary
    const summaryAddition = approvedAdditions.find((a) => a.type === "summary");
    if (summaryAddition && newResumeData.basics) {
      newResumeData.basics.summary = summaryAddition.newValue;
    }

    // Create new resume
    const newResume = await createResume(
      `${selectedResume.name} - Optimized for ${selectedJob.company}`,
      newResumeData,
      selectedResume.templateId
    );

    if (!newResume) {
      alert("Failed to create optimized resume");
      return;
    }

    // Save the job-resume mapping to sessionStorage for ATS tracking
    const jobResumeMapping = JSON.parse(sessionStorage.getItem("jobResumeMapping") || "{}");
    jobResumeMapping[selectedJob.id] = {
      resumeId: newResume.id,
      jobTitle: selectedJob.title,
      company: selectedJob.company,
      createdAt: new Date().toISOString()
    };
    sessionStorage.setItem("jobResumeMapping", JSON.stringify(jobResumeMapping));

    setShowAutoFixDialog(false);

    // Navigate to edit the new resume
    router.push(`/resume?id=${newResume.id}`);
  };

  // Generate cover letter for selected job
  const handleGenerateCoverLetter = async () => {
    if (!selectedJob || !selectedResumeId) return;

    const selectedResume = resumes.find((r) => r.id === selectedResumeId);
    if (!selectedResume) return;

    setIsGeneratingCoverLetter(true);
    setCoverLetterAIAdditions([]);
    setGeneratedCoverLetter("");

    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDetails: {
            title: selectedJob.title,
            company: selectedJob.company,
            description: selectedJob.description,
            location: selectedJob.location,
          },
          resumeData: selectedResume.resumeData,
          language: "en",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate cover letter");

      const data = await response.json();

      if (data.coverLetter) {
        setGeneratedCoverLetter(data.coverLetter.body || "");

        // Identify AI additions (simulated - in real implementation, AI would flag these)
        const additions: AIAddition[] = [];

        // Flag any claims that might need verification
        if (data.coverLetter.body?.includes("extensive experience")) {
          additions.push({
            id: "claim-1",
            field: "Body",
            originalValue: "",
            newValue: "extensive experience",
            type: "experience",
            approved: null,
          });
        }

        setCoverLetterAIAdditions(additions);
      }

      setShowCoverLetterDialog(true);
    } catch (error) {
      console.error("Cover letter generation error:", error);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  // Debounce ref for API calls
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Filter locations - first check static list, then call API
  const filterLocations = useCallback(async (input: string) => {
    if (!input.trim() || input.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }

    // First, filter from static list for instant results
    const query = input.toLowerCase();
    const staticFiltered = POPULAR_LOCATIONS.filter((loc) =>
      loc.toLowerCase().includes(query)
    ).slice(0, 4);
    
    setLocationSuggestions(staticFiltered);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce API call
    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoadingLocations(true);
        const response = await fetch("/api/location-autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.suggestions && data.suggestions.length > 0) {
            // Merge static and API results, remove duplicates
            const allSuggestions = [...staticFiltered];
            for (const suggestion of data.suggestions) {
              const normalized = suggestion.toLowerCase();
              if (!allSuggestions.some((s) => s.toLowerCase() === normalized)) {
                allSuggestions.push(suggestion);
              }
            }
            setLocationSuggestions(allSuggestions.slice(0, 8));
          }
        }
      } catch (error) {
        console.error("Location autocomplete error:", error);
      } finally {
        setIsLoadingLocations(false);
      }
    }, 300);
  }, []);

  // Handle location input change
  const handleLocationChange = (value: string) => {
    setLocationSearch(value);
    filterLocations(value);
    setShowLocationSuggestions(true);
  };

  // Select location from suggestions
  const selectLocation = (location: string) => {
    setLocationSearch(location);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return "Unknown";
    }
  };

  // Get ATS score color
  const getATSColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    if (score >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  // Loading subscription
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Trial expired gate
  if (trialExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-amber-200 shadow-lg shadow-amber-500/10">
          <CardHeader className="text-center bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
              <Crown className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle className="text-gray-900">
              Your Free Trial Has Ended
            </CardTitle>
            <CardDescription>
              Upgrade to Pro to continue using Find Jobs & ATS Optimizer
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-center mb-6">
              Your 3-day free trial has expired. Upgrade to Pro to continue searching LinkedIn jobs and getting AI-powered ATS score analysis.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => router.push("/pricing")} 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No resumes - show message
  if (resumes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-blue-100 shadow-lg shadow-blue-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              No Resume Found
            </CardTitle>
            <CardDescription>
              You need to create and save a resume first before searching for jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => router.push("/resume")} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              <FileText className="w-4 h-4 mr-2" />
              Create Resume
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full border-blue-200 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="w-full px-4 py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")} className="border-blue-200 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="LinImpact.ai Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Find Jobs</h1>
                <p className="text-sm text-gray-500">Search LinkedIn jobs and analyze ATS compatibility</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Search Form */}
          <div className="w-full lg:w-[400px] space-y-4">
            {/* Resume Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Select Your Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Search Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Search Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Job Title</Label>
                  <Input
                    placeholder="e.g., Data Scientist, Software Engineer"
                    value={titleSearch}
                    onChange={(e) => setTitleSearch(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separate multiple titles with commas</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Company</Label>
                  <Input
                    placeholder="e.g., Google, Microsoft, Amazon"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">Optional - separate multiple companies with commas</p>
                </div>

                {/* Work Type - Remote toggle */}
                <div>
                  <Label className="text-xs text-gray-600">Work Type</Label>
                  <Select
                    value={remote === undefined ? "all" : remote ? "remote" : "onsite"}
                    onValueChange={(v) => {
                      if (v === "all") setRemote(undefined);
                      else if (v === "remote") setRemote(true);
                      else setRemote(false);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="remote">Remote Only</SelectItem>
                      <SelectItem value="onsite">On-site Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Label className="text-xs text-gray-600">
                    Location {remote === true && <span className="text-gray-400">(optional for remote)</span>}
                  </Label>
                  <Input
                    ref={locationInputRef}
                    placeholder={remote === true ? "Optional - e.g., US, Europe" : "e.g., France, Paris"}
                    value={locationSearch}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    onFocus={() => {
                      if (locationSuggestions.length > 0 || locationSearch.trim()) {
                        filterLocations(locationSearch);
                        setShowLocationSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowLocationSuggestions(false), 200);
                    }}
                    className="mt-1"
                    autoComplete="off"
                  />
                  {showLocationSuggestions && (locationSuggestions.length > 0 || isLoadingLocations) && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {locationSuggestions.map((location, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectLocation(location);
                          }}
                        >
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {location}
                        </button>
                      ))}
                      {isLoadingLocations && (
                        <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading more locations...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Time Range</Label>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">Last 24 hours</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="6m">Last 6 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Max Jobs</Label>
                    <Select value={String(maxJobs)} onValueChange={(v) => setMaxJobs(Number(v))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="easyApply"
                    checked={easyApplyOnly}
                    onCheckedChange={(checked) => setEasyApplyOnly(checked === true)}
                  />
                  <Label htmlFor="easyApply" className="text-sm cursor-pointer">
                    Easy Apply only
                  </Label>
                </div>

                {/* Advanced Filters Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Advanced Filters
                  </span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {showAdvanced && (
                  <div className="space-y-4 pt-2 border-t">
                    <div>
                      <Label className="text-xs text-gray-600">Seniority Level</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {["Entry", "Associate", "Mid-Senior", "Director", "Executive"].map((level) => (
                          <Badge
                            key={level}
                            variant={seniorityLevel.includes(level) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              if (seniorityLevel.includes(level)) {
                                setSeniorityLevel(seniorityLevel.filter((l) => l !== level));
                              } else {
                                setSeniorityLevel([...seniorityLevel, level]);
                              }
                            }}
                          >
                            {level}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600">Employment Type</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {["Full-time", "Part-time", "Contract", "Internship"].map((type) => (
                          <Badge
                            key={type}
                            variant={employmentType.includes(type) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              if (employmentType.includes(type)) {
                                setEmploymentType(employmentType.filter((t) => t !== type));
                              } else {
                                setEmploymentType([...employmentType, type]);
                              }
                            }}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {searchError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {searchError}
                  </div>
                )}

                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !selectedResumeId}
                  className="w-full"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Jobs
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Middle Panel - Job List */}
          <div className="flex-1 min-w-0">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Jobs Found ({jobs.length})
                    {isAnalyzing && (
                      <span className="text-sm font-normal text-gray-500">
                        Analyzing {analyzedCount}/{jobs.length}...
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Posted Date</SelectItem>
                        <SelectItem value="ats">ATS Score</SelectItem>
                        <SelectItem value="applications">Applications</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      {sortOrder === "desc" ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-320px)]">
                  {jobs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No jobs found. Try adjusting your search criteria.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedJobs.map((job) => (
                        <div
                          key={job.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:shadow-sm ${
                            selectedJob?.id === job.id ? "border-blue-500 bg-blue-50/50" : ""
                          }`}
                          onClick={() => handleSelectJob(job)}
                        >
                          <div className="flex items-start gap-3">
                            {job.companyLogo ? (
                              <img
                                src={job.companyLogo}
                                alt={job.company}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-gray-900 line-clamp-1">{job.title}</h3>
                                  <p className="text-sm text-gray-600">{job.company}</p>
                                </div>
                                {/* ATS Score - Circular Progress or Loading */}
                                <div className="shrink-0 flex flex-col items-center">
                                  {analyzingJobIds.has(job.id) ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="w-16 h-16 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                      </div>
                                      <span className="text-xs text-gray-500 text-center">Calculating<br/>ATS Score</span>
                                    </div>
                                  ) : job.atsScore !== undefined ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="relative w-16 h-16">
                                        <svg className="w-16 h-16 transform -rotate-90">
                                          <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="5"
                                            fill="transparent"
                                            className="text-gray-200"
                                          />
                                          <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="5"
                                            fill="transparent"
                                            strokeDasharray={`${2 * Math.PI * 28}`}
                                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - job.atsScore / 100)}`}
                                            strokeLinecap="round"
                                            className={
                                              job.atsScore >= 80 ? "text-green-500" :
                                              job.atsScore >= 60 ? "text-yellow-500" :
                                              job.atsScore >= 40 ? "text-orange-500" :
                                              "text-red-500"
                                            }
                                          />
                                        </svg>
                                        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${
                                          job.atsScore >= 80 ? "text-green-600" :
                                          job.atsScore >= 60 ? "text-yellow-600" :
                                          job.atsScore >= 40 ? "text-orange-600" :
                                          "text-red-600"
                                        }`}>
                                          {job.atsScore}%
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500 font-medium">ATS Score</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(job.postedAt)}
                                </span>
                                {job.applicationsCount !== undefined && job.applicationsCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {job.applicationsCount} applicants
                                  </span>
                                )}
                                {job.workArrangement ? (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      job.workArrangement.includes("Remote") 
                                        ? "text-blue-600 border-blue-300" 
                                        : job.workArrangement === "Hybrid" 
                                          ? "text-purple-600 border-purple-300"
                                          : "text-gray-600 border-gray-300"
                                    }`}
                                  >
                                    {job.workArrangement}
                                  </Badge>
                                ) : job.remote ? (
                                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Remote</Badge>
                                ) : null}
                                {job.easyApply && (
                                  <Badge variant="secondary" className="text-xs">Easy Apply</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Job Details */}
          {selectedJob && (
            <div className="w-full lg:w-[450px] space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedJob.title}</CardTitle>
                      <CardDescription>{selectedJob.company}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedJob(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Job Meta */}
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedJob.location}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(selectedJob.postedAt)}
                    </Badge>
                    {selectedJob.applicationsCount !== undefined && selectedJob.applicationsCount > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {selectedJob.applicationsCount} applicants
                      </Badge>
                    )}
                  </div>

                  {/* ATS Score */}
                  {selectedJob.atsScore !== undefined && (
                    <div className={`p-4 rounded-lg ${getATSColor(selectedJob.atsScore)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          ATS Compatibility
                        </span>
                        <span className="text-2xl font-bold">{selectedJob.atsScore}%</span>
                      </div>
                      {selectedJob.atsAnalysis && (
                        <div className="mt-3 space-y-2">
                          {selectedJob.atsAnalysis.missingSkills.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-1">Missing Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedJob.atsAnalysis.missingSkills.slice(0, 5).map((skill, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {selectedJob.atsAnalysis.missingSkills.length > 5 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{selectedJob.atsAnalysis.missingSkills.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {selectedJob.atsScore !== undefined && (
                      <Button onClick={handleAutoFix} disabled={isAutoFixing}>
                        {isAutoFixing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Suggestions...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Auto-Fix Resume for This Job
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleGenerateCoverLetter} disabled={isGeneratingCoverLetter}>
                      {isGeneratingCoverLetter ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Cover Letter
                        </>
                      )}
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={selectedJob.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on LinkedIn
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      onClick={() => {
                        // Save job details to localStorage for transfer
                        const interviewPrepTransfer = {
                          jobTitle: selectedJob.title,
                          company: selectedJob.company,
                          jobDescription: selectedJob.description,
                          jobUrl: selectedJob.url,
                          resumeId: selectedResumeId,
                        };
                        sessionStorage.setItem("interviewPrepTransfer", JSON.stringify(interviewPrepTransfer));
                        router.push(`/interview-prep?fromFindJobs=true`);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Prepare for Interview
                    </Button>
                  </div>

                  <Separator />

                  {/* Job Description */}
                  <div>
                    <h4 className="font-semibold mb-2">Job Description</h4>
                    <ScrollArea className="h-[300px]">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {selectedJob.description}
                      </p>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Fix Dialog */}
      <Dialog open={showAutoFixDialog} onOpenChange={setShowAutoFixDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Review AI Suggestions
            </DialogTitle>
            <DialogDescription>
              Review and approve the AI-suggested additions to your resume. 
              <span className="text-red-600 font-medium"> Red items</span> are AI-generated and need your approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {aiAdditions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No suggestions found for this job.</p>
            ) : (
              aiAdditions.map((addition) => (
                <div
                  key={addition.id}
                  className={`p-4 rounded-lg border-2 ${
                    addition.approved === true
                      ? "border-green-300 bg-green-50"
                      : addition.approved === false
                      ? "border-gray-200 bg-gray-50 opacity-50"
                      : "border-red-300 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{addition.field}</Badge>
                        {addition.approved === null && (
                          <Badge className="text-xs bg-red-600 text-white border-red-600">
                            AI Generated - Needs Review
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${addition.approved === null ? "text-red-700 font-medium" : "text-gray-700"}`}>
                        {addition.newValue}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={addition.approved === true ? "default" : "outline"}
                        className={addition.approved === true ? "bg-green-600" : ""}
                        onClick={() => {
                          setAiAdditions(
                            aiAdditions.map((a) =>
                              a.id === addition.id ? { ...a, approved: true } : a
                            )
                          );
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={addition.approved === false ? "default" : "outline"}
                        className={addition.approved === false ? "bg-red-600" : ""}
                        onClick={() => {
                          setAiAdditions(
                            aiAdditions.map((a) =>
                              a.id === addition.id ? { ...a, approved: false } : a
                            )
                          );
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoFixDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={applyAutoFix}
              disabled={aiAdditions.filter((a) => a.approved === true).length === 0}
            >
              Apply {aiAdditions.filter((a) => a.approved === true).length} Changes & Create New Resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cover Letter Dialog */}
      <Dialog open={showCoverLetterDialog} onOpenChange={setShowCoverLetterDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Generated Cover Letter
            </DialogTitle>
            <DialogDescription>
              Review the AI-generated cover letter for {selectedJob?.company}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={generatedCoverLetter}
              onChange={(e) => setGeneratedCoverLetter(e.target.value)}
              rows={15}
              className="font-serif"
            />
            {coverLetterAIAdditions.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  AI has made claims that may need verification
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCoverLetterDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              // Save cover letter data to localStorage for transfer
              const coverLetterTransfer = {
                body: generatedCoverLetter,
                recipientName: "Hiring Manager",
                recipientTitle: selectedJob?.title ? `${selectedJob.title} Hiring Team` : "",
                companyName: selectedJob?.company || "",
                greeting: "Dear Hiring Manager,",
                closing: "Sincerely,",
                senderName: resumes.find(r => r.id === selectedResumeId)?.resumeData?.basics?.name || "",
                senderTitle: resumes.find(r => r.id === selectedResumeId)?.resumeData?.basics?.label || "",
                jobDetails: {
                  title: selectedJob?.title || "",
                  company: selectedJob?.company || "",
                  description: selectedJob?.description || "",
                  location: selectedJob?.location || "",
                }
              };
              sessionStorage.setItem("coverLetterTransfer", JSON.stringify(coverLetterTransfer));
              router.push(`/cover-letter?fromFindJobs=true`);
            }}>
              Edit in Cover Letter Editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FindJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      }
    >
      <FindJobsContent />
    </Suspense>
  );
}
