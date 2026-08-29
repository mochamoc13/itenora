import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const scriptUrl = process.env.GSHEETS_WEBAPP_URL;

    if (!scriptUrl) {
      return NextResponse.json({ ok: true });
    }

    await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "affiliate_click",
        partner: String(body.partner || "").slice(0, 40),
        label: String(body.label || "").slice(0, 100),
        destination: String(body.destination || "").slice(0, 150),
        clickedAt: body.clickedAt || new Date().toISOString(),
      }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
