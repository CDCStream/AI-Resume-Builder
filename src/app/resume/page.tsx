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
import { Edit3, Eye, Type, ChevronUp, ChevronDown, RotateCcw, X, Loader2 } from "lucide-react";
import { exportResumeToPDF } from "@/lib/utils/pdfExport";
import { createResume, updateResume, getResumeById, SavedResume } from "@/lib/store/documentStore";

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
  // Document save state
  const [currentDocument, setCurrentDocument] = useState<SavedResume | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const paginatorRef = useRef<ResumePaginatorRef>(null);

  const handleDownloadPDF = useCallback(async () => {
    if (!previewRef.current || isExportingPDF) return;
    
    setIsExportingPDF(true);
    try {
      const resumeName = resume.basics?.name || "resume";
      const filename = `${resumeName.replace(/\s+/g, "_")}_CV.pdf`;
      await exportResumeToPDF(previewRef.current, { filename });
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsExportingPDF(false);
    }
  }, [resume.basics?.name, isExportingPDF]);

  // Track unsaved changes
  useEffect(() => {
    const currentState = JSON.stringify({ resume, selectedTemplate });
    if (lastSavedState && currentState !== lastSavedState) {
      setHasUnsavedChanges(true);
    }
  }, [resume, selectedTemplate, lastSavedState]);

  // Handle save
  const handleSave = useCallback((name: string) => {
    setIsSaving(true);
    try {
      if (currentDocument) {
        // Update existing document
        const updated = updateResume(currentDocument.id, {
          name,
          resumeData: resume,
          templateId: selectedTemplate,
        });
        if (updated) {
          setCurrentDocument(updated);
        }
      } else {
        // Create new document
        const newDoc = createResume(name, resume, selectedTemplate);
        setCurrentDocument(newDoc);
        // Update URL with new document ID
        router.push(`/resume?id=${newDoc.id}`, { scroll: false });
      }
      const savedState = JSON.stringify({ resume, selectedTemplate });
      setLastSavedState(savedState);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }, [currentDocument, resume, selectedTemplate, router]);

  // Handle rename
  const handleRename = useCallback((newName: string) => {
    if (currentDocument) {
      const updated = updateResume(currentDocument.id, { name: newName });
      if (updated) {
        setCurrentDocument(updated);
      }
    }
  }, [currentDocument]);

  // Load saved document if ID is provided in URL
  useEffect(() => {
    if (documentId) {
      setIsLoadingDocument(true);
      const savedDoc = getResumeById(documentId);
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
      }
      setIsLoadingDocument(false);
    }
  }, [documentId]);

  // Show Edit Mode popup on first page load
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
        // TODO: Open AI assistance modal
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
        return; // Don't close getting started yet
      case "example":
        setResume(defaultResume);
        setShowGettingStarted(false);
        break;
    }
  };

  const handleLinkedInImport = (importedResume: Resume) => {
    setResume(importedResume);
    setShowLinkedInModal(false);
  };

  const handleUploadImport = (importedResume: Resume) => {
    setResume(importedResume);
    setShowUploadModal(false);
  };

  const handleElementSelect = useCallback((selected: boolean) => {
    setHasSelection(selected);
  }, []);

  const A4_WIDTH = 794; // 210mm at 96dpi

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

  return (
    <>
      {/* Getting Started Modal */}
      <GettingStartedModal
        isOpen={showGettingStarted}
        onClose={() => setShowGettingStarted(false)}
        onSelectOption={handleSelectOption}
      />

      {/* LinkedIn Import Modal */}
      <LinkedInImportModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
        onImport={handleLinkedInImport}
      />

      {/* Upload Resume Modal */}
      <UploadResumeModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImport={handleUploadImport}
      />

      <div className="flex h-screen bg-gray-100">
        {/* Left Panel - Editor */}
        <div className="w-[480px] bg-white border-r border-gray-200 flex-shrink-0 no-print">
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
            onSave={handleSave}
            onRename={handleRename}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>

        {/* Right Panel - Preview */}
        <div ref={containerRef} className="flex-1 overflow-auto">
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
              
              {/* Zone Info Badge */}
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

        {/* Floating Controls - Outside of scaled container */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 no-print">
          {/* Text Edit Controls (only in edit mode with selection) */}
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

          {/* Reset Margins Button (only in edit mode with text edit) */}
          {viewMode === "edit" && isTextEditMode && (
            <button
              onClick={() => paginatorRef.current?.resetMargins()}
              className="p-3 rounded-full shadow-xl transition-all duration-200 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 mr-2"
              title="Reset to Default"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}

          {/* Edit Text Button (only in edit mode) */}
          {viewMode === "edit" && (
            <button
              onClick={() => {
                const newValue = !isTextEditMode;
                setIsTextEditMode(newValue);
                // Show popup on first text edit activation
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

          {/* Mode Toggle Button */}
          <button
            onClick={() => {
              const newMode = viewMode === "edit" ? "page" : "edit";
              setViewMode(newMode);
              // Auto-activate text edit mode when switching to edit mode
              if (newMode === "edit") {
                setIsTextEditMode(true);
                // Show popup on first text edit activation
                if (!hasSeenTextEditPopup) {
                  setShowTextEditPopup(true);
                  setHasSeenTextEditPopup(true);
                }
              } else {
                setIsTextEditMode(false);
              }
              setHasSelection(false);
              // Close edit mode popup when switching
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

        {/* Edit Mode Introduction Popup (shown on first page load) */}
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

        {/* Text Edit Help Popup (shown on first text edit activation) */}
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

        {/* Help tooltip for text edit mode (always visible when in text edit mode, after popup is dismissed) */}
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
    </>
  );
}

export default function ResumePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
