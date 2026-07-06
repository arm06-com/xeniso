import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { markSessionConnected } from "@/lib/pdfScannerSession";

export async function POST(req: Request) {
  const { sessionId } = await req.json();
  console.log("SESSION:", sessionId);
  // mark session connected for polling fallback
  try {
    markSessionConnected(sessionId);
  } catch (err) {
    console.warn("Failed to mark session connected:", err);
  }
  await pusherServer.trigger(
    `pdf-scanner-${sessionId}`,
    "mobile-connected",
    {
      connected: true,
      timestamp: Date.now(),
    }
  );

  return NextResponse.json({
    success: true,
  });
}