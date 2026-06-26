"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { routineSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ── Get all routines for the current user ────
export async function getRoutines() {
  const userId = await getUserId();
  return prisma.routine.findMany({
    where: { userId },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: {
          products: {
            include: { product: true },
          },
        },
      },
      _count: { select: { routineLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ── Get a single routine by ID ───────────────
export async function getRoutine(id: string) {
  const userId = await getUserId();
  return prisma.routine.findFirst({
    where: { id, userId },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: {
          products: {
            include: { product: true },
          },
        },
      },
    },
  });
}

// ── Create a new routine ─────────────────────
export async function createRoutine(data: unknown) {
  const userId = await getUserId();

  const validated = routineSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors.map((e) => e.message).join(". ") };
  }

  const { steps, ...routineData } = validated.data;

  const routine = await prisma.routine.create({
    data: {
      ...routineData,
      userId,
      steps: {
        create: steps.map((step, index) => ({
          order: index + 1,
          action: step.action,
          instructions: step.instructions,
          waitTimeSeconds: step.waitTimeSeconds,
          isMixingStep: step.isMixingStep,
          products: {
            create: step.productIds.map((productId) => ({
              productId,
              quantity: step.quantities?.[productId] || null,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/routines");
  redirect(`/routines/${routine.id}`);
}

// ── Update a routine ─────────────────────────
export async function updateRoutine(id: string, data: unknown) {
  const userId = await getUserId();

  const validated = routineSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors.map((e) => e.message).join(". ") };
  }

  const { steps, ...routineData } = validated.data;

  // Delete existing steps and recreate (simpler than diffing)
  await prisma.routineStep.deleteMany({ where: { routineId: id } });

  await prisma.routine.update({
    where: { id, userId },
    data: {
      ...routineData,
      steps: {
        create: steps.map((step, index) => ({
          order: index + 1,
          action: step.action,
          instructions: step.instructions,
          waitTimeSeconds: step.waitTimeSeconds,
          isMixingStep: step.isMixingStep,
          products: {
            create: step.productIds.map((productId) => ({
              productId,
              quantity: step.quantities?.[productId] || null,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/routines");
  revalidatePath(`/routines/${id}`);
}

// ── Delete a routine ─────────────────────────
export async function deleteRoutine(id: string) {
  const userId = await getUserId();
  await prisma.routine.delete({ where: { id, userId } });
  revalidatePath("/dashboard");
  revalidatePath("/routines");
  redirect("/routines");
}

// ── Toggle routine active status ─────────────
export async function toggleRoutineActive(id: string) {
  const userId = await getUserId();
  const routine = await prisma.routine.findFirst({ where: { id, userId } });
  if (!routine) return { error: "Routine not found" };

  await prisma.routine.update({
    where: { id, userId },
    data: { isActive: !routine.isActive },
  });

  revalidatePath("/dashboard");
  revalidatePath("/routines");
}

// ── Log routine completion ───────────────────
export async function logRoutineStep(
  routineId: string,
  stepId: string,
  completed: boolean
) {
  const userId = await getUserId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get or create today's routine log
  let routineLog = await prisma.routineLog.findUnique({
    where: {
      routineId_date: { routineId, date: today },
    },
  });

  if (!routineLog) {
    routineLog = await prisma.routineLog.create({
      data: {
        routineId,
        userId,
        date: today,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
  }

  // Upsert the step log
  await prisma.routineStepLog.upsert({
    where: {
      routineLogId_stepId: {
        routineLogId: routineLog.id,
        stepId,
      },
    },
    update: {
      isCompleted: completed,
      completedAt: completed ? new Date() : null,
      skippedAt: null,
    },
    create: {
      routineLogId: routineLog.id,
      stepId,
      isCompleted: completed,
      completedAt: completed ? new Date() : null,
    },
  });

  // Check if all steps are complete
  const routine = await prisma.routine.findFirst({
    where: { id: routineId },
    include: { steps: true },
  });

  if (routine) {
    const stepLogs = await prisma.routineStepLog.findMany({
      where: { routineLogId: routineLog.id },
    });

    const completedCount = stepLogs.filter((sl) => sl.isCompleted).length;
    const totalSteps = routine.steps.length;

    let status: "IN_PROGRESS" | "COMPLETED" | "PARTIALLY_COMPLETED" = "IN_PROGRESS";
    if (completedCount === totalSteps) {
      status = "COMPLETED";
    } else if (completedCount > 0) {
      status = "PARTIALLY_COMPLETED";
    }

    await prisma.routineLog.update({
      where: { id: routineLog.id },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
}

// ── Get today's routine logs ─────────────────
export async function getTodayLogs() {
  const userId = await getUserId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.routineLog.findMany({
    where: { userId, date: today },
    include: {
      routine: true,
      stepLogs: {
        include: { step: true },
      },
    },
  });
}

// ── Get dashboard data ───────────────────────
export async function getDashboardData() {
  const userId = await getUserId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();

  // Active routines for today
  const routines = await prisma.routine.findMany({
    where: {
      userId,
      isActive: true,
      daysOfWeek: { has: dayOfWeek },
      OR: [
        { startDate: null },
        { startDate: { lte: today } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: today } },
          ],
        },
      ],
    },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: {
          products: { include: { product: true } },
        },
      },
    },
    orderBy: { scheduledTime: "asc" },
  });

  // Today's logs
  const todayLogs = await prisma.routineLog.findMany({
    where: { userId, date: today },
    include: {
      stepLogs: true,
    },
  });

  // Streak calculation - get completed logs in the last 60 days
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const completedLogs = await prisma.routineLog.findMany({
    where: {
      userId,
      status: "COMPLETED",
      date: { gte: sixtyDaysAgo },
    },
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "desc" },
  });

  return {
    routines,
    todayLogs,
    completedDates: completedLogs.map((l) => l.date),
  };
}
