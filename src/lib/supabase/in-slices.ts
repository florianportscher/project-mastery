import { failed } from "./failed";

/** Ids per `in` filter, which keeps the query string short. */
const IDS_PER_SLICE = 100;

/**
 * The rows `read` gives for `ids`, read in slices of IDS_PER_SLICE distinct
 * ids, since an `.in()` filter puts its ids in the query string. No ids make
 * no request; an error throws with `action` in its message.
 */
export async function inSlices<Row>(
  action: string,
  ids: readonly string[],
  read: (
    slice: string[],
  ) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>,
): Promise<Row[]> {
  const unique = [...new Set(ids)];
  const rows: Row[] = [];
  for (let start = 0; start < unique.length; start += IDS_PER_SLICE) {
    const { data, error } = await read(
      unique.slice(start, start + IDS_PER_SLICE),
    );
    if (error) failed(action, error);
    rows.push(...(data ?? []));
  }
  return rows;
}
