"use client";

import { useRef, useState, useLayoutEffect, useEffect, ReactNode, useCallback, useImperativeHandle, forwardRef } from "react";

export interface ResumePaginatorProps {
  children: ReactNode;
  viewMode: "edit" | "page";
  isTextEditMode: boolean;
  onElementSelect?: (hasSelection: boolean) => void;
}

export interface ResumePaginatorRef {
  moveElement: (direction: "up" | "down") => void;
  resetMargins: () => void;
}

const A4_HEIGHT_PX = 1122;
const A4_WIDTH_PX = 794;
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

// Generate a unique key for an element
function getElementKey(element: HTMLElement, content: HTMLElement): string {
  // Check if it's a resume-item
  if (element.classList.contains("resume-item")) {
    const allItems = Array.from(content.querySelectorAll(".resume-item"));
    const itemIndex = allItems.indexOf(element);
    return `item-${itemIndex}`;
  }

  // Otherwise it's a section
  const sections = Array.from(content.querySelectorAll("section"));
  const sectionIndex = sections.indexOf(element);
  return `section-${sectionIndex}`;
}

// Find next sibling element (resume-item or section)
function getNextElement(element: HTMLElement, content: HTMLElement): HTMLElement | null {
  // If it's a resume-item, find next resume-item (any, not just in same section)
  if (element.classList.contains("resume-item")) {
    const allItems = Array.from(content.querySelectorAll(".resume-item"));
    const currentIndex = allItems.indexOf(element);
    if (currentIndex >= 0 && currentIndex < allItems.length - 1) {
      return allItems[currentIndex + 1] as HTMLElement;
    }
    // No more items, find next section
    const parentSection = element.closest("section");
    if (parentSection) {
      const sections = Array.from(content.querySelectorAll("section"));
      const sectionIndex = sections.indexOf(parentSection);
      if (sectionIndex >= 0 && sectionIndex < sections.length - 1) {
        return sections[sectionIndex + 1] as HTMLElement;
      }
    }
    return null;
  }

  // If it's a section, find next section
  const sections = Array.from(content.querySelectorAll("section"));
  const sectionIndex = sections.indexOf(element);
  if (sectionIndex >= 0 && sectionIndex < sections.length - 1) {
    return sections[sectionIndex + 1] as HTMLElement;
  }

  return null;
}

// Find previous sibling element (for moving element up - reducing its margin)
function getPrevElement(element: HTMLElement, content: HTMLElement): HTMLElement | null {
  // If it's a resume-item, find previous resume-item
  if (element.classList.contains("resume-item")) {
    const allItems = Array.from(content.querySelectorAll(".resume-item"));
    const currentIndex = allItems.indexOf(element);
    if (currentIndex > 0) {
      return allItems[currentIndex - 1] as HTMLElement;
    }
    // No previous items, find previous section
    const parentSection = element.closest("section");
    if (parentSection) {
      const sections = Array.from(content.querySelectorAll("section"));
      const sectionIndex = sections.indexOf(parentSection);
      if (sectionIndex > 0) {
        return sections[sectionIndex - 1] as HTMLElement;
      }
    }
    return null;
  }

  // If it's a section, find previous section
  const sections = Array.from(content.querySelectorAll("section"));
  const sectionIndex = sections.indexOf(element);
  if (sectionIndex > 0) {
    return sections[sectionIndex - 1] as HTMLElement;
  }

  return null;
}

const ResumePaginator = forwardRef<ResumePaginatorRef, ResumePaginatorProps>(
  function ResumePaginator({ children, viewMode, isTextEditMode, onElementSelect }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
    const [customMargins, setCustomMargins] = useState<Map<string, number>>(new Map());
    const prevViewModeRef = useRef<"edit" | "page">(viewMode);

    // Apply margins and calculate pages
    useLayoutEffect(() => {
      if (!contentRef.current) return;

      const content = contentRef.current;

      // Clear all styles first
      content.querySelectorAll("section").forEach((sec) => {
        (sec as HTMLElement).style.marginTop = "";
      });
      content.querySelectorAll(".resume-item").forEach((item) => {
        (item as HTMLElement).style.marginTop = "";
      });

      void content.offsetHeight;

      // In page mode, ALWAYS recalculate auto-margins for proper pagination
      if (viewMode === "page") {
        const sections = Array.from(content.querySelectorAll("section")) as HTMLElement[];
        const autoMargins = new Map<number, number>();
        let cumulativeShift = 0;

        // First pass: calculate all required margins
        sections.forEach((section, si) => {
          const top = getOffsetRelativeTo(section, content) + cumulativeShift;
          const height = section.offsetHeight;
          const bottom = top + height;
          const pageEnd = (Math.floor(top / A4_HEIGHT_PX) + 1) * A4_HEIGHT_PX;
          const splittable = section.getAttribute("data-splittable") === "true";

          if (bottom > pageEnd && top < pageEnd && !splittable) {
            if (height <= A4_HEIGHT_PX * 0.93) {
              const margin = pageEnd - top + BUFFER;
              autoMargins.set(si, margin);
              cumulativeShift += margin;
            }
          }
        });

        // Apply auto-calculated margins
        sections.forEach((section, si) => {
          if (autoMargins.has(si)) {
            section.style.marginTop = `${autoMargins.get(si)}px`;
          }
        });
      } else {
        // Edit mode: apply custom margins from user edits
        customMargins.forEach((margin, key) => {
          const [type, indexStr] = key.split("-");
          const index = parseInt(indexStr);

          if (type === "section") {
            const sections = content.querySelectorAll("section");
            if (sections[index]) {
              (sections[index] as HTMLElement).style.marginTop = `${margin}px`;
            }
          } else if (type === "item") {
            const items = content.querySelectorAll(".resume-item");
            if (items[index]) {
              (items[index] as HTMLElement).style.marginTop = `${margin}px`;
            }
          }
        });
      }

      void content.offsetHeight;
      const totalHeight = content.scrollHeight;
      const pages = Math.max(1, Math.ceil(totalHeight / A4_HEIGHT_PX));
      setTotalPages(pages);

      prevViewModeRef.current = viewMode;
    }, [children, viewMode, customMargins]);

    // Handle element selection in text edit mode
    const handleContentClick = useCallback(
      (e: React.MouseEvent) => {
        if (!isTextEditMode) return;

        const target = e.target as HTMLElement;

        // Find the closest resume-item first, then section
        const resumeItem = target.closest(".resume-item") as HTMLElement | null;
        const section = target.closest("section") as HTMLElement | null;

        // Prefer resume-item if it exists
        const elementToSelect = resumeItem || section;

        if (elementToSelect) {
          // Remove previous selection
          if (selectedElement) {
            selectedElement.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
          }

          // Add selection to new element
          elementToSelect.classList.add("ring-2", "ring-blue-500", "ring-offset-2");
          setSelectedElement(elementToSelect);
          onElementSelect?.(true);
        }
      },
      [isTextEditMode, selectedElement, onElementSelect]
    );

    // Handle keyboard events for moving elements
    useEffect(() => {
      if (!isTextEditMode || !selectedElement || !contentRef.current) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Enter" && e.key !== "Delete" && e.key !== "Backspace") return;

        e.preventDefault();

        const content = contentRef.current!;

        if (e.key === "Enter") {
          // Add space BELOW: increase margin-top of the NEXT element
          const nextElement = getNextElement(selectedElement, content);
          if (nextElement) {
            const key = getElementKey(nextElement, content);
            const currentMargin = customMargins.get(key) || 0;
            const newMargin = currentMargin + 50;
            setCustomMargins(new Map(customMargins.set(key, newMargin)));
          }
        } else if (e.key === "Delete" || e.key === "Backspace") {
          // Remove space ABOVE: decrease margin-top of the CURRENT element
          const key = getElementKey(selectedElement, content);
          const currentMargin = customMargins.get(key) || 0;
          const newMargin = Math.max(0, currentMargin - 50);
          if (newMargin === 0) {
            customMargins.delete(key);
            setCustomMargins(new Map(customMargins));
          } else {
            setCustomMargins(new Map(customMargins.set(key, newMargin)));
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isTextEditMode, selectedElement, customMargins]);

    // Move element up/down with buttons
    const moveElement = useCallback(
      (direction: "up" | "down") => {
        if (!selectedElement || !contentRef.current) return;

        const content = contentRef.current;

        if (direction === "down") {
          // Add space BELOW: increase margin-top of the NEXT element
          const nextElement = getNextElement(selectedElement, content);
          if (nextElement) {
            const key = getElementKey(nextElement, content);
            const currentMargin = customMargins.get(key) || 0;
            const newMargin = currentMargin + 50;
            setCustomMargins(new Map(customMargins.set(key, newMargin)));
          }
        } else {
          // Remove space ABOVE: decrease margin-top of the CURRENT element
          const key = getElementKey(selectedElement, content);
          const currentMargin = customMargins.get(key) || 0;
          const newMargin = Math.max(0, currentMargin - 50);
          if (newMargin === 0) {
            customMargins.delete(key);
            setCustomMargins(new Map(customMargins));
          } else {
            setCustomMargins(new Map(customMargins.set(key, newMargin)));
          }
        }
      },
      [selectedElement, customMargins]
    );

    // Reset all custom margins
    const resetMargins = useCallback(() => {
      setCustomMargins(new Map());
    }, []);

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        moveElement,
        resetMargins,
      }),
      [moveElement, resetMargins]
    );

    // Clear selection when exiting text edit mode
    useEffect(() => {
      if (!isTextEditMode && selectedElement) {
        selectedElement.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
        setSelectedElement(null);
        onElementSelect?.(false);
      }
    }, [isTextEditMode, selectedElement, onElementSelect]);

    // Render based on view mode
    if (viewMode === "edit") {
      // Edit Mode: Single long page with page break lines
      return (
        <div className="relative">
          <div
            ref={contentRef}
            className="relative shadow-lg resume-page bg-white"
            style={{ width: `${A4_WIDTH_PX}px` }}
            onClick={handleContentClick}
          >
            {children}
          </div>

          {/* Page break lines */}
          {Array.from({ length: totalPages - 1 }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: `${(i + 1) * A4_HEIGHT_PX}px` }}
            >
              <div
                className="h-0.5 mx-4"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 8px, transparent 8px, transparent 16px)",
                }}
              />
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                Sayfa {i + 2} Başlangıcı
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // Page Mode: Paginated view
      return (
        <div ref={containerRef} className="flex flex-col items-center">
          {Array.from({ length: totalPages }, (_, pageIndex) => (
            <div key={pageIndex} className="relative">
              {pageIndex > 0 && (
                <div
                  className="flex items-center gap-4 py-5 no-print"
                  style={{ width: `${A4_WIDTH_PX}px` }}
                >
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                    Sayfa {pageIndex + 1}
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
                  ref={pageIndex === 0 ? contentRef : undefined}
                  className="page-content"
                  style={{
                    transform: `translateY(-${pageIndex * A4_HEIGHT_PX}px)`,
                    width: `${A4_WIDTH_PX}px`,
                    ["--page-total-height" as string]: `${totalPages * A4_HEIGHT_PX}px`,
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
  }
);

export default ResumePaginator;
