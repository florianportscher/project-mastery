"use client";

import { WaypointsIcon } from "lucide-react";
import { SidebarLink } from "@/components/sidebar-link";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { courseMapPath } from "@/features/knowledge-map/domain/map-paths";

export function CourseMapLink({ courseId }: { courseId: string }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarLink href={courseMapPath(courseId)}>
          <WaypointsIcon />
          <span>Course map</span>
        </SidebarLink>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
