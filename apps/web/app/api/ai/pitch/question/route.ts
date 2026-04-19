import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { VC_PARTNER_SYSTEM, VC_QUESTION_USER } from "@/lib/ai/prompts";

const bodySchema = z.object({
  digest: z.string().min(1).max(4000),
  roundLabel: z.string().min(1).max(64),
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
      { status: 503 },
    );
  }

  const workersai = createWorkersAI({ binding: ai });

  try {
    const { text } = await generateText({
      model: workersai("@cf/openai/gpt-oss-120b"),
      system: VC_PARTNER_SYSTEM,
      prompt: VC_QUESTION_USER(parsed.roundLabel, parsed.digest),
      temperature: 0.7,
    });
    return NextResponse.json({ question: text.trim() });
  } catch (err) {
    console.error("pitch question error", err);
    return NextResponse.json({ error: "model error" }, { status: 502 });
  }
}
