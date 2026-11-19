import { NextResponse } from "next/server";
import { snapshot } from "@/lib/data/loadSnapshot";

/** Runtime never calls CMC. It only serves the committed snapshot. */
export function GET() {
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
