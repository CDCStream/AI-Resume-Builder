"use client";

import { useState, useEffect, useRef } from "react";
import ResumeEditor from "@/components/editor/ResumeEditor";
import GettingStartedModal from "@/components/editor/GettingStartedModal";
import { templates } from "@/components/templates";
import { Resume, defaultResume, emptyResume } from "@/lib/types/resume";

export default function Home() {
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [selectedTemplate, setSelectedTemplate] = useState("professional-white");
  const [scale, setScale] = useState(1);
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTemplate = templates.find((t) => t.id === selectedTemplate);
  const TemplateComponent = currentTemplate?.component;

  const handleSelectOption = (option: string) => {
    switch (option) {
      case "new":
        setResume(emptyResume);
        break;
      case "ai":
        // TODO: Open AI assistance modal
        setResume(emptyResume);
        break;
      case "upload":
        // TODO: Open file upload dialog
        break;
      case "linkedin":
        // TODO: Open LinkedIn import modal
        break;
      case "example":
        setResume(defaultResume);
        break;
    }
    setShowGettingStarted(false);
  };

  // A4 dimensions in pixels (at 96 DPI)
  const A4_HEIGHT = 1122; // 297mm
  const A4_WIDTH = 794; // 210mm

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const targetHeight = containerHeight * 0.95; // 95% of container height
        const newScale = targetHeight / A4_HEIGHT;
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
          className="flex-1 flex justify-center items-center overflow-hidden"
        >
          <div
            className="print:scale-100 print:transform-none"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center'
            }}
          >
            {TemplateComponent && <TemplateComponent resume={resume} />}
          </div>
        </div>
      </div>
    </>
  );
}
