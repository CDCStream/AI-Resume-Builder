"use client";

interface ExportOptions {
  filename?: string;
}

interface BackgroundExportInfo {
  type: 'none' | 'fullpage' | 'sidebar';
  bgColor: string;
  bgImage?: string;
  sidebarWidth?: number;
  sidebarColor?: string;
}

export async function exportResumeToPDF(
  previewElement: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = "resume.pdf" } = options;

  const allResumePages = previewElement.querySelectorAll(".resume-page");
  const visiblePages: HTMLElement[] = [];

  for (let i = 0; i < allResumePages.length; i++) {
    const page = allResumePages[i] as HTMLElement;
    const parent = page.parentElement;
    if (parent && (
      parent.classList.contains("opacity-0") ||
      parent.style.opacity === "0" ||
      parent.style.left === "-9999px"
    )) {
      continue;
    }
    visiblePages.push(page);
  }

  if (visiblePages.length === 0) {
    throw new Error("No resume pages found");
  }

  // Extract page break positions from visible page wrappers
  const pageBreaks = extractPageBreaks(previewElement);
  const bgInfo = extractBackgroundInfo(previewElement);

  console.log(`Found ${pageBreaks.length} page breaks: [${pageBreaks.join(', ')}]`);
  console.log(`Background type: ${bgInfo.type}`);

  const styles = collectStyles();

  let fullContentHtml = "";
  let styleSourceContainer: HTMLElement | null = null;

  const hiddenContent = previewElement.querySelector(
    '.absolute.opacity-0.pointer-events-none'
  ) as HTMLElement;

  if (hiddenContent) {
    fullContentHtml = hiddenContent.innerHTML;
    styleSourceContainer = hiddenContent;
  } else {
    const firstPageContent = visiblePages[0].querySelector(".page-content");
    if (firstPageContent) {
      fullContentHtml = firstPageContent.innerHTML;
      styleSourceContainer = firstPageContent as HTMLElement;
    } else {
      fullContentHtml = visiblePages[0].innerHTML;
      styleSourceContainer = visiblePages[0];
    }
  }

  // Apply computed inline styles for PDF fidelity
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = fullContentHtml;
  tempDiv.querySelectorAll(".no-print").forEach(el => el.remove());

  if (styleSourceContainer) {
    const sourceResumePage = styleSourceContainer.querySelector('.resume-page') as HTMLElement
      || (styleSourceContainer.classList?.contains('resume-page') ? styleSourceContainer as HTMLElement : null);

    if (sourceResumePage) {
      const targetResumePage = tempDiv.querySelector('.resume-page') as HTMLElement;
      if (targetResumePage) {
        inlineComputedStyles(sourceResumePage, targetResumePage, true);

        const resumePageDisplay = window.getComputedStyle(sourceResumePage).display;
        const parentIsFlex = resumePageDisplay === 'flex' || resumePageDisplay === 'inline-flex';

        const srcChildren = Array.from(sourceResumePage.children) as HTMLElement[];
        const tgtChildren = Array.from(targetResumePage.children) as HTMLElement[];
        for (let i = 0; i < Math.min(srcChildren.length, tgtChildren.length); i++) {
          inlineComputedStyles(srcChildren[i], tgtChildren[i] as HTMLElement, false, parentIsFlex);
        }

        inlineDeepStyles(sourceResumePage, targetResumePage, 0);
      }
    }
  }

  // Convert all images to inline base64 so Puppeteer can render them without network requests
  await inlineAllImages(tempDiv);

  fullContentHtml = tempDiv.innerHTML;

  // Get total content height from hidden measurement div (add buffer for margin/border precision)
  const totalContentHeight = hiddenContent ? hiddenContent.scrollHeight + 10 : 1122;

  const pagesData = [{
    html: fullContentHtml,
    pageIndex: 0,
  }];

  const response = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pagesData,
      styles,
      filename,
      totalPages: pageBreaks.length + 1,
      backgroundColor: bgInfo.bgColor,
      pageBreaks,
      totalContentHeight,
      backgroundInfo: bgInfo,
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

function extractPageBreaks(previewElement: HTMLElement): number[] {
  const offsets: number[] = [];
  const wrappers = previewElement.querySelectorAll('.page-content-wrapper');

  for (const wrapper of Array.from(wrappers)) {
    // Skip wrappers inside hidden measurement div
    const hiddenParent = (wrapper as HTMLElement).closest('.absolute.opacity-0');
    if (hiddenParent) continue;

    const contentDiv = wrapper.querySelector('.page-content') as HTMLElement;
    if (contentDiv) {
      const transform = contentDiv.style.transform;
      const match = transform.match(/translateY\(-(\d+(?:\.\d+)?)px\)/);
      if (match) {
        const offset = parseFloat(match[1]);
        if (offset > 0) {
          offsets.push(offset);
        }
      }
    }
  }

  return offsets;
}

function extractBackgroundInfo(previewElement: HTMLElement): BackgroundExportInfo {
  const wrappers = previewElement.querySelectorAll('.page-content-wrapper');

  for (const wrapper of Array.from(wrappers)) {
    const hiddenParent = (wrapper as HTMLElement).closest('.absolute.opacity-0');
    if (hiddenParent) continue;

    const children = wrapper.children;
    if (children.length < 1) {
      return { type: 'none', bgColor: '#ffffff' };
    }

    // First child is the background layer
    const bgLayer = children[0] as HTMLElement;
    const bgColor = bgLayer.style.backgroundColor || '#ffffff';
    const bgImage = bgLayer.style.backgroundImage;

    // Check for sidebar (second absolutely-positioned child with explicit width)
    if (children.length >= 3) {
      const secondChild = children[1] as HTMLElement;
      if (secondChild.style.position === 'absolute' && secondChild.style.width && secondChild.style.height === '100%') {
        return {
          type: 'sidebar',
          bgColor,
          sidebarWidth: parseInt(secondChild.style.width) || 0,
          sidebarColor: secondChild.style.backgroundColor || bgColor,
        };
      }
    }

    if (bgImage && bgImage !== 'none') {
      return { type: 'fullpage', bgColor, bgImage };
    }

    if (bgColor && bgColor !== 'rgb(255, 255, 255)' && bgColor !== 'rgba(0, 0, 0, 0)') {
      return { type: 'fullpage', bgColor };
    }

    return { type: 'none', bgColor: '#ffffff' };
  }

  return { type: 'none', bgColor: '#ffffff' };
}

function inlineComputedStyles(
  source: HTMLElement,
  target: HTMLElement,
  isResumePage: boolean,
  parentIsFlex: boolean = false
): void {
  const cs = window.getComputedStyle(source);

  target.style.paddingTop = cs.paddingTop;
  target.style.paddingRight = cs.paddingRight;
  target.style.paddingBottom = cs.paddingBottom;
  target.style.paddingLeft = cs.paddingLeft;
  target.style.boxSizing = 'border-box';

  target.style.marginTop = cs.marginTop;
  target.style.marginRight = cs.marginRight;
  target.style.marginBottom = cs.marginBottom;
  target.style.marginLeft = cs.marginLeft;

  target.style.backgroundColor = cs.backgroundColor;
  if (cs.backgroundImage !== 'none') {
    target.style.backgroundImage = cs.backgroundImage;
  }

  target.style.color = cs.color;
  target.style.fontFamily = cs.fontFamily;
  target.style.fontSize = cs.fontSize;
  target.style.lineHeight = cs.lineHeight;
  target.style.fontWeight = cs.fontWeight;
  target.style.letterSpacing = cs.letterSpacing;
  target.style.wordSpacing = cs.wordSpacing;
  target.style.textRendering = 'geometricPrecision';

  if (cs.borderBottom && cs.borderBottom !== 'none') {
    target.style.borderBottom = cs.borderBottom;
  }
  if (cs.borderTop && cs.borderTop !== 'none') {
    target.style.borderTop = cs.borderTop;
  }

  const display = cs.display;
  if (display === 'flex' || display === 'inline-flex') {
    target.style.display = display;
    target.style.flexDirection = cs.flexDirection;
    if (cs.gap && cs.gap !== 'normal' && cs.gap !== '0px') {
      target.style.gap = cs.gap;
    }
    target.style.alignItems = cs.alignItems;
    target.style.flexWrap = cs.flexWrap;
  } else if (display === 'grid' || display === 'inline-grid') {
    target.style.display = display;
    target.style.gridTemplateColumns = cs.gridTemplateColumns;
    if (cs.gap && cs.gap !== 'normal' && cs.gap !== '0px') {
      target.style.gap = cs.gap;
    }
  }

  if (!isResumePage && parentIsFlex) {
    target.style.width = cs.width;
    if (cs.minWidth !== '0px') target.style.minWidth = cs.minWidth;
    if (cs.maxWidth !== 'none') target.style.maxWidth = cs.maxWidth;
    target.style.flex = cs.flex;
    target.style.flexShrink = cs.flexShrink;
    target.style.flexGrow = cs.flexGrow;
  }

  if (cs.overflow !== 'visible') {
    target.style.overflow = cs.overflow;
  }

  if (cs.position !== 'static') {
    target.style.position = cs.position;
  }
}

function inlineDeepStyles(source: HTMLElement, target: HTMLElement, depth: number = 0): void {
  if (depth > 3) return;

  const srcChildren = Array.from(source.children) as HTMLElement[];
  const tgtChildren = Array.from(target.children) as HTMLElement[];

  for (let i = 0; i < Math.min(srcChildren.length, tgtChildren.length); i++) {
    const srcChild = srcChildren[i];
    const tgtChild = tgtChildren[i];
    const tag = srcChild.tagName.toLowerCase();

    if (tag === 'section' || srcChild.classList.contains('resume-item') ||
        tag === 'header' || tag === 'main' || tag === 'aside' || tag === 'nav' ||
        tag === 'div' || tag === 'ul' || tag === 'ol') {
      const cs = window.getComputedStyle(srcChild);
      const parentDisplay = window.getComputedStyle(srcChild.parentElement!).display;
      const parentIsFlex = parentDisplay === 'flex' || parentDisplay === 'inline-flex';

      tgtChild.style.paddingTop = cs.paddingTop;
      tgtChild.style.paddingRight = cs.paddingRight;
      tgtChild.style.paddingBottom = cs.paddingBottom;
      tgtChild.style.paddingLeft = cs.paddingLeft;
      tgtChild.style.marginTop = cs.marginTop;
      tgtChild.style.marginRight = cs.marginRight;
      tgtChild.style.marginBottom = cs.marginBottom;
      tgtChild.style.marginLeft = cs.marginLeft;
      tgtChild.style.boxSizing = 'border-box';

      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        tgtChild.style.backgroundColor = cs.backgroundColor;
      }
      if (cs.backgroundImage !== 'none') {
        tgtChild.style.backgroundImage = cs.backgroundImage;
      }

      tgtChild.style.color = cs.color;
      tgtChild.style.fontFamily = cs.fontFamily;
      tgtChild.style.fontSize = cs.fontSize;
      tgtChild.style.lineHeight = cs.lineHeight;
      tgtChild.style.fontWeight = cs.fontWeight;

      const display = cs.display;
      if (display === 'flex' || display === 'inline-flex') {
        tgtChild.style.display = display;
        tgtChild.style.flexDirection = cs.flexDirection;
        if (cs.gap && cs.gap !== 'normal' && cs.gap !== '0px') {
          tgtChild.style.gap = cs.gap;
        }
        tgtChild.style.alignItems = cs.alignItems;
        tgtChild.style.flexWrap = cs.flexWrap;
      } else if (display === 'grid' || display === 'inline-grid') {
        tgtChild.style.display = display;
        tgtChild.style.gridTemplateColumns = cs.gridTemplateColumns;
        if (cs.gap && cs.gap !== 'normal' && cs.gap !== '0px') {
          tgtChild.style.gap = cs.gap;
        }
      }

      if (parentIsFlex) {
        tgtChild.style.width = cs.width;
        tgtChild.style.flex = cs.flex;
      }

      if (cs.overflow !== 'visible') {
        tgtChild.style.overflow = cs.overflow;
      }

      if (cs.borderBottom && cs.borderBottom !== 'none') {
        tgtChild.style.borderBottom = cs.borderBottom;
      }

      inlineDeepStyles(srcChild, tgtChild, depth + 1);
    } else if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' ||
               tag === 'h5' || tag === 'h6' || tag === 'p' || tag === 'li' || tag === 'span') {
      const cs = window.getComputedStyle(srcChild);
      tgtChild.style.fontFamily = cs.fontFamily;
      tgtChild.style.fontSize = cs.fontSize;
      tgtChild.style.lineHeight = cs.lineHeight;
      tgtChild.style.fontWeight = cs.fontWeight;
      tgtChild.style.color = cs.color;
      tgtChild.style.letterSpacing = cs.letterSpacing;
      tgtChild.style.marginTop = cs.marginTop;
      tgtChild.style.marginBottom = cs.marginBottom;
      tgtChild.style.paddingTop = cs.paddingTop;
      tgtChild.style.paddingBottom = cs.paddingBottom;
    }
  }
}

const MAX_IMG_DIMENSION = 400;
const IMG_QUALITY = 0.7;

function resizeToCanvas(image: HTMLImageElement): string {
  let w = image.naturalWidth;
  let h = image.naturalHeight;

  if (w > MAX_IMG_DIMENSION || h > MAX_IMG_DIMENSION) {
    const ratio = Math.min(MAX_IMG_DIMENSION / w, MAX_IMG_DIMENSION / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return image.src;
  ctx.drawImage(image, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", IMG_QUALITY);
}

async function inlineAllImages(container: HTMLElement): Promise<void> {
  const imgs = container.querySelectorAll("img");
  const promises = Array.from(imgs).map(async (img) => {
    const src = img.getAttribute("src");
    if (!src) return;

    // Compress existing data URLs that are too large (>100KB)
    if (src.startsWith("data:")) {
      if (src.length > 100_000) {
        try {
          const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
          });
          img.setAttribute("src", resizeToCanvas(loaded));
        } catch { /* keep original */ }
      }
      return;
    }

    try {
      const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });
      img.setAttribute("src", resizeToCanvas(loaded));
    } catch {
      try {
        const resp = await fetch(src);
        const blob = await resp.blob();
        const bmpSrc = URL.createObjectURL(blob);
        try {
          const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = bmpSrc;
          });
          img.setAttribute("src", resizeToCanvas(loaded));
        } finally {
          URL.revokeObjectURL(bmpSrc);
        }
      } catch {
        // Can't convert — leave as-is
      }
    }
  });

  await Promise.all(promises);
}

function collectStyles(): string {
  const styles: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (sheet.cssRules) {
        for (const rule of Array.from(sheet.cssRules)) {
          // Skip @media print rules — they conflict with Puppeteer PDF generation
          // (e.g. padding: 0 !important overrides template-specific inline padding)
          if (rule.cssText.trimStart().startsWith('@media print')) continue;
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
