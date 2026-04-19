import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  BOARD_OBSERVER_JUDGE_SYSTEM,
  BOARD_OBSERVER_JUDGE_USER,
} from "@/lib/ai/prompts";

export const runtime = "edge";

const bodySchema = z.object({
  answer: z.string().min(1).max(2000),
});

const verdictSchema = z.object({
  verdict: z.enum(["good", "bad"]),
  reply: z.string().min(1).max(600),
});

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no json");
  return JSON.parse(match[0]);
}

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

  try {
    const { text } = await generateText({
      model: workersai("@cf/openai/gpt-oss-120b"),
      system: BOARD_OBSERVER_JUDGE_SYSTEM,
      prompt: BOARD_OBSERVER_JUDGE_USER(parsed.answer),
      temperature: 0.7,
    });

    const result = verdictSchema.parse(extractJson(text));
    return NextResponse.json(result);
  } catch (err) {
    console.error("judge error", err);
    return NextResponse.json({ error: "model error" }, { status: 502 });
  }
}
