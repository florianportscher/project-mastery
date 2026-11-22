export function courseMapPath(courseId: string): string {
  return `/courses/${courseId}/map`;
}

export function topicPath(courseId: string, topicId: string): string {
  return `${courseMapPath(courseId)}/${topicId}`;
}
