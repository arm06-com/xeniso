import Pusher from "pusher-js/dist/web/pusher.js";

const PusherClient = (Pusher as any)?.default ?? Pusher;

// Enable pusher-js console logging to help diagnose connection/subscription issues
PusherClient.logToConsole = true;

export function createPusherClient() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER;

  if (!key) {
    const noop = () => {};
    const stub: any = {
      subscribe: (_channel: string) => ({ bind: noop, unbind_all: noop }),
      unsubscribe: noop,
      disconnect: noop,
    };

    console.warn("Pusher key not set: returning stub client. Real-time features will be disabled.");

    return stub as any;
  }

  return new PusherClient(
    key,
    {
      cluster: cluster,
      forceTLS: true,
      enabledTransports: ["ws", "wss", "xhr_streaming", "xhr_polling"],
      disableStats: true,
      activityTimeout: 120000,
    }
  );
}
