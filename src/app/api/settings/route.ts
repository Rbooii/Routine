import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema, notificationPrefSchema } from "@/lib/validations";

// GET /api/settings — Load user settings
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      timezone: true,
      skinType: true,
      notificationPref: true,
    },
  });

  return NextResponse.json(user);
}

// PUT /api/settings — Update user settings
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Validate profile data
  const profileResult = profileSchema.safeParse({
    name: body.name,
    timezone: body.timezone,
    skinType: body.skinType,
  });

  if (!profileResult.success) {
    return NextResponse.json(
      { error: profileResult.error.errors.map((e) => e.message).join(". ") },
      { status: 400 }
    );
  }

  // Update user profile
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: profileResult.data.name,
      timezone: profileResult.data.timezone,
      skinType: profileResult.data.skinType,
    },
  });

  // Update notification preferences if provided
  if (body.notificationPref) {
    const notifResult = notificationPrefSchema.safeParse(body.notificationPref);
    if (notifResult.success) {
      await prisma.notificationPreference.upsert({
        where: { userId: session.user.id },
        update: notifResult.data,
        create: {
          userId: session.user.id,
          ...notifResult.data,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
