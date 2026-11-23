"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AttachedMaterials } from "@/features/chat/components/attached-materials";
import { ContextAction } from "@/features/chat/components/context-action";
import { MessageActionRow } from "@/features/chat/components/message-action-row";
import { ReplyFooter } from "@/features/chat/components/reply-footer";
import { ReplyParts } from "@/features/chat/components/reply-parts";
import { replyActivity } from "@/features/chat/domain/reply-activity";
import type { ChatUIMessage } from "@/features/chat/types";
import type { MaterialListItem } from "@/features/courses";
import type { ProblemFlag } from "@/features/study";
import { messageText } from "@/lib/ai/reply";

/** A Student's message in a Chat: the Materials it attaches and its text. */
export function StudentMessage({
  message,
  materialsById,
  onOpenMaterial,
}: {
  message: ChatUIMessage;
  /** The Materials to show attached ones under their current names. */
  materialsById: Map<string, MaterialListItem>;
  onOpenMaterial: (material: MaterialListItem) => void;
}) {
  const text = messageText(message.parts);
  return (
    <Message from="user">
      <MessageContent data-testid="message-text" className="wrap-break-word">
        <AttachedMaterials
          parts={message.parts}
          materialsById={materialsById}
          onOpen={onOpenMaterial}
        />
        {text !== "" && <p className="whitespace-pre-wrap">{text}</p>}
      </MessageContent>
      <MessageActionRow from="user" text={text} />
    </Message>
  );
}

/**
 * An AI reply in a Chat: its parts, and until it has text, a line that says
 * what the AI is doing in its place, in the same box the text then fills.
 * Its actions are hidden while it is on its way.
 */
export function AiReply({
  message,
  streaming,
  inProgress,
  arrived,
  showDetails,
  problemFlags,
  onRegenerate,
}: {
  message: ChatUIMessage;
  /** Whether its text is streaming in. */
  streaming: boolean;
  /** Whether the reply is still being made. */
  inProgress: boolean;
  /** Whether it arrived while the Chat is open, not with the stored Chat. */
  arrived: boolean;
  /** Whether its step cards and Context sheet show: outside production. */
  showDetails: boolean;
  problemFlags: Record<string, ProblemFlag>;
  /** Shown as Regenerate when given. */
  onRegenerate?: () => void;
}) {
  const activity = inProgress ? replyActivity(message.parts) : null;
  return (
    <Message from="assistant">
      <MessageContent data-testid="message-text" className="wrap-break-word">
        <ReplyParts
          parts={message.parts}
          streaming={streaming}
          inProgress={inProgress}
          arrived={arrived}
          showSteps={showDetails}
          problemFlags={problemFlags}
        />
        {activity !== null && <Shimmer className="text-sm">{activity}</Shimmer>}
      </MessageContent>
      <MessageActionRow
        from="assistant"
        text={messageText(message.parts)}
        stopped={message.metadata?.stopped}
        hidden={inProgress}
        onRegenerate={onRegenerate}
      >
        {showDetails && (
          <ContextAction context={message.metadata?.tutorContext} />
        )}
        <ReplyFooter metadata={message.metadata} />
      </MessageActionRow>
    </Message>
  );
}
