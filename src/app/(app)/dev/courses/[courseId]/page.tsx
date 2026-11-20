import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseInspector, devCoursePath } from "@/features/dev-inspector";
import {
  getCourseInspection,
  requireDeveloper,
} from "@/features/dev-inspector/server";
import { courseMapPath } from "@/features/knowledge-map";

export const metadata: Metadata = {
  title: "Developer view",
};

/**
 * The developer view of a Course's map build. Not found in production, for
 * any account without a `developers` row, and for another Student's Course.
 */
export default async function DevCoursePage({
  params,
}: PageProps<"/dev/courses/[courseId]">) {
  const { courseId } = await params;
  await requireDeveloper(devCoursePath(courseId));
  const inspection = await getCourseInspection(courseId);
  if (!inspection) notFound();
  return <CourseInspector {...inspection} backHref={courseMapPath(courseId)} />;
}
