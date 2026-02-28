"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";
import { getConsentStatus, setConsentStatus } from "@/lib/cookie-consent";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!getConsentStatus()) setVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    setConsentStatus("accepted");
    setVisible(false);
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: "accepted" }));
  };

  const handleReject = () => {
    setConsentStatus("rejected");
    setVisible(false);
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: "rejected" }));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">Your Privacy Matters</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    We use cookies for analytics and to improve your experience. Your data is never sold or used to train AI models.{" "}
                    <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
                <button
                  onClick={handleReject}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl transition-all"
                >
                  Reject
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/25"
                >
                  Accept All
                </button>
              </div>

              <button
                onClick={handleReject}
                className="absolute top-3 right-3 sm:hidden p-1 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
