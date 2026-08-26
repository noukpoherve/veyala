import { withBrowser } from "@/lib/chromium";

/**
 * HTML → PDF via headless Chromium (Playwright): pixel-perfect design and
 * clickable links.
 */

/** Renders a standalone HTML document to an A4 PDF buffer. */
export async function htmlToPdf(html: string): Promise<Buffer> {
  return withBrowser(async (browser) => {
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "networkidle" });
      return await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });
    } finally {
      await page.close().catch(() => {}); // browser may be gone already
    }
  });
}
