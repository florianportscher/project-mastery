# gpt-transcribe through the Gateway

Installed: ai 7.0.172, @ai-sdk/gateway 4.0.145. Code: the `transcribe` task in `src/lib/ai/models.ts`, `AUDIO_PRICES` in `src/lib/ai/prices.ts`, `src/features/dictation/server/handler.ts`.

- **Free credit (2026-11-19, 3 calls, $0.0025).** `openai/gpt-transcribe` answers on the free credit, served by `openai`. An 11 s `audio/webm;codecs=opus` recording from Chromium's `MediaRecorder` and a WAV both came back as the exact text with `language: "en"`, `durationInSeconds: 11`, no warnings and no token usage. `providerMetadata.gateway.cost` was "0.000825": $0.27 per audio hour, so `ai_usage` prices the duration, not tokens.
- **Media type.** `transcribe()` takes no media type: it reads it from the bytes (WebM and MP4 are detected), so the request's `Content-Type` is not passed on.
- **Options.** `providerOptions.openai.keywords` is forwarded (a made-up spelling appeared in the text); not used yet. The `gateway.tags` that `aiTask` adds are accepted (smoke check, 2026-11-20).
- **Local development.** The Gemini router in `models.ts` sends transcription ids to the Gateway; there is no Gemini override for this task.
- **Limits.** OpenAI's docs: up to 25 MB; flac, mp3, mp4, m4a, ogg, wav, webm. Unverified: whether the team's 5 requests per minute apply, and OpenAI's audio retention through the Gateway.
