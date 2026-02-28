"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ATSOptimizeModal from "./ATSOptimizeModal";
import { Lock, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";

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
  const router = useRouter();
  const { isPro, trialExpired } = useSubscription();
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

  // If trial expired, show locked buttons
  if (trialExpired) {
    return (
      <div className={`flex flex-col items-end gap-1 shrink-0 ${className}`}>
        {!showOnlyTailored && (
          <button
            type="button"
            onClick={() => router.push("/pricing")}
            className="inline-flex items-center text-[10px] h-5 px-1.5 rounded border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed hover:bg-gray-100 transition-colors"
            title="Upgrade to Pro for AI optimization"
          >
            <Lock className="w-3 h-3 mr-0.5" />
            Quick
            <Crown className="w-3 h-3 ml-0.5 text-amber-400" />
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/pricing")}
          className={`inline-flex items-center rounded border transition-colors ${
            showOnlyTailored
              ? "text-sm h-8 px-3 font-medium border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed hover:bg-gray-100 shadow-sm"
              : "text-[10px] h-5 px-1.5 border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed hover:bg-gray-100"
          }`}
          title="Upgrade to Pro for AI optimization"
        >
          <Lock className={showOnlyTailored ? "w-4 h-4 mr-1" : "w-3 h-3 mr-0.5"} />
          {showOnlyTailored ? "AI Skills" : "Tailored"}
          <Crown className={showOnlyTailored ? "w-4 h-4 ml-1 text-amber-400" : "w-3 h-3 ml-0.5 text-amber-400"} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`flex flex-col items-end gap-1 shrink-0 ${className}`}>
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
          className={`inline-flex items-center rounded border transition-colors ${
            showOnlyTailored
              ? "text-sm h-8 px-3 font-medium border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 shadow-sm"
              : "text-[10px] h-5 px-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          }`}
          title="Tailored ATS Optimize"
        >
          <span className={showOnlyTailored ? "mr-1 text-sm" : "mr-0.5 text-[10px]"}>🎯</span>
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
