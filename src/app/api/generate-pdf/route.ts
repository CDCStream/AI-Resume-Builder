import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { createClient } from "@/lib/supabase/server";

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

async function checkIsPro(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Only paid Pro subscribers get watermark-free PDFs

    const { data } = await supabase
      .from("subscriptions")
      .select("status, plan")
      .eq("user_id", user.id)
      .single();

    return data?.status === "active" && data?.plan !== "FREE";
  } catch {
    return false;
  }
}

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

    const isPro = await checkIsPro();

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

    const cssBlock = buildCssBlock(styles, backgroundColor, !isPro);

    // --- Pass 1: Load content and calculate page breaks in Puppeteer's rendering ---
    const measureHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&display=swap" rel="stylesheet">
      <style>${cssBlock}</style></head>
      <body>${contentHtml}</body></html>`;

    await page.setContent(measureHtml, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluateHandle(() => document.fonts.ready);

    const showWatermark = !isPro;
    const WATERMARK_BOTTOM_RESERVE = 30;

    const breakData = await page.evaluate((a4H, safePx, wmReserve) => {
      const content = document.querySelector('.resume-page') as HTMLElement;
      if (!content) return { breaks: [] as number[], totalHeight: 0 };

      const cRect = content.getBoundingClientRect();
      const totalHeight = content.scrollHeight;
      const effectivePageH = a4H - wmReserve;

      function getLines(el: HTMLElement): { top: number; bottom: number }[] {
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

      // Collect leaf text elements
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

      const breaks: number[] = [];
      let pageStart = 0;

      while (pageStart + effectivePageH < totalHeight) {
        const ideal = pageStart + effectivePageH;
        let best = ideal;

        const crossing = leafEls.filter(
          e => e.top < ideal && e.bottom > ideal - safePx
        );

        if (crossing.length > 0) {
          let resolved = false;
          for (const ce of crossing) {
            const lines = getLines(ce.el);
            if (lines.length === 0) continue;
            let lastFit = -1;
            for (const ln of lines) {
              if (ln.bottom + safePx <= ideal) lastFit = ln.bottom;
            }
            if (lastFit > pageStart + 50) {
              best = Math.ceil(lastFit) + safePx;
              resolved = true;
              break;
            }
            if (ce.top > pageStart + 50) {
              best = Math.floor(ce.top) - safePx;
              resolved = true;
              break;
            }
          }
          if (!resolved) {
            const ce = crossing[0];
            const st = window.getComputedStyle(ce.el);
            let lh = parseFloat(st.lineHeight);
            if (isNaN(lh) || lh === 0) lh = (parseFloat(st.fontSize) || 14) * 1.5;
            const pad = parseFloat(st.paddingTop) || 0;
            const tStart = ce.top + pad;
            const full = Math.floor((ideal - tStart) / lh);
            if (full >= 1) best = Math.floor(tStart + full * lh) + safePx;
            if (best <= pageStart + 50) best = ideal;
          }
        } else {
          const blockEls = content.querySelectorAll('.resume-item, section, header, div');
          for (const el of Array.from(blockEls)) {
            const r = (el as HTMLElement).getBoundingClientRect();
            const t = r.top - cRect.top;
            const b = r.bottom - cRect.top;
            if (t < ideal && b > ideal && b - t < a4H * 0.5) {
              if (t > pageStart + 50) { best = Math.floor(t) - safePx; break; }
            }
          }
        }

        // Validate: no text line is cut by best.
        // Find the last fully-fitting line bottom instead of moving before the cut line's top
        // to prevent cascading adjustments that waste page space.
        for (let pass = 0; pass < 3; pass++) {
          let adj = false;
          for (const le of leafEls) {
            if (le.top >= best || le.bottom <= best) continue;
            const lines = getLines(le.el);
            for (const ln of lines) {
              if (ln.top < best && ln.bottom > best) {
                let lastFit = -1;
                for (const l of lines) {
                  if (l.bottom <= best) lastFit = l.bottom;
                }
                if (lastFit > pageStart + 50) {
                  best = Math.ceil(lastFit);
                } else if (le.top > pageStart + 50) {
                  best = Math.floor(le.top) - safePx;
                }
                adj = true;
                break;
              }
            }
            if (adj) break;
          }
          if (!adj) break;
        }

        // Ensure no resume-item shows only border without text
        const items = content.querySelectorAll('.resume-item');
        for (const item of Array.from(items)) {
          const r = (item as HTMLElement).getBoundingClientRect();
          const iTop = r.top - cRect.top;
          const iBot = r.bottom - cRect.top;
          if (iTop < best && iBot > best && iTop > pageStart + 50) {
            const lines = getLines(item as HTMLElement);
            const hasVis = lines.some(l => l.top >= iTop && l.bottom <= best);
            if (!hasVis) best = Math.floor(iTop) - safePx;
          }
        }

        // Prevent orphaned section headings
        const sections = content.querySelectorAll('section');
        for (const sec of Array.from(sections)) {
          const h = sec.querySelector('h2, h3') as HTMLElement;
          if (!h) continue;
          const hr = h.getBoundingClientRect();
          const hTop = hr.top - cRect.top;
          const hBot = hr.bottom - cRect.top;
          if (hTop >= pageStart && hBot <= best && hTop > pageStart + 50) {
            const sr = sec.getBoundingClientRect();
            if (sr.bottom - cRect.top > best) {
              const els = sec.querySelectorAll('.resume-item, p, li');
              const hasC = Array.from(els).some(el => {
                const er = (el as HTMLElement).getBoundingClientRect();
                return er.top - cRect.top >= hBot && er.bottom - cRect.top <= best;
              });
              if (!hasC) best = Math.floor(hTop) - safePx;
            }
          }
        }

        // Final safety: re-check ALL leaf text lines one more time
        for (let pass = 0; pass < 3; pass++) {
          let adj = false;
          for (const le of leafEls) {
            if (le.top >= best || le.bottom <= best) continue;
            const lines = getLines(le.el);
            let lastFit = -1;
            let hasCross = false;
            for (const ln of lines) {
              if (ln.bottom <= best) lastFit = ln.bottom;
              if (ln.top < best && ln.bottom > best) hasCross = true;
            }
            if (hasCross) {
              if (lastFit > pageStart + 50) {
                best = Math.ceil(lastFit);
              } else if (le.top > pageStart + 50) {
                best = Math.floor(le.top) - safePx;
              }
              adj = true;
            }
            if (adj) break;
          }
          if (!adj) break;
        }

        // Prevent splitting sidebar atomic blocks (e.g. skill name + dots)
        // If break falls inside a small parent wrapper, move the whole item to next page
        const asideEl = content.querySelector('aside');
        if (asideEl) {
          const sidebarItems = asideEl.querySelectorAll('[data-section] > div > div');
          for (const item of Array.from(sidebarItems)) {
            const r = (item as HTMLElement).getBoundingClientRect();
            const iTop = r.top - cRect.top;
            const iBot = r.bottom - cRect.top;
            if (iTop < best && iBot > best && iBot - iTop < 60 && iTop > pageStart + 50) {
              best = Math.floor(iTop) - safePx;
            }
          }
        }

        breaks.push(best);
        pageStart = best;
      }

      return { breaks, totalHeight };
    }, A4_HEIGHT_PX, LINE_SAFETY_PX, showWatermark ? WATERMARK_BOTTOM_RESERVE : 0);

    console.log(`Puppeteer-calculated breaks: [${breakData.breaks.join(', ')}] (${breakData.breaks.length + 1} pages, height: ${breakData.totalHeight})`);

    // --- Pass 2: Replace body content in-place (preserves loaded fonts & CSS) ---
    const bodyHtml = breakData.breaks.length > 0
      ? buildPrePaginatedHtml(contentHtml, breakData.breaks, breakData.totalHeight, backgroundInfo, showWatermark)
      : (showWatermark ? wrapSinglePageWithWatermark(contentHtml) : contentHtml);

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

function buildCssBlock(styles: string, backgroundColor: string, showWatermark: boolean = false): string {
  const watermarkCss = showWatermark ? `
    .pdf-watermark {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999;
      pointer-events: none;
      overflow: hidden;
    }

    .pdf-watermark-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-family: 'Geist', 'Inter', Arial, sans-serif;
      font-size: 60px;
      font-weight: 700;
      color: rgba(180, 180, 180, 0.18);
      white-space: nowrap;
      letter-spacing: 8px;
      user-select: none;
      text-transform: uppercase;
    }

    .pdf-watermark-sub {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Geist', 'Inter', Arial, sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: rgba(150, 150, 150, 0.35);
      white-space: nowrap;
      letter-spacing: 1px;
      user-select: none;
    }
  ` : '';

  return `
    ${styles}

    :root, body {
      --font-geist-sans: 'Geist', 'Inter', system-ui, sans-serif !important;
      --font-geist-mono: 'Geist Mono', monospace !important;
      --font-sans: 'Geist', 'Inter', system-ui, sans-serif !important;
      --font-mono: 'Geist Mono', monospace !important;
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
      text-rendering: geometricPrecision !important;
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

    ${watermarkCss}
  `;
}

const WATERMARK_HTML = `<div class="pdf-watermark">
  <div class="pdf-watermark-text">LinImpact.ai</div>
  <div class="pdf-watermark-sub">Created with LinImpact.ai — Upgrade to Pro to remove watermark</div>
</div>`;

function wrapSinglePageWithWatermark(contentHtml: string): string {
  return `<div style="position:relative;width:794px;min-height:1122px;">
    ${contentHtml}
    ${WATERMARK_HTML}
  </div>`;
}

function buildPrePaginatedHtml(
  contentHtml: string,
  pageBreaks: number[],
  totalContentHeight: number,
  backgroundInfo?: BackgroundInfo,
  showWatermark: boolean = false
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
        ${showWatermark ? WATERMARK_HTML : ''}
      </div>
    `);
  }

  return pages.join('');
}
