"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  Target, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Briefcase, 
  GraduationCap, 
  Wrench,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  X,
  ExternalLink,
  Lightbulb
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface WeakArea {
  section: string;
  field: string;
  currentValue: string;
  issue: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
  fixed?: boolean;
}

interface MissingSkill {
  name: string;
  importance: "required" | "preferred" | "nice-to-have";
  added?: boolean;
}

interface ATSScoreResponse {
  score: number;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingSkills: MissingSkill[];
  weakAreas: WeakArea[];
  strengths: string[];
  recommendations: string[];
}

interface CachedAnalysis {
  jobDescriptionHash: string;
  timestamp: number;
  originalAnalysis: ATSScoreResponse;
  currentState: {
    fixedWeakAreas: number[];
    addedSkills: string[];
  };
}

const CACHE_KEY_PREFIX = "ats_analysis_";

function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getCacheKey(jobDescription: string): string {
  const hash = generateHash(jobDescription);
  return `${CACHE_KEY_PREFIX}${hash}`;
}

function getCachedAnalysis(jobDescription: string): CachedAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getCacheKey(jobDescription);
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error("Error reading cache:", e);
  }
  return null;
}

function saveCachedAnalysis(jobDescription: string, analysis: ATSScoreResponse): void {
  if (typeof window === "undefined") return;
  try {
    const key = getCacheKey(jobDescription);
    const cached: CachedAnalysis = {
      jobDescriptionHash: generateHash(jobDescription),
      timestamp: Date.now(),
      originalAnalysis: analysis,
      currentState: {
        fixedWeakAreas: [],
        addedSkills: [],
      },
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (e) {
    console.error("Error saving cache:", e);
  }
}

function updateCachedState(jobDescription: string, fixedWeakAreas: number[], addedSkills: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const key = getCacheKey(jobDescription);
    const cached = localStorage.getItem(key);
    if (cached) {
      const data: CachedAnalysis = JSON.parse(cached);
      data.currentState = { fixedWeakAreas, addedSkills };
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.error("Error updating cache:", e);
  }
}

function calculateScoreFromState(
  originalAnalysis: ATSScoreResponse,
  fixedWeakAreas: number[],
  addedSkills: string[]
): number {
  const totalWeakAreas = originalAnalysis.weakAreas.length;
  const totalMissingSkills = originalAnalysis.missingSkills.length;
  const totalIssues = totalWeakAreas + totalMissingSkills;
  
  if (totalIssues === 0) return originalAnalysis.score;
  
  const fixedCount = fixedWeakAreas.length + addedSkills.length;
  const remainingIssues = totalIssues - fixedCount;
  
  const baseScore = originalAnalysis.score;
  const maxImprovement = 100 - baseScore;
  const improvementPerFix = totalIssues > 0 ? maxImprovement / totalIssues : 0;
  
  const newScore = Math.min(100, Math.round(baseScore + (fixedCount * improvementPerFix)));
  return newScore;
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

interface ATSScorePanelProps {
  resume: Resume;
  onResumeChange: (resume: Resume) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function ATSScorePanel({
  resume,
  onResumeChange,
  isExpanded,
  onToggleExpand,
}: ATSScorePanelProps) {
  const { isPro, trialExpired, isLoading: subLoading } = useSubscription();
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
  const [result, setResult] = useState<ATSScoreResponse | null>(null);
  const [originalAnalysis, setOriginalAnalysis] = useState<ATSScoreResponse | null>(null);
  const [fixedWeakAreas, setFixedWeakAreas] = useState<number[]>([]);
  const [addedSkills, setAddedSkills] = useState<string[]>([]);
  const [calculatedScore, setCalculatedScore] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["weakAreas", "missingSkills"]));
  const [fixingItems, setFixingItems] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const scoreDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded) {
      setJobDescription(globalSavedJobDescription.jobDescription);
      setFetchedJobInfo(globalSavedJobDescription.jobInfo);
    }
  }, [isExpanded]);

  // Scroll to score display when result is available
  useEffect(() => {
    if (result && scoreDisplayRef.current) {
      setTimeout(() => {
        scoreDisplayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [result]);

  const updateJobDescription = (newJobDescription: string, newJobInfo: typeof fetchedJobInfo = null) => {
    setJobDescription(newJobDescription);
    setFetchedJobInfo(newJobInfo);
    globalSavedJobDescription = {
      jobDescription: newJobDescription,
      jobInfo: newJobInfo,
    };
  };

  const extractJobId = (input: string): string | null => {
    const cleanInput = input.trim();
    if (/^\d+$/.test(cleanInput)) {
      return cleanInput;
    }
    const urlMatch = cleanInput.match(/linkedin\.com\/jobs\/view\/(\d+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    return null;
  };

  const handleFetchLinkedInJob = async (inputValue: string, inputType: "id" | "url") => {
    const jobId = extractJobId(inputValue);
    if (!jobId) {
      setError(inputType === "id" ? "Please enter a valid LinkedIn Job ID" : "Please enter a valid LinkedIn job URL");
      return;
    }

    setIsFetchingJob(true);
    setError(null);

    try {
      const response = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch job details");
      }

      updateJobDescription(data.jobDescription, {
        title: data.jobTitle,
        company: data.companyName,
        logoUrl: data.logoUrl,
        backgroundUrl: data.backgroundUrl,
      });

      if (inputType === "id") {
        setLinkedinJobId("");
      } else {
        setLinkedinJobUrl("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job details");
    } finally {
      setIsFetchingJob(false);
    }
  };

  const handleAnalyze = async () => {
    if (!fetchedJobInfo || !jobDescription.trim()) {
      setError("Please import a job from LinkedIn first");
      return;
    }

    // Check for cached analysis first
    const cached = getCachedAnalysis(jobDescription);
    if (cached) {
      // Use cached analysis
      setOriginalAnalysis(cached.originalAnalysis);
      setFixedWeakAreas(cached.currentState.fixedWeakAreas);
      setAddedSkills(cached.currentState.addedSkills);
      
      // Build current result based on state
      const currentResult = buildCurrentResult(
        cached.originalAnalysis,
        cached.currentState.fixedWeakAreas,
        cached.currentState.addedSkills
      );
      setResult(currentResult);
      
      const score = calculateScoreFromState(
        cached.originalAnalysis,
        cached.currentState.fixedWeakAreas,
        cached.currentState.addedSkills
      );
      setCalculatedScore(score);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setOriginalAnalysis(null);
    setFixedWeakAreas([]);
    setAddedSkills([]);

    await runAnalysis(resume);
  };

  // Build current result from original analysis and fixed items
  const buildCurrentResult = (
    original: ATSScoreResponse,
    fixedAreas: number[],
    addedSkillNames: string[]
  ): ATSScoreResponse => {
    return {
      ...original,
      weakAreas: original.weakAreas.map((area, idx) => ({
        ...area,
        fixed: fixedAreas.includes(idx),
      })),
      missingSkills: original.missingSkills.map(skill => ({
        ...skill,
        added: addedSkillNames.includes(skill.name),
      })),
    };
  };

  // Run fresh analysis (only called for first time or force refresh)
  const runAnalysis = async (resumeToAnalyze: Resume) => {
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resume: {
            basics: resumeToAnalyze.basics,
            work: resumeToAnalyze.work,
            education: resumeToAnalyze.education,
            skills: resumeToAnalyze.skills,
            projects: resumeToAnalyze.projects,
            certificates: resumeToAnalyze.certificates,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      // Save to cache
      saveCachedAnalysis(jobDescription, data);
      
      setOriginalAnalysis(data);
      setFixedWeakAreas([]);
      setAddedSkills([]);
      setResult(data);
      setCalculatedScore(data.score);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Update score and cache when items are fixed/added
  const updateScoreAndCache = (newFixedAreas: number[], newAddedSkills: string[]) => {
    if (!originalAnalysis) return;
    
    const newScore = calculateScoreFromState(originalAnalysis, newFixedAreas, newAddedSkills);
    setCalculatedScore(newScore);
    
    // Update the result to show fixed/added status
    const updatedResult = buildCurrentResult(originalAnalysis, newFixedAreas, newAddedSkills);
    setResult(updatedResult);
    
    // Persist to cache
    updateCachedState(jobDescription, newFixedAreas, newAddedSkills);
  };

  const handleAutoFix = async (weakArea: WeakArea, index: number) => {
    const itemKey = `${weakArea.section}-${index}`;
    setFixingItems(prev => new Set(prev).add(itemKey));

    try {
      let field = "professionalSummary";
      let currentValue = "";
      let workIndex = 0;
      let eduIndex = 0;
      let projectIndex = 0;

      switch (weakArea.section) {
        case "professionalTitle":
          field = "professionalTitle";
          currentValue = resume.basics?.label || "";
          break;
        case "professionalSummary":
          field = "professionalSummary";
          currentValue = resume.basics?.summary || "";
          break;
        case "workExperience":
          field = "workExperience";
          workIndex = resume.work?.findIndex(w => 
            weakArea.currentValue.includes(w.summary || "") || 
            weakArea.currentValue.includes(w.position || "")
          ) || 0;
          currentValue = resume.work?.[workIndex]?.summary || "";
          break;
        case "education":
          field = "education";
          eduIndex = resume.education?.findIndex(e => 
            weakArea.currentValue.includes(e.summary || "") ||
            weakArea.currentValue.includes(e.area || "")
          ) || 0;
          currentValue = resume.education?.[eduIndex]?.summary || "";
          break;
        case "skills":
          await handleAddSkillsFromWeakArea(weakArea, index);
          return;
        case "projects":
          field = "project";
          projectIndex = resume.projects?.findIndex(p => 
            weakArea.currentValue.includes(p.description || "") ||
            weakArea.currentValue.includes(p.name || "")
          ) || 0;
          currentValue = resume.projects?.[projectIndex]?.description || "";
          break;
        default:
          field = "professionalSummary";
          currentValue = resume.basics?.summary || "";
      }

      const response = await fetch("/api/ats-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tailored",
          field,
          currentValue: currentValue || weakArea.currentValue,
          jobDescription,
          context: {
            name: resume.basics?.name,
            currentTitle: resume.basics?.label,
            skills: resume.skills?.map(s => s.name),
            experience: resume.work?.map(w => ({
              position: w.position,
              company: w.name,
              summary: w.summary,
            })),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to optimize");
      }

      // Build updated resume and trigger re-analysis
      let updatedResume: Resume;
      
      switch (weakArea.section) {
        case "professionalTitle":
          updatedResume = {
            ...resume,
            basics: { ...resume.basics, label: data.optimizedValue },
          };
          break;
        case "professionalSummary":
          updatedResume = {
            ...resume,
            basics: { ...resume.basics, summary: data.optimizedValue },
          };
          break;
        case "workExperience":
          const newWork = [...(resume.work || [])];
          if (newWork[workIndex]) {
            newWork[workIndex] = { ...newWork[workIndex], summary: data.optimizedValue };
          }
          updatedResume = { ...resume, work: newWork };
          break;
        case "education":
          const newEdu = [...(resume.education || [])];
          if (newEdu[eduIndex]) {
            newEdu[eduIndex] = { ...newEdu[eduIndex], summary: data.optimizedValue };
          }
          updatedResume = { ...resume, education: newEdu };
          break;
        case "projects":
          const newProjects = [...(resume.projects || [])];
          if (newProjects[projectIndex]) {
            newProjects[projectIndex] = { ...newProjects[projectIndex], description: data.optimizedValue };
          }
          updatedResume = { ...resume, projects: newProjects };
          break;
        default:
          updatedResume = resume;
      }

      // Update resume state
      onResumeChange(updatedResume);
      
      // Mark weak area as fixed and update score
      const newFixedAreas = [...fixedWeakAreas, index];
      setFixedWeakAreas(newFixedAreas);
      updateScoreAndCache(newFixedAreas, addedSkills);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-fix failed");
    } finally {
      setFixingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  const handleAddSkillsFromWeakArea = async (weakArea: WeakArea, index: number) => {
    const skillName = weakArea.suggestion.match(/add[:\s]+["']?([^"']+)["']?/i)?.[1] || 
                      weakArea.issue.match(/missing[:\s]+["']?([^"']+)["']?/i)?.[1] ||
                      weakArea.currentValue;
    
    const existingSkills = resume.skills || [];
    
    if (skillName && skillName !== "empty") {
      const alreadyExists = existingSkills.some(s => 
        s.name?.toLowerCase() === skillName.toLowerCase()
      );
      
      if (!alreadyExists) {
        const updatedResume = {
          ...resume,
          skills: [...existingSkills, { name: skillName, level: "Proficient", keywords: [] }],
        };
        onResumeChange(updatedResume);
      }
    }

    // Remove loading state
    setFixingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${weakArea.section}-${index}`);
      return newSet;
    });
    
    // Mark weak area as fixed and update score
    const newFixedAreas = [...fixedWeakAreas, index];
    setFixedWeakAreas(newFixedAreas);
    updateScoreAndCache(newFixedAreas, addedSkills);
  };

  const handleAddMissingSkill = async (skillName: string) => {
    const existingSkills = resume.skills || [];
    const alreadyExists = existingSkills.some(s => 
      s.name?.toLowerCase() === skillName.toLowerCase()
    );
    
    if (!alreadyExists) {
      const updatedResume = {
        ...resume,
        skills: [...existingSkills, { name: skillName, level: "Proficient", keywords: [] }],
      };
      onResumeChange(updatedResume);
      
      // Mark skill as added and update score
      const newAddedSkills = [...addedSkills, skillName];
      setAddedSkills(newAddedSkills);
      updateScoreAndCache(fixedWeakAreas, newAddedSkills);
    }
  };

  const handleAddAllMissingSkills = async () => {
    if (!result || result.missingSkills.length === 0) return;
    
    const existingSkills = resume.skills || [];
    const existingSkillNames = existingSkills.map(s => (s.name || "").toLowerCase());
    
    // Only add skills that are not already added
    const skillsToAdd = result.missingSkills.filter(s => {
      const skillName = (s.name || "").toLowerCase();
      return skillName && 
             !existingSkillNames.includes(skillName) && 
             !addedSkills.includes(s.name);
    });
    
    const newSkills = skillsToAdd.map(s => ({ name: s.name, level: "Proficient", keywords: [] as string[] }));
    
    // Build updated resume
    const updatedResume = {
      ...resume,
      skills: [...existingSkills, ...newSkills],
    };
    
    // Update resume if any new skills
    if (newSkills.length > 0) {
      onResumeChange(updatedResume);
    }
    
    // Mark all missing skills as added and update score
    const allMissingSkillNames = result.missingSkills.map(s => s.name);
    const newAddedSkills = [...new Set([...addedSkills, ...allMissingSkillNames])];
    setAddedSkills(newAddedSkills);
    updateScoreAndCache(fixedWeakAreas, newAddedSkills);
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
    if (isLoading || isFetchingJob) {
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
    setIsFetchingJob(false);
    onToggleExpand();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500";
    if (score >= 75) return "from-green-400 to-teal-500";
    if (score >= 60) return "from-yellow-400 to-amber-500";
    if (score >= 40) return "from-orange-400 to-red-400";
    return "from-red-500 to-rose-600";
  };

  const getScoreTrackColor = (score: number) => {
    if (score >= 90) return "#dcfce7"; // green-100
    if (score >= 75) return "#d1fae5"; // emerald-100
    if (score >= 60) return "#fef3c7"; // amber-100
    if (score >= 40) return "#ffedd5"; // orange-100
    return "#fee2e2"; // red-100
  };

  const getScoreStrokeColor = (score: number) => {
    if (score >= 90) return "#22c55e"; // green-500
    if (score >= 75) return "#4ade80"; // green-400
    if (score >= 60) return "#facc15"; // yellow-400
    if (score >= 40) return "#fb923c"; // orange-400
    return "#ef4444"; // red-500
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Moderate";
    if (score >= 40) return "Weak";
    return "Poor";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "required": return "bg-red-100 text-red-700";
      case "preferred": return "bg-yellow-100 text-yellow-700";
      case "nice-to-have": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case "professionalTitle":
      case "professionalSummary":
        return <FileText className="w-4 h-4" />;
      case "workExperience":
        return <Briefcase className="w-4 h-4" />;
      case "education":
        return <GraduationCap className="w-4 h-4" />;
      case "skills":
        return <Wrench className="w-4 h-4" />;
      case "projects":
        return <Award className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (!isExpanded) {
    if (trialExpired && !subLoading) {
      return (
        <button
          onClick={() => window.location.href = "/pricing"}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 rounded-xl border border-gray-200 transition-all duration-200 group cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-300 rounded-lg text-gray-500">
              <Target className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-500 flex items-center gap-2">
                ATS Score Analysis for Specific LinkedIn Job
                <span className="inline-flex items-center text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  <span className="mr-1">👑</span> Pro
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
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
            <Target className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">ATS Score Analysis for Specific LinkedIn Job</h3>
            <p className="text-xs text-gray-500">Import LinkedIn job posting & check compatibility</p>
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </button>
    );
  }

  return (
    <>
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">ATS Score Analysis for Specific LinkedIn Job</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Import LinkedIn job posting & analyze</p>
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
          {/* Job Description Input */}
          {!result && (
            <div className="space-y-4">
              {/* LinkedIn Import */}
              <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-200">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  Import from LinkedIn
                </Label>
                
                {/* Job ID Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Job ID (e.g., 4361758535)"
                    value={linkedinJobId}
                    onChange={(e) => setLinkedinJobId(e.target.value)}
                    className="flex-1 min-w-0"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFetchLinkedInJob(linkedinJobId, "id")}
                    disabled={!linkedinJobId.trim() || isFetchingJob}
                    className="shrink-0"
                  >
                    {isFetchingJob ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                  </Button>
                </div>

                {/* Job URL Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="LinkedIn Job URL"
                    value={linkedinJobUrl}
                    onChange={(e) => setLinkedinJobUrl(e.target.value)}
                    className="flex-1 min-w-0"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFetchLinkedInJob(linkedinJobUrl, "url")}
                    disabled={!linkedinJobUrl.trim() || isFetchingJob}
                    className="shrink-0"
                  >
                    {isFetchingJob ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                  </Button>
                </div>
              </div>

              {/* Fetched Job Info */}
              {fetchedJobInfo && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  {fetchedJobInfo.backgroundUrl && (
                    <div 
                      className="h-16 bg-cover bg-center"
                      style={{ backgroundImage: `url(${fetchedJobInfo.backgroundUrl})` }}
                    />
                  )}
                  <div className="p-3 bg-white flex items-center gap-3">
                    {fetchedJobInfo.logoUrl && (
                      <img 
                        src={fetchedJobInfo.logoUrl} 
                        alt={fetchedJobInfo.company}
                        className="w-10 h-10 rounded-lg object-contain border border-gray-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{fetchedJobInfo.title}</p>
                      <p className="text-xs text-gray-500 truncate">{fetchedJobInfo.company}</p>
                    </div>
                    <button
                      onClick={() => updateJobDescription("", null)}
                      className="p-1 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !fetchedJobInfo || !jobDescription.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Compatibility
                  </>
                )}
              </Button>

              {/* Cancel during loading */}
              {isLoading && (
                <Button
                  variant="outline"
                  onClick={handleCloseRequest}
                  className="w-full"
                >
                  Cancel
                </Button>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Score Display */}
              <div ref={scoreDisplayRef} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center gap-4">
                  {/* Circular Score Gauge */}
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        stroke={getScoreTrackColor(calculatedScore)}
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        stroke={getScoreStrokeColor(calculatedScore)}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(calculatedScore / 100) * 220} 220`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className={`text-2xl font-bold ${getScoreColor(calculatedScore)}`}>
                        {calculatedScore}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className={`text-lg font-semibold ${getScoreColor(calculatedScore)}`}>
                      {getScoreLabel(calculatedScore)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ATS Compatibility
                    </p>
                  </div>
                </div>
                {/* Progress indicator */}
                <div className="text-right text-sm text-gray-500">
                  <p className="font-medium">{fixedWeakAreas.length + addedSkills.length} / {(originalAnalysis?.weakAreas.length || 0) + (originalAnalysis?.missingSkills.length || 0)}</p>
                  <p className="text-xs">Issues Fixed</p>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <p className="text-sm text-gray-700">{result.summary}</p>
              </div>

              {/* Keywords Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleSection("keywords")}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm">Matched Keywords</span>
                    <span className="text-xs text-gray-500">({result.matchedKeywords.length})</span>
                  </div>
                  {expandedSections.has("keywords") ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.has("keywords") && (
                  <div className="px-3 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchedKeywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Missing Keywords */}
              {result.missingKeywords.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("missingKeywords")}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-sm">Missing Keywords</span>
                      <span className="text-xs text-gray-500">({result.missingKeywords.length})</span>
                    </div>
                    {expandedSections.has("missingKeywords") ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has("missingKeywords") && (
                    <div className="px-3 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {result.missingKeywords.map((keyword, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Missing Skills with Add buttons */}
              {result.missingSkills.length > 0 && (
                <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("missingSkills")}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-sm">Missing Skills</span>
                      <span className="text-xs text-gray-500">
                        ({result.missingSkills.filter(s => !s.added).length} remaining)
                      </span>
                    </div>
                    {expandedSections.has("missingSkills") ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has("missingSkills") && (
                    <div className="px-3 pb-3 space-y-2">
                      {result.missingSkills.map((skill, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            skill.added ? "bg-green-50 border border-green-200" : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {skill.added && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            <span className={`text-sm font-medium ${skill.added ? "text-green-700" : ""}`}>
                              {skill.name}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${getImportanceColor(skill.importance)}`}>
                              {skill.importance}
                            </span>
                          </div>
                          {skill.added ? (
                            <span className="text-xs text-green-600 font-medium">Added</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddMissingSkill(skill.name)}
                              className="h-7 text-xs"
                            >
                              + Add
                            </Button>
                          )}
                        </div>
                      ))}
                      {result.missingSkills.some(s => !s.added) && (
                        <Button
                          size="sm"
                          onClick={handleAddAllMissingSkills}
                          className="w-full mt-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Add All Missing Skills
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Weak Areas with Auto-Fix */}
              {result.weakAreas.length > 0 && (
                <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("weakAreas")}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-sm">Areas to Improve</span>
                      <span className="text-xs text-gray-500">
                        ({result.weakAreas.filter(a => !a.fixed).length} remaining)
                      </span>
                    </div>
                    {expandedSections.has("weakAreas") ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has("weakAreas") && (
                    <div className="px-3 pb-3 space-y-3">
                      {result.weakAreas.map((area, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg space-y-2 ${
                            area.fixed ? "bg-green-50 border border-green-200" : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {area.fixed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                getSectionIcon(area.section)
                              )}
                              <span className={`text-sm font-medium ${area.fixed ? "text-green-700" : ""}`}>
                                {area.field}
                              </span>
                              {!area.fixed && (
                                <span className={`px-1.5 py-0.5 text-[10px] rounded-full border ${getPriorityColor(area.priority)}`}>
                                  {area.priority}
                                </span>
                              )}
                            </div>
                            {area.fixed && (
                              <span className="text-xs text-green-600 font-medium">Fixed</span>
                            )}
                          </div>
                          {!area.fixed && (
                            <>
                              <p className="text-xs text-red-600">{area.issue}</p>
                              <p className="text-xs text-green-600 flex items-start gap-1">
                                <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                                {area.suggestion}
                              </p>
                              <Button
                                size="sm"
                                onClick={() => handleAutoFix(area, i)}
                                disabled={fixingItems.has(`${area.section}-${i}`)}
                                className="w-full h-7 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                              >
                                {fixingItems.has(`${area.section}-${i}`) ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Fixing...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Auto-Fix
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("strengths")}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm">Strengths</span>
                      <span className="text-xs text-gray-500">({result.strengths.length})</span>
                    </div>
                    {expandedSections.has("strengths") ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has("strengths") && (
                    <div className="px-3 pb-3">
                      <ul className="space-y-1">
                        {result.strengths.map((strength, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("recommendations")}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
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
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                            <span className="w-4 h-4 flex items-center justify-center bg-blue-500 text-white rounded-full text-[10px] shrink-0">
                              {i + 1}
                            </span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Close Confirmation Modal */}
      <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Analysis?</DialogTitle>
            <DialogDescription>
              The analysis is still in progress. Are you sure you want to cancel?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCloseConfirm(false)}>
              Continue Analysis
            </Button>
            <Button variant="destructive" onClick={handleConfirmClose}>
              Cancel Analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
