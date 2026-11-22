"use client";

import { usePathname } from "next/navigation";
import { topicPath } from "@/features/knowledge-map/domain/map-paths";

export function TopicTitle({
  courseId,
  topics,
}: {
  courseId: string;
  topics: Array<{ id: string; name: string }>;
}) {
  const pathname = usePathname();
  return (
    topics.find(({ id }) => topicPath(courseId, id) === pathname)?.name ??
    "Topic"
  );
}
