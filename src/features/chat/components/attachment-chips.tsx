"use client";

import { PromptInputHeader } from "@/components/ai-elements/prompt-input";
import type { useMessageAttachments } from "@/features/chat/hooks/use-message-attachments";
import { MaterialChip } from "@/features/courses";

/**
 * The input's header: the Materials attached to the message and the files
 * being uploaded, each as a chip. Nothing without either.
 */
export function AttachmentChips({
  attached,
  detach,
  materialsById,
  uploads,
  uploading,
  retryUpload,
  removeUpload,
}: Pick<
  ReturnType<typeof useMessageAttachments>,
  | "attached"
  | "detach"
  | "materialsById"
  | "uploads"
  | "uploading"
  | "retryUpload"
  | "removeUpload"
>) {
  if (attached.length === 0 && !uploading) return null;
  return (
    <PromptInputHeader aria-label="Attached materials">
      {attached.map((material) => (
        <MaterialChip
          key={material.materialId}
          name={materialsById.get(material.materialId)?.name ?? material.name}
          mediaType={material.mediaType}
          onRemove={() => detach(material.materialId)}
        />
      ))}
      {uploads.map((upload) => (
        <MaterialChip
          key={upload.key}
          name={upload.filename}
          mediaType={upload.mediaType}
          progress={upload.status === "failed" ? undefined : upload.progress}
          error={upload.status === "failed" ? upload.message : undefined}
          onRetry={upload.canRetry ? () => retryUpload(upload.key) : undefined}
          onRemove={
            upload.status === "registering"
              ? undefined
              : () => removeUpload(upload.key)
          }
        />
      ))}
    </PromptInputHeader>
  );
}
