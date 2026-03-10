"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const templates = [
  { id: "professional-white", name: "Professional White", person: "Grace Hall", role: "Marketing Manager", image: "/professional-white.png" },
  { id: "modern-sidebar", name: "Modern Sidebar", person: "Aiden Williams", role: "Full Stack Developer", image: "/modern-sidebar.png" },
  { id: "creative-timeline", name: "Creative Timeline", person: "Maeve Delaney", role: "UX/UI Designer", image: "/creative-timeline.png" },
  { id: "executive-dark", name: "Executive Dark", person: "Marcus Chen", role: "Chief Financial Officer", image: "/executive-dark.png" },
  { id: "professional-teal", name: "Professional Teal", person: "Sarah Nakamura", role: "Data Scientist", image: "/professional-teal.png" },
  { id: "modern-grid", name: "Modern Grid", person: "James O'Brien", role: "Product Manager", image: "/modern-grid.png" },
  { id: "classic-traditional", name: "Classic Traditional", person: "Ellen Johnson", role: "HR Director", image: "/classic-traditional.png" },
  { id: "minimalist-clean", name: "Minimalist Clean", person: "Grace Jackson", role: "Content Strategist", image: "/minimalist-clean.png" },
  { id: "professional-navy", name: "Professional Navy", person: "David Kim", role: "Cloud Architect", image: "/professional-navy.png" },
  { id: "modern-accent", name: "Modern Accent", person: "Priya Sharma", role: "Business Analyst", image: "/modern-accent.png" },
  { id: "creative-gradient", name: "Creative Gradient", person: "Leo Torres", role: "Brand Designer", image: "/creative-gradient.png" },
  { id: "creative-bold", name: "Creative Bold", person: "Zara Mitchell", role: "Digital Marketing Lead", image: "/creative-bold.png" },
  { id: "minimalist-line", name: "Minimalist Line", person: "Thomas Berg", role: "Financial Analyst", image: "/minimalist-line.png" },
  { id: "minimalist-elegant", name: "Minimalist Elegant", person: "Olivia Chen", role: "Project Manager", image: "/minimalist-elegant.png" },
];

const VISIBLE_DESKTOP = 5;
const VISIBLE_TABLET = 3;
const VISIBLE_MOBILE = 2;
const AUTO_PLAY_MS = 4000;
const TOTAL = templates.length;

interface TemplateCarouselProps {
  onSelect: () => void;
}

export function TemplateCarousel({ onSelect }: TemplateCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(VISIBLE_DESKTOP);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth < 640) setVisibleCount(VISIBLE_MOBILE);
      else if (window.innerWidth < 1024) setVisibleCount(VISIBLE_TABLET);
      else setVisibleCount(VISIBLE_DESKTOP);
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  const maxIndex = TOTAL - visibleCount;

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goNext, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const totalPages = maxIndex + 1;
  const activePage = activeIndex;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Arrow Left */}
      <button
        onClick={goPrev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all border border-gray-200"
        aria-label="Previous templates"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* Arrow Right */}
      <button
        onClick={goNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all border border-gray-200"
        aria-label="Next templates"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>

      {/* Carousel Track */}
      <div
        className="overflow-hidden px-8 sm:px-16"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${activeIndex * (100 / visibleCount)}%)`,
          }}
        >
          {templates.map((t, idx) => {
            const isNearVisible = idx >= activeIndex - 1 && idx <= activeIndex + visibleCount;
            return (
              <div
                key={t.id}
                className="shrink-0 px-2 sm:px-3"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <div
                  className="group cursor-pointer"
                  onClick={onSelect}
                >
                  <div className="relative rounded-xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    <div className="relative aspect-[3/4.2]">
                      <Image
                        src={t.image}
                        alt={`${t.name} resume template — ${t.person}, ${t.role}`}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
                        loading={idx < 5 ? "eager" : "lazy"}
                        quality={60}
                        {...(idx < 3 ? { priority: true } : {})}
                        placeholder={isNearVisible ? undefined : "empty"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/90 via-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                        <span className="text-white font-semibold text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                          Use This Template
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <h3 className="font-semibold text-gray-900 text-sm">{t.name}</h3>
                    <p className="text-xs text-gray-500">{t.person} — {t.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-8">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === activePage
                ? "w-6 h-2.5 bg-blue-600"
                : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
