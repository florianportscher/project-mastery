# Live AI calls

Deployments call models through AI Gateway (ADR 0006). Locally, the text tasks call the Gemini API directly with `GOOGLE_GENERATIVE_AI_API_KEY`, and the `AI_MODEL_*` overrides in the developer's `.env.local` point them at `google/gemini-3.5-flash-lite` (ADR 0016). Embeddings and the smoke checks use AI Gateway with `AI_GATEWAY_API_KEY`. Gateway live calls spend its monthly free credit of $5, shared by every checkout and by the preview deployments. Cheap calls make that plenty: `meta/muse-ember`, the model every text task ships on, costs $0.10 per million input and $0.50 per million output tokens, `cohere/embed-v5.0-fast` $0.08 per million. Reasoning tokens count as output and Muse cannot switch reasoning off, so a call costs more than its visible text suggests. The limit is 5 requests per minute per provider, and the Gateway does not fail over when one provider is limited. Gemini calls spend the Gemini API's daily free quota instead.

- **Default:** tests, runtime checks and `run-app` use `AI_PROVIDER=mock`.
- **Live calls are welcome** while implementing and reviewing, on `google/gemini-3.5-flash-lite` for local text calls (a spec's smoke check, a call to see how a provider responds, calls to verify a provider fact) and `cohere/embed-v5.0-fast`. Builds make no call on `meta/muse-ember`: its quality is the maintainer's to judge. Keep them purposeful, not a loop: a smoke check costs cents.
- **Every other model** (other `AI_MODEL_*` overrides, Pro models) only when the user asks for it in the session or a spec requires it. The free credit serves only a subset of the Gateway's models; the others answer 403.
- **No evals but the tutoring and Brief scenarios:** the maintainer checks AI quality by hand (ADR 0012), and runs the scenarios in `evals/` on demand ([evals/gold/README.md](../../evals/gold/README.md)). Don't build other eval datasets, judges or scripted sessions, and don't make one a spec's gate.
- **The guard:** the Bash guard refuses smoke checks and direct model calls unless the command starts with `ALLOW_LIVE_AI=1`. `pnpm -s metrics` only reads the database and writes Langfuse scores, and `pnpm gold` only reads and writes the local database; both are allowed.
- **Smoke checks:** `pnpm smoke <name>` runs `evals/smoke/<name>.ts`: one real feature path once, on a small input, with every generating task on `google/gemini-3.5-flash-lite` (ADR 0016). The runner refuses to start without `GOOGLE_GENERATIVE_AI_API_KEY` and never falls back to Muse or another Gateway model; only embeddings and transcription use the Gateway. A check tests plumbing only: the path runs, rows are stored with the expected shape, calls are recorded with a cost, a repeat run makes 0 calls. It never checks what the model chose (which tool, what a note says, whether an answer is right): the maintainer judges quality on the preview and in the gold scenarios. A build runs each check once, never again to see how often it passes. Builders and specs never set `AI_SMOKE_MODEL`; it is for the maintainer's own sessions. At most 30 model calls (a check may set its own cap). A check stops after 4 minutes (`AI_SMOKE_MAX_MINUTES`; `pnpm smoke map` may need more, run it in the background): a subagent's prompt cache expires after 5 idle minutes. A spec names its smoke check, and `/build` runs it before the PR. They never run in `pnpm check` or CI.
- **`agent up`:** runs the app on the mock even when `.env.local` names a live provider; `pnpm -s agent up --live` keeps it.
- **Credit exhausted or rate limited:** a 429 or 402 that retrying does not clear means the free credit is gone or the key is limited (not yet seen live: read the body). Stop making live calls and say what stayed unverified. The user sees the balance in the Vercel dashboard under AI Gateway.

When a live call shows a provider behaviour the mock lacks (no usage reported, an error shape, an empty result), add it to the mock and a line to `docs/agents/notes/`.

## What a call costs

Every call is priced from `src/lib/ai/prices.ts` and recorded in `ai_usage`, so `select task, model_id, cost_usd from ai_usage` shows what a run spent. Embeddings of different models are not comparable and `chunks.embedding` has one size (2048 dimensions, what `cohere/embed-v5.0-fast` returns), so a changed `embed` model needs a migration and a re-parse. A build's calls run at most `AI_CONCURRENCY` at a time (default 4) and, with `AI_RPM` set (5 on the free credit), start 60 / `AI_RPM` seconds apart (`paceCall`, `src/lib/ai/pacing.ts`), so `pnpm smoke map` (at most 10 build calls besides embeddings) takes minutes on Muse.

## Telling errors apart

Read the body before deciding. In the AI SDK the status is `statusCode` on the `APICallError` inside the `RetryError` (see `notes/ai-sdk.md`), and the raw body is `responseBody`.

| Status | Meaning                                                                                                        |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| 401    | The key is missing, wrong or expired (an OIDC token from `vercel env pull` lasts 12 hours).                    |
| 403    | "Free tier users do not have access to this model": the free credit does not serve it (verified).              |
| 402    | Probably the credit is used up (not yet seen live).                                                            |
| 429    | Rate limited. `retry-after` headers say how long; waiting works.                                               |
| 400    | Malformed request, or input the model does not take (a PDF sent to a model without file input): read the body. |
| 404    | Unknown model id.                                                                                              |
| 5xx    | Provider-side trouble that clears by itself. No task has a fallback model.                                     |

There are no fallback models: a call is recorded as its task's model.
