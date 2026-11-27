import { aiTask } from "@/lib/ai/models";

function titleInstructions(courseLanguage: string | undefined) {
  const fallback = courseLanguage
    ? `in the language of the message, or in ${courseLanguage} when the message is a fixed English button text such as "Let's start." or "Show me an example."`
    : "in the language of the message";
  return `You name Chats in a study app. Given the Student's first message in a Chat, reply with a short title for the Chat: at most six words, ${fallback}, naming the subject or problem. Reply with the title only, without quotes, Markdown or a final period.`;
}

/**
 * Call settings for naming a Chat with the `title` task, given the Course
 * language of the reply's tutor context:
 *
 *   generateText({ ...chatTitleSettings("German"), prompt: firstMessage })
 */
export function chatTitleSettings(courseLanguage?: string) {
  return {
    ...aiTask("title"),
    instructions: titleInstructions(courseLanguage),
  };
}
