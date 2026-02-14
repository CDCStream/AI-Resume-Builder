"use client";

import { useState, useEffect, useRef } from "react";
import ResumeEditor from "@/components/editor/ResumeEditor";
import GettingStartedModal from "@/components/editor/GettingStartedModal";
import LinkedInImportModal from "@/components/editor/LinkedInImportModal";
import ResumePaginator from "@/components/preview/ResumePaginator";
import { templates } from "@/components/templates";
import { Resume, defaultResume, emptyResume } from "@/lib/types/resume";

export default function Home() {
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [selectedTemplate, setSelectedTemplate] = useState("professional-white");
  const [scale, setScale] = useState(1);
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        <div
          ref={containerRef}
          className="flex-1 overflow-auto"
        >
          <div
            className="py-8 flex justify-center print:scale-100 print:transform-none print:py-0"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            <ResumePaginator>
              {TemplateComponent && <TemplateComponent resume={resume} />}
            </ResumePaginator>
          </div>
        </div>
      </div>
    </>
  );
}
