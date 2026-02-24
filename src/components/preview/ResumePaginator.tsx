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
const PAGE_PADDING = 40; // Padding at top/bottom of each page

// Safety margin to fully include the last visible line (prevents sub-pixel clipping)
const LINE_SAFETY_PX = 5;

// Component to render page content with smart clipping
interface PageContentProps {
  children: ReactNode;
  pageIndex: number;
  totalPages: number;
  pageBreaks: number[]; // Array of Y positions where pages break
  calculatedMargins: Map<string, number>;
  totalContentHeight: number;
}

interface BackgroundInfo {
  type: 'sidebar' | 'fullpage' | 'none';
  sidebarWidth?: number;
  sidebarColor?: string;
  mainColor?: string;
  pageColor?: string;
  gradient?: string;
  bgClass?: string;
}

function PageContent({ children, pageIndex, totalPages, pageBreaks, calculatedMargins, totalContentHeight }: PageContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [bgInfo, setBgInfo] = useState<BackgroundInfo>({ type: 'none' });

  // Calculate the Y range for this page
  const startY = pageIndex === 0 ? 0 : pageBreaks[pageIndex - 1];
  const endY = pageIndex < pageBreaks.length ? pageBreaks[pageIndex] : totalContentHeight;
  const isLastPage = pageIndex === totalPages - 1;
  // Last page: use full page height to prevent clipping the last line
  const clipHeight = isLastPage ? A4_HEIGHT_PX : Math.min(Math.ceil(endY - startY), A4_HEIGHT_PX);

  useLayoutEffect(() => {
    if (!contentRef.current) return;

    const content = contentRef.current;

    // Apply calculated margins to this page's content
    calculatedMargins.forEach((margin, key) => {
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

    // Detect template layout type and colors
    const resumePage = content.querySelector('.resume-page') as HTMLElement;
    if (resumePage) {
      const pageStyle = window.getComputedStyle(resumePage);
      const pageBgColor = pageStyle.backgroundColor;
      const pageBgImage = pageStyle.backgroundImage;
      
      // Check if page has a gradient background
      const hasGradient = pageBgImage && pageBgImage !== 'none';
      
      // Check if page itself has a non-white background
      const hasCustomBg = pageBgColor && 
        pageBgColor !== 'rgba(0, 0, 0, 0)' && 
        pageBgColor !== 'rgb(255, 255, 255)' &&
        pageBgColor !== 'transparent';
      
      if (hasGradient || hasCustomBg) {
        setBgInfo({
          type: 'fullpage',
          pageColor: pageBgColor,
          gradient: hasGradient ? pageBgImage : undefined,
        });
        return;
      }
      
      // Check for sidebar layout (flex container with colored sidebar)
      const pageDisplay = pageStyle.display;
      const isFlex = pageDisplay === 'flex' || pageDisplay === 'inline-flex';
      const children = resumePage.children;
      
      if (children.length >= 2) {
        const firstChild = children[0] as HTMLElement;
        const secondChild = children[1] as HTMLElement;
        const firstTag = firstChild.tagName.toLowerCase();
        
        // If first child is a header, this is NOT a sidebar layout
        // It's a template with a colored header (like ProfessionalTeal)
        if (firstTag === 'header') {
          setBgInfo({ type: 'none' });
          return;
        }
        
        // Only check for sidebar if it's a flex layout
        if (isFlex) {
          const firstStyle = window.getComputedStyle(firstChild);
          const secondStyle = window.getComputedStyle(secondChild);
          const firstBg = firstStyle.backgroundColor;
          const secondBg = secondStyle.backgroundColor;
          
          const firstHasBg = firstBg && firstBg !== 'rgba(0, 0, 0, 0)' && firstBg !== 'rgb(255, 255, 255)';
          const secondHasBg = secondBg && secondBg !== 'rgba(0, 0, 0, 0)' && secondBg !== 'rgb(255, 255, 255)';
          
          if (firstHasBg || secondHasBg) {
            const sidebar = firstHasBg ? firstChild : secondChild;
            const sidebarStyle = window.getComputedStyle(sidebar);
            
            setBgInfo({
              type: 'sidebar',
              sidebarWidth: sidebar.offsetWidth,
              sidebarColor: sidebarStyle.backgroundColor,
            });
            return;
          }
        }
      }
      
      setBgInfo({ type: 'none' });
    }
  }, [calculatedMargins, children]);

  return (
    <div
      className="page-content-wrapper"
      style={{
        width: `${A4_WIDTH_PX}px`,
        height: `${A4_HEIGHT_PX}px`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Background layer - covers entire page */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: bgInfo.type === 'fullpage' ? bgInfo.pageColor : '#ffffff',
          backgroundImage: bgInfo.type === 'fullpage' ? bgInfo.gradient : undefined,
          zIndex: 0,
        }}
      />
      {/* Sidebar background if applicable */}
      {bgInfo.type === 'sidebar' && bgInfo.sidebarColor && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${bgInfo.sidebarWidth}px`,
            height: '100%',
            backgroundColor: bgInfo.sidebarColor,
            zIndex: 1,
          }}
        />
      )}
      {/* Content area - clipped to exact page break height */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${clipHeight}px`,
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        <div
          ref={contentRef}
          className="page-content"
          style={{
            transform: `translateY(-${startY}px)`,
            width: `${A4_WIDTH_PX}px`,
            ["--page-total-height" as string]: `${totalPages * A4_HEIGHT_PX}px`,
          } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

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

// Check if element is inside a grid container
function isInGridContainer(element: HTMLElement): boolean {
  const parent = element.parentElement;
  if (!parent) return false;
  const display = window.getComputedStyle(parent).display;
  return display === "grid" || display === "inline-grid";
}

// Get the number of columns in a grid
function getGridColumns(gridContainer: HTMLElement): number {
  const style = window.getComputedStyle(gridContainer);
  const columns = style.gridTemplateColumns;
  if (!columns || columns === "none") return 1;
  return columns.split(" ").length;
}

// Find next sibling element (resume-item or section)
function getNextElement(element: HTMLElement, content: HTMLElement): HTMLElement | null {
  if (element.classList.contains("resume-item")) {
    const parentSection = element.closest("section");
    const gridContainer = element.parentElement;
    
    if (gridContainer && isInGridContainer(element)) {
      const gridItems = Array.from(gridContainer.querySelectorAll(".resume-item"));
      const currentIndex = gridItems.indexOf(element);
      const columns = getGridColumns(gridContainer);
      const nextRowIndex = currentIndex + columns;
      
      if (nextRowIndex < gridItems.length) {
        return gridItems[nextRowIndex] as HTMLElement;
      } else {
        if (parentSection) {
          const sections = Array.from(content.querySelectorAll("section"));
          const sectionIndex = sections.indexOf(parentSection);
          if (sectionIndex >= 0 && sectionIndex < sections.length - 1) {
            return sections[sectionIndex + 1] as HTMLElement;
          }
        }
        return null;
      }
    }
    
    if (parentSection) {
      const sectionItems = Array.from(parentSection.querySelectorAll(".resume-item"));
      const currentIndexInSection = sectionItems.indexOf(element);
      
      if (currentIndexInSection >= 0 && currentIndexInSection < sectionItems.length - 1) {
        return sectionItems[currentIndexInSection + 1] as HTMLElement;
      }
      
      const sections = Array.from(content.querySelectorAll("section"));
      const sectionIndex = sections.indexOf(parentSection);
      if (sectionIndex >= 0 && sectionIndex < sections.length - 1) {
        return sections[sectionIndex + 1] as HTMLElement;
      }
    } else {
      const allItems = Array.from(content.querySelectorAll(".resume-item"));
      const currentIndex = allItems.indexOf(element);
      if (currentIndex >= 0 && currentIndex < allItems.length - 1) {
        return allItems[currentIndex + 1] as HTMLElement;
      }
    }
    return null;
  }

  const sections = Array.from(content.querySelectorAll("section"));
  const sectionIndex = sections.indexOf(element);
  if (sectionIndex >= 0 && sectionIndex < sections.length - 1) {
    return sections[sectionIndex + 1] as HTMLElement;
  }

  return null;
}

// Find previous sibling element
function getPrevElement(element: HTMLElement, content: HTMLElement): HTMLElement | null {
  if (element.classList.contains("resume-item")) {
    const parentSection = element.closest("section");
    const gridContainer = element.parentElement;
    
    if (gridContainer && isInGridContainer(element)) {
      const gridItems = Array.from(gridContainer.querySelectorAll(".resume-item"));
      const currentIndex = gridItems.indexOf(element);
      const columns = getGridColumns(gridContainer);
      const prevRowIndex = currentIndex - columns;
      
      if (prevRowIndex >= 0) {
        return gridItems[prevRowIndex] as HTMLElement;
      } else {
        if (parentSection) {
          const sections = Array.from(content.querySelectorAll("section"));
          const sectionIndex = sections.indexOf(parentSection);
          if (sectionIndex > 0) {
            return sections[sectionIndex - 1] as HTMLElement;
          }
        }
        return null;
      }
    }
    
    const allItems = Array.from(content.querySelectorAll(".resume-item"));
    const currentIndex = allItems.indexOf(element);
    if (currentIndex > 0) {
      return allItems[currentIndex - 1] as HTMLElement;
    }
    if (parentSection) {
      const sections = Array.from(content.querySelectorAll("section"));
      const sectionIndex = sections.indexOf(parentSection);
      if (sectionIndex > 0) {
        return sections[sectionIndex - 1] as HTMLElement;
      }
    }
    return null;
  }

  const sections = Array.from(content.querySelectorAll("section"));
  const sectionIndex = sections.indexOf(element);
  if (sectionIndex > 0) {
    return sections[sectionIndex - 1] as HTMLElement;
  }

  return null;
}

// Collect all rendered line boundaries inside an element using Range API.
// Returns array of { top, bottom } relative to contentEl.
function getRenderedLines(element: HTMLElement, contentEl: HTMLElement): { top: number; bottom: number }[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.textContent?.trim()) {
      textNodes.push(node as Text);
    }
  }
  if (textNodes.length === 0) return [];

  const contentRect = contentEl.getBoundingClientRect();
  const lines: { top: number; bottom: number }[] = [];
  let prevTop = -Infinity;

  for (const tn of textNodes) {
    const range = document.createRange();
    for (let i = 0; i < tn.length; i++) {
      range.setStart(tn, i);
      range.setEnd(tn, Math.min(i + 1, tn.length));
      const rects = range.getClientRects();
      for (let r = 0; r < rects.length; r++) {
        const rect = rects[r];
        if (rect.width < 1 || rect.height < 1) continue;
        const relTop = rect.top - contentRect.top;
        const relBottom = rect.bottom - contentRect.top;
        if (relTop - prevTop > 2) {
          lines.push({ top: relTop, bottom: relBottom });
          prevTop = relTop;
        } else if (lines.length > 0) {
          lines[lines.length - 1].bottom = Math.max(lines[lines.length - 1].bottom, relBottom);
        }
      }
    }
  }
  return lines;
}

// Calculate smart page breaks that never cut through text lines.
// Uses getBoundingClientRect exclusively for consistent measurements.
function calculateSmartPageBreaks(content: HTMLElement, totalHeight: number): number[] {
  const breaks: number[] = [];
  let currentPageStart = 0;
  const contentRect = content.getBoundingClientRect();

  // Pre-collect all leaf text elements and their positions via getBoundingClientRect
  const leafElements: { el: HTMLElement; top: number; bottom: number }[] = [];
  const allEls = content.querySelectorAll('p, li, span, h1, h2, h3, h4, h5, h6');
  for (const el of Array.from(allEls)) {
    const htmlEl = el as HTMLElement;
    const hasDirectText = Array.from(htmlEl.childNodes).some(
      n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()
    );
    if (!hasDirectText && htmlEl.children.length > 0) continue;
    const rect = htmlEl.getBoundingClientRect();
    if (rect.height < 5) continue;
    leafElements.push({
      el: htmlEl,
      top: rect.top - contentRect.top,
      bottom: rect.bottom - contentRect.top,
    });
  }

  while (currentPageStart + A4_HEIGHT_PX < totalHeight) {
    const idealBreak = currentPageStart + A4_HEIGHT_PX;
    let bestBreak = idealBreak;

    // Find elements that cross the ideal break point
    const crossing = leafElements.filter(
      e => e.top < idealBreak && e.bottom > idealBreak - LINE_SAFETY_PX
    );

    if (crossing.length > 0) {
      let resolved = false;

      for (const ce of crossing) {
        const lines = getRenderedLines(ce.el, content);
        if (lines.length === 0) continue;

        // Find the last line whose bottom fits entirely before the ideal break
        let lastFittingBottom = -1;
        for (const line of lines) {
          if (line.bottom + LINE_SAFETY_PX <= idealBreak) {
            lastFittingBottom = line.bottom;
          }
        }

        if (lastFittingBottom > currentPageStart + 50) {
          // Break right after the last fully-visible line (with safety buffer)
          bestBreak = Math.ceil(lastFittingBottom) + LINE_SAFETY_PX;
          resolved = true;
          break;
        }

        // If no line fits, push to the top of this element
        if (ce.top > currentPageStart + 50) {
          bestBreak = Math.floor(ce.top) - LINE_SAFETY_PX;
          resolved = true;
          break;
        }
      }

      // Fallback: use line-height estimation
      if (!resolved) {
        const ce = crossing[0];
        const style = window.getComputedStyle(ce.el);
        let lh = parseFloat(style.lineHeight);
        if (isNaN(lh) || lh === 0) lh = (parseFloat(style.fontSize) || 14) * 1.5;
        const padding = parseFloat(style.paddingTop) || 0;
        const textStart = ce.top + padding;
        const fullLines = Math.floor((idealBreak - textStart) / lh);
        if (fullLines >= 1) {
          bestBreak = Math.floor(textStart + fullLines * lh) + LINE_SAFETY_PX;
        }
        if (bestBreak <= currentPageStart + 50) bestBreak = idealBreak;
      }
    } else {
      // No element crosses the break - check for non-text block elements (images, etc.)
      const blockEls = content.querySelectorAll('.resume-item, section, header, div');
      for (const el of Array.from(blockEls)) {
        const rect = (el as HTMLElement).getBoundingClientRect();
        const top = rect.top - contentRect.top;
        const bottom = rect.bottom - contentRect.top;
        if (top < idealBreak && bottom > idealBreak && bottom - top < A4_HEIGHT_PX * 0.5) {
          if (top > currentPageStart + 50) {
            bestBreak = Math.floor(top) - LINE_SAFETY_PX;
            break;
          }
        }
      }
    }

    // Final validation: ensure bestBreak doesn't cut through ANY text line.
    // Instead of moving break before the cut line (which cascades), find the
    // last fully-fitting line across ALL leaf elements and break right after it.
    for (let pass = 0; pass < 3; pass++) {
      let didAdjust = false;
      for (const le of leafElements) {
        if (le.top >= bestBreak || le.bottom <= bestBreak) continue;

        const lines = getRenderedLines(le.el, content);
        for (const line of lines) {
          if (line.top < bestBreak && line.bottom > bestBreak) {
            // Find the last line in this element that fits entirely
            let lastFitBottom = -1;
            for (const l of lines) {
              if (l.bottom <= bestBreak) lastFitBottom = l.bottom;
            }
            if (lastFitBottom > currentPageStart + 50) {
              bestBreak = Math.ceil(lastFitBottom);
            } else if (le.top > currentPageStart + 50) {
              bestBreak = Math.floor(le.top) - LINE_SAFETY_PX;
            }
            didAdjust = true;
            break;
          }
        }
        if (didAdjust) break;
      }
      if (!didAdjust) break;
    }

    // Ensure no .resume-item shows only its border/padding without any text content
    const allItems = content.querySelectorAll('.resume-item');
    for (const item of Array.from(allItems)) {
      const rect = (item as HTMLElement).getBoundingClientRect();
      const itemTop = rect.top - contentRect.top;
      const itemBottom = rect.bottom - contentRect.top;

      if (itemTop < bestBreak && itemBottom > bestBreak && itemTop > currentPageStart + 50) {
        const lines = getRenderedLines(item as HTMLElement, content);
        const hasVisibleLine = lines.some(
          l => l.top >= itemTop && l.bottom <= bestBreak
        );

        if (!hasVisibleLine) {
          bestBreak = Math.floor(itemTop) - LINE_SAFETY_PX;
        }
      }
    }

    // Prevent orphaned section headings (heading visible but no content below it on same page)
    const allSections = content.querySelectorAll('section');
    for (const section of Array.from(allSections)) {
      const heading = section.querySelector('h2, h3') as HTMLElement;
      if (!heading) continue;
      const headingRect = heading.getBoundingClientRect();
      const headingTop = headingRect.top - contentRect.top;
      const headingBottom = headingRect.bottom - contentRect.top;

      if (headingTop >= currentPageStart && headingBottom <= bestBreak && headingTop > currentPageStart + 50) {
        const sectionRect = section.getBoundingClientRect();
        const sectionBottom = sectionRect.bottom - contentRect.top;

        if (sectionBottom > bestBreak) {
          const contentEls = section.querySelectorAll('.resume-item, p, li');
          const hasVisibleContent = Array.from(contentEls).some(el => {
            const r = (el as HTMLElement).getBoundingClientRect();
            const elBottom = r.bottom - contentRect.top;
            return r.top - contentRect.top >= headingBottom && elBottom <= bestBreak;
          });

          if (!hasVisibleContent) {
            bestBreak = Math.floor(headingTop) - LINE_SAFETY_PX;
          }
        }
      }
    }

    // Final safety: re-check ALL leaf text lines one more time
    for (let pass = 0; pass < 3; pass++) {
      let didFinalAdj = false;
      for (const le of leafElements) {
        if (le.top >= bestBreak || le.bottom <= bestBreak) continue;
        const lines = getRenderedLines(le.el, content);
        let lastFitBottom = -1;
        let hasCrossing = false;
        for (const line of lines) {
          if (line.bottom <= bestBreak) lastFitBottom = line.bottom;
          if (line.top < bestBreak && line.bottom > bestBreak) hasCrossing = true;
        }
        if (hasCrossing) {
          if (lastFitBottom > currentPageStart + 50) {
            bestBreak = Math.ceil(lastFitBottom);
          } else if (le.top > currentPageStart + 50) {
            bestBreak = Math.floor(le.top) - LINE_SAFETY_PX;
          }
          didFinalAdj = true;
        }
        if (didFinalAdj) break;
      }
      if (!didFinalAdj) break;
    }

    breaks.push(bestBreak);
    currentPageStart = bestBreak;
  }

  return breaks;
}

const ResumePaginator = forwardRef<ResumePaginatorRef, ResumePaginatorProps>(
  function ResumePaginator({ children, viewMode, isTextEditMode, onElementSelect }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [pageBreaks, setPageBreaks] = useState<number[]>([]);
    const [totalContentHeight, setTotalContentHeight] = useState(A4_HEIGHT_PX);
    const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
    const [customMargins, setCustomMargins] = useState<Map<string, number>>(new Map());
    const prevViewModeRef = useRef<"edit" | "page">(viewMode);
    const [recalcKey, setRecalcKey] = useState(0);

    useEffect(() => {
      // Always recalculate when switching to page mode
      if (viewMode === "page") {
        const timer = setTimeout(() => {
          setRecalcKey(prev => prev + 1);
        }, 100);
        return () => clearTimeout(timer);
      }
      prevViewModeRef.current = viewMode;
    }, [viewMode]);

    // Recalculate after fonts are fully loaded to prevent text reflow issues
    useEffect(() => {
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (!cancelled) {
          setRecalcKey(prev => prev + 1);
        }
      });
      return () => { cancelled = true; };
    }, []);

    const [calculatedMargins, setCalculatedMargins] = useState<Map<string, number>>(new Map());

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

      // Ensure .resume-page has overflow visible for accurate measurement
      const resumePage = content.querySelector('.resume-page') as HTMLElement;
      if (resumePage) {
        resumePage.style.overflow = 'visible';
        resumePage.style.minHeight = 'auto';
        resumePage.style.maxHeight = 'none';
        resumePage.style.height = 'auto';
      }

      void content.offsetHeight;

      // Calculate auto-margins for pagination
      const sections = Array.from(content.querySelectorAll("section")) as HTMLElement[];
      const autoMargins = new Map<string, number>();
      let cumulativeShift = 0;

      sections.forEach((section, si) => {
        const top = getOffsetRelativeTo(section, content) + cumulativeShift;
        const height = section.offsetHeight;
        const bottom = top + height;
        const pageEnd = (Math.floor(top / A4_HEIGHT_PX) + 1) * A4_HEIGHT_PX;
        const splittable = section.getAttribute("data-splittable") === "true";

        if (bottom > pageEnd && top < pageEnd && !splittable) {
          if (height <= A4_HEIGHT_PX * 0.93) {
            const margin = pageEnd - top + BUFFER;
            autoMargins.set(`section-${si}`, margin);
            cumulativeShift += margin;
          }
        }
      });

      const finalMargins = new Map(autoMargins);
      customMargins.forEach((margin, key) => {
        finalMargins.set(key, margin);
      });

      finalMargins.forEach((margin, key) => {
        const [type, indexStr] = key.split("-");
        const index = parseInt(indexStr);

        if (type === "section") {
          const secs = content.querySelectorAll("section");
          if (secs[index]) {
            (secs[index] as HTMLElement).style.marginTop = `${margin}px`;
          }
        } else if (type === "item") {
          const items = content.querySelectorAll(".resume-item");
          if (items[index]) {
            (items[index] as HTMLElement).style.marginTop = `${margin}px`;
          }
        }
      });

      setCalculatedMargins(finalMargins);

      void content.offsetHeight;
      const totalHeight = content.scrollHeight;
      setTotalContentHeight(totalHeight);
      
      // Calculate smart page breaks
      const breaks = calculateSmartPageBreaks(content, totalHeight);
      setPageBreaks(breaks);
      
      const pages = breaks.length + 1;
      setTotalPages(pages);

      prevViewModeRef.current = viewMode;
    }, [children, viewMode, customMargins, recalcKey]);

    const handleContentClick = useCallback(
      (e: React.MouseEvent) => {
        if (!isTextEditMode) return;

        const target = e.target as HTMLElement;
        const resumeItem = target.closest(".resume-item") as HTMLElement | null;
        const section = target.closest("section") as HTMLElement | null;
        const elementToSelect = resumeItem || section;

        if (elementToSelect) {
          if (selectedElement) {
            selectedElement.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
          }
          elementToSelect.classList.add("ring-2", "ring-blue-500", "ring-offset-2");
          setSelectedElement(elementToSelect);
          onElementSelect?.(true);
        }
      },
      [isTextEditMode, selectedElement, onElementSelect]
    );

    useEffect(() => {
      if (!isTextEditMode || !selectedElement || !contentRef.current) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Enter" && e.key !== "Delete" && e.key !== "Backspace") return;

        e.preventDefault();

        const content = contentRef.current!;

        if (e.key === "Enter") {
          const nextElement = getNextElement(selectedElement, content);
          if (nextElement) {
            const key = getElementKey(nextElement, content);
            const currentMargin = customMargins.get(key) || 0;
            const newMargin = currentMargin + 50;
            setCustomMargins(new Map(customMargins.set(key, newMargin)));
          }
        } else if (e.key === "Delete" || e.key === "Backspace") {
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

    const moveElement = useCallback(
      (direction: "up" | "down") => {
        if (!selectedElement || !contentRef.current) return;

        const content = contentRef.current;

        if (direction === "down") {
          const nextElement = getNextElement(selectedElement, content);
          if (nextElement) {
            const key = getElementKey(nextElement, content);
            const currentMargin = customMargins.get(key) || 0;
            const newMargin = currentMargin + 50;
            setCustomMargins(new Map(customMargins.set(key, newMargin)));
          }
        } else {
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

    const resetMargins = useCallback(() => {
      setCustomMargins(new Map());
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        moveElement,
        resetMargins,
      }),
      [moveElement, resetMargins]
    );

    useEffect(() => {
      if (!isTextEditMode && selectedElement) {
        selectedElement.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
        setSelectedElement(null);
        onElementSelect?.(false);
      }
    }, [isTextEditMode, selectedElement, onElementSelect]);

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

          {/* Page break lines - now at smart break points */}
          {pageBreaks.map((breakY, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: `${breakY}px` }}
            >
              <div
                className="h-0.5 mx-4"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 8px, transparent 8px, transparent 16px)",
                }}
              />
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                Page {i + 2} Start
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // Page Mode: Paginated view with smart breaks
      return (
        <div ref={containerRef} className="flex flex-col items-center">
          {/* Hidden content for measurement */}
          <div
            ref={contentRef}
            className="absolute opacity-0 pointer-events-none"
            style={{ width: `${A4_WIDTH_PX}px`, left: "-9999px" }}
            key={`measure-${recalcKey}`}
          >
            {children}
          </div>

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
                <PageContent
                  pageIndex={pageIndex}
                  totalPages={totalPages}
                  pageBreaks={pageBreaks}
                  calculatedMargins={calculatedMargins}
                  totalContentHeight={totalContentHeight}
                >
                  {children}
                </PageContent>
              </div>
            </div>
          ))}
        </div>
      );
    }
  }
);

export default ResumePaginator;
