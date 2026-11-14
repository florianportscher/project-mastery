"use client";

import { type KeyboardEvent, type PointerEvent, useState } from "react";

const STORAGE_KEY = "source-pane-width";
export const MIN_FRACTION = 0.25;
export const MAX_FRACTION = 0.7;
const KEY_STEP = 0.02;

const clamp = (fraction: number) =>
  Math.min(MAX_FRACTION, Math.max(MIN_FRACTION, fraction));

function readStored(): number | null {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return value > 0 ? clamp(value) : null;
  } catch {
    return null;
  }
}

function store(fraction: number | null) {
  try {
    if (fraction === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, String(fraction));
  } catch {
    // Not remembered: private mode or blocked site data.
  }
}

/**
 * The source pane's width as a fraction of the window, remembered in this
 * browser; null is the default width. Read it only in the browser.
 */
export function usePaneWidth() {
  const [fraction, setFraction] = useState<number | null>(() =>
    typeof window === "undefined" ? null : readStored(),
  );
  return {
    fraction,
    /** Sets the width; `remember` also stores it. */
    set(next: number, remember: boolean) {
      const value = clamp(next);
      setFraction(value);
      if (remember) store(value);
    },
    reset() {
      setFraction(null);
      store(null);
    },
  };
}

/**
 * The handle between the Chat and the source pane: drag it, press the arrow
 * keys, or double-click to reset the width.
 */
export function PaneDivider({
  fraction,
  onChange,
  onReset,
}: {
  /** The pane's current width as a fraction of the window, or null. */
  fraction: number | null;
  onChange: (fraction: number, remember: boolean) => void;
  onReset: () => void;
}) {
  const fromPointer = (event: PointerEvent) =>
    (window.innerWidth - event.clientX) / window.innerWidth;

  const onKeyDown = (event: KeyboardEvent) => {
    const current =
      fraction ??
      (event.currentTarget.nextElementSibling?.getBoundingClientRect().width ??
        0) / window.innerWidth;
    if (event.key === "ArrowLeft") onChange(current + KEY_STEP, true);
    else if (event.key === "ArrowRight") onChange(current - KEY_STEP, true);
    else return;
    event.preventDefault();
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize source"
      aria-valuemin={Math.round(MIN_FRACTION * 100)}
      aria-valuemax={Math.round(MAX_FRACTION * 100)}
      aria-valuenow={fraction === null ? undefined : Math.round(fraction * 100)}
      tabIndex={0}
      className="-mr-1 w-2 shrink-0 cursor-col-resize touch-none self-stretch transition-colors hover:bg-border focus-visible:bg-border focus-visible:outline-none"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          onChange(fromPointer(event), false);
        }
      }}
      onPointerUp={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        onChange(fromPointer(event), true);
      }}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
    />
  );
}
