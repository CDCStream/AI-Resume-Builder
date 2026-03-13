"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResumeEditor from "@/components/editor/ResumeEditor";
import GettingStartedModal from "@/components/editor/GettingStartedModal";
import LinkedInImportModal from "@/components/editor/LinkedInImportModal";
import UploadResumeModal from "@/components/editor/UploadResumeModal";
import ResumePaginator, { ResumePaginatorRef } from "@/components/preview/ResumePaginator";
import { templates } from "@/components/templates";
import { Resume, defaultResume, emptyResume } from "@/lib/types/resume";
import { Edit3, Eye, Type, ChevronUp, ChevronDown, RotateCcw, X, Loader2, PanelLeft, FileText } from "lucide-react";
import { exportResumeToPDF } from "@/lib/utils/pdfExport";
import { useResumes, SavedResume } from "@/hooks/useResumes";
import { useSubscription } from "@/hooks/useSubscription";
import { hasUserGivenFeedback, syncCvPhotoToProfile } from "@/lib/supabase/database";
import FeedbackModal from "@/components/ui/FeedbackModal";
import { useAuth } from "@/contexts/AuthContext";
import { trackAction } from "@/lib/activity-tracker";

type ViewMode = "edit" | "page";

interface HeatmapZone {
  id: string;
  name: string;
  section: string;
  attention: "high" | "medium" | "low" | "none";
  timeSpent: number;
}

function ResumeEditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const documentId = searchParams.get("id");

  const {
    getResumeById,
    createResume,
    updateResume,
    loading: resumesLoading,
    isAuthenticated,
  } = useResumes();

  const { user, avatarUrl, refreshProfile } = useAuth();

  const [resume, setResume] = useState<Resume>(defaultResume);
  const [selectedTemplate, setSelectedTemplate] = useState("professional-white");
  const [scale, setScale] = useState(1);
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("page");
  const [isTextEditMode, setIsTextEditMode] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [showEditModePopup, setShowEditModePopup] = useState(false);
  const [showTextEditPopup, setShowTextEditPopup] = useState(false);
  const [hasSeenEditModePopup, setHasSeenEditModePopup] = useState(false);
  const [hasSeenTextEditPopup, setHasSeenTextEditPopup] = useState(false);
  const [activeHeatmapZone, setActiveHeatmapZone] = useState<HeatmapZone | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<SavedResume | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [mobilePanel, setMobilePanel] = useState<"editor" | "preview">("editor");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const documentLoadedRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const paginatorRef = useRef<ResumePaginatorRef>(null);

  const { isPro } = useSubscription();
  const hasPaidPlan = isPro;

  const handleDownloadPDF = useCallback(async () => {
    if (!previewRef.current || isExportingPDF) return;

    setIsExportingPDF(true);
    try {
      const resumeName = resume.basics?.name || "resume";
      const filename = `${resumeName.replace(/\s+/g, "_")}_CV.pdf`;

      await exportResumeToPDF(previewRef.current, {
        filename,
        showWatermark: !hasPaidPlan,
      });

      if (user?.id) {
        trackAction(user.id, "download_pdf", "/resume", { template: selectedTemplate, hasPaidPlan });
      }

      const alreadyGiven = await hasUserGivenFeedback("resume_pdf");
      if (!alreadyGiven) {
        setShowFeedbackModal(true);
      }
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsExportingPDF(false);
    }
  }, [resume.basics?.name, isExportingPDF, hasPaidPlan]);

  useEffect(() => {
    const currentState = JSON.stringify({ resume, selectedTemplate });
    if (lastSavedState && currentState !== lastSavedState) {
      setHasUnsavedChanges(true);
    }
  }, [resume, selectedTemplate, lastSavedState]);

  const handleSave = useCallback(async (name: string) => {
    setIsSaving(true);
    try {
      if (currentDocument) {
        const updated = await updateResume(currentDocument.id, {
          name,
          resumeData: resume,
          templateId: selectedTemplate,
        });
        if (updated) {
          setCurrentDocument(updated);
        }
      } else {
        const newDoc = await createResume(name, resume, selectedTemplate);
        if (newDoc) {
          setCurrentDocument(newDoc);
          router.push(`/resume?id=${newDoc.id}`, { scroll: false });
        }
      }
      if (user?.id) {
        trackAction(user.id, "save_resume", "/resume", { template: selectedTemplate, isNew: !currentDocument });
      }

      const savedState = JSON.stringify({ resume, selectedTemplate });
      setLastSavedState(savedState);
      setHasUnsavedChanges(false);

      if (resume.basics?.image && !avatarUrl && user?.id) {
        syncCvPhotoToProfile(user.id, resume.basics.image)
          .then(() => refreshProfile())
          .catch(() => {});
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }, [currentDocument, resume, selectedTemplate, router, createResume, updateResume, avatarUrl, user?.id, refreshProfile]);

  useEffect(() => {
    if (!currentDocument || !hasUnsavedChanges) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        const updated = await updateResume(currentDocument.id, {
          name: currentDocument.name,
          resumeData: resume,
          templateId: selectedTemplate,
        });
        if (updated) {
          setCurrentDocument(updated);
        }
        const savedState = JSON.stringify({ resume, selectedTemplate });
        setLastSavedState(savedState);
        setHasUnsavedChanges(false);
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);

        if (resume.basics?.image && !avatarUrl && user?.id) {
          syncCvPhotoToProfile(user.id, resume.basics.image)
            .then(() => refreshProfile())
            .catch(() => {});
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
        setAutoSaveStatus("idle");
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [resume, selectedTemplate, currentDocument, hasUnsavedChanges, updateResume, avatarUrl, user?.id, refreshProfile]);

  const handleRename = useCallback(async (newName: string) => {
    if (currentDocument) {
      const updated = await updateResume(currentDocument.id, { name: newName });
      if (updated) {
        setCurrentDocument(updated);
      }
    }
  }, [currentDocument, updateResume]);

  useEffect(() => {
    const loadDocument = async () => {
      if (documentId && isAuthenticated) {
        // Skip if this document is already loaded (prevents re-fetch on token refresh)
        if (documentLoadedRef.current === documentId) return;

        setIsLoadingDocument(true);
        const savedDoc = await getResumeById(documentId);
        if (savedDoc) {
          setResume(savedDoc.resumeData);
          setSelectedTemplate(savedDoc.templateId);
          setCurrentDocument(savedDoc);
          setShowGettingStarted(false);
          const savedState = JSON.stringify({
            resume: savedDoc.resumeData,
            selectedTemplate: savedDoc.templateId,
          });
          setLastSavedState(savedState);
          setHasUnsavedChanges(false);
          documentLoadedRef.current = documentId;
        }
        setIsLoadingDocument(false);
      }
    };
    loadDocument();
  }, [documentId, isAuthenticated, getResumeById]);

  useEffect(() => {
    if (!hasSeenEditModePopup && !documentId) {
      const timer = setTimeout(() => {
        setShowEditModePopup(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenEditModePopup, documentId]);

  const currentTemplate = templates.find((t) => t.id === selectedTemplate);
  const TemplateComponent = currentTemplate?.component;

  const handleSelectOption = (option: string) => {
    switch (option) {
      case "new":
        setResume(emptyResume);
        setShowGettingStarted(false);
        break;
      case "ai":
        setResume(emptyResume);
        setShowGettingStarted(false);
        break;
      case "upload":
        setShowGettingStarted(false);
        setShowUploadModal(true);
        break;
      case "linkedin":
        setShowGettingStarted(false);
        setShowLinkedInModal(true);
        return;
      case "example":
        setResume(defaultResume);
        setShowGettingStarted(false);
        break;
    }
  };

  const autoCreateDocument = useCallback(async (importedResume: Resume) => {
    if (!isAuthenticated || currentDocument) return;
    try {
      const name = importedResume.basics?.name || "My Resume";
      const docName = `${name}'s Resume`;
      const newDoc = await createResume(docName, importedResume, selectedTemplate);
      if (newDoc) {
        setCurrentDocument(newDoc);
        const savedState = JSON.stringify({ resume: importedResume, selectedTemplate });
        setLastSavedState(savedState);
        setHasUnsavedChanges(false);
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
        router.push(`/resume?id=${newDoc.id}`, { scroll: false });

        if (importedResume.basics?.image && !avatarUrl && user?.id) {
          syncCvPhotoToProfile(user.id, importedResume.basics.image)
            .then(() => refreshProfile())
            .catch(() => {});
        }
      }
    } catch (error) {
      console.error("Auto-create document failed:", error);
    }
  }, [isAuthenticated, currentDocument, selectedTemplate, createResume, router, avatarUrl, user?.id, refreshProfile]);

  const handleLinkedInImport = (importedResume: Resume) => {
    setResume(importedResume);
    setShowLinkedInModal(false);
    autoCreateDocument(importedResume);
  };

  const handleUploadImport = (importedResume: Resume) => {
    setResume(importedResume);
    setShowUploadModal(false);
    autoCreateDocument(importedResume);
  };

  const handleElementSelect = useCallback((selected: boolean) => {
    setHasSelection(selected);
  }, []);

  const A4_WIDTH = 794;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const targetWidth = containerWidth * 0.85;
        const newScale = Math.min(targetWidth / A4_WIDTH, 1);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  if (resumesLoading || isLoadingDocument) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <GettingStartedModal
        isOpen={showGettingStarted}
        onClose={() => setShowGettingStarted(false)}
        onSelectOption={handleSelectOption}
      />

      <LinkedInImportModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
        onBack={() => { setShowLinkedInModal(false); setShowGettingStarted(true); }}
        onImport={handleLinkedInImport}
      />

      <UploadResumeModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onBack={() => { setShowUploadModal(false); setShowGettingStarted(true); }}
        onImport={handleUploadImport}
      />

      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-cyan-50">
        <div className={`w-full lg:w-[480px] bg-white border-r border-gray-200 flex-shrink-0 no-print ${mobilePanel === "preview" ? "hidden lg:block" : "block"}`}>
          <ResumeEditor
            resume={resume}
            onResumeChange={setResume}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            onHeatmapZoneChange={setActiveHeatmapZone}
            onDownloadPDF={handleDownloadPDF}
            isExportingPDF={isExportingPDF}
            documentId={currentDocument?.id || null}
            documentName={currentDocument?.name}
            documentUpdatedAt={currentDocument?.updatedAt}
            onSave={handleSave}
            onRename={handleRename}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            autoSaveStatus={autoSaveStatus}
          />
        </div>

        <div ref={containerRef} className={`flex-1 overflow-auto ${mobilePanel === "editor" ? "hidden lg:block" : "block"}`}>
          <div
            className="py-8 flex justify-center print:scale-100 print:transform-none print:py-0"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            <div ref={previewRef} className="relative">
              <ResumePaginator
                ref={paginatorRef}
                viewMode={viewMode}
                isTextEditMode={isTextEditMode}
                onElementSelect={handleElementSelect}
              >
                {TemplateComponent && <TemplateComponent resume={resume} />}
              </ResumePaginator>

              {activeHeatmapZone && (
                <div className="absolute top-4 right-4 pointer-events-none z-50">
                  <div
                    className="px-4 py-2 rounded-xl shadow-2xl text-white text-sm font-semibold flex items-center gap-2"
                    style={{
                      background: activeHeatmapZone.attention === "high"
                        ? "rgb(34, 197, 94)"
                        : activeHeatmapZone.attention === "medium"
                        ? "rgb(234, 179, 8)"
                        : activeHeatmapZone.attention === "low"
                        ? "rgb(249, 115, 22)"
                        : "rgb(239, 68, 68)",
                    }}
                  >
                    <Eye className="w-5 h-5" />
                    <div>
                      <div>{activeHeatmapZone.name}</div>
                      <div className="text-xs opacity-90">{activeHeatmapZone.timeSpent}s attention</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setMobilePanel(mobilePanel === "editor" ? "preview" : "editor")}
          className="fixed bottom-6 left-6 z-50 lg:hidden p-3.5 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 no-print"
          title={mobilePanel === "editor" ? "Show Preview" : "Show Editor"}
        >
          {mobilePanel === "editor" ? <FileText className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>

        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 no-print">
          {viewMode === "edit" && isTextEditMode && hasSelection && (
            <div className="flex items-center gap-1 bg-white rounded-full shadow-xl border border-gray-200 p-1 mr-2">
              <button
                onClick={() => paginatorRef.current?.moveElement("up")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Reduce space above (Delete)"
              >
                <ChevronUp className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => paginatorRef.current?.moveElement("down")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Add space below (Enter)"
              >
                <ChevronDown className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}

          {viewMode === "edit" && isTextEditMode && (
            <button
              onClick={() => paginatorRef.current?.resetMargins()}
              className="p-3 rounded-full shadow-xl transition-all duration-200 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 mr-2"
              title="Reset to Default"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}

          {viewMode === "edit" && (
            <button
              onClick={() => {
                const newValue = !isTextEditMode;
                setIsTextEditMode(newValue);
                if (newValue && !hasSeenTextEditPopup) {
                  setShowTextEditPopup(true);
                  setHasSeenTextEditPopup(true);
                }
              }}
              className={`p-3 rounded-full shadow-xl transition-all duration-200 ${
                isTextEditMode
                  ? "bg-blue-500 hover:bg-blue-600 text-white ring-4 ring-blue-200"
                  : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
              }`}
              title={isTextEditMode ? "Close Text Edit" : "Edit Text"}
            >
              <Type className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => {
              const newMode = viewMode === "edit" ? "page" : "edit";
              setViewMode(newMode);
              if (newMode === "edit") {
                setIsTextEditMode(true);
                if (!hasSeenTextEditPopup) {
                  setShowTextEditPopup(true);
                  setHasSeenTextEditPopup(true);
                }
              } else {
                setIsTextEditMode(false);
              }
              setHasSelection(false);
              setShowEditModePopup(false);
            }}
            className={`p-3 rounded-full shadow-xl transition-all duration-200 flex items-center gap-2 ${
              viewMode === "edit"
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
            }`}
            title={viewMode === "edit" ? "Switch to Preview Mode" : "Switch to Edit Mode"}
          >
            {viewMode === "edit" ? (
              <>
                <Eye className="w-5 h-5" />
                <span className="text-sm font-medium pr-1">Preview</span>
              </>
            ) : (
              <>
                <Edit3 className="w-5 h-5" />
                <span className="text-sm font-medium pr-1">Edit</span>
              </>
            )}
          </button>
        </div>

        {showEditModePopup && !showGettingStarted && (
          <div className="fixed bottom-20 right-6 z-50 bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm rounded-xl px-5 py-4 shadow-2xl max-w-sm backdrop-blur-sm border border-blue-500 no-print animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => {
                setShowEditModePopup(false);
                setHasSeenEditModePopup(true);
              }}
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Edit Mode
            </p>
            <p className="text-blue-100 text-xs leading-relaxed mb-3">
              Click the <strong className="text-white">Edit</strong> button to switch to Edit Mode.
              In this mode, you can see page break lines and adjust text positioning across pages.
            </p>
            <button
              onClick={() => {
                setShowEditModePopup(false);
                setHasSeenEditModePopup(true);
              }}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        )}

        {showTextEditPopup && (
          <div className="fixed bottom-20 right-6 z-50 bg-gray-900/95 text-white text-sm rounded-xl px-5 py-4 shadow-2xl max-w-sm backdrop-blur-sm border border-gray-700 no-print animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setShowTextEditPopup(false)}
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Type className="w-4 h-4" /> Text Editing
            </p>
            <ul className="space-y-1.5 text-gray-300 text-xs">
              <li>• Click on any section or line in the CV</li>
              <li>• Selected items are highlighted with a blue border</li>
              <li>
                • <strong className="text-white">Enter</strong>: Add space below the selected item
              </li>
              <li>
                • <strong className="text-white">Delete</strong>: Reduce space above the selected item
              </li>
              <li>• Use arrow buttons for the same actions</li>
              <li>• Use the ↩️ button to reset all adjustments</li>
            </ul>
            <button
              onClick={() => setShowTextEditPopup(false)}
              className="mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        )}

        {viewMode === "edit" && isTextEditMode && !showTextEditPopup && (
          <div className="fixed bottom-20 right-6 z-50 bg-gray-900/95 text-white text-sm rounded-xl px-4 py-3 shadow-2xl max-w-xs backdrop-blur-sm border border-gray-700 no-print">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Type className="w-4 h-4" /> Text Editing
            </p>
            <ul className="space-y-1 text-gray-300 text-xs">
              <li>• Click on any section or line in the CV</li>
              <li>• Selected items are highlighted with a blue border</li>
              <li>
                • <strong className="text-white">Enter</strong>: Add space below
              </li>
              <li>
                • <strong className="text-white">Delete</strong>: Reduce space above
              </li>
              <li>• Use arrow buttons for the same actions</li>
              <li>• Use ↩️ button to reset all adjustments</li>
            </ul>
          </div>
        )}
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        source="resume_pdf"
      />
    </>
  );
}

export default function ResumePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    }>
      <ResumeEditorContent />
    </Suspense>
  );
}
