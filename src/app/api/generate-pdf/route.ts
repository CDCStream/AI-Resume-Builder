import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1122;

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
}

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const body: RequestBody = await request.json();
    const { pagesData, styles, filename = "resume.pdf", totalPages, backgroundColor = "#ffffff" } = body;

    console.log(`Background color: ${backgroundColor}`);

    if (!pagesData || pagesData.length === 0) {
      return NextResponse.json(
        { error: "No pages provided" },
        { status: 400 }
      );
    }

    console.log(`Generating PDF with ${totalPages} pages`);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const screenshots: Buffer[] = [];

    for (let i = 0; i < pagesData.length; i++) {
      const { html, pageIndex } = pagesData[i];
      const translateY = pageIndex * A4_HEIGHT_PX;

      console.log(`Rendering page ${pageIndex + 1}/${totalPages}, translateY: -${translateY}px`);

      const page = await browser.newPage();

      await page.setViewport({
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        deviceScaleFactor: 2,
      });

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
                width: ${A4_WIDTH_PX}px !important;
                height: ${A4_HEIGHT_PX}px !important;
                overflow: hidden !important;
              }
              
              .pdf-page-container {
                width: ${A4_WIDTH_PX}px !important;
                height: ${A4_HEIGHT_PX}px !important;
                overflow: hidden !important;
                position: relative !important;
                background: ${backgroundColor} !important;
              }
              
              .pdf-content-wrapper {
                width: ${A4_WIDTH_PX}px !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                transform: translateY(-${translateY}px) !important;
              }
              
              .no-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            <div class="pdf-page-container">
              <div class="pdf-content-wrapper">
                ${html}
              </div>
            </div>
          </body>
        </html>
      `;

      await page.setContent(fullHtml, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      const screenshot = await page.screenshot({
        type: "png",
        clip: {
          x: 0,
          y: 0,
          width: A4_WIDTH_PX,
          height: A4_HEIGHT_PX,
        },
      });

      screenshots.push(Buffer.from(screenshot));
      console.log(`Page ${pageIndex + 1} captured`);

      await page.close();
    }

    await browser.close();
    browser = null;

    console.log(`Captured ${screenshots.length} screenshots, creating PDF...`);

    const pdfDoc = await PDFDocument.create();

    // A4 size in points (72 points per inch, A4 is 8.27 x 11.69 inches)
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    for (let i = 0; i < screenshots.length; i++) {
      const pngImage = await pdfDoc.embedPng(screenshots[i]);
      const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
      
      pdfPage.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });

      console.log(`Added page ${i + 1} to PDF`);
    }

    const pdfBytes = await pdfDoc.save();

    console.log(`PDF generated successfully, size: ${pdfBytes.length} bytes`);

    return new NextResponse(Buffer.from(pdfBytes), {
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
