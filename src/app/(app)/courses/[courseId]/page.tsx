import { redirect } from "next/navigation";
import { courseMapPath } from "@/features/knowledge-map";

export default async function CoursePage({
  params,
}: PageProps<"/courses/[courseId]">) {
  const { courseId } = await params;
  redirect(courseMapPath(courseId));
}
