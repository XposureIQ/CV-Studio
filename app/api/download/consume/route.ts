import { NextResponse } from "next/server";
import { consumeDownloadGrant, getSession } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to download your CV." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("token" in body) || typeof body.token !== "string") {
    return NextResponse.json({ error: "A verified download code is required." }, { status: 400 });
  }

  const consumed = await consumeDownloadGrant(session.email, body.token);
  if (!consumed) {
    return NextResponse.json({ error: "This download code is invalid, expired, or already used." }, { status: 403 });
  }
  return NextResponse.json({ authorized: true });
}
