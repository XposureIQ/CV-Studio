import QRCode from "qrcode";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const upiId = process.env.SUPPORT_UPI_ID?.trim();
  if (!upiId || !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
    return NextResponse.json({
      enabled: false,
      error: "Optional support QR is not configured yet. Add a valid SUPPORT_UPI_ID to the deployment environment."
    }, { status: 503 });
  }

  const payee = process.env.SUPPORT_PAYEE_NAME?.trim() || "ATS-Craft Pro";
  const upiUri = new URL("upi://pay");
  upiUri.searchParams.set("pa", upiId);
  upiUri.searchParams.set("pn", payee);
  upiUri.searchParams.set("am", "25.00");
  upiUri.searchParams.set("cu", "INR");
  upiUri.searchParams.set("tn", "Optional ATS-Craft Pro support");

  try {
    const image = await QRCode.toDataURL(upiUri.toString(), {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: { dark: "#17221a", light: "#ffffff" }
    });
    return NextResponse.json({
      enabled: true,
      amount: 25,
      currency: "INR",
      image,
      upiUri: upiUri.toString()
    });
  } catch (error) {
    console.error("Could not create the optional support QR.", error);
    return NextResponse.json({ enabled: false, error: "Could not create the support QR." }, { status: 500 });
  }
}
