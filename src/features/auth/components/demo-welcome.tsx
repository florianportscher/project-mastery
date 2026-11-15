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

/** A section of the app, named in the welcome: a link when it has one. */
function Section({ href, children }: { href?: string; children: string }) {
  if (!href) return <span className="text-foreground">{children}</span>;
  return (
    <Link href={href} className="text-foreground underline underline-offset-4">
      {children}
    </Link>
  );
}

/**
 * The demo account's welcome on the Course map: what the app is, how to use
 * it section by section, and what the sample Course is. A visitor can close
 * it; it stays closed in that browser. Real Students never see it.
 */
export function DemoWelcome({
  courseName,
  materialsHref,
  briefHref,
  chatHref,
}: {
  courseName: string;
  materialsHref: string;
  briefHref: string;
  chatHref: string;
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
          Project Mastery is an AI tutor for university exams: you upload your
          course in <Section href={materialsHref}>Materials</Section>, tell the
          AI about the exam in the <Section href={briefHref}>Brief</Section>,
          see what to learn on this <Section>Course map</Section>, and start a{" "}
          <Section href={chatHref}>New chat</Section> to be tutored. Each part,
          from the sidebar:
        </p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <Section href={materialsHref}>Materials</Section>: the files of the
            course, such as slides, lecture notes and old exams. Here it&apos;s
            one lecture script that an AI wrote for this demo.
          </li>
          <li>
            <Section href={briefHref}>Brief</Section>: a short conversation
            where you tell the AI about your exam: its date, your goal and what
            the lecturer stresses. The study plan follows from it.
          </li>
          <li>
            <Section>Course map</Section>, this page: everything the course
            teaches, as Topics in the order you need to learn them. Click a box
            to see what it&apos;s made of and the pages it comes from. The{" "}
            <Section>Today</Section> card says what to study now.
          </li>
          <li>
            <Section href={chatHref}>New chat</Section>: a tutoring session. You
            don&apos;t pick what to study: the tutor takes the reviews that are
            due and then the next Topic, quizzes you, grades your answers and
            explains from your materials when you&apos;re stuck. The Chat listed
            under Chats is an example.
          </li>
        </ul>
        <p>
          The sample course is {courseName}. Everything is at 0% because the
          demo student has barely started, and the app runs on free AI models,
          so replies can take a minute.
        </p>
      </CardContent>
    </Card>
  );
}
