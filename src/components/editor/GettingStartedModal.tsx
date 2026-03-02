"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { Lock, Crown } from "lucide-react";

interface GettingStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: string) => void;
}

const options = [
  {
    id: "new",
    title: "Create new resume",
    description: "Start from scratch with a blank resume",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    proOnly: false,
  },
  {
    id: "upload",
    title: "Upload resume",
    description: "Import your existing resume file",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    proOnly: false,
  },
  {
    id: "linkedin",
    title: "Create with LinkedIn profile",
    description: "Import your profile from LinkedIn",
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    proOnly: true,
  },
];

export default function GettingStartedModal({
  isOpen,
  onClose,
  onSelectOption,
}: GettingStartedModalProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const { isPro, trialExpired, isLoading: subLoading } = useSubscription();
  const router = useRouter();

  if (!isOpen) return null;

  const handleOptionClick = (option: typeof options[0]) => {
    if (option.proOnly && trialExpired && !subLoading) {
      router.push("/pricing");
      onClose();
    } else {
      onSelectOption(option.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop — not dismissible */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Let's get started</h2>
          <p className="text-gray-500 mt-2">How do you want to create your resume?</p>
        </div>

        {/* Options */}
        <div className="px-6 pb-8 space-y-2">
          {options.map((option) => {
            const isLocked = option.proOnly && trialExpired && !subLoading;
            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setHoveredOption(option.id)}
                onMouseLeave={() => setHoveredOption(null)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isLocked
                    ? "border-gray-200 bg-gray-50 cursor-pointer"
                    : hoveredOption === option.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  isLocked
                    ? "bg-gray-200 text-gray-400"
                    : hoveredOption === option.id 
                    ? "bg-blue-100 text-blue-600" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {isLocked ? <Lock className="w-6 h-6" /> : option.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold flex items-center gap-2 ${isLocked ? "text-gray-500" : "text-gray-900"}`}>
                    {option.title}
                    {isLocked && (
                      <span className="inline-flex items-center text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <Crown className="w-3 h-3 mr-1" /> Pro
                      </span>
                    )}
                  </span>
                  <p className={`text-sm mt-0.5 ${isLocked ? "text-gray-400" : "text-gray-500"}`}>
                    {isLocked ? "Upgrade to Pro to unlock LinkedIn import" : option.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className={`flex-shrink-0 transition-transform ${
                  hoveredOption === option.id ? "translate-x-1" : ""
                }`}>
                  {isLocked ? (
                    <Crown className="w-5 h-5 text-amber-500" />
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}



