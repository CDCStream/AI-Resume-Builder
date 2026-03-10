"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

export function LinkedInUrlHowTo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 transition-colors font-medium"
        title="How to copy LinkedIn job URL"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        How?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl overflow-hidden max-w-[640px] w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">How to copy a LinkedIn job URL</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <video
              src="/videos/Copy-linkedin-job-posting-url.mp4"
              controls
              autoPlay
              className="w-full"
              style={{ maxHeight: "70vh" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
