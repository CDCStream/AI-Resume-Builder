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

  const allPages = previewElement.querySelectorAll(".resume-page");
  const visiblePages: HTMLElement[] = [];

  for (const page of Array.from(allPages)) {
    const el = page as HTMLElement;
    if (el.closest(".absolute.opacity-0")) continue;
    const parent = el.parentElement;
    if (parent?.style.left === "-9999px") continue;
    visiblePages.push(el);
  }

  if (visiblePages.length === 0) {
    throw new Error("No resume pages found");
  }

  // In paginated mode, keep only overflow:hidden pages (the actual visible slices)
  let capturePages = visiblePages;
  if (visiblePages.length > 1) {
    const paginated = visiblePages.filter((p) => {
      const cs = window.getComputedStyle(p);
      return cs.overflow === "hidden";
    });
    if (paginated.length > 0) capturePages = paginated;
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  for (let i = 0; i < capturePages.length; i++) {
    const page = capturePages[i];

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

    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
  }

  pdf.save(filename);
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
