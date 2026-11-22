"use client";

import { FilesIcon } from "lucide-react";
import { SidebarLink } from "@/components/sidebar-link";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { materialsPath } from "@/features/courses/domain/course-paths";

export function MaterialsLink({ courseId }: { courseId: string }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarLink href={materialsPath(courseId)}>
          <FilesIcon />
          <span>Materials</span>
        </SidebarLink>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
