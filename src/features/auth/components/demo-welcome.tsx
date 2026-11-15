"use client";

import { XIcon } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const KEY = "demo-welcome-closed";

const listeners = new Set<() => void>();
/** Set when closed while `localStorage` was unavailable. */
let closedInMemory = false;

function readClosed(): boolean {
  if (closedInMemory) return true;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function close() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    closedInMemory = true;
  }
  for (const listener of listeners) listener();
}

/**
 * The demo account's welcome on the Course map: what the app is, what the
 * sample Course is, and what to look at. A visitor can close it; it stays
 * closed in that browser. Real Students never see it.
 */
export function DemoWelcome({
  courseName,
  materialsHref,
}: {
  courseName: string;
  materialsHref: string;
}) {
  const closed = useSyncExternalStore(subscribe, readClosed, () => false);
  if (closed) return null;

  return (
    <Card
      role="region"
      aria-label="Demo welcome"
      className="w-full max-w-2xl gap-3 py-4"
    >
      <CardHeader className="px-4">
        <CardTitle>Welcome to the Project Mastery demo</CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Close the welcome"
            onClick={close}
          >
            <XIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 text-sm text-muted-foreground">
        <p>
          Project Mastery is an AI tutor that prepares you for a university exam
          from your own course materials. It maps what the course teaches, tells
          you what to study each day, and quizzes and teaches you from your
          notes, so your time goes into learning instead of organizing.
        </p>
        <p>
          This sample course, {courseName}, was built from one lecture script
          that an AI wrote for this demo. Things to try:
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>
            Click a Topic box on the map below to see what it&apos;s made of and
            the pages it comes from.
          </li>
          <li>
            Open the Chat in the sidebar to see a tutoring session: the tutor
            asks, grades the answers and explains from the script.
          </li>
          <li>
            The <span className="text-foreground">Today</span> card says what to
            study first, and{" "}
            <Link
              href={materialsHref}
              className="text-foreground underline underline-offset-4"
            >
              Materials
            </Link>{" "}
            shows the script itself.
          </li>
        </ul>
        <p>
          Everything is at 0% because the demo student has barely started. The
          app runs on free AI models, so replies can take a minute.
        </p>
      </CardContent>
    </Card>
  );
}
