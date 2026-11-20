# Langfuse API

Verified 2026-11-20 with a probe span, `@langfuse/*` 6.1.1.

- Only `GET /api/public/v2/observations` works for this org; the legacy traces API answers 410. `@langfuse/client`'s `api.observations.getMany` calls v2.
- Trace metadata set with `withTraceAttributes({ metadata })` lands on each observation as a plain metadata key (`metadata.courseId`), AI SDK spans included. Nested calls merge their metadata. The trace name of an AI SDK span is `metadata["attributes.langfuse.trace.name"]`.
- Filter with `filter=[{"type":"stringObject","column":"metadata","key":"courseId","operator":"=","value":"…"}]`. A `filter` overrides the plain query filters, so put the environment in it too: `{"type":"stringOptions","column":"environment","operator":"any of","value":["preview"]}`. One call by id: `{"type":"string","column":"id","operator":"=","value":"…"}`.
- One `generateText` call is one `GENERATION` observation (the wrapper spans are not exported, `lib/tracing/export-filter.ts`), plus a `TOOL` one per tool call. One `embedMany` call is two `EMBEDDING` observations: the outer one (0 tokens) is the parent of the provider call. To count calls once, filter `{"type":"stringOptions","column":"type","operator":"any of","value":["GENERATION","EMBEDDING"]}` and drop observations that are another's `parentObservationId`.
- Results come newest first; `limit` is at most 1000, with `meta.cursor` for the next page. Add `io` to `fields` only when the input and output are needed.
- A new observation takes up to a minute before the API returns it.
