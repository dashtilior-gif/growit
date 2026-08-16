import { NextResponse } from "next/server";
import { computeGarden } from "@/lib/plant";
import { buildLeaderboard } from "@/lib/engagement";

export const dynamic = "force-dynamic";

export async function GET() {
  const garden = await computeGarden();
  const board = await buildLeaderboard(garden);
  return NextResponse.json(board);
}