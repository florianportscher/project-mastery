"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { MAX_FLAG_NOTE_LENGTH } from "@/features/dev-inspector/schemas";
import { sendToDeveloper } from "@/features/dev-inspector/server/actions";

/**
 * Marks a Chat (`chatId`) or a Course's map build (none) as gone wrong, with
 * an optional note. Reads "Sent" once sent. Shown to developers only: the
 * caller decides.
 */
export function SendToDeveloper({
  courseId,
  chatId,
  sent: initiallySent,
}: {
  courseId: string;
  chatId?: string;
  sent: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(initiallySent);

  if (sent) {
    return (
      <Button variant="outline" size="sm" disabled>
        Sent
      </Button>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Send to developer
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        {/* Mounted per opening, so the note starts empty. */}
        <FlagForm
          courseId={courseId}
          chatId={chatId}
          onSent={() => {
            setSent(true);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function FlagForm({
  courseId,
  chatId,
  onSent,
}: {
  courseId: string;
  chatId?: string;
  onSent: () => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const noteId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await sendToDeveloper({ courseId, chatId, note });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onSent();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Send to developer</DialogTitle>
      </DialogHeader>
      <Field data-invalid={error !== null || undefined}>
        <FieldLabel htmlFor={noteId}>What felt wrong (optional)</FieldLabel>
        <Textarea
          id={noteId}
          value={note}
          maxLength={MAX_FLAG_NOTE_LENGTH}
          onChange={(event) => {
            setNote(event.target.value);
            setError(null);
          }}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          Send
        </Button>
      </DialogFooter>
    </form>
  );
}
