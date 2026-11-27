import path from "node:path";
import { expect, test } from "./fixtures";

// Chromium plays a file as the microphone, so recording needs no hardware.
const RECORDING = path.join(__dirname, "files", "dictation.webm");

test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      `--use-file-for-fake-audio-capture=${RECORDING}`,
    ],
  },
});

test("a dictated sentence lands after the typed text, and nothing is sent", async ({
  page,
  course,
}) => {
  await page.goto(course.chatPath);
  const input = page.getByRole("textbox", { name: "Message" });
  await input.fill("Question:");

  await page.getByRole("button", { name: "Dictate" }).click();
  await page.getByRole("button", { name: "Stop dictating" }).click();

  // The mock transcription answers with a fixed sentence.
  await expect(input).toHaveValue(
    "Question: The determinant of A is zero, so A is not invertible.",
  );
  await expect(page).toHaveURL(course.chatPath);
  await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
});

test("a dictated sentence lands at the cursor", async ({ page, course }) => {
  await page.goto(course.chatPath);
  const input = page.getByRole("textbox", { name: "Message" });
  await input.fill("Question: done");
  await input.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(9, 9));

  await page.getByRole("button", { name: "Dictate" }).click();
  await page.getByRole("button", { name: "Stop dictating" }).click();

  await expect(input).toHaveValue(
    "Question: The determinant of A is zero, so A is not invertible. done",
  );
});
