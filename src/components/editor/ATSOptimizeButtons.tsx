"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ATSOptimizeModal from "./ATSOptimizeModal";

interface ATSOptimizeButtonsProps {
  field: "professionalTitle" | "professionalSummary" | "workExperience" | "education" | "project" | "skill" | "volunteer" | "award" | "certificate" | "skillsSuggestion";
  fieldLabel: string;
  showOnlyTailored?: boolean;
  currentValue: string;
  context?: {
    name?: string;
    currentTitle?: string;
    skills?: string[];
    experience?: { position: string; company: string; summary: string }[];
  };
  onApply: (
    newValue: string,
    suggestedSkills?: { name: string; level: string }[],
    suggestedLanguages?: { language: string; fluency: string }[]
  ) => void;
  size?: "sm" | "default";
  className?: string;
}

export default function ATSOptimizeButtons({
  field,
  fieldLabel,
  currentValue,
  context,
  onApply,
  size = "sm",
  className = "",
  showOnlyTailored = false,
}: ATSOptimizeButtonsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"quick" | "tailored">("quick");

  const openQuickModal = () => {
    setModalType("quick");
    setModalOpen(true);
  };

  const openTailoredModal = () => {
    setModalType("tailored");
    setModalOpen(true);
  };

  return (
    <>
      <div className={`flex items-center gap-1 shrink-0 ${className}`}>
        {!showOnlyTailored && (
          <button
            type="button"
            onClick={openQuickModal}
            className="inline-flex items-center text-[10px] h-5 px-1.5 rounded border border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            title="Quick ATS Optimize"
          >
            <span className="mr-0.5 text-[10px]">⚡</span>
            Quick
          </button>
        )}
        <button
          type="button"
          onClick={openTailoredModal}
          className="inline-flex items-center text-[10px] h-5 px-1.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          title="Tailored ATS Optimize"
        >
          <span className="mr-0.5 text-[10px]">🎯</span>
          {showOnlyTailored ? "Suggest Skills from Job" : "Tailored"}
        </button>
      </div>

      <ATSOptimizeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        field={field}
        fieldLabel={fieldLabel}
        currentValue={currentValue}
        context={context}
        onApply={onApply}
      />
    </>
  );
}
