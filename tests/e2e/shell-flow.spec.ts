import { test, expect } from "@playwright/test";

test("create a Daily Operator frame, add a widget, and revert", async ({
  page,
}) => {
  // Start at the picker.
  await page.goto("/frames");
  await expect(
    page.getByRole("heading", { name: /pick how you want to work/i }),
  ).toBeVisible();

  // Create a Daily Operator frame.
  await page.getByRole("button", { name: /start a daily operator/i }).click();

  // We should land on /frames/<id> with the shell visible.
  await expect(page).toHaveURL(/\/frames\/[0-9a-f-]+/);
  await expect(
    page.getByRole("region", { name: /widget rail-1/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: /widget dashboard-1/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /integrations/i })).toBeVisible();
  await expect(page.getByText(/mock api feed/i)).toBeVisible();

  // Edit mode can still compose extra panels; adding a widget creates a revision.
  await page.getByRole("button", { name: /^edit$/i }).click();
  await page.getByRole("button", { name: /^web preview$/i }).click();
  const previewRegion = page
    .getByRole("region", { name: /widget web-preview-/i })
    .first();
  await expect(previewRegion).toBeVisible();

  // Open history. The Sheet shows the running revision count via a Badge.
  await page.getByRole("button", { name: /history/i }).click();
  await expect(
    page.getByRole("heading", { name: /revision history/i }),
  ).toBeVisible();

  // We expect at least 2 revisions — the genesis and the notes save.
  const revertButtons = page.getByRole("button", { name: /revert here/i });
  await expect(revertButtons.first()).toBeVisible();

  // Revert to the bottom-most revision (genesis), which removes the added panel.
  await revertButtons.last().click();

  await expect(previewRegion).toBeHidden();
  await expect(
    page.getByRole("region", { name: /widget dashboard-1/i }),
  ).toBeVisible();
});

test("edit-mode lets the user add and remove a widget", async ({ page }) => {
  // Pick a fresh Blank Canvas to avoid colliding with the other test's frame.
  await page.goto("/frames");
  await page.getByRole("button", { name: /start a blank canvas/i }).click();
  await expect(page).toHaveURL(/\/frames\/[0-9a-f-]+/);

  // Toggle edit mode.
  await page.getByRole("button", { name: /^edit$/i }).click();

  // Add a Web Preview widget.
  await page.getByRole("button", { name: /^web preview$/i }).click();

  // The preview iframe wrapper renders.
  await expect(
    page.getByRole("region", { name: /widget web-preview-/i }),
  ).toBeVisible();

  // Remove the new widget. Find the first Web Preview region and click its
  // remove button.
  const previewRegion = page
    .getByRole("region", { name: /widget web-preview-/i })
    .first();
  await previewRegion.getByRole("button", { name: /remove widget/i }).click();

  // It should disappear; the original blank-1 region remains.
  await expect(previewRegion).toBeHidden();
  await expect(
    page.getByRole("region", { name: /widget blank-1/i }),
  ).toBeVisible();
});
