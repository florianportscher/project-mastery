"use client";

import { ClipboardListIcon } from "lucide-react";
import { SidebarLink } from "@/components/sidebar-link";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { briefPath } from "@/features/brief/domain/brief-paths";

export function BriefLink({ courseId }: { courseId: string }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarLink href={briefPath(courseId)}>
          <ClipboardListIcon />
          <span>Brief</span>
        </SidebarLink>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
