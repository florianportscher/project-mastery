"use client";

import { MicIcon, SquareIcon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  PromptInputButton,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { Spinner } from "@/components/ui/spinner";

const MAX_SECONDS = 120;
const TRANSCRIBE_FAILED = "Couldn't transcribe that. Try again.";
const ACCESS_NEEDED =
  "Microphone access is needed to dictate. Allow it for this site and try again.";

type DictationButtonProps = {
  /** True at the Daily limit, like the message box. */
  disabled?: boolean;
  /** Called with true while recording or transcribing, so Send can wait. */
  onBusyChange?: (busy: boolean) => void;
  /** Called with a one-line message, or null when a new attempt starts. */
  onError?: (message: string | null) => void;
};

const noSubscription = () => () => {};

function canRecord() {
  return (
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Dictation: records the Student's voice and appends the transcript to the
 * message box. Nothing is sent by itself. Renders nothing where the browser
 * cannot record.
 */
export function DictationButton({
  disabled,
  onBusyChange,
  onError,
}: DictationButtonProps) {
  const { textInput } = usePromptInputController();
  // "starting" waits for microphone access, so a second press is ignored.
  const [phase, setPhase] = useState<
    "idle" | "starting" | "recording" | "transcribing"
  >("idle");
  const [seconds, setSeconds] = useState(0);
  const supported = useSyncExternalStore(
    noSubscription,
    canRecord,
    () => false,
  );
  const recorder = useRef<MediaRecorder | null>(null);
  const mounted = useRef(false);
  // The box's current text, read when the transcript arrives.
  const current = useRef(textInput.value);
  useEffect(() => {
    current.current = textInput.value;
  }, [textInput.value]);

  useEffect(() => {
    onBusyChange?.(phase !== "idle");
  }, [phase, onBusyChange]);

  useEffect(() => {
    if (phase !== "recording") return;
    const started = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS) recorder.current?.stop();
    }, 500);
    return () => clearInterval(timer);
  }, [phase]);

  // Leaving the page drops a recording and switches the microphone off.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const active = recorder.current;
      if (active && active.state !== "inactive") {
        active.onstop = null;
        active.stop();
        for (const track of active.stream.getTracks()) track.stop();
      }
    };
  }, []);

  async function transcribe(audio: Blob) {
    try {
      const response = await fetch("/api/dictation", {
        method: "POST",
        headers: { "Content-Type": audio.type || "audio/webm" },
        body: audio,
      });
      if (!response.ok)
        throw new Error(`Dictation answered ${response.status}`);
      const { text } = (await response.json()) as { text: string };
      if (text) {
        const before = current.current;
        const gap = before && !/\s$/.test(before) ? " " : "";
        textInput.setInput(before + gap + text);
      }
    } catch {
      onError?.(TRANSCRIBE_FAILED);
    } finally {
      setPhase("idle");
    }
  }

  async function start() {
    onError?.(null);
    setPhase("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      if (!mounted.current) return;
      onError?.(ACCESS_NEEDED);
      setPhase("idle");
      return;
    }
    // The Student left while the browser asked for access.
    if (!mounted.current) {
      for (const track of stream.getTracks()) track.stop();
      return;
    }
    const next = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    next.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    next.onstop = () => {
      for (const track of stream.getTracks()) track.stop();
      recorder.current = null;
      if (chunks.length === 0) {
        setPhase("idle");
        return;
      }
      setPhase("transcribing");
      void transcribe(new Blob(chunks, { type: next.mimeType }));
    };
    recorder.current = next;
    next.start();
    setSeconds(0);
    setPhase("recording");
  }

  if (!supported) return null;

  if (phase === "transcribing") {
    return (
      <PromptInputButton aria-label="Transcribing" disabled>
        <Spinner />
      </PromptInputButton>
    );
  }

  if (phase === "recording") {
    return (
      <PromptInputButton
        aria-label="Stop dictating"
        size="sm"
        onClick={() => recorder.current?.stop()}
      >
        <SquareIcon className="size-4 fill-current text-destructive" />
        <span className="tabular-nums">{formatTime(seconds)}</span>
      </PromptInputButton>
    );
  }

  return (
    <PromptInputButton
      aria-label="Dictate"
      tooltip="Dictate"
      disabled={disabled || phase === "starting"}
      onClick={() => void start()}
    >
      <MicIcon className="size-4" />
    </PromptInputButton>
  );
}
