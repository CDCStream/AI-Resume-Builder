"use client";

import { useState } from "react";
import { Star, X, Loader2, Heart } from "lucide-react";
import { insertFeedback } from "@/lib/supabase/database";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: "resume_pdf" | "cover_letter_pdf" | "digital_portfolio";
}

export default function FeedbackModal({ isOpen, onClose, source }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await insertFeedback(rating, source, comment.trim() || undefined);
      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } catch {
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {!submitted ? (
          <>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="px-8 pt-8 pb-2 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">How was your experience?</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Your feedback helps us improve LinImpact.ai
              </p>
            </div>

            <div className="px-8 pb-8">
              <div className="flex justify-center gap-2 my-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors duration-150 ${
                        star <= displayRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-200"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {displayRating > 0 && (
                <p className="text-center text-sm font-medium text-gray-600 mb-4">
                  {ratingLabels[displayRating]}
                </p>
              )}

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what you think... (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none resize-none"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  className={`flex-1 h-11 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    rating > 0
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Feedback"
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-8 py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-green-600 fill-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Thank you!</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Your feedback means a lot to us.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
