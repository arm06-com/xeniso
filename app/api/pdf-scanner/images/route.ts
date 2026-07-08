import { NextResponse } from "next/server";
import { consumeSessionImages } from "@/lib/pdfScannerSession";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") || "";

  const images = consumeSessionImages(sessionId);

  return NextResponse.json({ images });
}
