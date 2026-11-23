import { expect, test } from "./fixtures";

// Runs only in the mock-fault project, whose server fails every mock model
// call (playwright.config.ts).
test("with every AI call failing, a Chat reply shows the error state", async ({
  page,
  course,
}) => {
  await page.goto(course.chatPath);
  const input = page.getByRole("textbox", { name: "Message" });
  await input.fill("What is a limit?");
  await input.press("Enter");

  const log = page.getByRole("log");
  await expect(
    log.getByText("The AI could not reply. Please try again."),
  ).toBeVisible();
  await expect(log.getByRole("button", { name: "Retry" })).toBeVisible();
  // The failed reply shows nothing, not an empty reply with its actions.
  await expect(log.getByRole("button", { name: "Regenerate" })).toHaveCount(0);
  await expect(log.getByRole("button", { name: "Copy" })).toHaveCount(1);

  // Nor once a later message follows it.
  await input.fill("And a derivative?");
  await input.press("Enter");
  await expect(log.getByText("And a derivative?")).toBeVisible();
  await expect(log.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(log.getByRole("button", { name: "Copy" })).toHaveCount(2);
});
