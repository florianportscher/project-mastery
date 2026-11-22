# Developer view is slow in `next dev` on a big Course

Measured 2026-11-22 on a Course of 164 chunks and 135 KCs: `/dev/courses/<id>` answers in about 35 s under `next dev` (the agent browser times out after 30 s and reports "Resource temporarily unavailable"). The data reads are fast (snapshot 315 ms, Langfuse 445 ms); the time is in rendering.

- It scales with the KCs: the page with `KcsSection` cut to 10 KCs took 3.6 s, without the section 1.2 s. The Chunks section costs little.
- Not the cause: `KcRefs`/`ChunkRefs` as plain functions (no change), the Unit row, Langfuse.
- Suspect, not shown: dev-mode server-component debug info per `Row`/`Ref`/`Flag` under a section whose props hold the whole `lookup`. See the comment on `chunkItem` in `materials-outline.tsx`.
- Not checked: whether a production build is fast. Previews run production builds.

To read a big Course meanwhile, use `pnpm -s agent inspect <courseId>`.
