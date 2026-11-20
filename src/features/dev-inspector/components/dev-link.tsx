"use client";

import { WrenchIcon } from "lucide-react";
import { SidebarLink } from "@/components/sidebar-link";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { devCoursePath } from "@/features/dev-inspector/domain/dev-paths";

/** The sidebar's link to the developer view, shown to developers only. */
export function DevLink({ courseId }: { courseId: string }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarLink href={devCoursePath(courseId)}>
          <WrenchIcon />
          <span>Developer</span>
        </SidebarLink>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
