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
// VERCEL/VERCEL_ENV are absent when "Automatically expose System Environment
// Variables" is disabled on the project, hence the extra AWS runtime signals.
function isServerless(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      process.env.AWS_EXECUTION_ENV
  );
}

async function launchBundledChromium(): Promise<Browser> {
  const sparticuzChromium = (await import("@sparticuz/chromium")).default;
  // CV/cover letter PDFs never need WebGL; disabling it cuts Chromium's
  // memory footprint enough to avoid OOM kills under Lambda's memory cap.
  sparticuzChromium.setGraphicsMode = false;
  return chromium.launch({
    args: sparticuzChromium.args,
    executablePath: await sparticuzChromium.executablePath(),
    headless: true,
  });
}

async function launchBrowser(): Promise<Browser> {
  // Fast path: on a detected serverless platform, go straight to the bundled
  // Lambda Chromium (playwright-core 1.61 and @sparticuz 149 both ship Chromium 149).
  if (isServerless()) return launchBundledChromium();

  // Local dev: prefer the Playwright-managed Chromium, then a system Chrome.
  try {
    return await chromium.launch({ headless: true });
  } catch (primaryError) {
    try {
      return await chromium.launch({ headless: true, channel: "chrome" });
    } catch {
      // Last resort: only on Linux can the @sparticuz binary actually run.
      // This is the production safety net — if serverless env detection ever
      // misses (e.g. a Vercel runtime that doesn't expose the expected vars),
      // we still render instead of failing the whole generation. On macOS /
      // Windows we never reach it, so a dev never hits the wrong-OS binary.
      if (process.platform === "linux") return launchBundledChromium();
      throw new Error(
        "Aucun navigateur Chromium disponible pour générer le PDF. " +
          "Lancez `npm run setup:pdf` (ou installez Google Chrome). " +
          `Cause : ${primaryError instanceof Error ? primaryError.message : String(primaryError)}`
      );
    }
  }
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
