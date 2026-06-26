import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Flame, TrendingUp, BarChart3 } from "lucide-react";
import { calculateStreak, formatTime } from "@/lib/utils";
import { format, subDays, eachDayOfInterval } from "date-fns";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = subDays(today, 30);

  // Get logs for last 30 days
  const logs = await prisma.routineLog.findMany({
    where: {
      userId: session.user.id,
      date: { gte: thirtyDaysAgo },
    },
    include: {
      routine: { select: { name: true, timeOfDay: true } },
    },
    orderBy: { date: "desc" },
  });

  // Calculate stats
  const completedLogs = logs.filter((l) => l.status === "COMPLETED");
  const completedDates = [
    ...new Set(completedLogs.map((l) => l.date.toISOString().split("T")[0])),
  ];
  const streak = calculateStreak(completedLogs.map((l) => l.date));
  const totalRoutines = logs.length;
  const completionRate =
    totalRoutines > 0 ? Math.round((completedLogs.length / totalRoutines) * 100) : 0;

  // Build heatmap data for last 30 days
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
  const heatmapData = days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayLogs = logs.filter(
      (l) => l.date.toISOString().split("T")[0] === dateStr
    );
    const completed = dayLogs.filter((l) => l.status === "COMPLETED").length;
    const total = dayLogs.length;
    return { date: day, dateStr, completed, total };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History & Insights</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your skincare consistency
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CalendarCheck className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{completedLogs.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalRoutines}</p>
            <p className="text-xs text-muted-foreground">Total Logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground text-center font-medium"
              >
                {d}
              </div>
            ))}
            {/* Padding for alignment */}
            {Array.from({ length: heatmapData[0]?.date.getDay() || 0 }).map(
              (_, i) => (
                <div key={`pad-${i}`} />
              )
            )}
            {heatmapData.map((day) => {
              let intensity = "bg-muted";
              if (day.total > 0) {
                const ratio = day.completed / day.total;
                if (ratio === 1)
                  intensity = "bg-green-500 dark:bg-green-600";
                else if (ratio >= 0.5)
                  intensity = "bg-green-300 dark:bg-green-700";
                else if (ratio > 0)
                  intensity = "bg-green-200 dark:bg-green-800";
              }

              const isToday = day.dateStr === format(today, "yyyy-MM-dd");

              return (
                <div
                  key={day.dateStr}
                  className={`aspect-square rounded-sm ${intensity} transition-colors ${
                    isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                  }`}
                  title={`${format(day.date, "MMM d")}: ${day.completed}/${day.total} completed`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="h-3 w-3 rounded-sm bg-muted" />
            <div className="h-3 w-3 rounded-sm bg-green-200 dark:bg-green-800" />
            <div className="h-3 w-3 rounded-sm bg-green-300 dark:bg-green-700" />
            <div className="h-3 w-3 rounded-sm bg-green-500 dark:bg-green-600" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No activity yet. Complete your first routine to see it here!
            </p>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 15).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        log.status === "COMPLETED"
                          ? "bg-green-500"
                          : log.status === "PARTIALLY_COMPLETED"
                          ? "bg-yellow-500"
                          : log.status === "SKIPPED"
                          ? "bg-red-400"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {log.routine.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(log.date, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      log.status === "COMPLETED"
                        ? "success"
                        : log.status === "SKIPPED"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {log.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
