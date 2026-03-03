"use client";

import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

interface ExportOptions {
  filename?: string;
  showWatermark?: boolean;
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
  const { filename = "resume.pdf", showWatermark = false } = options;

  // Find top-level .resume-page elements only (skip nested template wrappers)
  const allPages = previewElement.querySelectorAll(".resume-page");
  const visiblePages: HTMLElement[] = [];

  for (const page of Array.from(allPages)) {
    const el = page as HTMLElement;
    // Skip pages inside hidden measurement container
    if (el.closest(".absolute.opacity-0")) continue;
    if (el.closest('[style*="left: -9999"]')) continue;
    // Skip nested .resume-page — templates have their own .resume-page wrapper
    // inside the paginator's .resume-page container; only capture the outermost
    if (el.parentElement?.closest(".resume-page")) continue;
    visiblePages.push(el);
  }

  if (visiblePages.length === 0) {
    throw new Error("No resume pages found");
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Check if we're in edit mode (single tall page without pagination)
  const firstPage = visiblePages[0];
  const isSingleTallPage =
    visiblePages.length === 1 && firstPage.scrollHeight > A4_HEIGHT_PX + 20;

  if (isSingleTallPage) {
    await captureEditMode(firstPage, pdf, showWatermark);
  } else {
    await capturePaginatedMode(visiblePages, pdf, showWatermark);
  }

  pdf.save(filename);
}

async function capturePaginatedMode(
  pages: HTMLElement[],
  pdf: jsPDF,
  showWatermark: boolean
): Promise<void> {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    const gradientFixes = fixGradientTextElements(page);

    let watermarkEl: HTMLElement | null = null;
    if (showWatermark) {
      watermarkEl = createWatermarkOverlay();
      page.appendChild(watermarkEl);
    }

    const canvas = await html2canvas(page, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      logging: false,
    });

    if (watermarkEl && page.contains(watermarkEl)) {
      page.removeChild(watermarkEl);
    }

    restoreGradientTextElements(gradientFixes);

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
  }
}

async function captureEditMode(
  page: HTMLElement,
  pdf: jsPDF,
  showWatermark: boolean
): Promise<void> {
  const gradientFixes = fixGradientTextElements(page);

  const fullCanvas = await html2canvas(page, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: A4_WIDTH_PX,
    logging: false,
  });

  restoreGradientTextElements(gradientFixes);

  const numPages = Math.ceil(fullCanvas.height / (A4_HEIGHT_PX * CAPTURE_SCALE));

  for (let i = 0; i < numPages; i++) {
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = A4_WIDTH_PX * CAPTURE_SCALE;
    sliceCanvas.height = A4_HEIGHT_PX * CAPTURE_SCALE;
    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) continue;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

    const srcY = i * A4_HEIGHT_PX * CAPTURE_SCALE;
    const srcH = Math.min(
      A4_HEIGHT_PX * CAPTURE_SCALE,
      fullCanvas.height - srcY
    );
    if (srcH > 0) {
      ctx.drawImage(
        fullCanvas,
        0, srcY, fullCanvas.width, srcH,
        0, 0, sliceCanvas.width, srcH
      );
    }

    if (showWatermark) drawWatermarkOnCanvas(sliceCanvas);

    const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
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
    const clip = cs.backgroundClip || (cs as unknown as Record<string, string>).webkitBackgroundClip;
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

    // Extract first color from gradient for a solid fallback
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

function drawWatermarkOnCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const s = CAPTURE_SCALE;
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height * 0.46);
  ctx.rotate((-35 * Math.PI) / 180);
  ctx.fillStyle = "rgba(180, 180, 180, 0.18)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `bold ${60 * s}px Geist, Inter, Arial, sans-serif`;
  ctx.fillText("LINIMPACT.AI", 0, 0);

  ctx.font = `500 ${16 * s}px Geist, Inter, Arial, sans-serif`;
  ctx.fillText("Upgrade to Pro to remove watermark", 0, 50 * s);

  ctx.restore();
}

function createWatermarkOverlay(): HTMLElement {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 9999; pointer-events: none; overflow: hidden;
  `;
  overlay.innerHTML = `
    <div style="position:absolute;top:46%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);
      font-family:'Geist','Inter',Arial,sans-serif;font-size:60px;font-weight:700;
      color:rgba(180,180,180,0.18);white-space:nowrap;letter-spacing:8px;
      text-transform:uppercase;user-select:none;">LINIMPACT.AI</div>
    <div style="position:absolute;top:54%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);
      font-family:'Geist','Inter',Arial,sans-serif;font-size:16px;font-weight:500;
      color:rgba(180,180,180,0.18);white-space:nowrap;letter-spacing:2px;
      user-select:none;">Upgrade to Pro to remove watermark</div>
  `;
  return overlay;
}

export function printResume(): void {
  window.print();
}
