import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { addSessionImage, markSessionConnected } from "@/lib/pdfScannerSession";

export async function POST(req: Request) {
  const { sessionId, image } = await req.json();

  if (!sessionId || typeof image !== "string") {
    return NextResponse.json({ success: false, error: "Invalid upload payload" }, { status: 400 });
  }

  try {
    markSessionConnected(sessionId);
    addSessionImage(sessionId, image);
  } catch (err) {
    console.warn("Failed to persist uploaded image:", err);
  }

  try {
    await pusherServer.trigger(`pdf-scanner-${sessionId}`, "image-uploaded", {
      image,
      uploadedAt: Date.now(),
    });
  } catch (err) {
    console.warn("Pusher upload notification failed, continuing with polling fallback:", err);
  }

  return NextResponse.json({
    success: true,
  });
}