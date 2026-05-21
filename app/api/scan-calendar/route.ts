import { NextRequest, NextResponse } from "next/server";
import { runScanPipeline } from "@/features/scan/pipeline";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "no file" }, { status: 400 });
    }

    const result = await runScanPipeline(file);

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}