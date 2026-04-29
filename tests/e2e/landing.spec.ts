import { test, expect } from "@playwright/test";

test("landing page renders the operator-grade hero and theme toggle", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /personal agentic work-surface/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /toggle theme/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /pick a frame/i })).toBeVisible();
});
