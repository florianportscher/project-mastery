import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  PromptInputProvider,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DictationButton } from "./dictation-button";

class FakeRecorder {
  static last: FakeRecorder;
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: MediaStream) {
    FakeRecorder.last = this;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["x"], { type: this.mimeType }) });
    this.onstop?.();
  }
}

beforeEach(() => {
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi
        .fn()
        .mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }),
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

function setup(onBusyChange = vi.fn(), onError = vi.fn()) {
  render(
    <TooltipProvider>
      <PromptInputProvider>
        <PromptInputTextarea aria-label="Message" />
        <DictationButton onBusyChange={onBusyChange} onError={onError} />
      </PromptInputProvider>
    </TooltipProvider>,
  );
  return { onBusyChange, onError };
}

async function dictate() {
  await act(async () => {
    fireEvent.click(await screen.findByRole("button", { name: "Dictate" }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Stop dictating" }));
  });
}

test("appends the transcript after the typed text and reports busy", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ text: "A is singular." })),
  );
  const { onBusyChange } = setup();
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Hello" },
  });
  await dictate();
  expect(await screen.findByDisplayValue("Hello A is singular.")).toBeTruthy();
  expect(onBusyChange).toHaveBeenCalledWith(true);
  expect(onBusyChange).toHaveBeenLastCalledWith(false);
});

test("a failed transcription shows the error line and leaves the box", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("Try later.", { status: 502 })),
  );
  const { onError } = setup();
  await dictate();
  expect(onError).toHaveBeenLastCalledWith(
    "Couldn't transcribe that. Try again.",
  );
  expect(screen.getByRole("textbox")).toHaveProperty("value", "");
});

test("a second press while the browser asks for access is ignored", async () => {
  vi.mocked(navigator.mediaDevices.getUserMedia).mockReturnValue(
    new Promise(() => {}),
  );
  setup();
  const button = await screen.findByRole("button", { name: "Dictate" });
  await act(async () => fireEvent.click(button));
  expect(button).toHaveProperty("disabled", true);
});

test("denied microphone access shows a message", async () => {
  vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
    new Error("denied"),
  );
  const { onError } = setup();
  await act(async () => {
    fireEvent.click(await screen.findByRole("button", { name: "Dictate" }));
  });
  expect(onError).toHaveBeenLastCalledWith(
    expect.stringContaining("Microphone access is needed"),
  );
});
