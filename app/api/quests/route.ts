import { NextRequest, NextResponse } from "next/server";
import { computeGarden } from "@/lib/plant";
import { computeQuestProgress } from "@/lib/engagement";
import { listQuests, claimQuest, getProfile, updateXp } from "@/lib/data";
import { todayStr } from "@/lib/plant";

export const dynamic = "force-dynamic";

export async function GET() {
  const garden = await computeGarden();
  const quests = await computeQuestProgress(garden);
  return NextResponse.json({ quests });
}

// POST { questId } → award XP and mark the quest claimed (once per day)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const questId = Number(body?.questId);
  if (!questId) return NextResponse.json({ error: "questId required" }, { status: 400 });

  const quest = (await listQuests()).find((q) => q.id === questId);
  if (!quest) return NextResponse.json({ error: "quest not found" }, { status: 404 });

  const today = todayStr();
  const garden = await computeGarden();
  const progress = await computeQuestProgress(garden);
  const entry = progress.find((p) => p.id === questId);

  if (!entry?.done) return NextResponse.json({ error: "quest not complete yet" }, { status: 400 });
  if (entry.claimed) return NextResponse.json({ error: "already claimed today" }, { status: 400 });

  await claimQuest(questId, today);
  const profile = await getProfile();
  await updateXp(profile.xp + quest.reward_xp);

  return NextResponse.json({ ok: true, reward_xp: quest.reward_xp });
}