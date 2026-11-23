import { adminClient, expect, seedChat, test } from "./fixtures";

test("a developer sends a Chat with a note and sees Sent; others see no button", async ({
  page,
  student,
  course,
}) => {
  const chatId = await seedChat(student.id, course.id, {
    firstMessage: "What is a limit?",
    at: new Date(),
  });
  const chatUrl = `${course.chatPath}/${chatId}`;

  await page.goto(chatUrl);
  await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send to developer" }),
  ).toHaveCount(0);

  const admin = adminClient();
  const added = await admin.from("developers").insert({ user_id: student.id });
  expect(added.error).toBeNull();

  await page.goto(chatUrl);
  await page.getByRole("button", { name: "Send to developer" }).click();
  const dialog = page.getByRole("dialog", { name: "Send to developer" });
  await dialog
    .getByRole("textbox", { name: "What felt wrong" })
    .fill("The tutor skipped the definition");
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Sent" })).toBeDisabled();

  const { data } = await admin
    .from("developer_flags")
    .select("note, chat_id, case_id")
    .eq("owner", student.id);
  expect(data).toEqual([
    {
      note: "The tutor skipped the definition",
      chat_id: chatId,
      case_id: null,
    },
  ]);

  await page.reload();
  await expect(page.getByRole("button", { name: "Sent" })).toBeVisible();
});
