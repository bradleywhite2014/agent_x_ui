import { test, expect } from "@playwright/test";

test("create a Daily Operator frame, edit notes, and revert", async ({
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
    page.getByRole("region", { name: /widget notes-1/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: /widget preview-1/i }),
  ).toBeVisible();

  // Edit the notes panel.
  const editor = page.getByRole("textbox", { name: /today editor/i });
  await editor.click();
  await editor.fill("# Today\n\n- [x] Verify Agent X P1 flow");

  // Save creates a revision.
  await page.getByRole("button", { name: /save notes/i }).click();
  await expect(page.getByText(/^saved$/)).toBeVisible({ timeout: 10_000 });

  // Open history. The Sheet shows the running revision count via a Badge.
  await page.getByRole("button", { name: /history/i }).click();
  await expect(
    page.getByRole("heading", { name: /revision history/i }),
  ).toBeVisible();

  // We expect at least 2 revisions — the genesis and the notes save.
  const revertButtons = page.getByRole("button", { name: /revert here/i });
  await expect(revertButtons.first()).toBeVisible();

  // Revert to the bottom-most revision (genesis), which restores the
  // template's default notes.
  await revertButtons.last().click();

  // Sheet auto-closes on revert; the editor should re-render with the seed text.
  await expect(editor).toHaveValue(/Today/);
  await expect(editor).not.toHaveValue(/Verify Agent X P1 flow/);
});

test("edit-mode lets the user add and remove a widget", async ({ page }) => {
  // Pick a fresh Scratchpad to avoid colliding with the other test's frame.
  await page.goto("/frames");
  await page.getByRole("button", { name: /start a scratchpad/i }).click();
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

  // It should disappear; the original notes-1 region remains.
  await expect(previewRegion).toBeHidden();
  await expect(
    page.getByRole("region", { name: /widget notes-1/i }),
  ).toBeVisible();
});
