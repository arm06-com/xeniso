import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: Request) {
  const { sessionId, image } = await req.json();

  await pusherServer.trigger(
    `pdf-scanner-${sessionId}`,
    "image-uploaded",
    {
      image,
      uploadedAt: Date.now(),
    }
  );

  return NextResponse.json({
    success: true,
  });
}