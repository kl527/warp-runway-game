import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  BOARD_OBSERVER_CRITIQUE_USER,
  BOARD_OBSERVER_SYSTEM,
} from "@/lib/ai/prompts";

const bodySchema = z.object({
  digest: z.string().min(1).max(4000),
});

export async function POST(req: Request): Promise<Response> {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (err) {
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

  try {
    const { text } = await generateText({
      model: workersai("@cf/openai/gpt-oss-120b"),
      system: BOARD_OBSERVER_SYSTEM,
      prompt: BOARD_OBSERVER_CRITIQUE_USER(parsed.digest),
      temperature: 0.8,
    });
    return NextResponse.json({ critique: text.trim() });
  } catch (err) {
    console.error("critique error", err);
    return NextResponse.json({ error: "model error" }, { status: 502 });
  }
}
