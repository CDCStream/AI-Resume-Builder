import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar";


interface PageData {
  html: string;
  pageIndex: number;
}

interface BackgroundInfo {
  type: 'none' | 'fullpage' | 'sidebar';
  bgColor: string;
  bgImage?: string;
  sidebarWidth?: number;
  sidebarColor?: string;
}

interface RequestBody {
  pagesData: PageData[];
  styles: string;
  filename: string;
  totalPages: number;
  backgroundColor?: string;
  pageBreaks?: number[];
  totalContentHeight?: number;
  backgroundInfo?: BackgroundInfo;
}

export const maxDuration = 60;

const A4_HEIGHT_PX = 1122;
const LINE_SAFETY_PX = 5;

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const body: RequestBody = await request.json();
    const {
      pagesData,
      styles,
      filename = "resume.pdf",
      backgroundColor = "#ffffff",
      backgroundInfo,
    } = body;

    if (!pagesData || pagesData.length === 0) {
      return NextResponse.json(
        { error: "No pages provided" },
        { status: 400 }
      );
    }

    const contentHtml = pagesData
      .sort((a, b) => a.pageIndex - b.pageIndex)
      .map(p => p.html)
      .join("");

    console.log(`Generating PDF...`);

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 794, height: 1122 },
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1122 });

    const cssBlock = buildCssBlock(styles, backgroundColor);

    // Use client-side page breaks (from ResumePaginator) for pixel-perfect match with preview
    const clientBreaks = body.pageBreaks || [];
    const clientTotalHeight = body.totalContentHeight || 0;

    // Load content and fonts in Puppeteer
    const measureHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>${cssBlock}</style></head>
      <body>${contentHtml}</body></html>`;

    await page.setContent(measureHtml, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluateHandle(() => document.fonts.ready);

    // Validate and refine page breaks against Puppeteer's actual text rendering
    const refined = await page.evaluate((inputBreaks: number[], safetyPx: number) => {
      const content = document.querySelector('.resume-page') as HTMLElement;
      if (!content) return { breaks: inputBreaks, totalHeight: 0 };

      const totalHeight = content.scrollHeight;
      const cRect = content.getBoundingClientRect();

      function getTextLines(el: HTMLElement): { top: number; bottom: number }[] {
        const textNodes: Text[] = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let n: Node | null;
        while ((n = walker.nextNode())) {
          if (n.textContent?.trim()) textNodes.push(n as Text);
        }
        if (textNodes.length === 0) return [];
        const lines: { top: number; bottom: number }[] = [];
        let prevTop = -Infinity;
        for (const tn of textNodes) {
          const range = document.createRange();
          for (let i = 0; i < tn.length; i++) {
            range.setStart(tn, i);
            range.setEnd(tn, Math.min(i + 1, tn.length));
            const rects = range.getClientRects();
            for (let r = 0; r < rects.length; r++) {
              const rc = rects[r];
              if (rc.width < 1 || rc.height < 1) continue;
              const rTop = rc.top - cRect.top;
              const rBot = rc.bottom - cRect.top;
              if (rTop - prevTop > 2) {
                lines.push({ top: rTop, bottom: rBot });
                prevTop = rTop;
              } else if (lines.length > 0) {
                lines[lines.length - 1].bottom = Math.max(lines[lines.length - 1].bottom, rBot);
              }
            }
          }
        }
        return lines;
      }

      // Collect all leaf text elements
      const leafEls: { el: HTMLElement; top: number; bottom: number }[] = [];
      const allEls = content.querySelectorAll('p, li, span, h1, h2, h3, h4, h5, h6');
      for (const el of Array.from(allEls)) {
        const htmlEl = el as HTMLElement;
        const hasTxt = Array.from(htmlEl.childNodes).some(
          nd => nd.nodeType === Node.TEXT_NODE && nd.textContent?.trim()
        );
        if (!hasTxt && htmlEl.children.length > 0) continue;
        const r = htmlEl.getBoundingClientRect();
        if (r.height < 5) continue;
        leafEls.push({ el: htmlEl, top: r.top - cRect.top, bottom: r.bottom - cRect.top });
      }

      // If no client breaks provided, calculate from scratch
      if (inputBreaks.length === 0) {
        const a4H = 1122;
        if (totalHeight <= a4H) return { breaks: [], totalHeight };

        const calcBreaks: number[] = [];
        let pageStart = 0;
        while (pageStart + a4H < totalHeight) {
          const ideal = pageStart + a4H;
          let best = ideal;
          for (const le of leafEls) {
            if (le.top >= best || le.bottom <= best) continue;
            const lines = getTextLines(le.el);
            let lastFit = -1;
            let hasCross = false;
            for (const ln of lines) {
              if (ln.bottom + safetyPx <= best) lastFit = ln.bottom;
              if (ln.top < best && ln.bottom > best) hasCross = true;
            }
            if (hasCross) {
              if (lastFit > pageStart + 50) {
                best = Math.ceil(lastFit) + safetyPx;
              } else if (le.top > pageStart + 50) {
                best = Math.floor(le.top) - safetyPx;
              }
            }
          }
          calcBreaks.push(best);
          pageStart = best;
        }
        return { breaks: calcBreaks, totalHeight };
      }

      // Refine each break point: if it cuts through a text line, adjust it
      const refined: number[] = [];
      for (let bi = 0; bi < inputBreaks.length; bi++) {
        let bp = inputBreaks[bi];
        const pageStart = bi === 0 ? 0 : refined[bi - 1];

        for (let pass = 0; pass < 5; pass++) {
          let adjusted = false;
          for (const le of leafEls) {
            if (le.top >= bp || le.bottom <= bp) continue;
            // This element spans the break point - check individual lines
            const lines = getTextLines(le.el);
            let hasCross = false;
            let lastFit = -1;
            for (const ln of lines) {
              if (ln.bottom + safetyPx <= bp) lastFit = ln.bottom;
              if (ln.top < bp && ln.bottom > bp) hasCross = true;
            }
            if (hasCross) {
              if (lastFit > pageStart + 50) {
                bp = Math.ceil(lastFit) + safetyPx;
              } else if (le.top > pageStart + 50) {
                bp = Math.floor(le.top) - safetyPx;
              }
              adjusted = true;
              break;
            }
          }
          if (!adjusted) break;
        }

        refined.push(bp);
      }

      return { breaks: refined, totalHeight };
    }, clientBreaks, LINE_SAFETY_PX);

    const finalBreaks = refined.breaks;
    const finalTotalHeight = clientTotalHeight > 0 ? clientTotalHeight : refined.totalHeight;

    console.log(`Breaks: [${finalBreaks.join(', ')}] (${finalBreaks.length + 1} pages, height: ${finalTotalHeight})`);

    // Build paginated HTML using the page breaks
    const bodyHtml = finalBreaks.length > 0
      ? buildPrePaginatedHtml(contentHtml, finalBreaks, finalTotalHeight, backgroundInfo)
      : contentHtml;

    await page.evaluate((html) => {
      document.body.innerHTML = html;
    }, bodyHtml);

    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 300)));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: true,
    });

    await page.close();
    await browser.close();
    browser = null;

    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    if (browser) {
      await browser.close();
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

function buildCssBlock(styles: string, backgroundColor: string): string {
  return `
    ${styles}

    :root, body {
      --font-geist-sans: 'Geist', 'Inter', system-ui, sans-serif !important;
      --font-geist-mono: 'Geist Mono', monospace !important;
      --font-sans: 'Geist', 'Inter', system-ui, sans-serif !important;
      --font-mono: 'Geist Mono', monospace !important;
      --font-poppins: 'Poppins', system-ui, sans-serif !important;
    }

    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: ${backgroundColor} !important;
      -webkit-font-smoothing: antialiased !important;
      text-rendering: auto !important;
    }

    .resume-page {
      width: 794px !important;
      min-height: auto !important;
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      box-shadow: none !important;
    }

    @media print {
      .resume-page {
        min-height: auto !important;
        max-height: none !important;
        box-shadow: none !important;
      }
    }

    .pdf-page {
      width: 794px;
      height: 1122px;
      overflow: hidden;
      position: relative;
      page-break-after: always;
    }

    .pdf-page:last-child {
      page-break-after: auto;
    }

    .pdf-page-bg {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 0;
    }

    .pdf-page-sidebar {
      position: absolute;
      top: 0; left: 0; height: 100%;
      z-index: 1;
    }

    .pdf-page-clip {
      position: absolute;
      top: 0; left: 0; right: 0;
      overflow: hidden;
      z-index: 2;
    }

    .pdf-page-content {
      width: 794px;
    }

    section h2, section h3 {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    .resume-item > div:first-child {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    .resume-item li {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .resume-item p {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .no-print {
      display: none !important;
    }

    @page {
      size: A4;
      margin: 0;
    }
  `;
}

function buildPrePaginatedHtml(
  contentHtml: string,
  pageBreaks: number[],
  totalContentHeight: number,
  backgroundInfo?: BackgroundInfo,
): string {
  const numPages = pageBreaks.length + 1;
  const bg = backgroundInfo || { type: 'none' as const, bgColor: '#ffffff' };
  const pages: string[] = [];

  for (let i = 0; i < numPages; i++) {
    const startY = i === 0 ? 0 : pageBreaks[i - 1];
    const isLastPage = i === numPages - 1;
    const clipHeight = isLastPage ? A4_HEIGHT_PX : Math.min(Math.ceil((i < pageBreaks.length ? pageBreaks[i] : totalContentHeight) - startY), A4_HEIGHT_PX);

    let bgLayerHtml = '';
    let sidebarLayerHtml = '';

    if (bg.type === 'fullpage') {
      bgLayerHtml = `<div class="pdf-page-bg" style="background-color: ${bg.bgColor}; ${bg.bgImage ? `background-image: ${bg.bgImage};` : ''}"></div>`;
    } else if (bg.type === 'sidebar') {
      bgLayerHtml = `<div class="pdf-page-bg" style="background-color: #ffffff;"></div>`;
      sidebarLayerHtml = `<div class="pdf-page-sidebar" style="width: ${bg.sidebarWidth}px; background-color: ${bg.sidebarColor || bg.bgColor};"></div>`;
    } else {
      bgLayerHtml = `<div class="pdf-page-bg" style="background-color: #ffffff;"></div>`;
    }

    pages.push(`
      <div class="pdf-page">
        ${bgLayerHtml}
        ${sidebarLayerHtml}
        <div class="pdf-page-clip" style="height: ${clipHeight}px;">
          <div class="pdf-page-content" style="transform: translateY(-${startY}px);">
            ${contentHtml}
          </div>
        </div>
      </div>
    `);
  }

  return pages.join('');
}
