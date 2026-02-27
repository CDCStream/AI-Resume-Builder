"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Lightbulb,
  Search
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

// Profession categories and jobs
const PROFESSIONS = {
  "Technology": [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Data Scientist",
    "Data Analyst",
    "Data Engineer",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
    "Site Reliability Engineer",
    "Mobile Developer",
    "iOS Developer",
    "Android Developer",
    "QA Engineer",
    "Security Engineer",
    "Solutions Architect",
    "Technical Lead",
    "Engineering Manager",
    "CTO",
  ],
  "Product & Design": [
    "Product Manager",
    "Product Owner",
    "UX Designer",
    "UI Designer",
    "UX Researcher",
    "Product Designer",
    "Graphic Designer",
    "Creative Director",
  ],
  "Business & Operations": [
    "Business Analyst",
    "Project Manager",
    "Program Manager",
    "Operations Manager",
    "Management Consultant",
    "Strategy Consultant",
    "Business Development Manager",
  ],
  "Marketing & Sales": [
    "Marketing Manager",
    "Digital Marketing Specialist",
    "Content Marketing Manager",
    "SEO Specialist",
    "Social Media Manager",
    "Sales Manager",
    "Account Executive",
    "Customer Success Manager",
  ],
  "Finance": [
    "Financial Analyst",
    "Investment Banker",
    "Accountant",
    "Controller",
    "CFO",
    "Risk Analyst",
    "Actuary",
  ],
  "Human Resources": [
    "HR Manager",
    "Recruiter",
    "Talent Acquisition Specialist",
    "HR Business Partner",
    "Compensation Analyst",
  ],
};

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
  professionHash: string;
  timestamp: number;
  originalAnalysis: ATSScoreResponse;
  currentState: {
    fixedWeakAreas: number[];
    addedSkills: string[];
  };
}

const CACHE_KEY_PREFIX = "profession_ats_";

function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getCacheKey(profession: string): string {
  const hash = generateHash(profession);
  return `${CACHE_KEY_PREFIX}${hash}`;
}

function getCachedAnalysis(profession: string): CachedAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getCacheKey(profession);
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error("Error reading cache:", e);
  }
  return null;
}

function saveCachedAnalysis(profession: string, analysis: ATSScoreResponse): void {
  if (typeof window === "undefined") return;
  try {
    const key = getCacheKey(profession);
    const cached: CachedAnalysis = {
      professionHash: generateHash(profession),
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

function updateCachedState(profession: string, fixedWeakAreas: number[], addedSkills: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const key = getCacheKey(profession);
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
  
  const baseScore = originalAnalysis.score;
  const maxImprovement = 100 - baseScore;
  const improvementPerFix = totalIssues > 0 ? maxImprovement / totalIssues : 0;
  
  const newScore = Math.min(100, Math.round(baseScore + (fixedCount * improvementPerFix)));
  return newScore;
}

interface ProfessionATSPanelProps {
  resume: Resume;
  onResumeChange: (resume: Resume) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function ProfessionATSPanel({
  resume,
  onResumeChange,
  isExpanded,
  onToggleExpand,
}: ProfessionATSPanelProps) {
  const { isPro, trialExpired } = useSubscription();
  const [selectedProfession, setSelectedProfession] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  // Filter professions based on search
  const filteredProfessions = Object.entries(PROFESSIONS).reduce((acc, [category, jobs]) => {
    const filtered = jobs.filter(job => 
      job.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, string[]>);

  // Scroll to score display when result is available
  useEffect(() => {
    if (result && scoreDisplayRef.current) {
      scoreDisplayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleAnalyze = async () => {
    if (!selectedProfession) {
      setError("Please select a profession");
      return;
    }

    // Check for cached analysis first
    const cached = getCachedAnalysis(selectedProfession);
    if (cached) {
      setOriginalAnalysis(cached.originalAnalysis);
      setFixedWeakAreas(cached.currentState.fixedWeakAreas);
      setAddedSkills(cached.currentState.addedSkills);
      
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

  const runAnalysis = async (resumeToAnalyze: Resume) => {
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/profession-ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession: selectedProfession,
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

      saveCachedAnalysis(selectedProfession, data);
      
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

  const updateScoreAndCache = (newFixedAreas: number[], newAddedSkills: string[]) => {
    if (!originalAnalysis) return;
    
    const newScore = calculateScoreFromState(originalAnalysis, newFixedAreas, newAddedSkills);
    setCalculatedScore(newScore);
    
    const updatedResult = buildCurrentResult(originalAnalysis, newFixedAreas, newAddedSkills);
    setResult(updatedResult);
    
    updateCachedState(selectedProfession, newFixedAreas, newAddedSkills);
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
          jobDescription: `Target profession: ${selectedProfession}. Optimize for this role.`,
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

      onResumeChange(updatedResume);
      
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

    setFixingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${weakArea.section}-${index}`);
      return newSet;
    });
    
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
      
      const newAddedSkills = [...addedSkills, skillName];
      setAddedSkills(newAddedSkills);
      updateScoreAndCache(fixedWeakAreas, newAddedSkills);
    }
  };

  const handleAddAllMissingSkills = async () => {
    if (!result || result.missingSkills.length === 0) return;
    
    const existingSkills = resume.skills || [];
    const existingSkillNames = existingSkills.map(s => (s.name || "").toLowerCase());
    
    const skillsToAdd = result.missingSkills.filter(s => {
      const skillName = (s.name || "").toLowerCase();
      return skillName && 
             !existingSkillNames.includes(skillName) && 
             !addedSkills.includes(s.name);
    });
    
    const newSkills = skillsToAdd.map(s => ({ name: s.name, level: "Proficient", keywords: [] as string[] }));
    
    const updatedResume = {
      ...resume,
      skills: [...existingSkills, ...newSkills],
    };
    
    if (newSkills.length > 0) {
      onResumeChange(updatedResume);
    }
    
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent Match";
    if (score >= 80) return "Strong Match";
    if (score >= 70) return "Good Match";
    if (score >= 60) return "Fair Match";
    return "Needs Improvement";
  };

  const getScoreTrackColor = (score: number) => {
    if (score >= 80) return "#dcfce7";
    if (score >= 60) return "#fef9c3";
    return "#fee2e2";
  };

  const getScoreStrokeColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#eab308";
    return "#ef4444";
  };

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high": return "bg-red-50 text-red-700 border-red-200";
      case "medium": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "low": return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getImportanceColor = (importance: "required" | "preferred" | "nice-to-have") => {
    switch (importance) {
      case "required": return "bg-red-100 text-red-700";
      case "preferred": return "bg-yellow-100 text-yellow-700";
      case "nice-to-have": return "bg-gray-100 text-gray-600";
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case "professionalTitle":
      case "professionalSummary":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "workExperience":
        return <Briefcase className="w-4 h-4 text-purple-500" />;
      case "education":
        return <GraduationCap className="w-4 h-4 text-green-500" />;
      case "skills":
        return <Wrench className="w-4 h-4 text-orange-500" />;
      case "projects":
        return <Award className="w-4 h-4 text-pink-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isExpanded) {
    if (trialExpired) {
      return (
        <button
          onClick={() => window.location.href = "/pricing"}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 rounded-xl border border-gray-200 transition-all duration-200 group cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-300 rounded-lg text-gray-500">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-500 flex items-center gap-2">
                ATS Score Analysis for a Job
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
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 rounded-xl border border-purple-200 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg text-white">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">ATS Score Analysis for a Job</h3>
            <p className="text-xs text-gray-500">Select a profession & check compatibility</p>
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

      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-600" />
              ATS Score Analysis for a Job
            </CardTitle>
            <button
              onClick={handleCloseRequest}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronUp className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Profession Selection */}
          {!result && (
            <div className="space-y-4">
              <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-200">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Search className="w-4 h-4 text-purple-600" />
                  Select a Profession
                </Label>
                
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search professions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                {/* Profession List */}
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {Object.entries(filteredProfessions).map(([category, jobs]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {category}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {jobs.map((job) => (
                          <button
                            key={job}
                            onClick={() => setSelectedProfession(job)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                              selectedProfession === job
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                            }`}
                          >
                            {job}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedProfession && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-700">
                      Selected: {selectedProfession}
                    </p>
                  </div>
                )}
              </div>

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
                disabled={isLoading || !selectedProfession}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze for {selectedProfession || "Profession"}
                  </>
                )}
              </Button>

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
                      for {selectedProfession}
                    </p>
                  </div>
                </div>
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
                        <span key={i} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Missing Skills */}
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

              {/* Weak Areas */}
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
                      <ul className="space-y-1.5">
                        {result.strengths.map((strength, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
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
                      <ul className="space-y-1.5">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <Lightbulb className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* New Analysis Button */}
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setOriginalAnalysis(null);
                  setFixedWeakAreas([]);
                  setAddedSkills([]);
                  setSelectedProfession("");
                }}
                className="w-full"
              >
                Analyze for Different Profession
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
