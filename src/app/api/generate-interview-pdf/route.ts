import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const body = await request.json();
    const { html } = body;

    if (!html) {
      return NextResponse.json(
        { error: "No HTML content provided" },
        { status: 400 }
      );
    }

    console.log("Generating Interview Guide PDF...");

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 794, height: 1122 },
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    await page.close();
    await browser.close();
    browser = null;

    console.log(`Interview Guide PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="interview-guide.pdf"',
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
