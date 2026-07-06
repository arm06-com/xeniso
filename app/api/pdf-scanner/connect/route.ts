import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: Request) {
  const { sessionId } = await req.json();
  console.log("SESSION:", sessionId);
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