import { handleDictationRequest } from "@/features/dictation/server";

export function POST(request: Request) {
  return handleDictationRequest(request);
}
