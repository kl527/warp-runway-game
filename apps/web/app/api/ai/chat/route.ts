import { NextResponse } from "next/server";
import { z } from "zod";
import { streamText, type ModelMessage } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { BOARD_OBSERVER_SYSTEM } from "@/lib/ai/prompts";

export const runtime = "edge";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

export async function POST(req: Request): Promise<Response> {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const ai = (env as unknown as { AI?: Ai }).AI;
  if (!ai) {
    return NextResponse.json(
      { error: "AI binding not available" },
      { status: 503 }
    );
  }

  const workersai = createWorkersAI({ binding: ai });

  const messages: ModelMessage[] = parsed.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const result = streamText({
    model: workersai("@cf/openai/gpt-oss-120b"),
    system: BOARD_OBSERVER_SYSTEM,
    messages,
    temperature: 0.9,
  });

  return result.toTextStreamResponse();
}
