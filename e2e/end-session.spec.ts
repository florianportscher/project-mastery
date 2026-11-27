import { expect, seedKc, test } from "./fixtures";

/** Ending a Study session in a Chat, with the mock AI (AI_PROVIDER=mock). */

test("a session from the Today card: a question answered in its card is graded per part, and the close card lists its KC", async ({
  page,
  student,
  course,
}) => {
  await seedKc(student.id, course.id);
  await page.goto(course.chatPath);

  const today = page.getByRole("region", { name: "Today" });
  await today.getByRole("radio", { name: "15 min" }).click();
  await today.getByRole("link", { name: "Let's start." }).click();
  await expect(
    page.getByText("it never calls a real model.", { exact: false }),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Regenerate" })).toBeVisible();
  await expect(page.getByTestId("session-strip")).toContainText("0 of 15 min");

  // The mock asks two parts on the KC ids of the tutor context.
  const message = page.getByRole("textbox", { name: "Message" });
  await message.fill("Quiz me");
  await message.press("Enter");
  const question = page.getByTestId("question");
  await expect(question).toContainText("two plus two");
  // The card sends nothing while a reply streams: wait for its end.
  await expect(page.getByRole("button", { name: "Regenerate" })).toBeVisible();
  const parts = question.getByTestId("question-part");
  // While the Question is open, each part has its help and the quick
  // replies are gone.
  await expect(
    parts.nth(0).getByRole("button", { name: "Hint" }),
  ).toBeVisible();
  await expect(page.getByRole("group", { name: "Quick replies" })).toBeHidden();
  // A hint on part 1 with its work so far, the solution of part 2.
  await question.getByRole("textbox", { name: "Part 1" }).fill("4");
  await parts.nth(0).getByRole("button", { name: "Hint" }).click();
  await expect(page.getByText("Hint on part 1", { exact: true })).toBeVisible();
  await expect(
    page.getByText('Mock reply to "Hint on part 1. My work so far: 4"', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Regenerate" })).toBeVisible();
  await parts.nth(1).getByRole("button", { name: "Show the solution" }).click();
  await expect(parts.nth(1)).toContainText("Solution shown");
  await expect(
    page.getByText('Mock reply to "Show the solution of part 2."', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Regenerate" })).toBeVisible();
  await expect(parts.nth(1).getByRole("button", { name: "Hint" })).toBeHidden();

  await question.getByRole("button", { name: "Submit" }).click();

  await expect(parts.nth(0)).toContainText("Right");
  await expect(parts.nth(0)).toContainText("Mock note: right.");
  // A shown solution is stored wrong, though the part was left empty.
  await expect(parts.nth(1)).toContainText("Not right");
  await expect(
    page.getByRole("group", { name: "Quick replies" }),
  ).toBeVisible();
  // The card keeps the answer; the Submit shows no message of its own.
  await expect(question.getByRole("textbox", { name: "Part 1" })).toHaveValue(
    "4",
  );
  await expect(
    question.getByRole("textbox", { name: "Part 1" }),
  ).toBeDisabled();
  await expect(question.getByRole("button", { name: "Submit" })).toBeHidden();
  await expect(page.getByText(/^Part 1: 4/)).toBeHidden();
  await expect(
    page
      .getByTestId("session-strip")
      .getByRole("img", { name: /^Thrust equation: (practised|shown)/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: "End session" }).click();
  const card = page.getByRole("region", { name: "Session summary" });
  await card.getByRole("button", { name: /Session (summary|ended)/ }).click();
  const checked = card
    .getByRole("list", { name: "What you worked on" })
    .getByRole("listitem");
  await expect(checked).toHaveCount(1);
  await expect(checked).toContainText("Thrust equation");
  // Its second part's solution was shown, so the KC is not yet.
  await expect(checked).toContainText("Not yet");
});

test("End session makes the Chat read-only, and Start new session opens a new one", async ({
  page,
  student,
  course,
}) => {
  await seedKc(student.id, course.id);
  await page.goto(course.chatPath);

  const message = page.getByRole("textbox", { name: "Message" });
  await message.fill("Hello");
  await message.press("Enter");
  await expect(
    page.getByText("it never calls a real model.", { exact: false }),
  ).toBeVisible();

  await page.getByRole("button", { name: "End session" }).click();

  // The close card takes the composer's place.
  const ended = page.getByRole("region", { name: "Session summary" });
  await expect(ended.getByRole("heading")).toHaveText("Session ended");
  await expect(message).toBeHidden();
  await expect(page.getByRole("button", { name: "End session" })).toBeHidden();
  // Stays read-only on a reload, and opens a new Chat to go on.
  await page.reload();
  await expect(ended.getByRole("heading")).toHaveText("Session ended");
  await expect(page.getByRole("textbox", { name: "Message" })).toBeHidden();
  await ended.getByRole("link", { name: "Start new session" }).click();
  await expect(page).toHaveURL(new RegExp(`${course.chatPath}$`));
  await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
});
