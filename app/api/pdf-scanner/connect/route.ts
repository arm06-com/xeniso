import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { markSessionConnected } from "@/lib/pdfScannerSession";

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
  }

  try {
    markSessionConnected(sessionId);
  } catch (err) {
    console.warn("Failed to mark session connected:", err);
  }

  try {
    await pusherServer.trigger(`pdf-scanner-${sessionId}`, "mobile-connected", {
      connected: true,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn("Pusher connect notification failed, continuing with polling fallback:", err);
  }

  return NextResponse.json({
    success: true,
    connected: true,
  });
}