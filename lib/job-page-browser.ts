import "server-only";
import { withBrowser } from "@/lib/chromium";
import { prefersMobileUserAgent } from "@/lib/job-board-urls";

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const GOTO_TIMEOUT_MS = 20_000;
const READY_TIMEOUT_MS = 12_000;

/**
 * Loads a job page in Chromium. Cloudflare often lets a real browser through
 * after `fetch` and the markdown reader both hit a challenge page.
 */
export async function fetchHtmlWithBrowser(url: URL): Promise<string | null> {
  const mobile = prefersMobileUserAgent(url.hostname);
  try {
    return await withBrowser(async (browser) => {
      const context = await browser.newContext({
        userAgent: mobile ? MOBILE_UA : DESKTOP_UA,
        viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 },
        locale: "fr-FR",
        extraHTTPHeaders: { "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8" },
      });
      try {
        const page = await context.newPage();
        await page.goto(url.href, {
          waitUntil: "domcontentloaded",
          timeout: GOTO_TIMEOUT_MS,
        });
        await page
          .waitForFunction(
            () => {
              const html = document.documentElement?.innerHTML ?? "";
              const title = document.title ?? "";
              if (
                /Security Check|Just a moment|Authenticating/i.test(title) &&
                html.length < 40_000
              ) {
                return false;
              }
              return Boolean(
                document.querySelector(
                  "#jobDescriptionText, .show-more-less-html__markup, script#__NEXT_DATA__, [itemprop='description']"
                ) ||
                  html.includes("window._initialData") ||
                  /"@type"\s*:\s*"JobPosting"/i.test(html) ||
                  (html.length > 25_000 && !/Security Check|Just a moment/i.test(title))
              );
            },
            { timeout: READY_TIMEOUT_MS }
          )
          .catch(() => {});
        return await page.content();
      } finally {
        await context.close().catch(() => {});
      }
    });
  } catch {
    return null;
  }
}
