import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/push/subscribe — Save push subscription
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await request.json();

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  // Upsert: update existing or create new
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId: session.user.id,
    },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId: session.user.id,
      userAgent: request.headers.get("user-agent") || undefined,
    },
  });

  // Enable push in preferences
  await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: { pushEnabled: true },
    create: {
      userId: session.user.id,
      pushEnabled: true,
      emailEnabled: true,
    },
  });

  return NextResponse.json({ success: true });
}
