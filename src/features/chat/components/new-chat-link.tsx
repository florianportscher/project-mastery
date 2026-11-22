"use client";

import { SquarePenIcon } from "lucide-react";
import { SidebarLink } from "@/components/sidebar-link";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { newChatPath } from "@/features/chat/domain/chat-paths";
import { useChatList } from "@/features/chat/hooks/use-chat-list";

export function NewChatLink() {
  const { courseId } = useChatList();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* Never highlighted: an empty Chat is not in the list. */}
        <SidebarLink href={newChatPath(courseId)} isActive={false}>
          <SquarePenIcon />
          <span>New chat</span>
        </SidebarLink>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
