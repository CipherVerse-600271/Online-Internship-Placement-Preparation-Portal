import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public landing page has no critical or serious WCAG 2.1 A/AA violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Launch your next opportunity" })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const seriousViolations = results.violations.filter(
    violation => violation.impact === "critical" || violation.impact === "serious"
  );

  if (results.violations.length) {
    console.log("Axe findings:", JSON.stringify(results.violations.map(({ id, impact, help, nodes }) => ({
      id, impact, help, affectedElements: nodes.length
    })), null, 2));
  }

  expect(seriousViolations, "Resolve critical and serious accessibility findings").toEqual([]);
});
