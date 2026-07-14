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
  // @sparticuz/chromium only unpacks its bundled shared libraries (libnspr4,
  // libnss3, …) AND sets LD_LIBRARY_PATH when it detects an Amazon Linux 2023
  // runtime. On Vercel that detection hinges on process.env.VERCEL, which is
  // absent unless "Automatically expose System Environment Variables" is on —
  // so Chromium launches but dies on "libnspr4.so: cannot open shared object".
  // We only reach this after isServerless() confirmed a serverless Linux host
  // (and @sparticuz 149 ships only the AL2023 lib pack), so assert the signal
  // BEFORE importing the module: its top-level code reads it to set up the libs.
  process.env.VERCEL ??= "1";
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

async function renderPdfOnce(html: string): Promise<Buffer> {
  let browser = await getBrowser();
  // A previously shared browser may have died (e.g. OOM-killed on a serverless
  // host) after the disconnect event already cleared browserPromise; a stale
  // reference can also be returned before the event fires. Check liveness and
  // relaunch instead of calling newPage() on a dead browser.
  if (!browser.isConnected()) {
    browserPromise = null;
    browser = await getBrowser();
  }
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
}

/** Tears down the shared browser so the next render launches a fresh one. */
async function closeBrowser(): Promise<void> {
  const pending = browserPromise;
  browserPromise = null;
  if (pending) await pending.then((b) => b.close()).catch(() => {});
}

/** Renders a standalone HTML document to an A4 PDF buffer. */
export async function htmlToPdf(html: string): Promise<Buffer> {
  try {
    try {
      return await renderPdfOnce(html);
    } catch (error) {
      // "Target page, context or browser has been closed" means the shared
      // Chromium crashed mid-render. Retry once on a fresh browser: transient
      // memory pressure usually clears after the crashed process is reaped.
      const message = error instanceof Error ? error.message : String(error);
      if (!/has been closed|browser.*disconnected|Target closed/i.test(message)) throw error;
      browserPromise = null;
      return await renderPdfOnce(html);
    }
  } finally {
    // Serverless functions are memory-capped (2048 MB on Vercel Hobby); keeping
    // Chromium warm lets memory accumulate across the CV and cover-letter
    // renders and OOM-kills the process. Close it after each render so peak
    // usage is ever only a single render. Local dev keeps the browser warm.
    if (isServerless()) await closeBrowser();
  }
}
