import { getDashboardData } from "@/lib/actions/routine-actions";
import { auth } from "@/auth";
import { formatTime, calculateStreak, getDayNames } from "@/lib/utils";
import { TodayRoutineCard } from "@/components/dashboard/today-routine-card";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Flame,
  CalendarCheck,
  Clock,
  Plus,
  Sparkles,
  Sun,
  Moon,
  Sunset,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: Sun, emoji: "☀️" };
  if (hour < 18) return { text: "Good afternoon", icon: Sunset, emoji: "🌤" };
  return { text: "Good evening", icon: Moon, emoji: "🌙" };
}

export default async function DashboardPage() {
  const session = await auth();
  const { routines, todayLogs, completedDates } = await getDashboardData();

  const greeting = getGreeting();
  const streak = calculateStreak(completedDates);
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  // Calculate today's overall progress
  const totalSteps = routines.reduce((acc, r) => acc + r.steps.length, 0);
  const completedSteps = todayLogs.reduce(
    (acc, log) => acc + log.stepLogs.filter((sl) => sl.isCompleted).length,
    0
  );
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            {greeting.emoji} {greeting.text}, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {routines.length > 0
              ? `You have ${routines.length} routine${routines.length > 1 ? "s" : ""} today`
              : "No routines scheduled for today"}
          </p>
        </div>
        <Link href="/routines/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Routine
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Progress */}
        <Card className="col-span-1">
          <CardContent className="p-4 flex items-center gap-4">
            <ProgressRing percentage={progressPercent} size={56} />
            <div>
              <p className="text-2xl font-bold">{progressPercent}%</p>
              <p className="text-xs text-muted-foreground">Today&apos;s progress</p>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="col-span-1">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Flame className="h-7 w-7 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-xs text-muted-foreground">Day streak 🔥</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed Today */}
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CalendarCheck className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {completedSteps}/{totalSteps}
              </p>
              <p className="text-xs text-muted-foreground">Steps completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Routines */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Today&apos;s Schedule
        </h2>

        {routines.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No routines for today</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first skincare routine to get started
              </p>
              <Link href="/routines/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  Create Routine
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => {
              const log = todayLogs.find((l) => l.routineId === routine.id);
              return (
                <TodayRoutineCard
                  key={routine.id}
                  routine={routine}
                  log={log || null}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
