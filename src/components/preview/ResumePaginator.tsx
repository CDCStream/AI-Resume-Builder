"use client";

import { useRef, useState, useLayoutEffect, useEffect, ReactNode, useCallback } from "react";

interface ResumePaginatorProps {
  children: ReactNode;
}

const A4_HEIGHT_PX = 1122; // 297mm at 96dpi
const A4_WIDTH_PX = 794;   // 210mm at 96dpi
// If a section is smaller than this fraction of a page, avoid splitting it
const MAX_MOVABLE_RATIO = 0.6;

/**
 * Applies spacers before sections that would be split across page boundaries.
 * Modifies the DOM directly by inserting spacer divs.
 * Returns an array of { sectionIndex, spacerHeight } for replication to other containers.
 */
function calculateAndApplySpacers(container: HTMLElement): { sectionIndex: number; height: number }[] {
  // Remove old spacers first
  container.querySelectorAll(".pb-spacer").forEach((el) => el.remove());

  // Force reflow so positions are clean
  void container.offsetHeight;

  const sections = Array.from(container.querySelectorAll("section"));
  const spacers: { sectionIndex: number; height: number }[] = [];

  for (let i = 0; i < sections.length; i++) {
    const el = sections[i] as HTMLElement;
    // Re-read position each iteration (previous spacers shift things)
    const containerTop = container.getBoundingClientRect().top;
    const rect = el.getBoundingClientRect();
    const top = rect.top - containerTop;
    const bottom = top + rect.height;

    if (rect.height <= 0) continue;

    const pageOfTop = Math.floor(top / A4_HEIGHT_PX);
    const pageOfBottom = Math.floor(Math.max(0, bottom - 1) / A4_HEIGHT_PX);

    // Section crosses a page boundary AND is small enough to move
    if (pageOfTop !== pageOfBottom && rect.height < A4_HEIGHT_PX * MAX_MOVABLE_RATIO) {
      const pageEnd = (pageOfTop + 1) * A4_HEIGHT_PX;
      const spacerHeight = pageEnd - top;

      // Insert spacer before the section
      const spacerEl = document.createElement("div");
      spacerEl.className = "pb-spacer";
      spacerEl.style.height = `${spacerHeight}px`;
      spacerEl.style.flexShrink = "0";
      el.parentNode?.insertBefore(spacerEl, el);

      spacers.push({ sectionIndex: i, height: spacerHeight });
    }
  }

  return spacers;
}

/**
 * Applies pre-calculated spacers to a container (e.g. page content div).
 */
function applySpacers(container: HTMLElement, spacers: { sectionIndex: number; height: number }[]) {
  // Remove old spacers
  container.querySelectorAll(".pb-spacer").forEach((el) => el.remove());

  const sections = Array.from(container.querySelectorAll("section"));

  // Apply in order (from last to first to avoid index shifting)
  const sortedSpacers = [...spacers].sort((a, b) => b.sectionIndex - a.sectionIndex);

  for (const { sectionIndex, height } of sortedSpacers) {
    const el = sections[sectionIndex] as HTMLElement | undefined;
    if (el) {
      const spacerEl = document.createElement("div");
      spacerEl.className = "pb-spacer";
      spacerEl.style.height = `${height}px`;
      spacerEl.style.flexShrink = "0";
      el.parentNode?.insertBefore(spacerEl, el);
    }
  }
}

export default function ResumePaginator({ children }: ResumePaginatorProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const pageContentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const spacersRef = useRef<{ sectionIndex: number; height: number }[]>([]);
  const iterRef = useRef(0);

  useLayoutEffect(() => {
    if (!measureRef.current) return;

    // Calculate spacers from the measurement div
    const spacers = calculateAndApplySpacers(measureRef.current);
    spacersRef.current = spacers;

    // Measure adjusted height
    void measureRef.current.offsetHeight;
    const h = measureRef.current.scrollHeight;
    const pages = Math.max(1, Math.ceil(h / A4_HEIGHT_PX));

    // Apply same spacers to all visible page content divs
    pageContentRefs.current.forEach((el) => {
      if (el) applySpacers(el, spacers);
    });

    // Update page count (with stabilization guard)
    if (pages !== totalPages && iterRef.current < 4) {
      iterRef.current++;
      setTotalPages(pages);
    } else {
      iterRef.current = 0;
    }
  });

  // Reset stabilizer when children change
  useEffect(() => {
    iterRef.current = 0;
  }, [children]);

  return (
    <div className="flex flex-col items-center">
      {/* Hidden measurement div - same width as A4 */}
      <div
        ref={measureRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ width: `${A4_WIDTH_PX}px`, left: "-9999px" }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Visible pages */}
      {Array.from({ length: totalPages }, (_, pageIndex) => (
        <div key={pageIndex}>
          {/* Page divider */}
          {pageIndex > 0 && (
            <div className="flex items-center gap-4 py-5 no-print" style={{ width: `${A4_WIDTH_PX}px` }}>
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                Page {pageIndex + 1}
              </span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          )}

          {/* A4 page */}
          <div
            className="relative bg-white shadow-lg overflow-hidden"
            style={{
              width: `${A4_WIDTH_PX}px`,
              height: `${A4_HEIGHT_PX}px`,
            }}
          >
            <div
              ref={(el) => {
                pageContentRefs.current[pageIndex] = el;
              }}
              style={{
                transform: `translateY(-${pageIndex * A4_HEIGHT_PX}px)`,
              }}
            >
              {children}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
