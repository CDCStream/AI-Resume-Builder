"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ResumeEditor from "@/components/editor/ResumeEditor";
import GettingStartedModal from "@/components/editor/GettingStartedModal";
import LinkedInImportModal from "@/components/editor/LinkedInImportModal";
import ResumePaginator, { ResumePaginatorRef } from "@/components/preview/ResumePaginator";
import { templates } from "@/components/templates";
import { Resume, defaultResume, emptyResume } from "@/lib/types/resume";
import { Edit3, Eye, Type, ChevronUp, ChevronDown, RotateCcw, X } from "lucide-react";

type ViewMode = "edit" | "page";

export default function Home() {
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [selectedTemplate, setSelectedTemplate] = useState("professional-white");
  const [scale, setScale] = useState(1);
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("page");
  const [isTextEditMode, setIsTextEditMode] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [showEditModePopup, setShowEditModePopup] = useState(false);
  const [showTextEditPopup, setShowTextEditPopup] = useState(false);
  const [hasSeenEditModePopup, setHasSeenEditModePopup] = useState(false);
  const [hasSeenTextEditPopup, setHasSeenTextEditPopup] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const paginatorRef = useRef<ResumePaginatorRef>(null);

  // Show Edit Mode popup on first page load
  useEffect(() => {
    if (!hasSeenEditModePopup) {
      const timer = setTimeout(() => {
        setShowEditModePopup(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenEditModePopup]);

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
        // TODO: Open file upload dialog
        setShowGettingStarted(false);
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

      <div className="flex h-screen bg-gray-100">
        {/* Left Panel - Editor */}
        <div className="w-[480px] bg-white border-r border-gray-200 flex-shrink-0 no-print">
          <ResumeEditor
            resume={resume}
            onResumeChange={setResume}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
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
            <div ref={previewRef}>
              <ResumePaginator
                ref={paginatorRef}
                viewMode={viewMode}
                isTextEditMode={isTextEditMode}
                onElementSelect={handleElementSelect}
              >
                {TemplateComponent && <TemplateComponent resume={resume} />}
              </ResumePaginator>
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
