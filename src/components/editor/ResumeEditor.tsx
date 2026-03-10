"use client";

import { Resume, SectionType, defaultSectionOrder } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import SectionOrderManager from "./SectionOrderManager";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import TemplateSelector from "./TemplateSelector";
import { DateRangeWithCurrent, MonthYearPicker } from "@/components/ui/month-year-picker";
import { PhotoPositionModal } from "./PhotoPositionModal";
import ATSOptimizeButtons from "./ATSOptimizeButtons";
import ATSScorePanel from "./ATSScorePanel";
import ProfessionATSPanel from "./ProfessionATSPanel";
import ResumeScanPreview from "./ResumeScanPreview";
import FeedbackModal from "@/components/ui/FeedbackModal";
import { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Pencil, Check, FileText, Search, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdditionalSection =
  | "languages"
  | "courses"
  | "activities"
  | "internships"
  | "hobbies"
  | "references"
  | "awards"
  | "volunteering"
  | "certifications"
  | "projects"
  | "publications"
  | "strengths"
  | "philosophy"
  | "books"
  | "digitalPortfolio"
  | "socialLinks"
  | "industryExpertise"
  | "custom";

interface HeatmapZone {
  id: string;
  name: string;
  section: string;
  attention: "high" | "medium" | "low" | "none";
  timeSpent: number;
}

interface ResumeEditorProps {
  resume: Resume;
  onResumeChange: (resume: Resume) => void;
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
  onHeatmapZoneChange?: (zone: HeatmapZone | null) => void;
  onDownloadPDF?: () => void;
  isExportingPDF?: boolean;
  documentId?: string | null;
  documentName?: string;
  documentUpdatedAt?: string;
  onSave?: (name: string) => void;
  onRename?: (newName: string) => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  autoSaveStatus?: "idle" | "saving" | "saved";
}

// Collapsible section types
type CollapsibleSection =
  | "personal"
  | "work"
  | "education"
  | "skills"
  | "techProficiencies"
  | AdditionalSection;

function combineWorkDescription(summary?: string, highlights?: string[]): string {
  const parts: string[] = [];
  if (summary) parts.push(summary);
  if (highlights && highlights.length > 0) {
    parts.push(highlights.map((h) => `• ${h}`).join("\n"));
  }
  return parts.join("\n\n");
}

export default function ResumeEditor({
  resume,
  onResumeChange,
  selectedTemplate,
  onSelectTemplate,
  onHeatmapZoneChange,
  onDownloadPDF,
  isExportingPDF,
  documentId,
  documentName,
  documentUpdatedAt,
  onSave,
  onRename,
  isSaving,
  hasUnsavedChanges,
  autoSaveStatus,
}: ResumeEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Using array to maintain insertion order
  const [activeSections, setActiveSections] = useState<AdditionalSection[]>([]);
  // Track collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<CollapsibleSection>>(new Set());
  // Photo position modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  // Delete confirmation modal state
  const [sectionToDelete, setSectionToDelete] = useState<AdditionalSection | null>(null);
  // ATS Score panel states
  const [isATSScoreExpanded, setIsATSScoreExpanded] = useState(false);
  const [isProfessionATSExpanded, setIsProfessionATSExpanded] = useState(false);
  const [isScanPreviewExpanded, setIsScanPreviewExpanded] = useState(false);
  // Save modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState(documentName || "");
  // Rename modal state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameName, setRenameName] = useState(documentName || "");

  // Drag state for main section cards
  const [draggedSection, setDraggedSection] = useState<SectionType | null>(null);
  const [dropTargetSection, setDropTargetSection] = useState<SectionType | null>(null);

  // Update saveName and renameName when documentName changes
  useEffect(() => {
    if (documentName) {
      setSaveName(documentName);
      setRenameName(documentName);
    }
  }, [documentName]);

  const handleSaveClick = () => {
    if (documentId && documentName) {
      // Already saved before, just update
      onSave?.(documentName);
    } else {
      // First time save, show modal
      setSaveName(resume.basics?.name ? `${resume.basics.name}'s Resume` : "My Resume");
      setIsSaveModalOpen(true);
    }
  };

  const handleSaveConfirm = () => {
    if (saveName.trim()) {
      onSave?.(saveName.trim());
      setIsSaveModalOpen(false);
    }
  };

  const handleRenameClick = () => {
    if (documentId && documentName) {
      setRenameName(documentName);
      setIsRenameModalOpen(true);
    }
  };

  const handleRenameConfirm = () => {
    if (renameName.trim() && onRename) {
      onRename(renameName.trim());
      setIsRenameModalOpen(false);
    }
  };

  const router = useRouter();

  // Auto-detect and activate sections based on resume data
  useEffect(() => {
    const sectionsToActivate: AdditionalSection[] = [];

    // Check each section for data
    if (resume.languages && resume.languages.length > 0 && resume.languages.some(l => l.language)) {
      sectionsToActivate.push("languages");
    }
    if (resume.courses && resume.courses.length > 0 && resume.courses.some(c => c.name)) {
      sectionsToActivate.push("courses");
    }
    if (resume.activities && resume.activities.length > 0 && resume.activities.some(a => a.name)) {
      sectionsToActivate.push("activities");
    }
    if (resume.internships && resume.internships.length > 0 && resume.internships.some(i => i.company)) {
      sectionsToActivate.push("internships");
    }
    if (resume.hobbies && resume.hobbies.length > 0 && resume.hobbies.some(h => h.name)) {
      sectionsToActivate.push("hobbies");
    }
    if (resume.references && resume.references.length > 0 && resume.references.some(r => r.name)) {
      sectionsToActivate.push("references");
    }
    if (resume.awards && resume.awards.length > 0 && resume.awards.some(a => a.title)) {
      sectionsToActivate.push("awards");
    }
    if (resume.volunteer && resume.volunteer.length > 0 && resume.volunteer.some(v => v.organization)) {
      sectionsToActivate.push("volunteering");
    }
    if (resume.certificates && resume.certificates.length > 0 && resume.certificates.some(c => c.name)) {
      sectionsToActivate.push("certifications");
    }
    if (resume.projects && resume.projects.length > 0 && resume.projects.some(p => p.name)) {
      sectionsToActivate.push("projects");
    }
    if (resume.publications && resume.publications.length > 0 && resume.publications.some(p => p.name)) {
      sectionsToActivate.push("publications");
    }
    if (resume.strengths && resume.strengths.length > 0 && resume.strengths.some(s => s.name)) {
      sectionsToActivate.push("strengths");
    }
    if (resume.philosophy && resume.philosophy.quote) {
      sectionsToActivate.push("philosophy");
    }
    if (resume.books && resume.books.length > 0 && resume.books.some(b => b.title)) {
      sectionsToActivate.push("books");
    }
    if (resume.digitalPortfolio && resume.digitalPortfolio.length > 0 && resume.digitalPortfolio.some(d => d.platform || d.url)) {
      sectionsToActivate.push("digitalPortfolio");
    }
    if (resume.socialLinks && resume.socialLinks.length > 0 && resume.socialLinks.some(l => l.network)) {
      sectionsToActivate.push("socialLinks");
    }
    if (resume.industryExpertise && resume.industryExpertise.length > 0 && resume.industryExpertise.some(e => e.name)) {
      sectionsToActivate.push("industryExpertise");
    }
    if (resume.customSections && resume.customSections.length > 0 && resume.customSections.some(s => s.title)) {
      sectionsToActivate.push("custom");
    }

    // Only update if there are sections to add that aren't already active
    setActiveSections(prev => {
      const newSections = sectionsToActivate.filter(s => !prev.includes(s));
      if (newSections.length > 0) {
        return [...prev, ...newSections];
      }
      return prev;
    });
  }, [resume]);

  // Helper to get active sections for the section order manager
  const getActiveSectionsForOrder = (): SectionType[] => {
    const sections: SectionType[] = [];
    if (resume.basics?.summary) sections.push("summary");
    if (resume.work && resume.work.length > 0) sections.push("experience");
    if (resume.internships && resume.internships.length > 0) sections.push("internships");
    if (resume.activities && resume.activities.length > 0) sections.push("activities");
    if (resume.education && resume.education.length > 0) sections.push("education");
    if (resume.awards && resume.awards.length > 0) sections.push("awards");
    if (resume.skills && resume.skills.length > 0) sections.push("skills");
    if (resume.languages && resume.languages.length > 0) sections.push("languages");
    if (resume.courses && resume.courses.length > 0) sections.push("courses");
    if (resume.hobbies && resume.hobbies.length > 0) sections.push("hobbies");
    if (resume.references && resume.references.length > 0) sections.push("references");
    if (resume.publications && resume.publications.length > 0) sections.push("publications");
    if (resume.projects && resume.projects.length > 0) sections.push("projects");
    if (resume.certificates && resume.certificates.length > 0) sections.push("certifications");
    if (resume.volunteer && resume.volunteer.length > 0) sections.push("volunteering");
    if (resume.strengths && resume.strengths.length > 0) sections.push("strengths");
    if (resume.industryExpertise && resume.industryExpertise.length > 0) sections.push("industryExpertise");
    if (resume.philosophy?.quote) sections.push("philosophy");
    if (resume.books && resume.books.length > 0) sections.push("books");
    if (resume.digitalPortfolio && resume.digitalPortfolio.length > 0) sections.push("digitalPortfolio");
    if (resume.socialLinks && resume.socialLinks.length > 0) sections.push("socialLinks");
    if (resume.customSections && resume.customSections.length > 0) sections.push("custom");
    return sections;
  };

  // Handle section order change from drag-drop
  const handleSectionOrderChange = (newOrder: SectionType[]) => {
    onResumeChange({
      ...resume,
      sectionOrder: newOrder,
    });
  };

  // Get current section order (auto-merge new sections that don't exist in saved order)
  const currentSectionOrder = useMemo(() => {
    const order = resume.sectionOrder || defaultSectionOrder;
    const missing = defaultSectionOrder.filter((s) => !order.includes(s));
    return missing.length > 0 ? [...order, ...missing] : order;
  }, [resume.sectionOrder]);

  // Drag handlers for main section cards
  const handleCardDragStart = (section: SectionType) => {
    setDraggedSection(section);
  };

  const handleCardDragEnd = () => {
    if (draggedSection && dropTargetSection && draggedSection !== dropTargetSection) {
      const newOrder = [...currentSectionOrder];
      const draggedIndex = newOrder.indexOf(draggedSection);
      const targetIndex = newOrder.indexOf(dropTargetSection);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedSection);
        handleSectionOrderChange(newOrder);
      }
    }
    setDraggedSection(null);
    setDropTargetSection(null);
  };

  const handleCardDragOver = (e: React.DragEvent, section: SectionType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedSection && draggedSection !== section) {
      setDropTargetSection(section);
    }
  };

  const handleCardDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Helper to create drag props for section cards
  const getDragProps = (section: SectionType) => ({
    draggable: true,
    onDragStart: () => handleCardDragStart(section),
    onDragEnd: handleCardDragEnd,
    onDragOver: (e: React.DragEvent) => handleCardDragOver(e, section),
    onDrop: handleCardDrop,
    className: `transition-all duration-200 ${
      draggedSection === section ? "opacity-50 scale-[0.98]" : ""
    } ${dropTargetSection === section && draggedSection !== section ? "ring-2 ring-blue-500 ring-offset-2 rounded-xl" : ""}`,
  });

  const sectionNames: Record<AdditionalSection, string> = {
    languages: "Languages",
    courses: "Courses",
    activities: "Extra-curricular Activities",
    internships: "Internships",
    hobbies: "Hobbies",
    references: "References",
    awards: "Awards",
    volunteering: "Volunteering",
    certifications: "Certifications",
    projects: "Projects",
    publications: "Publications",
    strengths: "Strengths",
    philosophy: "My Life Philosophy",
    books: "Books",
    digitalPortfolio: "Digital Portfolio",
    socialLinks: "Find Me Online",
    industryExpertise: "Industry Expertise",
    custom: "Custom Section",
  };

  const confirmDeleteSection = () => {
    if (sectionToDelete) {
      setActiveSections((prev) => prev.filter((s) => s !== sectionToDelete));

      // Also clear the data from resume
      const updatedResume = { ...resume };
      switch (sectionToDelete) {
        case "languages":
          updatedResume.languages = [];
          break;
        case "courses":
          updatedResume.courses = [];
          break;
        case "activities":
          updatedResume.activities = [];
          break;
        case "internships":
          updatedResume.internships = [];
          break;
        case "hobbies":
          updatedResume.hobbies = [];
          break;
        case "references":
          updatedResume.references = [];
          break;
        case "awards":
          updatedResume.awards = [];
          break;
        case "volunteering":
          updatedResume.volunteer = [];
          break;
        case "certifications":
          updatedResume.certificates = [];
          break;
        case "projects":
          updatedResume.projects = [];
          break;
        case "publications":
          updatedResume.publications = [];
          break;
        case "strengths":
          updatedResume.strengths = [];
          break;
        case "philosophy":
          updatedResume.philosophy = undefined;
          break;
        case "books":
          updatedResume.books = [];
          break;
        case "digitalPortfolio":
          updatedResume.digitalPortfolio = [];
          break;
        case "socialLinks":
          updatedResume.socialLinks = [];
          break;
        case "industryExpertise":
          updatedResume.industryExpertise = [];
          break;
        case "custom":
          updatedResume.customSections = [];
          break;
      }
      onResumeChange(updatedResume);

      setSectionToDelete(null);
    }
  };

  const toggleSection = (section: AdditionalSection) => {
    setActiveSections((prev) => {
      if (prev.includes(section)) {
        return prev.filter((s) => s !== section);
      } else {
        return [...prev, section];
      }
    });
  };

  const isSectionActive = (section: AdditionalSection) => activeSections.includes(section);

  // Toggle collapse state
  const toggleCollapse = (section: CollapsibleSection) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const isCollapsed = (section: CollapsibleSection) => collapsedSections.has(section);

  // Collapse button component (no onClick - parent CardHeader handles it)
  const CollapseButton = ({ section }: { section: CollapsibleSection }) => (
    <div
      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
      title={isCollapsed(section) ? "Expand" : "Collapse"}
    >
      <svg
        className={`w-5 h-5 transition-transform duration-200 ${isCollapsed(section) ? "-rotate-90" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  // Helper to render a section by name (for ordered rendering)
  const renderSection = (section: AdditionalSection) => {
    switch (section) {
      case "languages":
        return renderLanguagesSection();
      case "courses":
        return renderCoursesSection();
      case "projects":
        return renderProjectsSection();
      case "certifications":
        return renderCertificationsSection();
      case "awards":
        return renderAwardsSection();
      case "references":
        return renderReferencesSection();
      case "volunteering":
        return renderVolunteeringSection();
      case "hobbies":
        return renderHobbiesSection();
      case "internships":
        return renderInternshipsSection();
      case "activities":
        return renderActivitiesSection();
      case "publications":
        return renderPublicationsSection();
      case "strengths":
        return renderStrengthsSection();
      case "philosophy":
        return renderPhilosophySection();
      case "books":
        return renderBooksSection();
      case "digitalPortfolio":
        return renderDigitalPortfolioSection();
      case "socialLinks":
        return renderSocialLinksSection();
      case "industryExpertise":
        return renderIndustryExpertiseSection();
      case "custom":
        return renderCustomSection();
      default:
        return null;
    }
  };

  const updateBasics = (field: string, value: string) => {
    onResumeChange({
      ...resume,
      basics: {
        ...resume.basics,
        [field]: value,
      },
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBasics("image", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    updateBasics("image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateLocation = (field: string, value: string) => {
    onResumeChange({
      ...resume,
      basics: {
        ...resume.basics,
        location: {
          ...resume.basics?.location,
          [field]: value,
        },
      },
    });
  };

  const handleDownloadPDF = () => {
    if (onDownloadPDF) {
      onDownloadPDF();
    } else {
      window.print();
    }
  };

  // Section render functions for ordered rendering
  const renderLanguagesSection = () => (
    <Card key="languages">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("languages")}>
          <CollapseButton section="languages" />
          <CardTitle className="text-lg">Languages</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("languages")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </CardHeader>
      {!isCollapsed("languages") && <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {resume.languages?.map((lang, index) => {
            const fluencyLevels: Record<string, number> = { "Native": 5, "Fluent": 5, "Proficient": 5, "Advanced": 4, "Intermediate": 3, "Basic": 2, "Beginner": 1 };
            const filledDots = fluencyLevels[lang.fluency || "Intermediate"] || 3;
            return (
              <div key={index} className="p-4 border rounded-lg bg-gray-50 relative group">
                <button onClick={() => { const newLangs = [...(resume.languages || [])]; newLangs.splice(index, 1); onResumeChange({ ...resume, languages: newLangs }); }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{lang.language || "(Not specified)"}</p>
                    <p className="text-sm text-gray-500">{lang.fluency || "Intermediate"}</p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <button key={dot} onClick={() => { const newLangs = [...(resume.languages || [])]; const fluencyNames = ["Beginner", "Basic", "Intermediate", "Advanced", "Native"]; newLangs[index] = { ...newLangs[index], fluency: fluencyNames[dot - 1] }; onResumeChange({ ...resume, languages: newLangs }); }}
                        className={`w-3 h-3 rounded-full transition-colors ${dot <= filledDots ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 hover:bg-blue-300"}`} />
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <Input value={lang.language || ""} onChange={(e) => { const newLangs = [...(resume.languages || [])]; newLangs[index] = { ...newLangs[index], language: e.target.value }; onResumeChange({ ...resume, languages: newLangs }); }} placeholder="e.g. English, Spanish" className="bg-white" />
                </div>
              </div>
            );
          })}
        </div>
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, languages: [...(resume.languages || []), { language: "", fluency: "Intermediate" }] }); }}>+ Add Language</Button>
      </CardContent>}
    </Card>
  );

  const renderCoursesSection = () => (
    <Card key="courses">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("courses")}>
          <CollapseButton section="courses" />
          <CardTitle className="text-lg">Courses</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("courses")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("courses") && <CardContent className="space-y-4">
        {resume.courses?.map((course, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{course.name || "(Not specified)"}</p>
              <button onClick={() => { const newCourses = [...(resume.courses || [])]; newCourses.splice(index, 1); onResumeChange({ ...resume, courses: newCourses }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Course</Label>
                <Input
                  value={course.name || ""}
                  onChange={(e) => {
                    const newCourses = [...(resume.courses || [])];
                    newCourses[index] = { ...newCourses[index], name: e.target.value };
                    onResumeChange({ ...resume, courses: newCourses });
                  }}
                  placeholder="e.g. Advanced React"
                  className="bg-slate-50 border-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Institution</Label>
                <Input
                  value={course.institution || ""}
                  onChange={(e) => {
                    const newCourses = [...(resume.courses || [])];
                    newCourses[index] = { ...newCourses[index], institution: e.target.value };
                    onResumeChange({ ...resume, courses: newCourses });
                  }}
                  placeholder="e.g. Coursera"
                  className="bg-slate-50 border-0"
                />
              </div>
            </div>
            <DateRangeWithCurrent
              startDate={course.startDate || ""}
              endDate={course.endDate || ""}
              isCurrent={course.isCurrent || false}
              onStartDateChange={(date) => {
                const newCourses = [...(resume.courses || [])];
                newCourses[index] = { ...newCourses[index], startDate: date };
                onResumeChange({ ...resume, courses: newCourses });
              }}
              onEndDateChange={(date) => {
                const newCourses = [...(resume.courses || [])];
                newCourses[index] = { ...newCourses[index], endDate: date };
                onResumeChange({ ...resume, courses: newCourses });
              }}
              onCurrentChange={(isCurrent) => {
                const newCourses = [...(resume.courses || [])];
                newCourses[index] = {
                  ...newCourses[index],
                  isCurrent,
                  endDate: isCurrent ? "Present" : newCourses[index].endDate
                };
                onResumeChange({ ...resume, courses: newCourses });
              }}
              currentLabel="Currently taking this course"
            />
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, courses: [...(resume.courses || []), { name: "", institution: "", startDate: "", endDate: "", isCurrent: false }] }); }}>+ Add Course</Button>
      </CardContent>}
    </Card>
  );

  const renderProjectsSection = () => (
    <Card key="projects">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("projects")}>
          <CollapseButton section="projects" />
          <CardTitle className="text-lg">Projects</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("projects")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("projects") && <CardContent className="space-y-4">
        {resume.projects?.map((project, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{project.name || "(Not specified)"}</p>
              <button onClick={() => { const newProjects = [...(resume.projects || [])]; newProjects.splice(index, 1); onResumeChange({ ...resume, projects: newProjects }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="space-y-2"><Label className="text-xs">Project Name</Label><Input value={project.name || ""} onChange={(e) => { const newProjects = [...(resume.projects || [])]; newProjects[index] = { ...newProjects[index], name: e.target.value }; onResumeChange({ ...resume, projects: newProjects }); }} placeholder="e.g. E-commerce Platform" /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Description</Label>
                <ATSOptimizeButtons
                  field="project"
                  fieldLabel={project.name || "Project"}
                  currentValue={project.description || ""}
                  context={{
                    name: resume.basics?.name,
                    currentTitle: resume.basics?.label,
                    skills: resume.skills?.flatMap(s => s.keywords || []),
                  }}
                  onApply={(newValue, suggestedSkills, suggestedLanguages) => {
                    const newProjects = [...(resume.projects || [])];
                    newProjects[index] = { ...newProjects[index], description: newValue };
                    let updatedResume = { ...resume, projects: newProjects };
                    if (suggestedSkills && suggestedSkills.length > 0) {
                      const allExisting = new Set([
                        ...(resume.skills?.map(s => s.name?.toLowerCase()) || []),
                        ...(resume.skills?.flatMap(s => s.keywords?.map(k => k.toLowerCase()) || []) || []),
                      ]);
                      const newSkills = suggestedSkills.filter(s => !allExisting.has(s.name.toLowerCase()));
                      if (newSkills.length > 0) {
                        updatedResume.skills = [...(resume.skills || []), ...newSkills.map(s => ({ name: s.name, level: s.level, keywords: [] }))];
                      }
                    }
                    if (suggestedLanguages && suggestedLanguages.length > 0) {
                      const existingLangNames = new Set(resume.languages?.map(l => l.language?.toLowerCase()) || []);
                      const newLangs = suggestedLanguages.filter(l => !existingLangNames.has(l.language.toLowerCase()));
                      if (newLangs.length > 0) {
                        updatedResume.languages = [...(resume.languages || []), ...newLangs];
                      }
                    }
                    onResumeChange(updatedResume);
                  }}
                />
              </div>
              <Textarea value={project.description || ""} onChange={(e) => { const newProjects = [...(resume.projects || [])]; newProjects[index] = { ...newProjects[index], description: e.target.value }; onResumeChange({ ...resume, projects: newProjects }); }} placeholder="Briefly describe the project" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Start Date</Label>
                <MonthYearPicker
                  value={project.startDate || ""}
                  onChange={(newDate) => { const newProjects = [...(resume.projects || [])]; newProjects[index] = { ...newProjects[index], startDate: newDate }; onResumeChange({ ...resume, projects: newProjects }); }}
                  placeholder="Start date"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">End Date</Label>
                <MonthYearPicker
                  value={project.endDate || ""}
                  onChange={(newDate) => { const newProjects = [...(resume.projects || [])]; newProjects[index] = { ...newProjects[index], endDate: newDate }; onResumeChange({ ...resume, projects: newProjects }); }}
                  placeholder="End date"
                />
              </div>
            </div>
            <div className="space-y-2"><Label className="text-xs">URL</Label><Input value={project.url || ""} onChange={(e) => { const newProjects = [...(resume.projects || [])]; newProjects[index] = { ...newProjects[index], url: e.target.value }; onResumeChange({ ...resume, projects: newProjects }); }} placeholder="e.g. https://myproject.com" /></div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, projects: [...(resume.projects || []), { name: "", description: "", url: "" }] }); }}>+ Add Project</Button>
      </CardContent>}
    </Card>
  );

  const renderCertificationsSection = () => (
    <Card key="certifications">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("certifications")}>
          <CollapseButton section="certifications" />
          <CardTitle className="text-lg">Certifications</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("certifications")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("certifications") && <CardContent className="space-y-4">
        {resume.certificates?.map((cert, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{cert.name || "(Not specified)"}</p>
              <button onClick={() => { const newCerts = [...(resume.certificates || [])]; newCerts.splice(index, 1); onResumeChange({ ...resume, certificates: newCerts }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Certificate Name</Label><Input value={cert.name || ""} onChange={(e) => { const newCerts = [...(resume.certificates || [])]; newCerts[index] = { ...newCerts[index], name: e.target.value }; onResumeChange({ ...resume, certificates: newCerts }); }} placeholder="e.g. AWS Certified" /></div>
              <div className="space-y-2"><Label className="text-xs">Issuer</Label><Input value={cert.issuer || ""} onChange={(e) => { const newCerts = [...(resume.certificates || [])]; newCerts[index] = { ...newCerts[index], issuer: e.target.value }; onResumeChange({ ...resume, certificates: newCerts }); }} placeholder="e.g. Amazon" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-xs">Start Date</Label>
              <MonthYearPicker
                value={cert.date || ""}
                onChange={(newDate) => {
                  const newCerts = [...(resume.certificates || [])];
                  newCerts[index] = { ...newCerts[index], date: newDate };
                  onResumeChange({ ...resume, certificates: newCerts });
                }}
                  placeholder="Start date"
              />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">End Date</Label>
                <MonthYearPicker
                  value={cert.endDate || ""}
                  onChange={(newDate) => {
                    const newCerts = [...(resume.certificates || [])];
                    newCerts[index] = { ...newCerts[index], endDate: newDate };
                    onResumeChange({ ...resume, certificates: newCerts });
                  }}
                  placeholder="End date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Description</Label>
                <ATSOptimizeButtons
                  field="certificate"
                  fieldLabel={cert.name || "Certificate"}
                  currentValue={cert.summary || ""}
                  context={{
                    name: resume.basics?.name,
                    currentTitle: resume.basics?.label,
                    skills: resume.skills?.flatMap(s => s.keywords || []),
                  }}
                  onApply={(newValue, suggestedSkills, suggestedLanguages) => {
                    const newCerts = [...(resume.certificates || [])];
                    newCerts[index] = { ...newCerts[index], summary: newValue };
                    let updatedResume = { ...resume, certificates: newCerts };
                    if (suggestedSkills && suggestedSkills.length > 0) {
                      const allExisting = new Set([
                        ...(resume.skills?.map(s => s.name?.toLowerCase()) || []),
                        ...(resume.skills?.flatMap(s => s.keywords?.map(k => k.toLowerCase()) || []) || []),
                      ]);
                      const newSkills = suggestedSkills.filter(s => !allExisting.has(s.name.toLowerCase()));
                      if (newSkills.length > 0) {
                        updatedResume.skills = [...(resume.skills || []), ...newSkills.map(s => ({ name: s.name, level: s.level, keywords: [] }))];
                      }
                    }
                    if (suggestedLanguages && suggestedLanguages.length > 0) {
                      const existingLangNames = new Set(resume.languages?.map(l => l.language?.toLowerCase()) || []);
                      const newLangs = suggestedLanguages.filter(l => !existingLangNames.has(l.language.toLowerCase()));
                      if (newLangs.length > 0) {
                        updatedResume.languages = [...(resume.languages || []), ...newLangs];
                      }
                    }
                    onResumeChange(updatedResume);
                  }}
                />
              </div>
              <Textarea
                value={cert.summary || ""}
                onChange={(e) => {
                  const newCerts = [...(resume.certificates || [])];
                  newCerts[index] = { ...newCerts[index], summary: e.target.value };
                  onResumeChange({ ...resume, certificates: newCerts });
                }}
                placeholder="Describe the skills validated by this certification..."
                rows={2}
              />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, certificates: [...(resume.certificates || []), { name: "", issuer: "", date: "", endDate: "", summary: "" }] }); }}>+ Add Certification</Button>
      </CardContent>}
    </Card>
  );

  const renderAwardsSection = () => (
    <Card key="awards">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("awards")}>
          <CollapseButton section="awards" />
          <CardTitle className="text-lg">Awards</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("awards")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("awards") && <CardContent className="space-y-4">
        {resume.awards?.map((award, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{award.title || "(Not specified)"}</p>
              <button onClick={() => { const newAwards = [...(resume.awards || [])]; newAwards.splice(index, 1); onResumeChange({ ...resume, awards: newAwards }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Award Title</Label><Input value={award.title || ""} onChange={(e) => { const newAwards = [...(resume.awards || [])]; newAwards[index] = { ...newAwards[index], title: e.target.value }; onResumeChange({ ...resume, awards: newAwards }); }} placeholder="e.g. Employee of Year" /></div>
              <div className="space-y-2"><Label className="text-xs">Awarder</Label><Input value={award.awarder || ""} onChange={(e) => { const newAwards = [...(resume.awards || [])]; newAwards[index] = { ...newAwards[index], awarder: e.target.value }; onResumeChange({ ...resume, awards: newAwards }); }} placeholder="e.g. Company" /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Date</Label>
              <MonthYearPicker
                value={award.date || ""}
                onChange={(newDate) => {
                  const newAwards = [...(resume.awards || [])];
                  newAwards[index] = { ...newAwards[index], date: newDate };
                  onResumeChange({ ...resume, awards: newAwards });
                }}
                placeholder="Select award date"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Description</Label>
                <ATSOptimizeButtons
                  field="award"
                  fieldLabel={award.title || "Award"}
                  currentValue={award.summary || ""}
                  context={{
                    name: resume.basics?.name,
                    currentTitle: resume.basics?.label,
                    skills: resume.skills?.flatMap(s => s.keywords || []),
                  }}
                  onApply={(newValue, suggestedSkills, suggestedLanguages) => {
                    const newAwards = [...(resume.awards || [])];
                    newAwards[index] = { ...newAwards[index], summary: newValue };
                    let updatedResume = { ...resume, awards: newAwards };
                    if (suggestedSkills && suggestedSkills.length > 0) {
                      const allExisting = new Set([
                        ...(resume.skills?.map(s => s.name?.toLowerCase()) || []),
                        ...(resume.skills?.flatMap(s => s.keywords?.map(k => k.toLowerCase()) || []) || []),
                      ]);
                      const newSkills = suggestedSkills.filter(s => !allExisting.has(s.name.toLowerCase()));
                      if (newSkills.length > 0) {
                        updatedResume.skills = [...(resume.skills || []), ...newSkills.map(s => ({ name: s.name, level: s.level, keywords: [] }))];
                      }
                    }
                    if (suggestedLanguages && suggestedLanguages.length > 0) {
                      const existingLangNames = new Set(resume.languages?.map(l => l.language?.toLowerCase()) || []);
                      const newLangs = suggestedLanguages.filter(l => !existingLangNames.has(l.language.toLowerCase()));
                      if (newLangs.length > 0) {
                        updatedResume.languages = [...(resume.languages || []), ...newLangs];
                      }
                    }
                    onResumeChange(updatedResume);
                  }}
                />
              </div>
              <Textarea
                value={award.summary || ""}
                onChange={(e) => {
                  const newAwards = [...(resume.awards || [])];
                  newAwards[index] = { ...newAwards[index], summary: e.target.value };
                  onResumeChange({ ...resume, awards: newAwards });
                }}
                placeholder="Describe the significance of this award..."
                rows={2}
              />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, awards: [...(resume.awards || []), { title: "", awarder: "", date: "", summary: "" }] }); }}>+ Add Award</Button>
      </CardContent>}
    </Card>
  );

  const renderReferencesSection = () => (
    <Card key="references">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("references")}>
          <CollapseButton section="references" />
          <CardTitle className="text-lg">References</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("references")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("references") && <CardContent className="space-y-4">
        {resume.references?.map((ref, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{ref.name || "(Not specified)"}</p>
              <button onClick={() => { const newRefs = [...(resume.references || [])]; newRefs.splice(index, 1); onResumeChange({ ...resume, references: newRefs }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="space-y-2"><Label className="text-xs">Name</Label><Input value={ref.name || ""} onChange={(e) => { const newRefs = [...(resume.references || [])]; newRefs[index] = { ...newRefs[index], name: e.target.value }; onResumeChange({ ...resume, references: newRefs }); }} placeholder="e.g. John Smith" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Job Title</Label><Input value={ref.role || ""} onChange={(e) => { const newRefs = [...(resume.references || [])]; newRefs[index] = { ...newRefs[index], role: e.target.value }; onResumeChange({ ...resume, references: newRefs }); }} placeholder="e.g. Engineering Manager" /></div>
              <div className="space-y-2"><Label className="text-xs">Company</Label><Input value={ref.company || ""} onChange={(e) => { const newRefs = [...(resume.references || [])]; newRefs[index] = { ...newRefs[index], company: e.target.value }; onResumeChange({ ...resume, references: newRefs }); }} placeholder="e.g. Google" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Email</Label><Input value={ref.email || ""} onChange={(e) => { const newRefs = [...(resume.references || [])]; newRefs[index] = { ...newRefs[index], email: e.target.value }; onResumeChange({ ...resume, references: newRefs }); }} placeholder="e.g. john@company.com" /></div>
              <div className="space-y-2"><Label className="text-xs">Phone</Label><Input value={ref.phone || ""} onChange={(e) => { const newRefs = [...(resume.references || [])]; newRefs[index] = { ...newRefs[index], phone: e.target.value }; onResumeChange({ ...resume, references: newRefs }); }} placeholder="e.g. +1 (555) 123-4567" /></div>
            </div>
            <div className="space-y-2"><Label className="text-xs">Reference Details</Label><Textarea value={ref.reference || ""} onChange={(e) => { const newRefs = [...(resume.references || [])]; newRefs[index] = { ...newRefs[index], reference: e.target.value }; onResumeChange({ ...resume, references: newRefs }); }} placeholder="Contact info or 'Available upon request'" rows={2} /></div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, references: [...(resume.references || []), { name: "", role: "", company: "", email: "", phone: "", reference: "" }] }); }}>+ Add Reference</Button>
      </CardContent>}
    </Card>
  );

  const renderVolunteeringSection = () => (
    <Card key="volunteering">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("volunteering")}>
          <CollapseButton section="volunteering" />
          <CardTitle className="text-lg">Volunteering</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("volunteering")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("volunteering") && <CardContent className="space-y-4">
        {resume.volunteer?.map((vol, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{vol.organization || "(Not specified)"}</p>
              <button onClick={() => { const newVols = [...(resume.volunteer || [])]; newVols.splice(index, 1); onResumeChange({ ...resume, volunteer: newVols }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Organization</Label><Input value={vol.organization || ""} onChange={(e) => { const newVols = [...(resume.volunteer || [])]; newVols[index] = { ...newVols[index], organization: e.target.value }; onResumeChange({ ...resume, volunteer: newVols }); }} placeholder="e.g. Red Cross" /></div>
              <div className="space-y-2"><Label className="text-xs">Position</Label><Input value={vol.position || ""} onChange={(e) => { const newVols = [...(resume.volunteer || [])]; newVols[index] = { ...newVols[index], position: e.target.value }; onResumeChange({ ...resume, volunteer: newVols }); }} placeholder="e.g. Volunteer" /></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Summary</Label>
                <ATSOptimizeButtons
                  field="volunteer"
                  fieldLabel={vol.organization || "Volunteer Experience"}
                  currentValue={vol.summary || ""}
                  context={{
                    name: resume.basics?.name,
                    currentTitle: resume.basics?.label,
                    skills: resume.skills?.flatMap(s => s.keywords || []),
                  }}
                  onApply={(newValue, suggestedSkills, suggestedLanguages) => {
                    const newVols = [...(resume.volunteer || [])];
                    newVols[index] = { ...newVols[index], summary: newValue };
                    let updatedResume = { ...resume, volunteer: newVols };
                    if (suggestedSkills && suggestedSkills.length > 0) {
                      const allExisting = new Set([
                        ...(resume.skills?.map(s => s.name?.toLowerCase()) || []),
                        ...(resume.skills?.flatMap(s => s.keywords?.map(k => k.toLowerCase()) || []) || []),
                      ]);
                      const newSkills = suggestedSkills.filter(s => !allExisting.has(s.name.toLowerCase()));
                      if (newSkills.length > 0) {
                        updatedResume.skills = [...(resume.skills || []), ...newSkills.map(s => ({ name: s.name, level: s.level, keywords: [] }))];
                      }
                    }
                    if (suggestedLanguages && suggestedLanguages.length > 0) {
                      const existingLangNames = new Set(resume.languages?.map(l => l.language?.toLowerCase()) || []);
                      const newLangs = suggestedLanguages.filter(l => !existingLangNames.has(l.language.toLowerCase()));
                      if (newLangs.length > 0) {
                        updatedResume.languages = [...(resume.languages || []), ...newLangs];
                      }
                    }
                    onResumeChange(updatedResume);
                  }}
                />
              </div>
              <Textarea value={vol.summary || ""} onChange={(e) => { const newVols = [...(resume.volunteer || [])]; newVols[index] = { ...newVols[index], summary: e.target.value }; onResumeChange({ ...resume, volunteer: newVols }); }} placeholder="Describe your volunteer work" rows={2} />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, volunteer: [...(resume.volunteer || []), { organization: "", position: "", summary: "" }] }); }}>+ Add Volunteering</Button>
      </CardContent>}
    </Card>
  );

  const renderHobbiesSection = () => (
    <Card key="hobbies">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("hobbies")}>
          <CollapseButton section="hobbies" />
          <CardTitle className="text-lg">Hobbies</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("hobbies")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("hobbies") && <CardContent className="space-y-4">
        {resume.hobbies?.map((hobby, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{hobby.name || "(Not specified)"}</p>
              <button onClick={() => { const newHobbies = [...(resume.hobbies || [])]; newHobbies.splice(index, 1); onResumeChange({ ...resume, hobbies: newHobbies }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="space-y-2"><Label className="text-xs">Hobby/Interest</Label><Input value={hobby.name || ""} onChange={(e) => { const newHobbies = [...(resume.hobbies || [])]; newHobbies[index] = { ...newHobbies[index], name: e.target.value }; onResumeChange({ ...resume, hobbies: newHobbies }); }} placeholder="e.g. Photography, Hiking" /></div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, hobbies: [...(resume.hobbies || []), { name: "" }] }); }}>+ Add Hobby</Button>
      </CardContent>}
    </Card>
  );

  const renderInternshipsSection = () => (
    <Card key="internships">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("internships")}>
          <CollapseButton section="internships" />
          <CardTitle className="text-lg">Internships</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("internships")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("internships") && <CardContent className="space-y-4">
        {resume.internships?.map((intern, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{intern.position || "(Not specified)"}</p>
              <button onClick={() => { const newInterns = [...(resume.internships || [])]; newInterns.splice(index, 1); onResumeChange({ ...resume, internships: newInterns }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Job Title</Label><Input value={intern.position || ""} onChange={(e) => { const newInterns = [...(resume.internships || [])]; newInterns[index] = { ...newInterns[index], position: e.target.value }; onResumeChange({ ...resume, internships: newInterns }); }} placeholder="e.g. Software Intern" /></div>
              <div className="space-y-2"><Label className="text-xs">Employer</Label><Input value={intern.company || ""} onChange={(e) => { const newInterns = [...(resume.internships || [])]; newInterns[index] = { ...newInterns[index], company: e.target.value }; onResumeChange({ ...resume, internships: newInterns }); }} placeholder="e.g. Google" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">City</Label><Input value={intern.city || ""} onChange={(e) => { const newInterns = [...(resume.internships || [])]; newInterns[index] = { ...newInterns[index], city: e.target.value }; onResumeChange({ ...resume, internships: newInterns }); }} placeholder="e.g. San Francisco" /></div>
              <div className="space-y-2"><Label className="text-xs">Country</Label><Input value={intern.country || ""} onChange={(e) => { const newInterns = [...(resume.internships || [])]; newInterns[index] = { ...newInterns[index], country: e.target.value }; onResumeChange({ ...resume, internships: newInterns }); }} placeholder="e.g. USA" /></div>
            </div>
            <DateRangeWithCurrent startDate={intern.startDate || ""} endDate={intern.endDate || ""} onStartDateChange={(value) => { const newInterns = [...(resume.internships || [])]; newInterns[index] = { ...newInterns[index], startDate: value }; onResumeChange({ ...resume, internships: newInterns }); }} onEndDateChange={(value) => { const newInterns = [...(resume.internships || [])]; newInterns[index] = { ...newInterns[index], endDate: value }; onResumeChange({ ...resume, internships: newInterns }); }} currentLabel="Currently work here" />
            <div className="space-y-2"><Label className="text-xs">Description</Label><Textarea value={intern.summary || ""} onChange={(e) => { const newInterns = [...(resume.internships || [])]; newInterns[index] = { ...newInterns[index], summary: e.target.value }; onResumeChange({ ...resume, internships: newInterns }); }} placeholder="Describe your responsibilities" rows={3} /></div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, internships: [...(resume.internships || []), { company: "", position: "", startDate: "", endDate: "" }] }); }}>+ Add Internship</Button>
      </CardContent>}
    </Card>
  );

  const renderActivitiesSection = () => (
    <Card key="activities">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("activities")}>
          <CollapseButton section="activities" />
          <CardTitle className="text-lg">Extra-curricular Activities</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("activities")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("activities") && <CardContent className="space-y-4">
        {resume.activities?.map((activity, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{activity.name || "(Not specified)"}</p>
              <button onClick={() => { const newActs = [...(resume.activities || [])]; newActs.splice(index, 1); onResumeChange({ ...resume, activities: newActs }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Activity Name</Label><Input value={activity.name || ""} onChange={(e) => { const newActs = [...(resume.activities || [])]; newActs[index] = { ...newActs[index], name: e.target.value }; onResumeChange({ ...resume, activities: newActs }); }} placeholder="e.g. Debate Club" /></div>
              <div className="space-y-2"><Label className="text-xs">Role</Label><Input value={activity.role || ""} onChange={(e) => { const newActs = [...(resume.activities || [])]; newActs[index] = { ...newActs[index], role: e.target.value }; onResumeChange({ ...resume, activities: newActs }); }} placeholder="e.g. President" /></div>
            </div>
            <div className="space-y-2"><Label className="text-xs">Description</Label><Textarea value={activity.description || ""} onChange={(e) => { const newActs = [...(resume.activities || [])]; newActs[index] = { ...newActs[index], description: e.target.value }; onResumeChange({ ...resume, activities: newActs }); }} placeholder="Describe your involvement" rows={2} /></div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, activities: [...(resume.activities || []), { name: "", role: "", description: "" }] }); }}>+ Add Activity</Button>
      </CardContent>}
    </Card>
  );

  const renderPublicationsSection = () => (
    <Card key="publications">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("publications")}>
          <CollapseButton section="publications" />
          <CardTitle className="text-lg">Publications</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("publications")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("publications") && <CardContent className="space-y-4">
        {resume.publications?.map((pub, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{pub.name || "(Not specified)"}</p>
              <button onClick={() => { const newPubs = [...(resume.publications || [])]; newPubs.splice(index, 1); onResumeChange({ ...resume, publications: newPubs }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Title</Label><Input value={pub.name || ""} onChange={(e) => { const newPubs = [...(resume.publications || [])]; newPubs[index] = { ...newPubs[index], name: e.target.value }; onResumeChange({ ...resume, publications: newPubs }); }} placeholder="e.g. Research Paper" /></div>
              <div className="space-y-2"><Label className="text-xs">Publisher</Label><Input value={pub.publisher || ""} onChange={(e) => { const newPubs = [...(resume.publications || [])]; newPubs[index] = { ...newPubs[index], publisher: e.target.value }; onResumeChange({ ...resume, publications: newPubs }); }} placeholder="e.g. Journal Name" /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Release Date</Label>
              <MonthYearPicker
                value={pub.releaseDate || ""}
                onChange={(newDate) => {
                  const newPubs = [...(resume.publications || [])];
                  newPubs[index] = { ...newPubs[index], releaseDate: newDate };
                  onResumeChange({ ...resume, publications: newPubs });
                }}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-2"><Label className="text-xs">Summary</Label><Textarea value={pub.summary || ""} onChange={(e) => { const newPubs = [...(resume.publications || [])]; newPubs[index] = { ...newPubs[index], summary: e.target.value }; onResumeChange({ ...resume, publications: newPubs }); }} placeholder="Brief description" rows={2} /></div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, publications: [...(resume.publications || []), { name: "", publisher: "", summary: "" }] }); }}>+ Add Publication</Button>
      </CardContent>}
    </Card>
  );

  const renderStrengthsSection = () => (
    <Card key="strengths">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("strengths")}>
          <CollapseButton section="strengths" />
          <CardTitle className="text-lg">Strengths</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("strengths")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("strengths") && <CardContent className="space-y-4">
        {resume.strengths?.map((str, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{str.name || "(Not specified)"}</p>
              <button onClick={() => { const newStrs = [...(resume.strengths || [])]; newStrs.splice(index, 1); onResumeChange({ ...resume, strengths: newStrs }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="space-y-2"><Label className="text-xs">Strength Name</Label><Input value={str.name || ""} onChange={(e) => { const newStrs = [...(resume.strengths || [])]; newStrs[index] = { ...newStrs[index], name: e.target.value }; onResumeChange({ ...resume, strengths: newStrs }); }} placeholder="e.g. Go-getter" /></div>
            <div className="space-y-2"><Label className="text-xs">Description</Label><Textarea value={str.description || ""} onChange={(e) => { const newStrs = [...(resume.strengths || [])]; newStrs[index] = { ...newStrs[index], description: e.target.value }; onResumeChange({ ...resume, strengths: newStrs }); }} placeholder="Describe this strength" rows={2} /></div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, strengths: [...(resume.strengths || []), { name: "", description: "" }] }); }}>+ Add Strength</Button>
      </CardContent>}
    </Card>
  );

  const renderPhilosophySection = () => (
    <Card key="philosophy">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("philosophy")}>
          <CollapseButton section="philosophy" />
          <CardTitle className="text-lg">My Life Philosophy</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("philosophy")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("philosophy") && <CardContent className="space-y-4">
        <div className="space-y-2"><Label className="text-xs">Quote</Label><Textarea value={resume.philosophy?.quote || ""} onChange={(e) => { onResumeChange({ ...resume, philosophy: { ...resume.philosophy, quote: e.target.value } }); }} placeholder="e.g. First they ignore you, then they laugh at you..." rows={3} /></div>
        <div className="space-y-2"><Label className="text-xs">Author</Label><Input value={resume.philosophy?.author || ""} onChange={(e) => { onResumeChange({ ...resume, philosophy: { ...resume.philosophy, author: e.target.value } }); }} placeholder="e.g. Mahatma Gandhi" /></div>
      </CardContent>}
    </Card>
  );

  const renderBooksSection = () => (
    <Card key="books">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("books")}>
          <CollapseButton section="books" />
          <CardTitle className="text-lg">Books</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("books")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("books") && <CardContent className="space-y-4">
        {resume.books?.map((book, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{book.title || "(Not specified)"}</p>
              <button onClick={() => { const newBooks = [...(resume.books || [])]; newBooks.splice(index, 1); onResumeChange({ ...resume, books: newBooks }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Book Title</Label><Input value={book.title || ""} onChange={(e) => { const newBooks = [...(resume.books || [])]; newBooks[index] = { ...newBooks[index], title: e.target.value }; onResumeChange({ ...resume, books: newBooks }); }} placeholder="e.g. Finding Your Element" /></div>
              <div className="space-y-2"><Label className="text-xs">Author</Label><Input value={book.author || ""} onChange={(e) => { const newBooks = [...(resume.books || [])]; newBooks[index] = { ...newBooks[index], author: e.target.value }; onResumeChange({ ...resume, books: newBooks }); }} placeholder="e.g. Ken Robinson" /></div>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, books: [...(resume.books || []), { title: "", author: "" }] }); }}>+ Add Book</Button>
      </CardContent>}
    </Card>
  );

  const platformOptions = ["GitHub"];

  const [trustLoading, setTrustLoading] = useState(false);
  const [githubStatsLoading, setGithubStatsLoading] = useState<number | null>(null);
  const [linkCheckLoading, setLinkCheckLoading] = useState(false);
  const [portfolioFeedbackOpen, setPortfolioFeedbackOpen] = useState(false);

  const analyzeTrustScore = async () => {
    const items = resume.digitalPortfolio;
    if (!items || items.length === 0) return;
    setTrustLoading(true);
    try {
      const res = await fetch("/api/portfolio-trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          resumeContext: {
            name: resume.basics?.name,
            title: resume.basics?.label,
            skills: resume.skills?.map(s => s.name).filter(Boolean),
          },
        }),
      });
      const data = await res.json();
      if (data.results) {
        const updated = [...(resume.digitalPortfolio || [])];
        data.results.forEach((r: { index: number; trustScore: number; trustLevel: string }) => {
          if (updated[r.index]) {
            updated[r.index] = { ...updated[r.index], trustScore: r.trustScore, trustLevel: r.trustLevel };
          }
        });
        onResumeChange({ ...resume, digitalPortfolio: updated });
      }
    } catch (e) {
      console.error("Trust analysis failed:", e);
    } finally {
      setTrustLoading(false);
    }
  };

  const fetchGitHubStats = async (index: number) => {
    const item = resume.digitalPortfolio?.[index];
    if (!item?.url) return;
    setGithubStatsLoading(index);
    try {
      const res = await fetch("/api/github-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: item.url }),
      });
      const data = await res.json();
      if (data.stats) {
        const updated = [...(resume.digitalPortfolio || [])];
        updated[index] = { ...updated[index], stats: data.stats };
        onResumeChange({ ...resume, digitalPortfolio: updated });
      }
    } catch (e) {
      console.error("GitHub stats failed:", e);
    } finally {
      setGithubStatsLoading(null);
    }
  };

  const checkAllLinks = async () => {
    const items = resume.digitalPortfolio;
    if (!items || items.length === 0) return;
    setLinkCheckLoading(true);
    try {
      const urls = items.map(i => i.url).filter(Boolean) as string[];
      const res = await fetch("/api/link-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (data.results) {
        const updated = [...items];
        data.results.forEach((r: { url: string; status: "valid" | "broken" }) => {
          const idx = updated.findIndex(i => i.url === r.url);
          if (idx >= 0) updated[idx] = { ...updated[idx], linkStatus: r.status };
        });
        onResumeChange({ ...resume, digitalPortfolio: updated });
      }
    } catch (e) {
      console.error("Link check failed:", e);
    } finally {
      setLinkCheckLoading(false);
    }
  };

  const renderDigitalPortfolioSection = () => (
    <Card key="digitalPortfolio">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("digitalPortfolio")}>
          <CollapseButton section="digitalPortfolio" />
          <CardTitle className="text-lg">Digital Portfolio & Proof of Work</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("digitalPortfolio")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("digitalPortfolio") && <CardContent className="space-y-4">
        {resume.digitalPortfolio?.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{item.label || item.platform || "(Not specified)"}</p>
                {item.trustScore !== undefined && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    item.trustScore >= 70 ? "bg-green-100 text-green-700" :
                    item.trustScore >= 40 ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {item.trustLevel || `${item.trustScore}/100`}
                  </span>
                )}
                {item.linkStatus === "valid" && (
                  <span className="text-xs text-green-600 flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Live
                  </span>
                )}
                {item.linkStatus === "broken" && (
                  <span className="text-xs text-red-600 flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Broken
                  </span>
                )}
              </div>
              <button onClick={() => { const arr = [...(resume.digitalPortfolio || [])]; arr.splice(index, 1); onResumeChange({ ...resume, digitalPortfolio: arr }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Platform</Label>
                <select
                  value={item.platform || ""}
                  onChange={(e) => { const arr = [...(resume.digitalPortfolio || [])]; arr[index] = { ...arr[index], platform: e.target.value }; onResumeChange({ ...resume, digitalPortfolio: arr }); }}
                  className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="">Select platform</option>
                  {platformOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Label</Label>
                <Input value={item.label || ""} onChange={(e) => { const arr = [...(resume.digitalPortfolio || [])]; arr[index] = { ...arr[index], label: e.target.value }; onResumeChange({ ...resume, digitalPortfolio: arr }); }} placeholder="e.g. My Design Portfolio" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">URL</Label>
              <Input value={item.url || ""} onChange={(e) => { const arr = [...(resume.digitalPortfolio || [])]; arr[index] = { ...arr[index], url: e.target.value }; onResumeChange({ ...resume, digitalPortfolio: arr }); }} placeholder="https://github.com/username" />
            </div>
            {item.platform === "GitHub" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => fetchGitHubStats(index)} disabled={githubStatsLoading === index}>
                    {githubStatsLoading === index ? "Fetching..." : "Fetch GitHub Stats"}
                  </Button>
                  {item.stats && (
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{item.stats.repos} repos</span>
                      <span className="flex items-center gap-0.5"><svg className="w-3 h-3 text-amber-400" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>{item.stats.stars}</span>
                      <span>{item.stats.followers} followers</span>
                    </div>
                  )}
                </div>
                {item.stats?.topRepos && item.stats.topRepos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Top Repositories</p>
                    {item.stats.topRepos.map((repo, ri) => (
                      <div key={ri} className="flex items-center justify-between p-2.5 border rounded-md bg-gray-50 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{repo.name}</p>
                          {repo.description && <p className="text-gray-500 truncate mt-0.5">{repo.description}</p>}
                        </div>
                        <div className="flex items-center gap-3 ml-3 text-gray-500 shrink-0">
                          {repo.language && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{repo.language}</span>}
                          <span className="flex items-center gap-0.5"><svg className="w-3 h-3 text-amber-400" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>{repo.stars?.toLocaleString()}</span>
                          <span className="flex items-center gap-0.5"><svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 10 0-1.5.75.75 0 000 1.5zM8 12.75a.75.75 0 10 0-1.5.75.75 0 000 1.5z"/></svg>{repo.forks?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, digitalPortfolio: [...(resume.digitalPortfolio || []), { platform: "GitHub", url: "", label: "", linkStatus: "unchecked" }] }); }}>+ Add GitHub Profile</Button>

        {resume.digitalPortfolio && resume.digitalPortfolio.length > 0 && (
          <div className="flex gap-2 pt-2 flex-wrap">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={checkAllLinks} disabled={linkCheckLoading}>
              {linkCheckLoading ? "Checking..." : "Check All Links"}
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1 ml-auto text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setPortfolioFeedbackOpen(true)}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Give Feedback
            </Button>
          </div>
        )}
        <FeedbackModal isOpen={portfolioFeedbackOpen} onClose={() => setPortfolioFeedbackOpen(false)} source="digital_portfolio" />
      </CardContent>}
    </Card>
  );

  const renderSocialLinksSection = () => (
    <Card key="socialLinks">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("socialLinks")}>
          <CollapseButton section="socialLinks" />
          <CardTitle className="text-lg">Find Me Online</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("socialLinks")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("socialLinks") && <CardContent className="space-y-4">
        {resume.socialLinks?.map((link, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{link.network || "(Not specified)"}</p>
              <button onClick={() => { const newLinks = [...(resume.socialLinks || [])]; newLinks.splice(index, 1); onResumeChange({ ...resume, socialLinks: newLinks }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Network</Label><Input value={link.network || ""} onChange={(e) => { const newLinks = [...(resume.socialLinks || [])]; newLinks[index] = { ...newLinks[index], network: e.target.value }; onResumeChange({ ...resume, socialLinks: newLinks }); }} placeholder="e.g. LinkedIn, GitHub" /></div>
              <div className="space-y-2"><Label className="text-xs">Username</Label><Input value={link.username || ""} onChange={(e) => { const newLinks = [...(resume.socialLinks || [])]; newLinks[index] = { ...newLinks[index], username: e.target.value }; onResumeChange({ ...resume, socialLinks: newLinks }); }} placeholder="e.g. johndoe" /></div>
            </div>
            <div className="space-y-2"><Label className="text-xs">URL</Label><Input value={link.url || ""} onChange={(e) => { const newLinks = [...(resume.socialLinks || [])]; newLinks[index] = { ...newLinks[index], url: e.target.value }; onResumeChange({ ...resume, socialLinks: newLinks }); }} placeholder="e.g. https://linkedin.com/in/johndoe" /></div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, socialLinks: [...(resume.socialLinks || []), { network: "", username: "", url: "" }] }); }}>+ Add Social Link</Button>
      </CardContent>}
    </Card>
  );

  const renderIndustryExpertiseSection = () => (
    <Card key="industryExpertise">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("industryExpertise")}>
          <CollapseButton section="industryExpertise" />
          <CardTitle className="text-lg">Industry Expertise</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("industryExpertise")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("industryExpertise") && <CardContent className="space-y-4">
        {resume.industryExpertise?.map((exp, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{exp.name || "(Not specified)"}</p>
              <button onClick={() => { const newExps = [...(resume.industryExpertise || [])]; newExps.splice(index, 1); onResumeChange({ ...resume, industryExpertise: newExps }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Expertise</Label><Input value={exp.name || ""} onChange={(e) => { const newExps = [...(resume.industryExpertise || [])]; newExps[index] = { ...newExps[index], name: e.target.value }; onResumeChange({ ...resume, industryExpertise: newExps }); }} placeholder="e.g. Leadership" /></div>
              <div className="space-y-2">
                <Label className="text-xs">Level</Label>
                <select value={exp.level || ""} onChange={(e) => { const newExps = [...(resume.industryExpertise || [])]; newExps[index] = { ...newExps[index], level: e.target.value }; onResumeChange({ ...resume, industryExpertise: newExps }); }} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, industryExpertise: [...(resume.industryExpertise || []), { name: "", level: "" }] }); }}>+ Add Expertise</Button>
      </CardContent>}
    </Card>
  );

  const renderCustomSection = () => (
    <Card key="custom">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCollapse("custom")}>
          <CollapseButton section="custom" />
          <CardTitle className="text-lg">Custom Section</CardTitle>
        </div>
        <button onClick={() => setSectionToDelete("custom")} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>
      {!isCollapsed("custom") && <CardContent className="space-y-4">
        {resume.customSections?.map((custom, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{custom.title || "(Not specified)"}</p>
              <button onClick={() => { const newCustoms = [...(resume.customSections || [])]; newCustoms.splice(index, 1); onResumeChange({ ...resume, customSections: newCustoms }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
            <div className="space-y-2"><Label className="text-xs">Section Title</Label><Input value={custom.title || ""} onChange={(e) => { const newCustoms = [...(resume.customSections || [])]; newCustoms[index] = { ...newCustoms[index], title: e.target.value }; onResumeChange({ ...resume, customSections: newCustoms }); }} placeholder="e.g. Personal Interests" /></div>
            <div className="space-y-2"><Label className="text-xs">Content</Label><Textarea value={custom.content || ""} onChange={(e) => { const newCustoms = [...(resume.customSections || [])]; newCustoms[index] = { ...newCustoms[index], content: e.target.value }; onResumeChange({ ...resume, customSections: newCustoms }); }} placeholder="Add your custom content" rows={4} /></div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { onResumeChange({ ...resume, customSections: [...(resume.customSections || []), { title: "", content: "" }] }); }}>+ Add Custom Section</Button>
      </CardContent>}
    </Card>
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Logo */}
      <div
        className="flex items-center cursor-pointer no-print -mb-3"
        onClick={() => router.push("/dashboard")}
      >
        <img
          src="/logo.png"
          alt="LinImpact.ai Logo"
          className="w-16 h-16 object-contain"
        />
        <span className="text-2xl font-extrabold tracking-tight -ml-2" style={{ fontFamily: 'var(--font-poppins)' }}>
          <span className="text-cyan-500">Lin</span>
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">Impact</span>
          <span className="text-slate-500 font-semibold">.ai</span>
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            title="Home Page"
            className="no-print"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Home Page
          </Button>
          <div>
            {documentId && documentName ? (
              <button
                onClick={handleRenameClick}
                className="text-left group flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 -ml-2 transition-colors"
                title="Click to rename"
              >
                <h1 className="text-lg font-bold text-gray-900">
                  {documentName}
                  {hasUnsavedChanges && <span className="text-orange-500 ml-1">*</span>}
                </h1>
                <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <h1 className="text-lg font-bold text-gray-900">
                Resume Builder
              </h1>
            )}
            <p className="text-xs text-gray-500 flex items-center gap-2">
              {documentId ? "Click to rename" : "AI-Powered Premium Resume Builder"}
              {autoSaveStatus === "saving" && (
                <span className="flex items-center gap-1 text-blue-500 animate-pulse">
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Auto-saving...
                </span>
              )}
              {autoSaveStatus === "saved" && (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="h-3 w-3" />
                  Auto-saved
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-8">
          {documentId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="no-print border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Cover Letter
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuItem
                  onClick={() => router.push("/find-jobs")}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <Search className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Find Jobs on LinkedIn</p>
                    <p className="text-xs text-gray-500 mt-0.5">Search and pick a job, we&apos;ll write your cover letter</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/cover-letter")}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">I Have the Job Posting</p>
                    <p className="text-xs text-gray-500 mt-0.5">Paste the job description and get a tailored cover letter</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            onClick={handleSaveClick}
            variant="outline"
            className="no-print"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="no-print"
            disabled={isExportingPDF}
          >
            {isExportingPDF ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              "Download PDF"
            )}
          </Button>
        </div>
      </div>

      {/* Save Modal */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Resume</DialogTitle>
            <DialogDescription>
              Give your resume a name to save it for later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="resume-name">Resume Name</Label>
            <Input
              id="resume-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter a name for your resume"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveConfirm();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm} disabled={!saveName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Modal */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
            <DialogDescription>
              Enter a new name for your resume.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename-input">New Name</Label>
            <Input
              id="rename-input"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="Enter new name"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameConfirm();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm} disabled={!renameName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Separator />

      {/* ATS Score Panel - LinkedIn Job */}
      <ATSScorePanel
        resume={resume}
        onResumeChange={onResumeChange}
        isExpanded={isATSScoreExpanded}
        onToggleExpand={() => setIsATSScoreExpanded(!isATSScoreExpanded)}
        documentId={documentId}
        documentUpdatedAt={documentUpdatedAt}
      />

      {/* ATS Score Panel - Profession */}
      <ProfessionATSPanel
        resume={resume}
        onResumeChange={onResumeChange}
        isExpanded={isProfessionATSExpanded}
        onToggleExpand={() => setIsProfessionATSExpanded(!isProfessionATSExpanded)}
        documentId={documentId}
        documentUpdatedAt={documentUpdatedAt}
      />

      {/* Resume Scan Preview - 6-Second Analysis */}
      <ResumeScanPreview
        resume={resume}
        isExpanded={isScanPreviewExpanded}
        onToggleExpand={() => setIsScanPreviewExpanded(!isScanPreviewExpanded)}
        onHighlightZone={onHeatmapZoneChange}
        selectedTemplate={selectedTemplate}
      />

      <Separator />

      {/* Template Selector */}
      <TemplateSelector
        selectedTemplate={selectedTemplate}
        onSelectTemplate={onSelectTemplate}
      />

      <Separator />

      {/* Basic Information */}
      <Card>
        <button
          type="button"
          className="flex flex-row items-center justify-between w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors rounded-t-xl"
          onClick={() => toggleCollapse("personal")}
        >
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <CollapseButton section="personal" />
        </button>
        {!isCollapsed("personal") && <CardContent className="space-y-4">
          {/* Profile Photo */}
          <div className="flex items-start gap-4">
            <div className="relative">
              {resume.basics?.image ? (
                <div className="relative group">
                  <div
                    className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm cursor-pointer"
                    onClick={() => setIsPhotoModalOpen(true)}
                  >
                    <img
                      src={resume.basics.image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      style={{
                        transform: `translate(${resume.basics.imagePosition?.x || 0}%, ${resume.basics.imagePosition?.y || 0}%) scale(${resume.basics.imagePosition?.scale || 1})`,
                      }}
                    />
                  </div>
                  {/* Edit overlay on hover */}
                  <div
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => setIsPhotoModalOpen(true)}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </div>
                  <button
                    onClick={removePhoto}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700">Profile Photo</Label>
              <p className="text-xs text-gray-500 mb-2">Add a professional photo to your resume</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Photo
                </Button>
                {resume.basics?.image && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="text-xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Adjust
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Photo Position Modal */}
          <PhotoPositionModal
            isOpen={isPhotoModalOpen}
            onClose={() => setIsPhotoModalOpen(false)}
            imageUrl={resume.basics?.image || ""}
            initialPosition={{
              x: resume.basics?.imagePosition?.x || 0,
              y: resume.basics?.imagePosition?.y || 0,
              scale: resume.basics?.imagePosition?.scale || 1,
            }}
            onSave={(position) => {
              onResumeChange({
                ...resume,
                basics: { ...resume.basics, imagePosition: position },
              });
            }}
          />

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={resume.basics?.name || ""}
                onChange={(e) => updateBasics("name", e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="label">Professional Title</Label>
                <ATSOptimizeButtons
                  field="professionalTitle"
                  fieldLabel="Professional Title"
                  currentValue={resume.basics?.label || ""}
                  context={{
                    name: resume.basics?.name,
                    skills: resume.skills?.map(s => s.name || "").filter(Boolean),
                  }}
                  onApply={(newValue, suggestedSkills, suggestedLanguages) => {
                    updateBasics("label", newValue);
                    if (suggestedSkills && suggestedSkills.length > 0) {
                      const allExisting = new Set([
                        ...(resume.skills || []).map(s => s.name?.toLowerCase()),
                        ...(resume.skills || []).flatMap(s => s.keywords?.map(k => k.toLowerCase()) || []),
                      ]);
                      const newSkills = suggestedSkills.filter(s => !allExisting.has(s.name.toLowerCase()));
                      if (newSkills.length > 0) {
                        onResumeChange({
                          ...resume,
                          basics: { ...resume.basics, label: newValue },
                          skills: [...(resume.skills || []), ...newSkills.map(s => ({ name: s.name, level: s.level }))],
                        });
                      }
                    }
                    if (suggestedLanguages && suggestedLanguages.length > 0) {
                      const existingLangNames = (resume.languages || []).map(l => l.language?.toLowerCase());
                      const newLangs = suggestedLanguages.filter(l => !existingLangNames.includes(l.language.toLowerCase()));
                      if (newLangs.length > 0) {
                        onResumeChange({
                          ...resume,
                          basics: { ...resume.basics, label: newValue },
                          languages: [...(resume.languages || []), ...newLangs],
                        });
                      }
                    }
                  }}
                />
              </div>
              <Input
                id="label"
                value={resume.basics?.label || ""}
                onChange={(e) => updateBasics("label", e.target.value)}
                placeholder="Software Developer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={resume.basics?.email || ""}
                onChange={(e) => updateBasics("email", e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={resume.basics?.phone || ""}
                onChange={(e) => updateBasics("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={resume.basics?.location?.city || ""}
                onChange={(e) => updateLocation("city", e.target.value)}
                placeholder="San Francisco"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">State/Region</Label>
              <Input
                id="region"
                value={resume.basics?.location?.region || ""}
                onChange={(e) => updateLocation("region", e.target.value)}
                placeholder="CA"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn <span className="text-gray-400 text-xs font-normal">(Optional)</span>
              </Label>
              <Input
                id="linkedin"
                value={resume.basics?.profiles?.find(p => p.network === "LinkedIn")?.url || ""}
                onChange={(e) => {
                  const profiles = [...(resume.basics?.profiles || [])];
                  const linkedinIndex = profiles.findIndex(p => p.network === "LinkedIn");
                  if (linkedinIndex >= 0) {
                    if (e.target.value) {
                      profiles[linkedinIndex] = { ...profiles[linkedinIndex], url: e.target.value };
                    } else {
                      profiles.splice(linkedinIndex, 1);
                    }
                  } else if (e.target.value) {
                    profiles.push({ network: "LinkedIn", url: e.target.value });
                  }
                  onResumeChange({
                    ...resume,
                    basics: { ...resume.basics, profiles }
                  });
                }}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub <span className="text-gray-400 text-xs font-normal">(Optional)</span>
              </Label>
              <Input
                id="github"
                value={resume.basics?.profiles?.find(p => p.network === "GitHub")?.url || ""}
                onChange={(e) => {
                  const profiles = [...(resume.basics?.profiles || [])];
                  const githubIndex = profiles.findIndex(p => p.network === "GitHub");
                  if (githubIndex >= 0) {
                    if (e.target.value) {
                      profiles[githubIndex] = { ...profiles[githubIndex], url: e.target.value };
                    } else {
                      profiles.splice(githubIndex, 1);
                    }
                  } else if (e.target.value) {
                    profiles.push({ network: "GitHub", url: e.target.value });
                  }
                  onResumeChange({
                    ...resume,
                    basics: { ...resume.basics, profiles }
                  });
                }}
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medium" className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42c1.87 0 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                </svg>
                Medium <span className="text-gray-400 text-xs font-normal">(Optional)</span>
              </Label>
              <Input
                id="medium"
                value={resume.basics?.profiles?.find(p => p.network === "Medium")?.url || ""}
                onChange={(e) => {
                  const profiles = [...(resume.basics?.profiles || [])];
                  const mediumIndex = profiles.findIndex(p => p.network === "Medium");
                  if (mediumIndex >= 0) {
                    if (e.target.value) {
                      profiles[mediumIndex] = { ...profiles[mediumIndex], url: e.target.value };
                    } else {
                      profiles.splice(mediumIndex, 1);
                    }
                  } else if (e.target.value) {
                    profiles.push({ network: "Medium", url: e.target.value });
                  }
                  onResumeChange({
                    ...resume,
                    basics: { ...resume.basics, profiles }
                  });
                }}
                placeholder="https://medium.com/@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Website <span className="text-gray-400 text-xs font-normal">(Optional)</span>
              </Label>
              <Input
                id="website"
                value={resume.basics?.url || ""}
                onChange={(e) => {
                  onResumeChange({
                    ...resume,
                    basics: { ...resume.basics, url: e.target.value }
                  });
                }}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="birthDate" className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
              </svg>
              Birth Date <span className="text-gray-400 text-xs font-normal">(Optional)</span>
            </Label>
            <Input
              id="birthDate"
              type="date"
              value={resume.basics?.birthDate || ""}
              onChange={(e) => {
                onResumeChange({
                  ...resume,
                  basics: { ...resume.basics, birthDate: e.target.value }
                });
              }}
            />
          </div>

        </CardContent>}
      </Card>

      {/* Professional Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Professional Summary</CardTitle>
          <p className="text-sm text-blue-600 mt-1">
            Write 2-4 short, energetic sentences about how great you are. Mention the role and what you did. What were the big achievements? Describe your motivation and list your skills.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-slate-50 rounded-t-lg px-3 py-2 border border-b-0 border-gray-200">
            <div className="flex items-center gap-1">
              {/* Bold */}
              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 font-bold text-sm">B</button>
              {/* Italic */}
              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 italic text-sm">I</button>
              {/* Underline */}
              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 underline text-sm">U</button>
              {/* Strikethrough */}
              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 line-through text-sm">S</button>

              <div className="w-px h-5 bg-gray-300 mx-1" />

              {/* Ordered List */}
              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              {/* Unordered List */}
              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="w-px h-5 bg-gray-300 mx-1" />

              {/* Link */}
              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>

              <div className="w-px h-5 bg-gray-300 mx-1" />

              {/* Text Color */}
              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600 font-bold text-sm">A</button>
              {/* Highlight */}
              <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.24 2a2.005 2.005 0 0 1 1.414.586l3.526 3.525a2 2 0 0 1 0 2.829l-9.9 9.9-4.596 1.148a1.5 1.5 0 0 1-1.82-1.82l1.148-4.596 9.9-9.9A1.995 1.995 0 0 1 15.24 2z" />
                </svg>
              </button>
            </div>

            {/* ATS Optimize Buttons */}
            <ATSOptimizeButtons
              field="professionalSummary"
              fieldLabel="Professional Summary"
              currentValue={resume.basics?.summary || ""}
              context={{
                name: resume.basics?.name,
                currentTitle: resume.basics?.label,
                skills: resume.skills?.map(s => s.name || "").filter(Boolean),
                experience: resume.work?.map(w => ({
                  position: w.position || "",
                  company: w.name || "",
                  summary: w.summary || "",
                })),
              }}
              onApply={(newValue, suggestedSkills, suggestedLanguages) => {
                let updatedResume = { ...resume, basics: { ...resume.basics, summary: newValue } };
                if (suggestedSkills && suggestedSkills.length > 0) {
                  const allExisting = new Set([
                    ...(resume.skills || []).map(s => s.name?.toLowerCase()),
                    ...(resume.skills || []).flatMap(s => s.keywords?.map(k => k.toLowerCase()) || []),
                  ]);
                  const newSkills = suggestedSkills.filter(s => !allExisting.has(s.name.toLowerCase()));
                  if (newSkills.length > 0) {
                    updatedResume = {
                      ...updatedResume,
                      skills: [...(resume.skills || []), ...newSkills.map(s => ({ name: s.name, level: s.level }))],
                    };
                  }
                }
                if (suggestedLanguages && suggestedLanguages.length > 0) {
                  const existingLangNames = (resume.languages || []).map(l => l.language?.toLowerCase());
                  const newLangs = suggestedLanguages.filter(l => !existingLangNames.includes(l.language.toLowerCase()));
                  if (newLangs.length > 0) {
                    updatedResume = {
                      ...updatedResume,
                      languages: [...(resume.languages || []), ...newLangs],
                    };
                  }
                }
                onResumeChange(updatedResume);
              }}
            />
          </div>

          {/* Text Area */}
          <Textarea
            id="summary"
            value={resume.basics?.summary || ""}
            onChange={(e) => updateBasics("summary", e.target.value)}
            placeholder="Curious science teacher with 8+ years of experience and a track record of..."
            rows={6}
            className="rounded-t-none border-t-0 bg-slate-50 resize-none"
          />

          {/* Footer with character count */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-blue-600">
              Recruiter tip: write 400-600 characters to increase interview chances
            </p>
            <span className="text-gray-500">
              {resume.basics?.summary?.length || 0} / 400+
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Section Order Manager - Drag to reorder sections */}
      <SectionOrderManager
        sectionOrder={resume.sectionOrder || defaultSectionOrder}
        activeSections={getActiveSectionsForOrder()}
        onOrderChange={handleSectionOrderChange}
      />

      {/* Work Experience */}
      <div {...getDragProps("experience")}>
        <Card className="group">
          <div className="flex items-stretch">
            {/* Drag Handle */}
            <div
              className="w-8 flex items-center justify-center bg-gray-50 border-r border-gray-100 cursor-grab active:cursor-grabbing hover:bg-blue-50 transition-colors rounded-l-xl"
              title="Drag to reorder"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="flex-1 flex flex-row items-center justify-between text-left px-6 py-4 hover:bg-gray-50 transition-colors"
              onClick={() => toggleCollapse("work")}
            >
              <h3 className="text-lg font-semibold">Work Experience</h3>
              <CollapseButton section="work" />
            </button>
          </div>
        {!isCollapsed("work") && <CardContent className="space-y-4">
          {resume.work?.map((job, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{job.position || "(Not specified)"}</p>
                <button
                  onClick={() => {
                    const newWork = [...(resume.work || [])];
                    newWork.splice(index, 1);
                    onResumeChange({ ...resume, work: newWork });
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Job Title</Label>
                  <Input
                    value={job.position || ""}
                    onChange={(e) => {
                      const newWork = [...(resume.work || [])];
                      newWork[index] = { ...newWork[index], position: e.target.value };
                      onResumeChange({ ...resume, work: newWork });
                    }}
                    placeholder="e.g. Software Developer"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Company</Label>
                  <Input
                    value={job.name || ""}
                    onChange={(e) => {
                      const newWork = [...(resume.work || [])];
                      newWork[index] = { ...newWork[index], name: e.target.value };
                      onResumeChange({ ...resume, work: newWork });
                    }}
                    placeholder="e.g. Google"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  <Input
                    value={job.city || ""}
                    onChange={(e) => {
                      const newWork = [...(resume.work || [])];
                      newWork[index] = { ...newWork[index], city: e.target.value };
                      onResumeChange({ ...resume, work: newWork });
                    }}
                    placeholder="e.g. San Francisco"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Country</Label>
                  <Input
                    value={job.country || ""}
                    onChange={(e) => {
                      const newWork = [...(resume.work || [])];
                      newWork[index] = { ...newWork[index], country: e.target.value };
                      onResumeChange({ ...resume, work: newWork });
                    }}
                    placeholder="e.g. USA"
                  />
                </div>
              </div>
              <DateRangeWithCurrent
                startDate={job.startDate || ""}
                endDate={job.endDate || ""}
                onStartDateChange={(value) => {
                  const newWork = [...(resume.work || [])];
                  newWork[index] = { ...newWork[index], startDate: value };
                  onResumeChange({ ...resume, work: newWork });
                }}
                onEndDateChange={(value) => {
                  const newWork = [...(resume.work || [])];
                  newWork[index] = { ...newWork[index], endDate: value };
                  onResumeChange({ ...resume, work: newWork });
                }}
                currentLabel="Currently work here"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Description</Label>
                  <ATSOptimizeButtons
                    field="workExperience"
                    fieldLabel={`${job.position || "Work"} Experience`}
                    currentValue={combineWorkDescription(job.summary, job.highlights)}
                    context={{
                      name: resume.basics?.name,
                      currentTitle: job.position,
                      skills: resume.skills?.map(s => s.name || "").filter(Boolean),
                    }}
                    onApply={(newValue, suggestedSkills, suggestedLanguages) => {
                      const newWork = [...(resume.work || [])];
                      newWork[index] = { ...newWork[index], summary: newValue, highlights: [] };
                      let updatedResume = { ...resume, work: newWork };
                      if (suggestedSkills && suggestedSkills.length > 0) {
                        const allExisting = new Set([
                          ...(resume.skills || []).map(s => s.name?.toLowerCase()),
                          ...(resume.skills || []).flatMap(s => s.keywords?.map(k => k.toLowerCase()) || []),
                        ]);
                        const newSkills = suggestedSkills.filter(s => !allExisting.has(s.name.toLowerCase()));
                        if (newSkills.length > 0) {
                          updatedResume = {
                            ...updatedResume,
                            skills: [...(resume.skills || []), ...newSkills.map(s => ({ name: s.name, level: s.level }))],
                          };
                        }
                      }
                      if (suggestedLanguages && suggestedLanguages.length > 0) {
                        const existingLangNames = (resume.languages || []).map(l => l.language?.toLowerCase());
                        const newLangs = suggestedLanguages.filter(l => !existingLangNames.includes(l.language.toLowerCase()));
                        if (newLangs.length > 0) {
                          updatedResume = {
                            ...updatedResume,
                            languages: [...(resume.languages || []), ...newLangs],
                          };
                        }
                      }
                      onResumeChange(updatedResume);
                    }}
                  />
                </div>
                <Textarea
                  value={combineWorkDescription(job.summary, job.highlights)}
                  onChange={(e) => {
                    const newWork = [...(resume.work || [])];
                    newWork[index] = { ...newWork[index], summary: e.target.value, highlights: [] };
                    onResumeChange({ ...resume, work: newWork });
                  }}
                  placeholder="Describe your responsibilities and achievements"
                  rows={3}
                />
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => {
              onResumeChange({
                ...resume,
                work: [...(resume.work || []), { name: "", position: "", startDate: "", endDate: "", summary: "" }],
              });
            }}
          >
            + Add Experience
          </Button>
        </CardContent>}
        </Card>
      </div>

      {/* Education */}
      <div {...getDragProps("education")}>
        <Card className="group">
          <div className="flex items-stretch">
            {/* Drag Handle */}
            <div
              className="w-8 flex items-center justify-center bg-gray-50 border-r border-gray-100 cursor-grab active:cursor-grabbing hover:bg-blue-50 transition-colors rounded-l-xl"
              title="Drag to reorder"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="flex-1 flex flex-row items-center justify-between text-left px-6 py-4 hover:bg-gray-50 transition-colors"
              onClick={() => toggleCollapse("education")}
            >
              <h3 className="text-lg font-semibold">Education</h3>
              <CollapseButton section="education" />
            </button>
          </div>
        {!isCollapsed("education") && <CardContent className="space-y-4">
          {resume.education?.map((edu, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{edu.institution || "(Not specified)"}</p>
                <button
                  onClick={() => {
                    const newEducation = [...(resume.education || [])];
                    newEducation.splice(index, 1);
                    onResumeChange({ ...resume, education: newEducation });
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Institution</Label>
                <Input
                  value={edu.institution || ""}
                  onChange={(e) => {
                    const newEducation = [...(resume.education || [])];
                    newEducation[index] = { ...newEducation[index], institution: e.target.value };
                    onResumeChange({ ...resume, education: newEducation });
                  }}
                  placeholder="University Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Faculty</Label>
                  <Input
                    value={edu.area || ""}
                    onChange={(e) => {
                      const newEducation = [...(resume.education || [])];
                      newEducation[index] = { ...newEducation[index], area: e.target.value };
                      onResumeChange({ ...resume, education: newEducation });
                    }}
                    placeholder="e.g. Faculty of Engineering"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Degree</Label>
                  <div className="flex flex-wrap gap-1">
                    {["High School", "Associate", "Bachelor's Degree", "Master's Degree", "PhD"].map((degree) => (
                      <button
                        key={degree}
                        type="button"
                        onClick={() => {
                          const newEducation = [...(resume.education || [])];
                          newEducation[index] = { ...newEducation[index], studyType: degree };
                          onResumeChange({ ...resume, education: newEducation });
                        }}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          edu.studyType === degree
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {degree}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DateRangeWithCurrent
                startDate={edu.startDate || ""}
                endDate={edu.endDate || ""}
                onStartDateChange={(value) => {
                  const newEducation = [...(resume.education || [])];
                  newEducation[index] = { ...newEducation[index], startDate: value };
                  onResumeChange({ ...resume, education: newEducation });
                }}
                onEndDateChange={(value) => {
                  const newEducation = [...(resume.education || [])];
                  newEducation[index] = { ...newEducation[index], endDate: value };
                  onResumeChange({ ...resume, education: newEducation });
                }}
                currentLabel="Currently study here"
              />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Description</Label>
                  <ATSOptimizeButtons
                    field="education"
                    fieldLabel={edu.institution || "Education"}
                    currentValue={edu.summary || ""}
                    context={{
                      name: resume.basics?.name,
                      currentTitle: resume.basics?.label,
                      skills: resume.skills?.flatMap(s => s.keywords || []),
                    }}
                    onApply={(newValue, suggestedSkills, suggestedLanguages) => {
                      const newEducation = [...(resume.education || [])];
                      newEducation[index] = { ...newEducation[index], summary: newValue };
                      let updatedResume = { ...resume, education: newEducation };
                      if (suggestedSkills && suggestedSkills.length > 0) {
                        const allExisting = new Set([
                          ...(resume.skills?.map(s => s.name?.toLowerCase()) || []),
                          ...(resume.skills?.flatMap(s => s.keywords?.map(k => k.toLowerCase()) || []) || []),
                        ]);
                        const newSkills = suggestedSkills.filter(s => !allExisting.has(s.name.toLowerCase()));
                        if (newSkills.length > 0) {
                          updatedResume.skills = [...(resume.skills || []), ...newSkills.map(s => ({ name: s.name, level: s.level, keywords: [] }))];
                        }
                      }
                      if (suggestedLanguages && suggestedLanguages.length > 0) {
                        const existingLangNames = new Set(resume.languages?.map(l => l.language?.toLowerCase()) || []);
                        const newLangs = suggestedLanguages.filter(l => !existingLangNames.has(l.language.toLowerCase()));
                        if (newLangs.length > 0) {
                          updatedResume.languages = [...(resume.languages || []), ...newLangs];
                        }
                      }
                      onResumeChange(updatedResume);
                    }}
                  />
                </div>
                <Textarea
                  value={edu.summary || ""}
                  onChange={(e) => {
                    const newEducation = [...(resume.education || [])];
                    newEducation[index] = { ...newEducation[index], summary: e.target.value };
                    onResumeChange({ ...resume, education: newEducation });
                  }}
                  placeholder="Describe relevant coursework, thesis, projects, or achievements..."
                  rows={3}
                />
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => {
              onResumeChange({
                ...resume,
                education: [...(resume.education || []), { institution: "", area: "", startDate: "", endDate: "" }],
              });
            }}
          >
            + Add Education
          </Button>
        </CardContent>}
        </Card>
      </div>

      {/* Skills */}
      <div {...getDragProps("skills")}>
        <Card className="group">
          <div className="flex items-stretch">
            {/* Drag Handle */}
            <div
              className="w-8 flex items-center justify-center bg-gray-50 border-r border-gray-100 cursor-grab active:cursor-grabbing hover:bg-blue-50 transition-colors rounded-l-xl"
              title="Drag to reorder"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-blue-400"></div>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-row items-center justify-between px-6 py-4">
              <button
                type="button"
                className="flex flex-row items-center gap-2 text-left hover:bg-gray-50 transition-colors rounded-lg px-2 py-1 -mx-2"
                onClick={() => toggleCollapse("skills")}
              >
                <h3 className="text-lg font-semibold">Skills</h3>
                <CollapseButton section="skills" />
              </button>
              <ATSOptimizeButtons
                field="skillsSuggestion"
                fieldLabel="Skills"
                currentValue={resume.skills?.map(s => s.name).filter(Boolean).join(", ") || ""}
                showOnlyTailored={true}
                context={{
                  name: resume.basics?.name,
                  currentTitle: resume.basics?.label,
                  skills: [
                    ...(resume.skills?.flatMap(s => s.keywords || []) || []),
                    ...(resume.skills?.map(s => s.name || "").filter(Boolean) || []),
                  ],
                  experience: resume.work?.map(w => ({
                    position: w.position || "",
                    company: w.name || "",
                    summary: w.summary || "",
                  })),
                }}
                onApply={(_, suggestedSkills) => {
                  if (suggestedSkills && suggestedSkills.length > 0) {
                    const allExistingSkills = new Set([
                      ...(resume.skills?.map(s => s.name?.toLowerCase()) || []),
                      ...(resume.skills?.flatMap(s => s.keywords?.map(k => k.toLowerCase()) || []) || []),
                    ]);
                    const newSkills = suggestedSkills.filter(s => !allExistingSkills.has(s.name.toLowerCase()));
                    if (newSkills.length > 0) {
                      onResumeChange({
                        ...resume,
                        skills: [...(resume.skills || []), ...newSkills.map(s => ({ name: s.name, level: s.level, keywords: [] }))],
                      });
                    }
                  }
                }}
              />
            </div>
          </div>
          {!isCollapsed("skills") && <CardContent className="space-y-4">
          {resume.skills?.map((skill, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{skill.name || "(Not specified)"}</p>
                  <p className="text-sm text-gray-500">{skill.level || "Expert"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newSkills = [...(resume.skills || [])];
                      newSkills.splice(index, 1);
                      onResumeChange({ ...resume, skills: newSkills });
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Skill</Label>
                    <ATSOptimizeButtons
                      field="skill"
                      fieldLabel={skill.name || "Skill"}
                      currentValue={skill.name || ""}
                      context={{
                        name: resume.basics?.name,
                        currentTitle: resume.basics?.label,
                      }}
                      onApply={(newValue) => {
                        const newSkills = [...(resume.skills || [])];
                        newSkills[index] = { ...newSkills[index], name: newValue };
                        onResumeChange({ ...resume, skills: newSkills });
                      }}
                    />
                  </div>
                  <Input
                    value={skill.name || ""}
                    onChange={(e) => {
                      const newSkills = [...(resume.skills || [])];
                      newSkills[index] = { ...newSkills[index], name: e.target.value };
                      onResumeChange({ ...resume, skills: newSkills });
                    }}
                    placeholder="e.g. JavaScript, Project Management"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Level â€” <span className="text-blue-600">{skill.level || "Expert"}</span></Label>
                  <div className="flex gap-1">
                    {["Beginner", "Intermediate", "Advanced", "Expert"].map((level, levelIndex) => (
                      <button
                        key={level}
                        onClick={() => {
                          const newSkills = [...(resume.skills || [])];
                          newSkills[index] = { ...newSkills[index], level };
                          onResumeChange({ ...resume, skills: newSkills });
                        }}
                        className={`flex-1 h-10 rounded transition-colors ${
                          (skill.level === level || (!skill.level && level === "Expert"))
                            ? "bg-blue-500"
                            : levelIndex <= ["Beginner", "Intermediate", "Advanced", "Expert"].indexOf(skill.level || "Expert")
                              ? "bg-blue-200"
                              : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => {
              onResumeChange({
                ...resume,
                skills: [...(resume.skills || []), { name: "", level: "Expert", keywords: [] }],
              });
            }}
          >
            + Add one more skill
          </Button>
        </CardContent>}
        </Card>
      </div>

      {/* Render Additional Sections in Order */}
      {activeSections.map((section) => renderSection(section))}

      {/* Add Additional Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Additional Sections</CardTitle>
          <p className="text-sm text-gray-500">Optional sections you can add to enhance your resume</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {/* Custom Section */}
            <button
              onClick={() => toggleSection("custom")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("custom")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("custom") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="font-medium">Custom Section</span>
            </button>

            {/* Courses */}
            <button
              onClick={() => toggleSection("courses")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("courses")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("courses") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-medium">Courses</span>
            </button>

            {/* Activities */}
            <button
              onClick={() => toggleSection("activities")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("activities")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("activities") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium">Activities</span>
            </button>

            {/* Internships */}
            <button
              onClick={() => toggleSection("internships")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("internships")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("internships") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-medium">Internships</span>
            </button>

            {/* Hobbies */}
            <button
              onClick={() => toggleSection("hobbies")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("hobbies")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("hobbies") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium">Hobbies</span>
            </button>

            {/* Languages */}
            <button
              onClick={() => toggleSection("languages")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("languages")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("languages") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <span className="font-medium">Languages</span>
            </button>

            {/* References */}
            <button
              onClick={() => toggleSection("references")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("references")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("references") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <span className="font-medium">References</span>
            </button>

            {/* Awards */}
            <button
              onClick={() => toggleSection("awards")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("awards")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("awards") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="font-medium">Awards</span>
            </button>

            {/* Volunteering */}
            <button
              onClick={() => toggleSection("volunteering")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("volunteering")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("volunteering") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="font-medium">Volunteering</span>
            </button>

            {/* Certifications */}
            <button
              onClick={() => toggleSection("certifications")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("certifications")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("certifications") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className="font-medium">Certifications</span>
            </button>

            {/* Projects */}
            <button
              onClick={() => toggleSection("projects")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("projects")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("projects") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="font-medium">Projects</span>
            </button>

            {/* Publications */}
            <button
              onClick={() => toggleSection("publications")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("publications")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("publications") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <span className="font-medium">Publications</span>
            </button>

            {/* Strengths */}
            <button
              onClick={() => toggleSection("strengths")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("strengths")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("strengths") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-medium">Strengths</span>
            </button>

            {/* Industry Expertise */}
            <button
              onClick={() => toggleSection("industryExpertise")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("industryExpertise")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("industryExpertise") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <span className="font-medium">Industry Expertise</span>
            </button>

            {/* My Life Philosophy */}
            <button
              onClick={() => toggleSection("philosophy")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("philosophy")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("philosophy") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <span className="font-medium">Philosophy</span>
            </button>

            {/* Books */}
            <button
              onClick={() => toggleSection("books")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("books")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("books") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <span className="font-medium">Books</span>
            </button>

            {/* Digital Portfolio */}
            <button
              onClick={() => toggleSection("digitalPortfolio")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("digitalPortfolio")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("digitalPortfolio") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.836-3.244a4.5 4.5 0 00-6.364-6.364L4.5 8.25l4.5 4.5a4.5 4.5 0 006.364 0l3.75-3.75z" />
                </svg>
              </div>
              <span className="font-medium">Digital Portfolio</span>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-green-600 bg-green-100 px-1.5 py-0.5 rounded">New</span>
            </button>

            {/* Find Me Online */}
            <button
              onClick={() => toggleSection("socialLinks")}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                isSectionActive("socialLinks")
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSectionActive("socialLinks") ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <span className="font-medium">Find Me Online</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Section Confirmation Modal */}
      <Dialog open={sectionToDelete !== null} onOpenChange={(open) => { if (!open) setSectionToDelete(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">Delete Section</DialogTitle>
            <DialogDescription className="text-gray-500">
              Are you sure you want to delete the <span className="font-medium text-gray-700">&quot;{sectionToDelete ? sectionNames[sectionToDelete] : ""}&quot;</span> section? All data in this section will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setSectionToDelete(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSection}
              className="cursor-pointer bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
