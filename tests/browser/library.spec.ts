import { test, expect } from "@playwright/test";

const slug = "diffusion-policy-visuomotor-policy-learning";
const paperPath = `/paper/${slug}`;
const storageKey = "reading-library:v1";

test("bookmarks, chapters, notes, completion, backup and removal persist", async ({ page }) => {
  await page.goto(paperPath);
  const save = page.locator(".paper-buttons .save-paper");
  await expect(save).toBeEnabled();
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  const chapter = page.locator(".book-tabs button").nth(2);
  await chapter.click();
  await page.getByText("End-of-paper reflection", { exact: true }).click();
  await page.getByLabel("What I learned", { exact: true }).fill("Denoising produces a sequence of actions.");
  await page.getByLabel("Questions I still have").fill("How does the horizon affect control?");
  await page.getByLabel("What I want to try next").fill("Compare the two policy variants.");
  await page.reload();
  await expect(chapter).toHaveAttribute("aria-current", "step");
  await page.getByText("End-of-paper reflection", { exact: true }).click();
  await expect(page.getByLabel("What I learned", { exact: true })).toHaveValue("Denoising produces a sequence of actions.");
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Reading status", { exact: true }).selectOption("completed");
  await page.reload();
  await expect(page.getByLabel("Reading status", { exact: true })).toHaveValue("completed");
  await page.goto("/saved");
  await expect(page.locator(".saved-record")).toHaveCount(1);
  await page.getByRole("tab", { name: "Learning notes" }).click();
  await expect(page.locator(".saved-notes")).toContainText("Denoising produces");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const download = await downloaded;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.evaluate(key => localStorage.removeItem(key), storageKey);
  await page.reload();
  await expect(page.locator(".saved-record")).toHaveCount(0);
  await page.getByLabel("Import library backup").setInputFiles(path!);
  await expect(page.getByRole("status")).toContainText("Imported 1 new paper record");
  await expect(page.locator(".saved-record")).toHaveCount(1);
  await page.locator(".saved-record .save-paper").click();
  await expect(page.locator(".saved-record")).toHaveCount(0);
  await page.getByRole("tab", { name: "Finished", exact: true }).click();
  await expect(page.locator(".saved-record")).toHaveCount(1);
  await page.getByRole("tab", { name: "Learning notes" }).click();
  await expect(page.locator(".saved-notes")).toContainText("Compare the two policy variants.");
});

test("search query from the URL and topics affect the bookshelf", async ({ page }) => {
  await page.goto("/explore?q=diffusion");
  await expect(page).toHaveURL(/\/\?q=diffusion#papers$/);
  await expect(page.getByLabel("Find a paper", { exact: true })).toHaveValue("diffusion");
  await expect(page.locator(".shelf-book").first()).toBeVisible();
  await page.getByLabel("Find a paper", { exact: true }).fill("no-such-research-paper-zzzz");
  await expect(page.locator(".shelf-book")).toHaveCount(0);
  await page.getByLabel("Find a paper", { exact: true }).fill("");
  await page.locator('#topics').getByRole('button',{name:'World Models',exact:true}).click();
  await expect(page.locator(".shelf-book").first()).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: "Bookshelf", exact: true }).click();
  await expect(page).toHaveURL("/");
});

test("tabs share bookmark changes without reloading", async ({ page, context }) => {
  await page.goto(paperPath);
  await expect(page.locator(".paper-buttons .save-paper")).toBeEnabled();
  const other = await context.newPage();
  await other.goto("/saved");
  await expect(other.getByRole("button", { name: "Export backup" })).toBeEnabled();
  await page.locator(".paper-buttons .save-paper").click();
  await expect(other.locator(".saved-record")).toHaveCount(1);
  await other.locator(".save-paper").click();
  await expect(page.locator(".paper-buttons .save-paper")).toHaveAttribute("aria-pressed", "false");
});

test("invalid backups do not erase the journal", async ({ page }) => {
  await page.goto(paperPath);
  await page.getByText("End-of-paper reflection", { exact: true }).click();
  await page.getByLabel("What I learned", { exact: true }).fill("Keep this note.");
  await page.goto("/saved");
  await page.getByLabel("Import library backup").setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from('{"version":99,"records":{}}') });
  await expect(page.getByRole("status")).toContainText("not a supported library backup");
  await page.getByRole("tab", { name: "Learning notes" }).click();
  await expect(page.locator(".saved-notes")).toContainText("Keep this note.");
});

test("a failed storage write keeps the draft visible and reports the failure", async ({ page }) => {
  await page.goto(paperPath);
  await page.getByText("End-of-paper reflection", { exact: true }).click();
  const field = page.getByLabel("What I learned", { exact: true });
  await expect(field).toBeEnabled();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); }; });
  await field.fill("A note that must not disappear.");
  await expect(field).toHaveValue("A note that must not disappear.");
  await expect(page.getByRole("alert").filter({ hasText: "could not be saved" })).toBeVisible();
});

test("mobile journal and saved library fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(paperPath);
  await page.getByText("End-of-paper reflection", { exact: true }).click();
  await page.getByLabel("What I learned", { exact: true }).fill("A mobile reading note.");
  await expect(page.locator(".reading-journal")).toBeVisible();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflows).toBe(false);
  await page.screenshot({ path: "test-results/reader-mobile.png", fullPage: true });
  await page.goto("/saved");
  await page.getByRole("tab", { name: "Learning notes" }).click();
  await expect(page.locator(".saved-notes")).toContainText("A mobile reading note.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
});


test("collection completion and saved papers use the same reading record", async ({ page }) => {
  await page.goto("/collection/modern-physical-ai");
  await page.getByRole("button", { name: "Save all papers" }).click();
  await expect(page.getByRole("button", { name: "All papers saved" })).toBeVisible();
  await page.getByRole("button", { name: "Mark read", exact: true }).first().click();
  await expect(page.getByRole("progressbar", { name: "Collection reading progress" })).toHaveAttribute("value", "1");
  await page.reload();
  await expect(page.getByRole("progressbar", { name: "Collection reading progress" })).toHaveAttribute("value", "1");
  await page.goto("/saved");
  await page.getByRole("tab", { name: "Finished", exact: true }).click();
  await expect(page.locator(".saved-record")).toHaveCount(1);
});
