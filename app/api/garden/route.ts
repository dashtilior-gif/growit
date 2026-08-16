import { NextResponse } from "next/server";
import { computeGarden } from "@/lib/plant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const garden = await computeGarden();
  return NextResponse.json(garden);
}