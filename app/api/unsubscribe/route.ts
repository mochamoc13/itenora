import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const scriptUrl = process.env.GSHEETS_WEBAPP_URL;
    if (!scriptUrl) {
      return NextResponse.json({ ok: false, error: "Email service unavailable" }, { status: 503 });
    }

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "unsubscribe",
        email,
        unsubscribedAt: new Date().toISOString(),
        source: "itenora-unsubscribe-page",
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
