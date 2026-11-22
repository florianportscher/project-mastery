import { signInDemo } from "@/features/auth/server";

export async function GET() {
  return signInDemo();
}
