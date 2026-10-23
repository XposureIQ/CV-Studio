import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ authenticated: Boolean(session), session });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ authenticated: false });
}
