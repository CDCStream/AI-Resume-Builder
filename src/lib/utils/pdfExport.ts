"use client";

interface ExportOptions {
  filename?: string;
  pageBreaks?: number[];
  totalContentHeight?: number;
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

  // Use provided page breaks (from ResumePaginator state) or extract from DOM
  const pageBreaks = options.pageBreaks || extractPageBreaks(previewElement);
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
        applyFullStyles(sourceResumePage, targetResumePage, true, false);
        inlineDeepStyles(sourceResumePage, targetResumePage, 0);
      }
    }
  }

  // Convert all images to inline base64 so Puppeteer can render them without network requests
  await inlineAllImages(tempDiv);

  fullContentHtml = tempDiv.innerHTML;

  // Use provided total height or measure from hidden content
  const totalContentHeight = options.totalContentHeight || (hiddenContent ? hiddenContent.scrollHeight + 10 : 1122);

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

function applyFullStyles(source: HTMLElement, target: HTMLElement, isRoot: boolean, parentIsFlex: boolean): void {
  const cs = window.getComputedStyle(source);

  // Box model
  target.style.paddingTop = cs.paddingTop;
  target.style.paddingRight = cs.paddingRight;
  target.style.paddingBottom = cs.paddingBottom;
  target.style.paddingLeft = cs.paddingLeft;
  target.style.marginTop = cs.marginTop;
  target.style.marginRight = cs.marginRight;
  target.style.marginBottom = cs.marginBottom;
  target.style.marginLeft = cs.marginLeft;
  target.style.boxSizing = 'border-box';

  // Background
  target.style.backgroundColor = cs.backgroundColor;
  if (cs.backgroundImage !== 'none') {
    target.style.backgroundImage = cs.backgroundImage;
    target.style.backgroundSize = cs.backgroundSize;
    target.style.backgroundPosition = cs.backgroundPosition;
    target.style.backgroundRepeat = cs.backgroundRepeat;
  }
  if (cs.backgroundClip && cs.backgroundClip !== 'border-box') {
    target.style.backgroundClip = cs.backgroundClip;
    target.style.webkitBackgroundClip = (cs as unknown as Record<string, string>).webkitBackgroundClip || cs.backgroundClip;
  }

  // Typography
  target.style.color = cs.color;
  target.style.fontFamily = cs.fontFamily;
  target.style.fontSize = cs.fontSize;
  target.style.lineHeight = cs.lineHeight;
  target.style.fontWeight = cs.fontWeight;
  target.style.fontStyle = cs.fontStyle;
  target.style.letterSpacing = cs.letterSpacing;
  target.style.wordSpacing = cs.wordSpacing;
  target.style.textRendering = 'geometricPrecision';
  if (cs.textTransform !== 'none') target.style.textTransform = cs.textTransform;
  if (cs.textAlign !== 'start') target.style.textAlign = cs.textAlign;
  if (cs.textDecoration !== 'none') target.style.textDecoration = cs.textDecoration;
  if (cs.whiteSpace !== 'normal') target.style.whiteSpace = cs.whiteSpace;
  if (cs.webkitTextFillColor && cs.webkitTextFillColor !== cs.color) {
    target.style.webkitTextFillColor = cs.webkitTextFillColor;
  }

  // Borders (all sides)
  if (cs.borderTop !== 'none' && cs.borderTopWidth !== '0px') target.style.borderTop = cs.borderTop;
  if (cs.borderBottom !== 'none' && cs.borderBottomWidth !== '0px') target.style.borderBottom = cs.borderBottom;
  if (cs.borderLeft !== 'none' && cs.borderLeftWidth !== '0px') target.style.borderLeft = cs.borderLeft;
  if (cs.borderRight !== 'none' && cs.borderRightWidth !== '0px') target.style.borderRight = cs.borderRight;
  if (cs.borderRadius !== '0px') target.style.borderRadius = cs.borderRadius;

  // Layout
  const display = cs.display;
  if (display === 'flex' || display === 'inline-flex') {
    target.style.display = display;
    target.style.flexDirection = cs.flexDirection;
    target.style.alignItems = cs.alignItems;
    target.style.justifyContent = cs.justifyContent;
    target.style.flexWrap = cs.flexWrap;
    if (cs.gap && cs.gap !== 'normal' && cs.gap !== '0px') target.style.gap = cs.gap;
  } else if (display === 'grid' || display === 'inline-grid') {
    target.style.display = display;
    target.style.gridTemplateColumns = cs.gridTemplateColumns;
    if (cs.gridTemplateRows !== 'none') target.style.gridTemplateRows = cs.gridTemplateRows;
    if (cs.gap && cs.gap !== 'normal' && cs.gap !== '0px') target.style.gap = cs.gap;
  }

  // Sizing — only set width on flex children, never set computed height on text containers
  // (height differences between browsers cause text overlap)
  if (!isRoot && parentIsFlex) {
    target.style.width = cs.width;
    target.style.flex = cs.flex;
    target.style.flexShrink = cs.flexShrink;
    target.style.flexGrow = cs.flexGrow;
    if (cs.minWidth !== '0px') target.style.minWidth = cs.minWidth;
    if (cs.maxWidth !== 'none') target.style.maxWidth = cs.maxWidth;
  }

  // Only set height on image containers and decorative elements, not text containers
  const tag = source.tagName.toLowerCase();
  const isImgContainer = tag === 'img' || source.querySelector('img') !== null && source.children.length <= 1;
  if (isImgContainer && cs.height !== 'auto' && cs.height !== '0px') {
    target.style.height = cs.height;
  }

  // Positioning — only transfer for truly positioned elements (decorative overlays, images)
  if (cs.position === 'absolute' || cs.position === 'fixed') {
    target.style.position = cs.position;
    if (cs.top !== 'auto') target.style.top = cs.top;
    if (cs.left !== 'auto') target.style.left = cs.left;
    if (cs.right !== 'auto') target.style.right = cs.right;
    if (cs.bottom !== 'auto') target.style.bottom = cs.bottom;
    if (cs.zIndex !== 'auto') target.style.zIndex = cs.zIndex;
  } else if (cs.position === 'relative') {
    target.style.position = 'relative';
    if (cs.zIndex !== 'auto') target.style.zIndex = cs.zIndex;
  }

  if (cs.opacity !== '1') target.style.opacity = cs.opacity;
  if (cs.filter !== 'none') target.style.filter = cs.filter;
}

function inlineDeepStyles(source: HTMLElement, target: HTMLElement, depth: number = 0): void {
  if (depth > 10) return;

  const srcChildren = Array.from(source.children) as HTMLElement[];
  const tgtChildren = Array.from(target.children) as HTMLElement[];

  for (let i = 0; i < Math.min(srcChildren.length, tgtChildren.length); i++) {
    const srcChild = srcChildren[i];
    const tgtChild = tgtChildren[i];
    if (!srcChild || !tgtChild) continue;

    const parentDisplay = window.getComputedStyle(source).display;
    const parentIsFlex = parentDisplay === 'flex' || parentDisplay === 'inline-flex';

    applyFullStyles(srcChild, tgtChild, false, parentIsFlex);

    if (srcChild.children.length > 0) {
      inlineDeepStyles(srcChild, tgtChild, depth + 1);
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
