import Pusher from "pusher-js/dist/web/pusher.js";

const PusherClient = (Pusher as any)?.default ?? Pusher;

// Enable pusher-js console logging to help diagnose connection/subscription issues
PusherClient.logToConsole = true;

export function createPusherClient() {
  return new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_KEY!,
    {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      forceTLS: true,
      // allow fallback to XHR transports if WebSocket fails in the current network
      enabledTransports: ["ws", "wss", "xhr_streaming", "xhr_polling"],
      disableStats: true,
      activityTimeout: 120000,
    }
  );
}
