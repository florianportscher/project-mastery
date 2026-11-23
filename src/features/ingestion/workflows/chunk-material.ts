import "server-only";
import { storedUnitsSchema } from "@/features/ingestion/ai/page-units";
import { chunksFromUnits } from "@/features/ingestion/domain/chunk-joining";
import { materialLanguageAndNotes } from "@/features/ingestion/domain/language";
import { loadMaterial } from "@/features/ingestion/workflows/parse-steps";
import { createAdminClient } from "@/lib/supabase/admin";
import { failed } from "@/lib/supabase/failed";
import type { AdminSupabase } from "@/lib/supabase/types";

/**
 * Whether the Material has chunks. They are written in one transaction
 * after every page is read, so existing ones are complete: a parse started
 * again after a failed embed keeps them and their vectors.
 */
async function hasChunks(
  supabase: AdminSupabase,
  materialId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("chunks")
    .select("id")
    .eq("material_id", materialId)
    .limit(1);
  if (error) failed("Loading the chunks", error);
  return data.length > 0;
}

/**
 * The chunk step of a parse (`parse-material.ts`), after every page is
 * read: stores the Material's chunks, cut from the units of its read pages
 * (`chunksFromUnits`), in one transaction that replaces any earlier ones,
 * and its language and notes from what the page reads answered
 * (`materialLanguageAndNotes`). Does nothing when the Material is gone or
 * has its chunks already.
 */
export async function chunkMaterial(materialId: string): Promise<void> {
  "use step";
  const supabase = createAdminClient();
  const material = await loadMaterial(supabase, materialId);
  if (!material || (await hasChunks(supabase, materialId))) return;

  const { data: pages, error } = await supabase
    .from("material_pages")
    .select("units, language, notes")
    .eq("material_id", materialId)
    .order("page_number");
  if (error) failed("Loading the page results", error);
  const units = pages.flatMap((page) => storedUnitsSchema.parse(page.units));
  const chunks = chunksFromUnits(units);

  const named = await supabase
    .from("materials")
    .update(materialLanguageAndNotes(pages))
    .eq("id", materialId);
  if (named.error) failed("Storing the language and notes", named.error);
  const replaced = await supabase.rpc("replace_material_chunks", {
    p_material_id: materialId,
    p_chunks: chunks.map((chunk, position) => ({
      position,
      page_from: chunk.pageFrom,
      page_to: chunk.pageTo,
      label: chunk.label,
      markdown: chunk.markdown,
      heading: chunk.heading,
    })),
  });
  if (replaced.error) failed("Storing the chunks", replaced.error);
}
