import { chromium, type Browser } from "playwright-core";

/**
 * HTML → PDF via headless Chromium (Playwright): pixel-perfect design and
 * clickable links. The browser instance is shared across requests.
 */

let browserPromise: Promise<Browser> | null = null;

// Serverless platforms (Vercel, AWS Lambda) don't ship the Playwright browser
// binaries and have a read-only filesystem, so `npx playwright install` can't
// run at runtime. @sparticuz/chromium bundles a Lambda-compatible Chromium
// build (matching the Chromium version playwright-core expects) instead.
function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

async function launchBrowser(): Promise<Browser> {
  if (isServerless()) {
    const sparticuzChromium = (await import("@sparticuz/chromium")).default;
    return chromium.launch({
      args: sparticuzChromium.args,
      executablePath: await sparticuzChromium.executablePath(),
      headless: true,
    });
  }
  return chromium.launch({ headless: true });
}

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchBrowser().then((browser) => {
      browser.on("disconnected", () => {
        browserPromise = null;
      });
      return browser;
    });
    browserPromise.catch(() => {
      browserPromise = null;
    });
  }
  return browserPromise;
}

/** Renders a standalone HTML document to an A4 PDF buffer. */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await page.close();
  }
}
