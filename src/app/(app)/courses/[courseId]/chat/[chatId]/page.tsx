import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chat, chatPath } from "@/features/chat";
import { getChat } from "@/features/chat/server";
import { getMaterialList } from "@/features/courses/server";
import { SendToDeveloper } from "@/features/dev-inspector";
import { isChatFlagged, isDeveloper } from "@/features/dev-inspector/server";
import { getDailyLimitStatus } from "@/features/usage/server";
import { requireUser } from "@/lib/auth/user";
import { isProductionDeployment } from "@/lib/deployment-env";

export const metadata: Metadata = {
  title: "Chat",
};

/** A stored Chat. One in another Course is not found here. */
export default async function ChatPage({
  params,
}: PageProps<"/courses/[courseId]/chat/[chatId]">) {
  const { courseId, chatId } = await params;
  const user = await requireUser(chatPath(courseId, chatId));
  const [chat, dailyLimit, materials, developer] = await Promise.all([
    getChat(courseId, chatId),
    getDailyLimitStatus(),
    getMaterialList(courseId),
    isDeveloper(),
  ]);
  if (!chat) notFound();
  const flagged = developer && (await isChatFlagged(chat.id));

  return (
    <Chat
      key={chat.id}
      chat={chat}
      isNew={false}
      materials={materials}
      ownerId={user.id}
      dailyLimit={dailyLimit}
      showDetails={!isProductionDeployment()}
      developerAction={
        developer && (
          <div className="mx-auto -mb-2 flex w-full max-w-3xl justify-end pt-2">
            <SendToDeveloper
              courseId={courseId}
              chatId={chat.id}
              sent={flagged}
            />
          </div>
        )
      }
    />
  );
}
