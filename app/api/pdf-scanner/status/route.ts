import { NextResponse } from "next/server";
import { isSessionConnected } from "@/lib/pdfScannerSession";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") || "";

  const connected = isSessionConnected(sessionId);

  return NextResponse.json({ connected });
}
