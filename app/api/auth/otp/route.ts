import { NextResponse } from "next/server";
import {
  createDownloadGrant,
  createSession,
  getOtpPurpose,
  getSession,
  OtpError,
  sendOtp,
  verifyOtp
} from "@/lib/server-auth";

export const runtime = "nodejs";

function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value: unknown): value is string {
  return typeof value === "string" && /^\+[1-9]\d{7,14}$/.test(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body is required." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const action = input.action;
  const purpose = getOtpPurpose(input.purpose);
  if (!purpose || (action !== "send" && action !== "verify")) {
    return NextResponse.json({ error: "Choose a valid OTP action and purpose." }, { status: 400 });
  }

  const session = purpose === "download" ? await getSession() : null;
  if (purpose === "download" && !session) {
    return NextResponse.json({ error: "Sign in before requesting a download code." }, { status: 401 });
  }
  const email = purpose === "download" ? session!.email : input.email;
  const phone = purpose === "download" ? session!.phone : input.phone;
  if (!validEmail(email) || !validPhone(phone)) {
    return NextResponse.json({
      error: "Enter a valid email and mobile number in international format (for example, +919876543210)."
    }, { status: 400 });
  }

  try {
    if (action === "send") {
      const result = await sendOtp({ email, phone, purpose });
      return NextResponse.json(result);
    }

    if (typeof input.code !== "string" || !/^\d{6}$/.test(input.code)) {
      return NextResponse.json({ error: "Enter the six-digit code." }, { status: 400 });
    }
    await verifyOtp({ email, phone, code: input.code, purpose });
    if (purpose === "account") {
      await createSession({ email, phone });
      return NextResponse.json({ verified: true, purpose });
    }
    const downloadToken = await createDownloadGrant(email);
    return NextResponse.json({ verified: true, purpose, downloadToken });
  } catch (error) {
    console.error("OTP request failed.", error);
    const message = error instanceof Error ? error.message : "OTP request failed.";
    return NextResponse.json({ error: message }, { status: error instanceof OtpError ? error.status : 503 });
  }
}
