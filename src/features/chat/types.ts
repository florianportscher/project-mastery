import type { UIMessage } from "ai";
import type { MaterialReference } from "@/features/courses";
import type { PartAnswer, ProblemFlag, TutorContext } from "@/features/study";
import type { ReplyUsage } from "@/features/usage";

/** What the server attaches to an AI message besides its parts. */
export type ChatMessageMetadata = {
  /** The model that wrote the reply. */
  modelId?: string;
  /** Whether the reply was stopped before it ended. */
  stopped?: boolean;
  /**
   * The tutor context the reply was given. Sent on the stream's `start`
   * part; missing on replies from before it was saved.
   */
  tutorContext?: TutorContext;
  /**
   * The reply's tokens and cost. Sent on the stream's `finish` part, and
   * loaded from the reply's `ai_usage` record; missing on older replies.
   */
  usage?: ReplyUsage;
  /**
   * On a Student message sent by a Question card's Submit: the answer to
   * each of its parts. The Chat shows it in the card, not as a message.
   */
  answer?: SubmittedAnswer;
};

export type SubmittedAnswer = { questionId: string; parts: PartAnswer[] };

/** The custom data parts of Chat messages, by name without `data-`. */
type ChatDataParts = {
  /** A Material the Student attached to their message. */
  material: MaterialReference;
  /** Sent, not stored, while a reply waits to be asked again. */
  busy: Record<string, never>;
};

export type ChatUIMessage = UIMessage<ChatMessageMetadata, ChatDataParts>;

export type ChatWithMessages = {
  id: string;
  /** The Course the Chat belongs to. */
  courseId: string;
  title: string | null;
  messages: ChatUIMessage[];
  /** Whether its Study session has ended, which makes it read-only. */
  ended: boolean;
  /** The flags of the generated Problems its questions posed, by Problem id. */
  problemFlags: Record<string, ProblemFlag>;
};

/**
 * What the source pane opens: a Reading section by id, or a Material at
 * cited pages.
 */
export type SourceRequest =
  | { kind: "section"; id: string }
  | { kind: "pages"; materialId: string; pageFrom: number; pageTo: number };

export type ChatSource = {
  materialId: string;
  materialName: string;
  /** The page it opens at. */
  pageFrom: number;
  pageTo: number;
  /** Whether the cited pages are not in the Material: it opens at p. 1. */
  pageNotFound?: boolean;
};

export type ChatListItem = {
  id: string;
  /** The title, or the first message shortened (`chatLabel`). */
  label: string;
};
