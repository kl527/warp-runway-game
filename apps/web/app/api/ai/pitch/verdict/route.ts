import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { VC_VERDICT_SYSTEM, VC_VERDICT_USER } from "@/lib/ai/prompts";

export const runtime = "edge";

const bodySchema = z.object({
  roundLabel: z.string().min(1).max(64),
  question: z.string().min(1).max(2000),
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
      { status: 503 },
    );
  }

  const workersai = createWorkersAI({ binding: ai });

  try {
    const { text } = await generateText({
      model: workersai("@cf/openai/gpt-oss-120b"),
      system: VC_VERDICT_SYSTEM,
      prompt: VC_VERDICT_USER(parsed.roundLabel, parsed.question, parsed.answer),
      temperature: 0.6,
    });
    const result = verdictSchema.parse(extractJson(text));
    return NextResponse.json(result);
  } catch (err) {
    console.error("pitch verdict error", err);
    return NextResponse.json({ error: "model error" }, { status: 502 });
  }
}
