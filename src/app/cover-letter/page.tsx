"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getResumes,
  getCoverLetterById,
  createCoverLetter,
  updateCoverLetter,
  SavedResume,
  SavedCoverLetter,
} from "@/lib/store/documentStore";
import { ArrowLeft, Sparkles, FileText, Download, Save, Loader2, AlertCircle } from "lucide-react";
import { ProfessionalCoverLetter } from "@/components/templates/cover-letter";

interface CoverLetterData {
  recipientName: string;
  recipientTitle: string;
  companyName: string;
  companyAddress: string;
  date: string;
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  senderName: string;
  senderTitle: string;
}

const defaultCoverLetter: CoverLetterData = {
  recipientName: "",
  recipientTitle: "Hiring Manager",
  companyName: "",
  companyAddress: "",
  date: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  subject: "",
  greeting: "Dear Hiring Manager,",
  body: "",
  closing: "Sincerely,",
  senderName: "",
  senderTitle: "",
};

function CoverLetterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("id");

  const [coverLetter, setCoverLetter] = useState<CoverLetterData>(defaultCoverLetter);
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingJob, setIsFetchingJob] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<SavedCoverLetter | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [jobDetails, setJobDetails] = useState<{
    title?: string;
    company?: string;
    description?: string;
    location?: string;
    logoUrl?: string;
    backgroundUrl?: string;
  } | null>(null);

  // Load resumes
  useEffect(() => {
    const savedResumes = getResumes();
    setResumes(savedResumes);
    if (savedResumes.length === 1) {
      setSelectedResumeId(savedResumes[0].id);
    }
  }, []);

  // Load existing cover letter if editing
  useEffect(() => {
    if (documentId) {
      const saved = getCoverLetterById(documentId);
      if (saved) {
        setCoverLetter(saved.coverLetterData);
        setCurrentDocument(saved);
      }
    }
  }, [documentId]);

  // Load cover letter data transferred from Find Jobs page
  useEffect(() => {
    const fromFindJobs = searchParams.get("fromFindJobs");
    if (fromFindJobs === "true") {
      const transferData = localStorage.getItem("coverLetterTransfer");
      if (transferData) {
        try {
          const data = JSON.parse(transferData);
          setCoverLetter({
            body: data.body || "",
            recipientName: data.recipientName || "Hiring Manager",
            recipientTitle: data.recipientTitle || "",
            companyName: data.companyName || "",
            greeting: data.greeting || "Dear Hiring Manager,",
            closing: data.closing || "Sincerely,",
            senderName: data.senderName || "",
            senderTitle: data.senderTitle || "",
          });
          if (data.jobDetails) {
            setJobDetails(data.jobDetails);
          }
          // Clear transfer data after loading
          localStorage.removeItem("coverLetterTransfer");
        } catch (e) {
          console.error("Failed to parse cover letter transfer data:", e);
        }
      }
    }
  }, [searchParams]);

  // Auto-fill sender info when resume is selected
  useEffect(() => {
    if (selectedResumeId && !documentId) {
      const selectedResume = resumes.find((r) => r.id === selectedResumeId);
      if (selectedResume?.resumeData?.basics) {
        const basics = selectedResume.resumeData.basics;
        setCoverLetter((prev) => ({
          ...prev,
          senderName: basics.name || prev.senderName,
          senderTitle: basics.label || prev.senderTitle,
        }));
      }
    }
  }, [selectedResumeId, resumes, documentId]);

  // Extract job ID from LinkedIn URL
  const extractJobId = (url: string): string | null => {
    const match = url.match(/jobs\/view\/(\d+)/);
    return match ? match[1] : null;
  };

  // Fetch job details from LinkedIn
  const fetchJobDetails = async () => {
    if (!jobUrl) return;

    setIsFetchingJob(true);
    setError(null);

    try {
      const jobId = extractJobId(jobUrl) || jobUrl;
      const response = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) throw new Error("Failed to fetch job details");

      const data = await response.json();
      setJobDetails({
        title: data.jobTitle,
        company: data.companyName,
        description: data.jobDescription,
        location: data.location,
        logoUrl: data.logoUrl,
        backgroundUrl: data.backgroundUrl,
      });
      setJobDescription(data.jobDescription || "");
    } catch (err) {
      setError("Failed to fetch job details. Please paste the job description manually.");
      console.error(err);
    } finally {
      setIsFetchingJob(false);
    }
  };

  // Generate cover letter with AI
  const generateCoverLetter = async () => {
    if (!selectedResumeId) {
      setError("Please select a resume first");
      return;
    }

    if (!jobDescription && !jobDetails?.description) {
      setError("Please provide job details or description");
      return;
    }

    const selectedResume = resumes.find((r) => r.id === selectedResumeId);
    if (!selectedResume) {
      setError("Selected resume not found");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDetails: jobDetails || {
            description: jobDescription,
          },
          resumeData: selectedResume.resumeData,
          language: "en",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate cover letter");

      const data = await response.json();
      if (data.coverLetter) {
        setCoverLetter((prev) => ({
          ...data.coverLetter,
          senderName: prev.senderName || data.coverLetter.senderName,
          senderTitle: prev.senderTitle || data.coverLetter.senderTitle,
        }));
      }
    } catch (err) {
      setError("Failed to generate cover letter. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle save
  const handleSave = useCallback(
    (name: string) => {
      setIsSaving(true);
      try {
        if (currentDocument) {
          const updated = updateCoverLetter(currentDocument.id, {
            name,
            coverLetterData: coverLetter,
          });
          if (updated) {
            setCurrentDocument(updated);
          }
        } else {
          const newDoc = createCoverLetter(name, coverLetter, "professional");
          setCurrentDocument(newDoc);
          router.push(`/cover-letter?id=${newDoc.id}`, { scroll: false });
        }
        setIsSaveModalOpen(false);
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [currentDocument, coverLetter, router]
  );

  const handleSaveClick = () => {
    if (currentDocument) {
      handleSave(currentDocument.name);
    } else {
      setSaveName(jobDetails?.title ? `Cover Letter - ${jobDetails.title}` : "My Cover Letter");
      setIsSaveModalOpen(true);
    }
  };

  // Handle PDF export
  const handleDownloadPDF = useCallback(async () => {
    if (!previewRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const element = previewRef.current;
      const html = element.outerHTML;

      // Collect styles
      const styles = Array.from(document.styleSheets)
        .map((sheet) => {
          try {
            return Array.from(sheet.cssRules)
              .map((rule) => rule.cssText)
              .join("\n");
          } catch {
            return "";
          }
        })
        .join("\n");

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagesData: [{ html, pageIndex: 0 }],
          styles,
          filename: `${coverLetter.senderName || "Cover_Letter"}.pdf`,
          totalPages: 1,
          backgroundColor: "#ffffff",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${coverLetter.senderName?.replace(/\s+/g, "_") || "Cover_Letter"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      setError("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }, [coverLetter.senderName, isExporting]);

  // No resumes - show message
  if (resumes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle>No Resume Found</CardTitle>
            <CardDescription>
              You need to create and save a resume first before generating a cover letter.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => router.push("/resume")} className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Create Resume
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 line-clamp-1">
                {currentDocument?.name || "Create Cover Letter"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Generate a personalized cover letter using AI
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveClick} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <Save className="w-4 h-4 sm:mr-2" />}
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button 
              size="sm"
              onClick={handleDownloadPDF} 
              disabled={!coverLetter.body || isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Download PDF"}</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
          {/* Left Panel - Input & Edit */}
          <div className="w-full lg:flex-1 lg:min-w-[350px] space-y-4 lg:space-y-6 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto">
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

            {/* Job Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Job Details</CardTitle>
                <Button
                  onClick={generateCoverLetter}
                  disabled={isGenerating || !selectedResumeId || (!jobDescription && !jobDetails)}
                  className="w-full mt-3"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">LinkedIn Job URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="https://www.linkedin.com/jobs/view/..."
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                    />
                  <Button
                    onClick={fetchJobDetails}
                    disabled={!jobUrl || isFetchingJob}
                    variant="secondary"
                  >
                    {isFetchingJob ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Fetch"
                    )}
                  </Button>
                  </div>
                </div>

                {jobDetails && (
                  <div className="overflow-hidden rounded-lg border border-green-200">
                    {jobDetails.backgroundUrl && (
                      <div 
                        className="h-16 bg-cover bg-center"
                        style={{ backgroundImage: `url(${jobDetails.backgroundUrl})` }}
                      />
                    )}
                    <div className="p-4 bg-green-50 flex items-start gap-3">
                      {jobDetails.logoUrl && (
                        <img 
                          src={jobDetails.logoUrl} 
                          alt={jobDetails.company || "Company"} 
                          className="w-12 h-12 rounded object-contain bg-white border"
                        />
                      )}
                      <div>
                        <p className="font-medium text-green-800">{jobDetails.title}</p>
                        <p className="text-sm text-green-700">{jobDetails.company}</p>
                        {jobDetails.location && (
                          <p className="text-sm text-green-600">{jobDetails.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or paste manually</span>
                  </div>
                </div>

                <div>
                  <Label>Job Description</Label>
                  <Textarea
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    className="mt-2"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Panel - Edit */}
          <div className="w-full lg:flex-1 lg:min-w-[320px]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Edit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Recipient</Label>
                    <Input
                      value={coverLetter.recipientName}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const greeting = newName.trim() 
                          ? `Dear ${newName},` 
                          : "Dear Hiring Manager,";
                        setCoverLetter({ 
                          ...coverLetter, 
                          recipientName: newName,
                          greeting 
                        });
                      }}
                      placeholder="Hiring Manager"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={coverLetter.companyName}
                      onChange={(e) =>
                        setCoverLetter({ ...coverLetter, companyName: e.target.value })
                      }
                      placeholder="Company Inc."
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Subject</Label>
                  <Input
                    value={coverLetter.subject}
                    onChange={(e) =>
                      setCoverLetter({ ...coverLetter, subject: e.target.value })
                    }
                    placeholder="Application for Position"
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Body</Label>
                  <Textarea
                    value={coverLetter.body}
                    onChange={(e) =>
                      setCoverLetter({ ...coverLetter, body: e.target.value })
                    }
                    placeholder="Your cover letter content..."
                    rows={8}
                    className="mt-1 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Your Name</Label>
                    <Input
                      value={coverLetter.senderName}
                      onChange={(e) =>
                        setCoverLetter({ ...coverLetter, senderName: e.target.value })
                      }
                      placeholder="John Doe"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Your Title</Label>
                    <Input
                      value={coverLetter.senderTitle}
                      onChange={(e) =>
                        setCoverLetter({ ...coverLetter, senderTitle: e.target.value })
                      }
                      placeholder="Software Engineer"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview (hidden on mobile) */}
          <div className="hidden xl:block shrink-0">
            <div 
              className="origin-top-left"
              style={{ 
                transform: "scale(0.85)", 
                transformOrigin: "top left"
              }}
            >
              <div ref={previewRef}>
                <ProfessionalCoverLetter data={coverLetter} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Cover Letter</DialogTitle>
            <DialogDescription>
              Give your cover letter a name to save it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cover-letter-name">Name</Label>
            <Input
              id="cover-letter-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter a name"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && saveName.trim()) {
                  handleSave(saveName.trim());
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSave(saveName.trim())} disabled={!saveName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CoverLetterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    }>
      <CoverLetterPageContent />
    </Suspense>
  );
}
