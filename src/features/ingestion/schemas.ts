import { z } from "zod";

export const startMaterialParseSchema = z.object({ materialId: z.uuid() });
