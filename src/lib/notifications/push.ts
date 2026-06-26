import * as webpush from "web-push";

// Configure VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@routine.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface RoutineForPush {
  name: string;
  scheduledTime: string;
  steps: {
    order: number;
    action: string;
    products: {
      product: { name: string };
    }[];
  }[];
}

export async function sendPushReminder(
  subscription: PushSubscriptionData,
  routine: RoutineForPush
) {
  const stepSummary = routine.steps
    .slice(0, 3)
    .map((s) => `${s.order}. ${s.action} - ${s.products.map((p) => p.product.name).join(" + ")}`)
    .join("\n");

  const payload = JSON.stringify({
    title: `🧴 ${routine.name}`,
    body: `Time for your ${routine.scheduledTime} routine!\n${stepSummary}${
      routine.steps.length > 3 ? `\n... and ${routine.steps.length - 3} more steps` : ""
    }`,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: `routine-${routine.name}`,
    data: {
      url: "/dashboard",
    },
  });

  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    payload
  );
}
