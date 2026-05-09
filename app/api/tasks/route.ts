"use server";

import { NextRequest, NextResponse } from "next/server";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbwsmUvHxYh22A2WNoRKCmRHpbAS8AUfplQDI_DoRp0j84D0g4YLP_8GFAJaF-2gwFkc/exec";

function gasUrl() {
  return GAS_URL;
}

export async function GET() {
  try {
    const res = await fetch(gasUrl(), {
      method: "GET",
      cache: "no-store",
    });
    const json = await res.json();
    if (!json.ok) return NextResponse.json({ ok: false, error: json.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: json.data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(gasUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) return NextResponse.json({ ok: false, error: json.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: json.data, message: json.message });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
