import { test, expect } from "@playwright/test";

const firstForm = "#SearchForm_1 form.mugin_searchform";
const searchformPath =
  "/entries/widgets/searchform.html?domain=template&databases=pubmed&ai=false&advanced=false&component=1";

test.describe("SearchForm widget", () => {
  test("renders the search form and primary actions", async ({ page }) => {
    await page.goto(searchformPath, { waitUntil: "domcontentloaded" });
    await expect(page.locator(firstForm)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("#SearchForm_1 button.mugin_search")).toHaveCount(1);
    await expect(page.locator(firstForm)).toHaveAttribute("role", "search");
    await expect(page.getByRole("tab", { name: /Simpel søgning/i }).first()).toBeVisible();
  });

  test("does not auto-search when semantic sources are in the URL", async ({ page }) => {
    const searchRequests = [];
    page.on("request", (request) => {
      if (/UnifiedSearch\.php/i.test(request.url())) {
        searchRequests.push(request.url());
      }
    });
    await page.goto(
      "/entries/widgets/searchform.html?domain=template&databases=pubmed,openalex&ai=false&component=1",
      { waitUntil: "domcontentloaded" }
    );
    await expect(page.locator(firstForm)).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2000);
    expect(searchRequests).toEqual([]);
  });
});
