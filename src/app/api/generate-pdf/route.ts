import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

interface PageData {
  html: string;
  pageIndex: number;
}

interface RequestBody {
  pagesData: PageData[];
  styles: string;
  filename: string;
  totalPages: number;
  backgroundColor?: string;
  useNativePdf?: boolean;
}

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const body: RequestBody = await request.json();
    const { pagesData, styles, filename = "resume.pdf", backgroundColor = "#ffffff" } = body;

    if (!pagesData || pagesData.length === 0) {
      return NextResponse.json(
        { error: "No pages provided" },
        { status: 400 }
      );
    }

    // Combine all HTML content
    const combinedHtml = pagesData
      .sort((a, b) => a.pageIndex - b.pageIndex)
      .map(p => p.html)
      .join("");

    console.log(`Generating PDF with native Puppeteer PDF...`);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            ${styles}
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: ${backgroundColor} !important;
            }
            
            .resume-page {
              width: 210mm !important;
              min-height: auto !important;
              max-height: none !important;
              page-break-after: auto !important;
              box-shadow: none !important;
            }
            
            /* Keep section headers with their content */
            section h2,
            section h3 {
              break-after: avoid !important;
              page-break-after: avoid !important;
            }
            
            /* Keep job/education title header with at least some content below */
            .resume-item > div:first-child {
              break-after: avoid !important;
              page-break-after: avoid !important;
            }
            
            /* Prevent breaking inside individual list items (highlights) */
            .resume-item li {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            
            /* Prevent orphans and widows - keep at least 2 lines together */
            p, li {
              orphans: 2;
              widows: 2;
            }
            
            /* Make text wrap at line boundaries for cleaner page breaks */
            .resume-item p,
            .resume-item .description,
            .resume-item .summary {
              line-height: 1.6;
              display: block;
            }
            
            /* Wrap each line in its own box model context */
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
          </style>
        </head>
        <body>
          ${combinedHtml}
        </body>
      </html>
    `;

    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Use Puppeteer's native PDF generation which respects CSS page-break rules
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
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
