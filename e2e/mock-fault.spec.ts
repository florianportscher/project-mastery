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
});
