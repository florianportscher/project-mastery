/**
 * Puts a transcript into `text` at the cursor, replacing the selection from
 * `start` to `end`. A space goes before it unless it starts the text or follows
 * whitespace, and after it unless it ends the text or precedes whitespace.
 * Returns the new text and the caret position after the transcript.
 */
export function insertAt(
  text: string,
  start: number,
  end: number,
  transcript: string,
): { text: string; caret: number } {
  const from = Math.min(Math.max(start, 0), text.length);
  const to = Math.min(Math.max(end, from), text.length);
  const before = text.slice(0, from);
  const after = text.slice(to);
  const lead = before && !/\s$/.test(before) ? " " : "";
  const trail = after && !/^\s/.test(after) ? " " : "";
  const inserted = lead + transcript;
  return {
    text: before + inserted + trail + after,
    caret: before.length + inserted.length,
  };
}
