import { NextRequest, NextResponse } from "next/server";
import { listHabits, addHabit, deleteHabit, isDoneToday } from "@/lib/data";
import { todayStr } from "@/lib/plant";

export const dynamic = "force-dynamic";

export async function GET() {
  const habits = await listHabits();
  const today = todayStr();
  const enriched = await Promise.all(
    habits.map(async (h) => ({
      ...h,
      isCompleted: await isDoneToday(h.id, today),
    }))
  );
  return NextResponse.json({ habits: enriched });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").toString().trim().slice(0, 80);
  const emoji = (body?.emoji ?? "💪").toString().slice(0, 8);
  const category = (body?.category ?? "self").toString().slice(0, 20);

  if (!name) {
    return NextResponse.json({ error: "Habit name is required" }, { status: 400 });
  }
  const id = await addHabit(name, emoji, category);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteHabit(id);
  return NextResponse.json({ ok: true });
}