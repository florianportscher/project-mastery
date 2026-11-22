export function newChatPath(courseId: string): string {
  return `/courses/${courseId}/chat`;
}

export function chatPath(courseId: string, chatId: string): string {
  return `${newChatPath(courseId)}/${chatId}`;
}
