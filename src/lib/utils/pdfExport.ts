"use client";

import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

interface ExportOptions {
  filename?: string;
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1122;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const CAPTURE_SCALE = 2;

export async function exportResumeToPDF(
  previewElement: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = "resume.pdf" } = options;

  // Find the raw template content.
  // In page-mode the paginator keeps a hidden measurement copy;
  // in edit-mode the visible .resume-page IS the content.
  const measureContainer = previewElement.querySelector(
    ".absolute.opacity-0"
  ) as HTMLElement | null;

  let sourceElement: HTMLElement;

  if (measureContainer) {
    sourceElement =
      (measureContainer.querySelector(".resume-page") as HTMLElement) ||
      (measureContainer.firstElementChild as HTMLElement);
  } else {
    sourceElement = previewElement.querySelector(
      ".resume-page"
    ) as HTMLElement;
  }

  if (!sourceElement) {
    throw new Error("No resume content found");
  }

  // Deep-clone the content into a fresh visible element on <body>.
  // This sidesteps every parent opacity / transform / overflow issue.
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    `width:${A4_WIDTH_PX}px`,
    "opacity:1",
    "z-index:-99999",
    "pointer-events:none",
    "overflow:visible",
    "transform:none",
    "background:#ffffff",
  ].join(";");

  document.body.appendChild(clone);

  // Let browser lay out the clone
  await new Promise<void>((r) => setTimeout(r, 150));

  const gradientFixes = fixGradientTextElements(clone);

  try {
    const fullCanvas = await html2canvas(clone, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: A4_WIDTH_PX,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    });

    restoreGradientTextElements(gradientFixes);
    document.body.removeChild(clone);

    // Slice the full-height canvas into A4-sized pages
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const scaledPageH = A4_HEIGHT_PX * CAPTURE_SCALE;
    const numPages = Math.max(1, Math.ceil(fullCanvas.height / scaledPageH));

    for (let i = 0; i < numPages; i++) {
      const slice = document.createElement("canvas");
      slice.width = A4_WIDTH_PX * CAPTURE_SCALE;
      slice.height = scaledPageH;
      const ctx = slice.getContext("2d");
      if (!ctx) continue;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);

      const srcY = i * scaledPageH;
      const srcH = Math.min(scaledPageH, fullCanvas.height - srcY);
      if (srcH > 0) {
        ctx.drawImage(
          fullCanvas,
          0,
          srcY,
          fullCanvas.width,
          srcH,
          0,
          0,
          slice.width,
          srcH
        );
      }

      const imgData = slice.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
    }

    pdf.save(filename);
  } catch (error) {
    restoreGradientTextElements(gradientFixes);
    if (clone.parentNode) document.body.removeChild(clone);
    throw error;
  }
}

interface GradientFix {
  el: HTMLElement;
  bgClip: string;
  wkBgClip: string;
  bgImage: string;
  bgColor: string;
  color: string;
  wkFill: string;
}

function fixGradientTextElements(container: HTMLElement): GradientFix[] {
  const fixes: GradientFix[] = [];
  const allEls = container.querySelectorAll("*");

  for (const el of Array.from(allEls)) {
    const htmlEl = el as HTMLElement;
    const cs = window.getComputedStyle(htmlEl);
    const clip =
      cs.backgroundClip ||
      (cs as unknown as Record<string, string>).webkitBackgroundClip;
    if (clip !== "text") continue;

    fixes.push({
      el: htmlEl,
      bgClip: htmlEl.style.backgroundClip,
      wkBgClip: htmlEl.style.webkitBackgroundClip,
      bgImage: htmlEl.style.backgroundImage,
      bgColor: htmlEl.style.backgroundColor,
      color: htmlEl.style.color,
      wkFill: htmlEl.style.webkitTextFillColor,
    });

    let solidColor = "#22D3EE";
    const rgbMatch = cs.backgroundImage.match(/rgba?\([^)]+\)/);
    if (rgbMatch) solidColor = rgbMatch[0];

    htmlEl.style.backgroundClip = "border-box";
    htmlEl.style.webkitBackgroundClip = "border-box";
    htmlEl.style.backgroundImage = "none";
    htmlEl.style.backgroundColor = "transparent";
    htmlEl.style.color = solidColor;
    htmlEl.style.webkitTextFillColor = solidColor;
  }

  return fixes;
}

function restoreGradientTextElements(fixes: GradientFix[]): void {
  for (const f of fixes) {
    f.el.style.backgroundClip = f.bgClip;
    f.el.style.webkitBackgroundClip = f.wkBgClip;
    f.el.style.backgroundImage = f.bgImage;
    f.el.style.backgroundColor = f.bgColor;
    f.el.style.color = f.color;
    f.el.style.webkitTextFillColor = f.wkFill;
  }
}

export function printResume(): void {
  window.print();
}
