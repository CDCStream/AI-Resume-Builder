"use client";

import { useState } from "react";
import { Resume } from "@/lib/types/resume";

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (resume: Resume) => void;
}

export default function LinkedInImportModal({
  isOpen,
  onClose,
  onImport,
}: LinkedInImportModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"input" | "loading" | "success" | "error">("input");

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!url.trim()) {
      setError("Please enter a LinkedIn profile URL");
      return;
    }

    // Basic URL validation
    if (!/linkedin\.com\/in\//i.test(url)) {
      setError("Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)");
      return;
    }

    setError("");
    setLoading(true);
    setStep("loading");

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import profile");
      }

      if (data.resume) {
        setStep("success");
        // Short delay to show success state
        setTimeout(() => {
          onImport(data.resume);
          onClose();
          resetState();
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setUrl("");
    setError("");
    setStep("input");
    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetState();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        {!loading && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Import from LinkedIn</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Enter your LinkedIn profile URL to auto-fill your resume
          </p>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {/* Input Step */}
          {(step === "input" || step === "error") && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">LinkedIn Profile URL</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError(""); }}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleImport()}
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                onClick={handleImport}
                disabled={!url.trim()}
                className={`w-full mt-4 h-12 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  url.trim()
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Import Profile
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                Make sure your LinkedIn profile is public for best results
              </p>
            </>
          )}

          {/* Loading Step */}
          {step === "loading" && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              </div>
              <h3 className="font-semibold text-gray-900">Importing your profile...</h3>
              <p className="text-sm text-gray-500 mt-2">
                This may take 30-60 seconds. Please don&apos;t close this window.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Connecting to LinkedIn...
                </div>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Profile imported successfully!</h3>
              <p className="text-sm text-gray-500 mt-2">
                Your resume is being populated with LinkedIn data...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

