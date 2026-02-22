"use client";

const A4_HEIGHT_PX = 1122;

interface ExportOptions {
  filename?: string;
}

export async function exportResumeToPDF(
  previewElement: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = "resume.pdf" } = options;

  // Get visible resume pages only (exclude hidden measurement div)
  const allResumePages = previewElement.querySelectorAll(".resume-page");
  const visiblePages: HTMLElement[] = [];
  
  for (let i = 0; i < allResumePages.length; i++) {
    const page = allResumePages[i] as HTMLElement;
    const parent = page.parentElement;
    
    // Skip pages inside hidden measurement div
    if (parent && (
      parent.classList.contains("opacity-0") ||
      parent.style.opacity === "0" ||
      parent.style.left === "-9999px"
    )) {
      continue;
    }
    
    visiblePages.push(page);
  }

  console.log(`Found ${visiblePages.length} visible resume pages (filtered from ${allResumePages.length} total)`);

  if (visiblePages.length === 0) {
    throw new Error("No resume pages found");
  }

  // Get background color from the first visible page or its content
  let backgroundColor = "#ffffff";
  if (visiblePages.length > 0) {
    const firstPage = visiblePages[0];
    const computedBg = window.getComputedStyle(firstPage).backgroundColor;
    
    // Also check the template wrapper inside the page
    const templateWrapper = firstPage.querySelector(".page-content > div") as HTMLElement;
    if (templateWrapper) {
      const templateBg = window.getComputedStyle(templateWrapper).backgroundColor;
      if (templateBg && templateBg !== "rgba(0, 0, 0, 0)" && templateBg !== "transparent") {
        backgroundColor = templateBg;
      }
    }
    
    // Fallback to page background
    if (backgroundColor === "#ffffff" && computedBg && computedBg !== "rgba(0, 0, 0, 0)" && computedBg !== "transparent") {
      backgroundColor = computedBg;
    }
  }

  console.log(`Using background color: ${backgroundColor}`);

  const styles = collectStyles();

  // Get the full content from hidden measurement div or first page's content
  let fullContentHtml = "";
  
  const hiddenContent = previewElement.querySelector(
    '.absolute.opacity-0.pointer-events-none'
  ) as HTMLElement;

  if (hiddenContent) {
    console.log("Using hidden measurement div as content source");
    fullContentHtml = hiddenContent.innerHTML;
  } else {
    // Use first visible page's page-content
    const firstPageContent = visiblePages[0].querySelector(".page-content");
    if (firstPageContent) {
      console.log("Using first page's .page-content as content source");
      fullContentHtml = firstPageContent.innerHTML;
    } else {
      console.log("Using first page's innerHTML as content source");
      fullContentHtml = visiblePages[0].innerHTML;
    }
  }

  // Remove no-print elements from content
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = fullContentHtml;
  tempDiv.querySelectorAll(".no-print").forEach(el => el.remove());
  fullContentHtml = tempDiv.innerHTML;

  // Calculate actual number of pages based on content height
  const contentHeight = hiddenContent?.scrollHeight || visiblePages[0].querySelector(".page-content")?.scrollHeight || A4_HEIGHT_PX;
  const calculatedPages = Math.ceil(contentHeight / A4_HEIGHT_PX);
  const actualPageCount = Math.min(visiblePages.length, calculatedPages);

  console.log(`Content height: ${contentHeight}px, Calculated pages: ${calculatedPages}, Using: ${actualPageCount} pages`);

  const pagesData: { html: string; pageIndex: number }[] = [];

  for (let i = 0; i < actualPageCount; i++) {
    pagesData.push({
      html: fullContentHtml,
      pageIndex: i,
    });
  }

  const response = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      pagesData,
      styles,
      filename,
      totalPages: actualPageCount,
      backgroundColor,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate PDF");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function collectStyles(): string {
  const styles: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (sheet.cssRules) {
        for (const rule of Array.from(sheet.cssRules)) {
          styles.push(rule.cssText);
        }
      }
    } catch {
      // Cross-origin stylesheet, skip
    }
  }

  return styles.join("\n");
}

export function printResume(): void {
  window.print();
}
