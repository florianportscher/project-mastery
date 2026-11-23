/**
 * A stored Mock exam as its page sees it: its path, its status at a time,
 * its deadline once started and whether its grading stalled. Pure.
 */

export function mockExamPath(courseId: string, mockId: string): string {
  return `/courses/${courseId}/mock/${mockId}`;
}

export type MockStatus =
  "assembling" | "ready" | "in_progress" | "submitted" | "graded" | "failed";

const ASSEMBLY_MS = 60 * 60 * 1000;

/** Why a mock that assembled too long failed, as the database says it. */
const STALE_ASSEMBLY = "Assembling took longer than an hour.";

/**
 * When a started mock's time is up. The database takes answers for one
 * more minute, so an answer saved at 0 still lands.
 */
export function mockDeadline(startedAt: string, durationMinutes: number): Date {
  return new Date(Date.parse(startedAt) + durationMinutes * 60_000);
}

const GRADING_MS = 60 * 60 * 1000;

/**
 * Whether a submitted mock's grading never started or started over an hour
 * ago, so the page starts it again, as `restart_mock_grading` allows.
 */
export function gradingStalled(
  row: { status: string; grading_started_at: string | null },
  now: Date,
): boolean {
  return (
    row.status === "submitted" &&
    (row.grading_started_at === null ||
      now.getTime() - Date.parse(row.grading_started_at) > GRADING_MS)
  );
}

/**
 * A stored mock's status at `now`: one still assembling an hour after it
 * was queued counts as failed, as `queue_mock_exam` then marks it.
 */
export function mockStatus(
  row: { status: string; failure: string | null; created_at: string },
  now: Date,
): { status: MockStatus; failure: string | null } {
  if (
    row.status === "assembling" &&
    now.getTime() - Date.parse(row.created_at) > ASSEMBLY_MS
  ) {
    return { status: "failed", failure: STALE_ASSEMBLY };
  }
  return { status: row.status as MockStatus, failure: row.failure };
}
