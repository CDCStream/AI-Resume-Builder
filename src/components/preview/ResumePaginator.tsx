"use client";

import { useRef, useState, useLayoutEffect, useEffect, ReactNode } from "react";

interface ResumePaginatorProps {
  children: ReactNode;
}

const A4_HEIGHT_PX = 1122;
const A4_WIDTH_PX = 794;
// Template padding (p-12 = 48px) creates offset between measured position and actual clip boundary.
// The outer page div clips at A4_HEIGHT_PX, but sections are measured relative to the content wrapper
// which includes the template's padding. We need extra space to ensure sections clear the page boundary.
const BUFFER = 48;

function getOffsetRelativeTo(element: HTMLElement, ancestor: HTMLElement): number {
  let top = 0;
  let el: HTMLElement | null = element;
  while (el && el !== ancestor) {
    top += el.offsetTop;
    el = el.offsetParent as HTMLElement | null;
    if (el === ancestor) break;
  }
  return top;
}

export default function ResumePaginator({ children }: ResumePaginatorProps) {
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const firstPageRef = useRef<HTMLDivElement>(null);
  const [totalPages, setTotalPages] = useState(1);

  useLayoutEffect(() => {
    if (!pagesContainerRef.current || !firstPageRef.current) return;

    const firstPage = firstPageRef.current;
    const pagesContainer = pagesContainerRef.current;
    const allPages = Array.from(pagesContainer.querySelectorAll(".page-content")) as HTMLElement[];

    // Step 1: Clear ALL margins from ALL pages
    allPages.forEach((page) => {
      page.querySelectorAll("section").forEach((sec) => {
        (sec as HTMLElement).style.marginTop = "";
      });
      page.querySelectorAll(".resume-item").forEach((item) => {
        (item as HTMLElement).style.marginTop = "";
      });
    });

    void firstPage.offsetHeight; // Force reflow

    // Step 2: Measure sections from FIRST page (real layout, no margins)
    const sectionEls = Array.from(firstPage.querySelectorAll("section")) as HTMLElement[];

    const sections = sectionEls.map((section, si) => {
      const items = Array.from(section.querySelectorAll(".resume-item")) as HTMLElement[];
      return {
        index: si,
        top: getOffsetRelativeTo(section, firstPage),
        height: section.offsetHeight,
        splittable: section.getAttribute("data-splittable") === "true",
        items: items.map((item, ii) => ({
          index: ii,
          top: getOffsetRelativeTo(item, firstPage),
          height: item.offsetHeight,
        })),
      };
    });

    sections.sort((a, b) => a.top - b.top);

    // Step 3: Calculate margins
    const sectionMargins = new Map<number, number>();
    const itemMargins = new Map<string, number>();
    let cumulativeShift = 0;

    for (const section of sections) {
      const adjTop = section.top + cumulativeShift;
      const adjBottom = adjTop + section.height;
      const pageEnd = (Math.floor(adjTop / A4_HEIGHT_PX) + 1) * A4_HEIGHT_PX;

      if (adjBottom > pageEnd && adjTop < pageEnd) {
        const margin = pageEnd - adjTop + BUFFER;

        if (section.splittable) {
          // Splittable sections (e.g. Experience in CreativeBold) - don't push the whole section,
          // just let it flow naturally across pages. No margin needed.
          // Skip - let the content break across pages
        } else if (section.height <= A4_HEIGHT_PX * 0.93) {
          sectionMargins.set(section.index, margin);
          cumulativeShift += margin;
        } else {
          for (const item of section.items) {
            const iTop = item.top + cumulativeShift;
            const iBottom = iTop + item.height;
            const iPageEnd = (Math.floor(iTop / A4_HEIGHT_PX) + 1) * A4_HEIGHT_PX;

            if (iBottom > iPageEnd && iTop < iPageEnd && item.height <= A4_HEIGHT_PX * 0.9) {
              if (item.index === 0) {
                const sm = pageEnd - adjTop + BUFFER;
                sectionMargins.set(section.index, sm);
                cumulativeShift += sm;
              } else {
                const im = iPageEnd - iTop + BUFFER;
                itemMargins.set(`${section.index}-${item.index}`, im);
                cumulativeShift += im;
              }
            }
          }
        }
      } else if (adjTop < pageEnd) {
        const spaceLeft = pageEnd - adjTop;
        if (spaceLeft > 0 && spaceLeft < 80 && adjTop > A4_HEIGHT_PX * 0.1) {
          sectionMargins.set(section.index, spaceLeft + BUFFER);
          cumulativeShift += spaceLeft + BUFFER;
        }
      }
    }

    // Step 4: Apply margins to ALL pages' sections
    allPages.forEach((page) => {
      const pageSections = Array.from(page.querySelectorAll("section")) as HTMLElement[];
      pageSections.forEach((sec, si) => {
        if (sectionMargins.has(si)) {
          sec.style.marginTop = `${sectionMargins.get(si)}px`;
        }
        const items = Array.from(sec.querySelectorAll(".resume-item")) as HTMLElement[];
        items.forEach((item, ii) => {
          if (itemMargins.has(`${si}-${ii}`)) {
            item.style.marginTop = `${itemMargins.get(`${si}-${ii}`)}px`;
          }
        });
      });
    });

    // Step 5: Calculate pages from the first page content (now with margins)
    void firstPage.offsetHeight;
    const totalHeight = firstPage.scrollHeight;
    const pages = Math.max(1, Math.ceil(totalHeight / A4_HEIGHT_PX));

    if (pages !== totalPages) {
      setTotalPages(pages);
    }
  });

  return (
    <div ref={pagesContainerRef} className="flex flex-col items-center">
      {Array.from({ length: totalPages }, (_, pageIndex) => (
        <div key={pageIndex}>
          {pageIndex > 0 && (
            <div className="flex items-center gap-4 py-5 no-print" style={{ width: `${A4_WIDTH_PX}px` }}>
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                Page {pageIndex + 1}
              </span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          )}

          <div
            className="relative shadow-lg overflow-hidden resume-page"
            style={{
              width: `${A4_WIDTH_PX}px`,
              height: `${A4_HEIGHT_PX}px`,
            }}
          >
            <div
              ref={pageIndex === 0 ? firstPageRef : undefined}
              className="page-content"
              style={{
                transform: `translateY(-${pageIndex * A4_HEIGHT_PX}px)`,
                width: `${A4_WIDTH_PX}px`,
                ['--page-total-height' as string]: `${totalPages * A4_HEIGHT_PX}px`,
              } as React.CSSProperties}
            >
              {children}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
