"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useResumes, SavedResume } from "@/hooks/useResumes";
import {
  ArrowLeft,
  Loader2,
  FileText,
  MessageSquare,
  Sparkles,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  ChevronRight,
  Download,
  BookOpen,
  Mic,
  Send,
  RotateCcw,
  Trophy,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Crown,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface STARStory {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  relevantFor: string[];
}

interface TalkingPoint {
  point: string;
  explanation: string;
  howToMention: string;
}

interface ExpectedQuestion {
  question: string;
  category: "behavioral" | "technical" | "situational" | "general";
  bestAnswer: string;
  tips: string[];
}

interface QuestionToAsk {
  question: string;
  purpose: string;
  whenToAsk: string;
}

interface CompanyInsights {
  keyPoints: string[];
  culture: string;
  recentNews: string[];
  competitiveAdvantage: string;
}

interface InterviewGuide {
  elevatorPitch: string;
  starStories: STARStory[];
  talkingPoints: TalkingPoint[];
  expectedQuestions: ExpectedQuestion[];
  questionsToAsk: QuestionToAsk[];
  companyInsights: CompanyInsights;
}

interface InterviewQuestion {
  id: string;
  question: string;
  category: "behavioral" | "technical" | "situational" | "general";
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  tips: string[];
  bestAnswer: string;
  keyPoints: string[];
}

interface AnswerEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
  bestAnswerComparison: string;
  missingPoints: string[];
  deliveryTips: string[];
}

interface PracticeResult {
  questionId: string;
  question: string;
  userAnswer: string;
  evaluation: AnswerEvaluation;
  bestAnswer: string;
}

function InterviewPrepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trialExpired, isLoading: subscriptionLoading } = useSubscription();
  const { resumes, loading: resumesLoading } = useResumes();

  // Resume selection
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");

  // Job input
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [isLoadingJob, setIsLoadingJob] = useState(false);

  // Mode selection
  const [mode, setMode] = useState<"select" | "guide" | "practice">("select");

  // Quick Guide
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [guide, setGuide] = useState<InterviewGuide | null>(null);
  const [guideTab, setGuideTab] = useState("pitch");

  // Practice Interview
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [practiceResults, setPracticeResults] = useState<PracticeResult[]>([]);
  const [showBestAnswer, setShowBestAnswer] = useState(false);
  const [practiceComplete, setPracticeComplete] = useState(false);

  // Load URL params
  useEffect(() => {
    if (resumesLoading) return;

    // Check if coming from Find Jobs page
    const fromFindJobs = searchParams.get("fromFindJobs");
    if (fromFindJobs === "true") {
      const transferData = sessionStorage.getItem("interviewPrepTransfer");
      if (transferData) {
        try {
          const data = JSON.parse(transferData);
          if (data.resumeId) {
            setSelectedResumeId(data.resumeId);
          }
          if (data.jobTitle) {
            setJobTitle(data.jobTitle);
          }
          if (data.company) {
            setCompany(data.company);
          }
          if (data.jobDescription) {
            setJobDescription(data.jobDescription);
          }
          if (data.jobUrl) {
            setLinkedInUrl(data.jobUrl);
          }
          sessionStorage.removeItem("interviewPrepTransfer");
        } catch (e) {
          console.error("Failed to parse interview prep transfer data:", e);
        }
      }
    } else {
      const resumeId = searchParams.get("resumeId");
      const jobUrl = searchParams.get("jobUrl");

      if (resumeId) {
        setSelectedResumeId(resumeId);
      } else if (resumes.length === 1) {
        setSelectedResumeId(resumes[0].id);
      }

      if (jobUrl) {
        setLinkedInUrl(jobUrl);
        fetchJobDetails(jobUrl);
      }
    }
  }, [searchParams, resumes, resumesLoading]);

  // Fetch job details from LinkedIn URL
  const fetchJobDetails = async (url: string) => {
    if (!url.trim()) return;
    
    setIsLoadingJob(true);
    try {
      const response = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinJobUrl: url }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobDescription(data.jobDescription || "");
        setJobTitle(data.jobTitle || "");
        setCompany(data.companyName || "");
      } else {
        const error = await response.json();
        console.error("Failed to fetch job:", error.error);
        alert(error.error || "Failed to fetch job details");
      }
    } catch (error) {
      console.error("Failed to fetch job:", error);
      alert("Failed to fetch job details. Please try again.");
    } finally {
      setIsLoadingJob(false);
    }
  };

  // Generate Quick Interview Guide
  const generateGuide = async () => {
    const selectedResume = resumes.find((r) => r.id === selectedResumeId);
    if (!selectedResume || !jobDescription) return;

    setIsGeneratingGuide(true);
    setMode("guide");

    try {
      const response = await fetch("/api/interview-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          jobTitle,
          company,
          resume: selectedResume.resumeData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGuide(data);
      } else {
        console.error("Failed to generate guide");
      }
    } catch (error) {
      console.error("Guide generation error:", error);
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  // Start Practice Interview
  const startPractice = async () => {
    const selectedResume = resumes.find((r) => r.id === selectedResumeId);
    if (!selectedResume || !jobDescription) return;

    setIsGeneratingQuestions(true);
    setMode("practice");
    setPracticeResults([]);
    setCurrentQuestionIndex(0);
    setPracticeComplete(false);

    try {
      const response = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          jobTitle,
          company,
          resume: selectedResume.resumeData,
          questionCount: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Questions generation error:", error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Submit answer for evaluation
  const submitAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || !userAnswer.trim()) return;

    setIsEvaluating(true);

    try {
      const response = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question,
          questionCategory: currentQuestion.category,
          userAnswer,
          bestAnswer: currentQuestion.bestAnswer,
          keyPoints: currentQuestion.keyPoints,
          jobTitle,
          company,
        }),
      });

      if (response.ok) {
        const evaluation = await response.json();
        setCurrentEvaluation(evaluation);

        // Save result
        setPracticeResults((prev) => [
          ...prev,
          {
            questionId: currentQuestion.id,
            question: currentQuestion.question,
            userAnswer,
            evaluation,
            bestAnswer: currentQuestion.bestAnswer,
          },
        ]);
      }
    } catch (error) {
      console.error("Evaluation error:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setUserAnswer("");
      setCurrentEvaluation(null);
      setShowBestAnswer(false);
    } else {
      setPracticeComplete(true);
    }
  };

  // Calculate final score
  const calculateFinalScore = () => {
    if (practiceResults.length === 0) return 0;
    const totalScore = practiceResults.reduce((sum, r) => sum + r.evaluation.score, 0);
    return Math.round((totalScore / practiceResults.length) * 10);
  };

  // Download guide as PDF
  const downloadGuidePDF = async () => {
    if (!guide) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 11px; 
            line-height: 1.4;
            color: #333;
            padding: 30px;
          }
          h1 { font-size: 20px; color: #1e40af; margin-bottom: 5px; }
          h2 { font-size: 14px; color: #1e40af; margin-top: 20px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #1e40af; }
          h3 { font-size: 12px; color: #374151; margin-top: 10px; margin-bottom: 5px; }
          .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 15px; }
          .section { margin-bottom: 20px; }
          .pitch-box { background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .star-story { background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 12px; }
          .star-label { display: inline-block; font-weight: 600; width: 60px; }
          .star-situation { color: #2563eb; }
          .star-task { color: #16a34a; }
          .star-action { color: #ea580c; }
          .star-result { color: #7c3aed; }
          .tags { margin-top: 8px; }
          .tag { display: inline-block; background: #e5e7eb; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-right: 5px; }
          .point-box { background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 8px; }
          .point-title { font-weight: 600; color: #111827; }
          .point-explain { color: #6b7280; font-size: 10px; margin-top: 3px; }
          .point-how { color: #2563eb; font-size: 10px; font-style: italic; margin-top: 3px; }
          .qa-item { margin-bottom: 15px; page-break-inside: avoid; }
          .qa-question { font-weight: 600; color: #111827; margin-bottom: 5px; }
          .qa-category { display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-size: 9px; margin-left: 5px; }
          .qa-answer { background: #f0fdf4; padding: 10px; border-radius: 6px; color: #166534; }
          .qa-tips { margin-top: 5px; }
          .qa-tips li { color: #6b7280; font-size: 10px; margin-left: 15px; }
          .ask-item { background: #faf5ff; padding: 10px; border-radius: 6px; margin-bottom: 8px; }
          .ask-question { font-weight: 600; color: #7c3aed; }
          .ask-purpose { color: #6b7280; font-size: 10px; margin-top: 3px; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <h2>Interview Preparation Guide</h2>
        <div class="subtitle">${jobTitle || "Position"} at ${company || "Company"}</div>
        
        <div class="section">
          <h2>🎤 30-Second Elevator Pitch</h2>
          <div class="pitch-box">${guide.elevatorPitch}</div>
        </div>
        
        <div class="section">
          <h2>⭐ STAR Stories</h2>
          ${guide.starStories.map(story => `
            <div class="star-story">
              <h3>${story.title}</h3>
              <p><span class="star-label star-situation">Situation:</span> ${story.situation}</p>
              <p><span class="star-label star-task">Task:</span> ${story.task}</p>
              <p><span class="star-label star-action">Action:</span> ${story.action}</p>
              <p><span class="star-label star-result">Result:</span> ${story.result}</p>
              <div class="tags">
                ${story.relevantFor.map(tag => `<span class="tag">${tag}</span>`).join("")}
              </div>
            </div>
          `).join("")}
        </div>
        
        <div class="section page-break">
          <h2>🎯 Key Talking Points</h2>
          ${guide.talkingPoints.map(point => `
            <div class="point-box">
              <div class="point-title">${point.point}</div>
              <div class="point-explain">${point.explanation}</div>
              <div class="point-how">💡 ${point.howToMention}</div>
            </div>
          `).join("")}
        </div>
        
        <div class="section page-break">
          <h2>❓ Expected Questions & Best Answers</h2>
          ${guide.expectedQuestions.map(qa => `
            <div class="qa-item">
              <div class="qa-question">
                Q: ${qa.question}
                <span class="qa-category">${qa.category}</span>
              </div>
              <div class="qa-answer">${qa.bestAnswer}</div>
              <ul class="qa-tips">
                ${qa.tips.map(tip => `<li>💡 ${tip}</li>`).join("")}
              </ul>
            </div>
          `).join("")}
        </div>
        
        <div class="section page-break">
          <h2>🙋 Smart Questions to Ask</h2>
          ${guide.questionsToAsk.map(q => `
            <div class="ask-item">
              <div class="ask-question">"${q.question}"</div>
              <div class="ask-purpose"><strong>Purpose:</strong> ${q.purpose}</div>
              <div class="ask-purpose"><strong>When:</strong> ${q.whenToAsk}</div>
            </div>
          `).join("")}
        </div>
      </body>
      </html>
    `;

    try {
      const response = await fetch("/api/generate-interview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Interview-Guide-${jobTitle || "Position"}-${company || "Company"}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const error = await response.json();
        console.error("PDF generation failed:", error);
        alert("Failed to generate PDF. Please try again.");
      }
    } catch (error) {
      console.error("PDF download error:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "behavioral":
        return "bg-blue-100 text-blue-700";
      case "technical":
        return "bg-purple-100 text-purple-700";
      case "situational":
        return "bg-orange-100 text-orange-700";
      case "general":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };

  // Loading
  if (subscriptionLoading || resumesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Trial expired gate
  if (trialExpired && !subscriptionLoading) {
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
              Upgrade to Pro to continue using Interview Prep AI
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-center mb-6">
              Your 3-day free trial has expired. Upgrade to Pro to continue preparing for your interviews with AI-generated guides and practice questions.
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

  // No resumes
  if (resumes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-blue-100 shadow-lg shadow-blue-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              No Resume Found
            </CardTitle>
            <CardDescription>
              You need to create a resume before preparing for interviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/resume")} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              Create Resume
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center cursor-pointer" onClick={() => router.push("/dashboard")}>
                <img 
                  src="/logo.png" 
                  alt="LinImpact.ai Logo" 
                  className="w-14 h-14 object-contain"
                />
                <span className="text-xl font-extrabold tracking-tight -ml-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                  <span className="text-cyan-500">Lin</span>
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">Impact</span>
                  <span className="text-slate-500 font-semibold">.ai</span>
                </span>
              </div>
              <div className="border-l border-gray-200 pl-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Interview Preparation</h1>
                <p className="text-sm text-gray-500">Prepare for your dream job interview</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Mode Selection */}
        {mode === "select" && (
          <div className="space-y-8">
            {/* Job & Resume Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Select Your Resume & Job</CardTitle>
                <CardDescription>Choose your resume and enter the job details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Select Resume</Label>
                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                      <SelectTrigger className="mt-1">
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
                  </div>
                  <div>
                    <Label>LinkedIn Job URL (optional)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="https://www.linkedin.com/jobs/view/..."
                        value={linkedInUrl}
                        onChange={(e) => setLinkedInUrl(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => fetchJobDetails(linkedInUrl)}
                        disabled={!linkedInUrl || isLoadingJob}
                      >
                        {isLoadingJob ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      placeholder="e.g., Senior Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      placeholder="e.g., Google"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Job Description</Label>
                  <Textarea
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="mt-1 min-h-[200px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mode Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  !selectedResumeId || !jobDescription ? "opacity-50 cursor-not-allowed" : "hover:border-blue-300"
                }`}
                onClick={() => selectedResumeId && jobDescription && generateGuide()}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    Get a Quick Interview Guide
                  </CardTitle>
                  <CardDescription>
                    A quick, scannable guide for right before your interview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>30-second personal intro:</strong> Exactly how to open strong</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>STAR highlights:</strong> Your best stories, already structured</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Key talking points:</strong> What not to forget under pressure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Quick-scan format:</strong> Designed for on-the-go review</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  !selectedResumeId || !jobDescription ? "opacity-50 cursor-not-allowed" : "hover:border-purple-300"
                }`}
                onClick={() => selectedResumeId && jobDescription && startPractice()}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    Practice Interview
                  </CardTitle>
                  <CardDescription>
                    Practice like it&apos;s the real thing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Live interview simulation:</strong> Real questions, real-time flow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Smart hints:</strong> Get nudged when you&apos;re stuck or off-track</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Instant feedback:</strong> Learn what worked and what didn&apos;t</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Final score & report:</strong> Strengths, gaps, and next steps</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Quick Guide Mode */}
        {mode === "guide" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setMode("select")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Selection
              </Button>
              {guide && (
                <Button variant="outline" onClick={downloadGuidePDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </div>

            {isGeneratingGuide ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                  <p className="text-lg font-medium">Generating your interview guide...</p>
                  <p className="text-sm text-gray-500">This may take up to 5 minutes</p>
                </div>
              </Card>
            ) : guide ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Interview Guide</CardTitle>
                  <CardDescription>
                    Personalized for {jobTitle} at {company}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={guideTab} onValueChange={setGuideTab}>
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="pitch">Elevator Pitch</TabsTrigger>
                      <TabsTrigger value="star">STAR Stories</TabsTrigger>
                      <TabsTrigger value="points">Talking Points</TabsTrigger>
                      <TabsTrigger value="qa">Q&A</TabsTrigger>
                      <TabsTrigger value="ask">Questions to Ask</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pitch" className="mt-6">
                      <div className="bg-blue-50 rounded-lg p-6">
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <Mic className="w-5 h-5 text-blue-600" />
                          Your 30-Second Introduction
                        </h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {guide.elevatorPitch}
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="star" className="mt-6">
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-6">
                          {guide.starStories.map((story, index) => (
                            <Card key={index} className="bg-gray-50">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">{story.title}</CardTitle>
                                <div className="flex gap-2">
                                  {story.relevantFor.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3 text-sm">
                                <div>
                                  <span className="font-semibold text-blue-600">Situation:</span>
                                  <p className="text-gray-700">{story.situation}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-green-600">Task:</span>
                                  <p className="text-gray-700">{story.task}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-orange-600">Action:</span>
                                  <p className="text-gray-700">{story.action}</p>
                                </div>
                                <div>
                                  <span className="font-semibold text-purple-600">Result:</span>
                                  <p className="text-gray-700">{story.result}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="points" className="mt-6">
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-4">
                          {guide.talkingPoints.map((point, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-600" />
                                {point.point}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{point.explanation}</p>
                              <p className="text-sm text-blue-600 mt-2 italic">
                                💡 {point.howToMention}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="qa" className="mt-6">
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-6">
                          {guide.expectedQuestions.map((qa, index) => (
                            <Card key={index}>
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <CardTitle className="text-base">{qa.question}</CardTitle>
                                  <Badge className={getCategoryColor(qa.category)}>
                                    {qa.category}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div>
                                  <h5 className="font-semibold text-sm text-green-700 mb-1">Best Answer:</h5>
                                  <p className="text-sm text-gray-700 bg-green-50 p-3 rounded">
                                    {qa.bestAnswer}
                                  </p>
                                </div>
                                <div>
                                  <h5 className="font-semibold text-sm text-blue-700 mb-1">Tips:</h5>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {qa.tips.map((tip, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                        {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="ask" className="mt-6">
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-4">
                          {guide.questionsToAsk.map((q, index) => (
                            <div key={index} className="p-4 bg-purple-50 rounded-lg">
                              <h4 className="font-semibold text-purple-800">&quot;{q.question}&quot;</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Purpose:</strong> {q.purpose}
                              </p>
                              <p className="text-sm text-purple-600 mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {q.whenToAsk}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}

        {/* Practice Interview Mode */}
        {mode === "practice" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setMode("select")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Selection
              </Button>
              {questions.length > 0 && !practiceComplete && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-32" />
                </div>
              )}
            </div>

            {isGeneratingQuestions ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                  <p className="text-lg font-medium">Preparing your interview questions...</p>
                  <p className="text-sm text-gray-500">Analyzing job requirements and your experience</p>
                </div>
              </Card>
            ) : practiceComplete ? (
              /* Final Report */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    Interview Practice Complete!
                  </CardTitle>
                  <CardDescription>Here&apos;s your performance summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Score */}
                  <div className="flex items-center justify-center py-8">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - calculateFinalScore() / 100)}`}
                          strokeLinecap="round"
                          className={
                            calculateFinalScore() >= 80 ? "text-green-500" :
                            calculateFinalScore() >= 60 ? "text-yellow-500" :
                            calculateFinalScore() >= 40 ? "text-orange-500" :
                            "text-red-500"
                          }
                        />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${getScoreColor(calculateFinalScore() / 10)}`}>
                        {calculateFinalScore()}%
                      </span>
                    </div>
                  </div>

                  {/* Question-by-question breakdown */}
                  <div>
                    <h3 className="font-semibold mb-4">Detailed Breakdown</h3>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {practiceResults.map((result, index) => (
                          <Card key={index} className="bg-gray-50">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Q{index + 1}: {result.question}</CardTitle>
                                <Badge className={getScoreColor(result.evaluation.score)}>
                                  {result.evaluation.score}/10
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              <div>
                                <p className="font-medium text-gray-700">Your Answer:</p>
                                <p className="text-gray-600 bg-white p-2 rounded">{result.userAnswer}</p>
                              </div>
                              <div>
                                <p className="font-medium text-green-700">Best Answer:</p>
                                <p className="text-gray-600 bg-green-50 p-2 rounded">{result.bestAnswer}</p>
                              </div>
                              <p className="text-gray-700 italic">{result.evaluation.feedback}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={() => startPractice()} className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Practice Again
                    </Button>
                    <Button variant="outline" onClick={() => setMode("select")} className="flex-1">
                      Back to Menu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : questions.length > 0 ? (
              /* Active Question */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Question Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(questions[currentQuestionIndex].category)}>
                          {questions[currentQuestionIndex].category}
                        </Badge>
                        <Badge className={getDifficultyColor(questions[currentQuestionIndex].difficulty)}>
                          {questions[currentQuestionIndex].difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {Math.floor(questions[currentQuestionIndex].timeLimit / 60)}:{String(questions[currentQuestionIndex].timeLimit % 60).padStart(2, "0")}
                      </div>
                    </div>
                    <CardTitle className="text-xl mt-4">
                      {questions[currentQuestionIndex].question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Your Answer</Label>
                        <Textarea
                          placeholder="Type your answer here..."
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="mt-1 min-h-[200px]"
                          disabled={!!currentEvaluation}
                        />
                      </div>

                      {!currentEvaluation ? (
                        <Button
                          onClick={submitAnswer}
                          disabled={!userAnswer.trim() || isEvaluating}
                          className="w-full"
                        >
                          {isEvaluating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Evaluating...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Submit Answer
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button onClick={nextQuestion} className="w-full">
                          {currentQuestionIndex < questions.length - 1 ? (
                            <>
                              Next Question
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </>
                          ) : (
                            <>
                              <Trophy className="w-4 h-4 mr-2" />
                              See Final Results
                            </>
                          )}
                        </Button>
                      )}

                      {/* Tips */}
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm text-yellow-800 flex items-center gap-1">
                          <Lightbulb className="w-4 h-4" />
                          Tips for this question:
                        </h4>
                        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                          {questions[currentQuestionIndex].tips.map((tip, i) => (
                            <li key={i}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Evaluation Card */}
                <Card className={currentEvaluation ? "" : "opacity-50"}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentEvaluation ? (
                      <div className="space-y-4">
                        {/* Score */}
                        <div className="flex items-center justify-center">
                          <div className={`text-5xl font-bold ${getScoreColor(currentEvaluation.score)}`}>
                            {currentEvaluation.score}/10
                          </div>
                        </div>

                        {/* Feedback */}
                        <p className="text-gray-700">{currentEvaluation.feedback}</p>

                        <Separator />

                        {/* Strengths */}
                        {currentEvaluation.strengths.length > 0 && (
                          <div>
                            <h4 className="font-medium text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Strengths
                            </h4>
                            <ul className="text-sm text-gray-600 mt-1 space-y-1">
                              {currentEvaluation.strengths.map((s, i) => (
                                <li key={i}>• {s}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Improvements */}
                        {currentEvaluation.improvements.length > 0 && (
                          <div>
                            <h4 className="font-medium text-orange-700 flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              Areas to Improve
                            </h4>
                            <ul className="text-sm text-gray-600 mt-1 space-y-1">
                              {currentEvaluation.improvements.map((s, i) => (
                                <li key={i}>• {s}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Missing Points */}
                        {currentEvaluation.missingPoints.length > 0 && (
                          <div>
                            <h4 className="font-medium text-red-700 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              Missing Points
                            </h4>
                            <ul className="text-sm text-gray-600 mt-1 space-y-1">
                              {currentEvaluation.missingPoints.map((s, i) => (
                                <li key={i}>• {s}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Separator />

                        {/* Best Answer Toggle */}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowBestAnswer(!showBestAnswer)}
                        >
                          {showBestAnswer ? "Hide" : "Show"} Best Answer
                        </Button>

                        {showBestAnswer && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-medium text-green-800 mb-2">Best Answer:</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {questions[currentQuestionIndex].bestAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <MessageSquare className="w-12 h-12 mb-2" />
                        <p>Submit your answer to get feedback</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

export default function InterviewPrepPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <InterviewPrepContent />
    </Suspense>
  );
}
