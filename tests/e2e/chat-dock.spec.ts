import { test, expect } from "@playwright/test";

/**
 * Chat dock smoke test. Does NOT call the LLM — that would require
 * `ANTHROPIC_API_KEY` and would be flaky in CI. Instead this verifies the
 * dock renders, its empty state is correct, and the catalog endpoint feeding
 * it is reachable.
 */
test("chat dock renders the empty state and toggles open/closed", async ({
  page,
}) => {
  // The catalog endpoint is the agent's only ambient-state input — the
  // dock can't function without it.
  const capabilities = await page.request.get("/api/capabilities");
  expect(capabilities.ok()).toBe(true);
  const catalog = (await capabilities.json()) as {
    version: string;
    widgets: Array<{ slug: string }>;
    tools: Array<{ name: string; category: string }>;
  };
  expect(catalog.version).toBe("agent-x/capabilities/v1");
  expect(catalog.widgets.length).toBeGreaterThan(0);
  expect(catalog.tools.map((t) => t.name).sort()).toEqual([
    "proposeShell",
    "proposeWidgetAddition",
  ]);

  // Open a fresh Scratchpad frame so we have a /frames/[id] context.
  await page.goto("/frames");
  await page.getByRole("button", { name: /start a scratchpad/i }).click();
  await expect(page).toHaveURL(/\/frames\/[0-9a-f-]+/);

  // The dock is open by default. Empty-state copy is visible.
  await expect(
    page.getByText(/I read the capability catalog, not your data/i),
  ).toBeVisible();

  // The textarea is focusable.
  const dockInput = page.getByRole("textbox", { name: /message agent x/i });
  await expect(dockInput).toBeVisible();

  // Collapse the dock.
  await page.getByRole("button", { name: /collapse agent chat/i }).click();
  await expect(dockInput).toBeHidden();

  // Reopen it.
  await page.getByRole("button", { name: /open agent chat/i }).click();
  await expect(dockInput).toBeVisible();
});
