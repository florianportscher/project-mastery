"use client";

import { useState, type ChangeEvent } from "react";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chatMarkdownComponents } from "@/features/chat/components/citation-link";
import {
  answerText,
  optionLetter,
  VERDICT_LABELS,
  type QuestionState,
} from "@/features/chat/domain/question-states";
import type { AskedQuestion } from "@/features/chat/domain/reply-steps";
import { MAX_PART_ANSWER_LENGTH } from "@/features/chat/schemas";
import {
  ProblemFlagControl,
  type PartAnswer,
  type PartResult,
  type ProblemFlag,
} from "@/features/study";
import { cn } from "@/lib/utils";

/** What the Chat gives each Question card to answer it with. */
export type QuestionAnswering = {
  states: Map<string, QuestionState>;
  /** While a reply is on its way, or the Chat can't send: no Submit. */
  disabled: boolean;
  /** `text` is the Submit's message text, as the model reads it. */
  onSubmit: (questionId: string, parts: PartAnswer[], text: string) => void;
};

const VERDICT_STYLES: Record<PartResult, string> = {
  full: "bg-success/15 text-success",
  partial: "bg-warning/20 text-warning-foreground dark:text-warning",
  wrong: "bg-destructive/10 text-destructive",
  unanswered: "bg-muted text-muted-foreground",
};

/**
 * A Question as part of the reply: its case, or the Problem it poses with
 * an Exercise's page link and a generated Problem's flag control, then each
 * part with its field. The Student fills what they can and submits once;
 * the fields then keep their answers, and each part shows its verdict and
 * note once graded. A Question asked before parts shows its case only.
 */
export function QuestionCard({
  question,
  problemFlags,
  answering,
}: {
  question: AskedQuestion;
  problemFlags: Record<string, ProblemFlag>;
  answering: QuestionAnswering;
}) {
  const { problem, parts } = question;
  const state = answering.states.get(question.id);
  const [texts, setTexts] = useState<Record<number, string>>({});
  const [picks, setPicks] = useState<Record<number, number>>({});
  const editable = state?.open === true && !answering.disabled;
  const textOf = (position: number) =>
    state?.answers?.get(position)?.text ?? texts[position] ?? "";
  const choiceOf = (position: number): number | null =>
    state?.answers
      ? (state.answers.get(position)?.choice ?? null)
      : (picks[position] ?? null);

  return (
    <div
      data-testid="question"
      className={cn(
        "flex flex-col gap-3",
        parts.length > 0 && "w-xl max-w-full rounded-lg border p-4",
      )}
    >
      <Markdown components={chatMarkdownComponents}>
        {problem?.statement ?? question.prompt}
      </Markdown>
      {problem?.page && (
        <Markdown components={chatMarkdownComponents}>
          {`[${problem.page.label}](${problem.page.link})`}
        </Markdown>
      )}
      {problem?.generatedProblemId && (
        <ProblemFlagControl
          problemId={problem.generatedProblemId}
          flag={problemFlags[problem.generatedProblemId]}
        />
      )}
      {parts.length > 0 && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!editable) return;
            const answers = parts.map(({ position }) => ({
              position,
              text: textOf(position),
              choice: choiceOf(position),
            }));
            answering.onSubmit(
              question.id,
              answers,
              answerText(answers, parts),
            );
          }}
        >
          <ol className="flex flex-col gap-4">
            {parts.map(({ position, prompt, form, options }) => {
              const verdict = state?.verdicts?.get(position);
              const field = {
                "aria-label": `Part ${position}`,
                value: textOf(position),
                maxLength: MAX_PART_ANSWER_LENGTH,
                disabled: !editable,
                // A submitted answer stays readable.
                className: cn(state?.answers && "disabled:opacity-100"),
                onChange: (
                  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
                ) =>
                  setTexts((current) => ({
                    ...current,
                    [position]: event.target.value,
                  })),
              };
              return (
                <li
                  key={position}
                  data-testid="question-part"
                  className="flex flex-col gap-2"
                >
                  <div className="flex gap-2">
                    <span className="font-medium">{position}.</span>
                    <div className="min-w-0 flex-1">
                      <Markdown components={chatMarkdownComponents}>
                        {prompt}
                      </Markdown>
                    </div>
                  </div>
                  {form === "choice" && options && (
                    <fieldset
                      className="flex flex-col gap-1.5"
                      disabled={!editable}
                      aria-label={`Part ${position} options`}
                    >
                      {options.map((option, index) => (
                        <label
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <input
                            type="radio"
                            name={`part-${question.id}-${position}`}
                            className="mt-1"
                            checked={choiceOf(position) === index}
                            onChange={() =>
                              setPicks((current) => ({
                                ...current,
                                [position]: index,
                              }))
                            }
                          />
                          <span>
                            {optionLetter(index)}) {option}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  )}
                  {form === "long" || form === "choice" ? (
                    <Textarea
                      {...field}
                      aria-label={
                        form === "choice" ? `Part ${position} why` : undefined
                      }
                      placeholder={form === "choice" ? "Why?" : undefined}
                    />
                  ) : (
                    <Input {...field} />
                  )}
                  {verdict && (
                    <p className="flex flex-wrap items-baseline gap-2 text-sm">
                      <Badge className={VERDICT_STYLES[verdict.result]}>
                        {VERDICT_LABELS[verdict.result]}
                      </Badge>
                      {verdict.note && (
                        <span className="text-muted-foreground">
                          {verdict.note}
                        </span>
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          {state?.open && (
            <Button type="submit" className="self-start" disabled={!editable}>
              Submit
            </Button>
          )}
        </form>
      )}
    </div>
  );
}
