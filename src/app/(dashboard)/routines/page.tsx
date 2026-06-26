import { getRoutines } from "@/lib/actions/routine-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime, getDayNames } from "@/lib/utils";
import {
  Plus,
  ListChecks,
  Clock,
  ChevronRight,
  Calendar,
} from "lucide-react";

const timeOfDayVariant = (t: string) => {
  if (t === "MORNING") return "morning" as const;
  if (t === "EVENING" || t === "NIGHT") return "evening" as const;
  return "secondary" as const;
};

export default async function RoutinesPage() {
  const routines = await getRoutines();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Routines</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your skincare routines
          </p>
        </div>
        <Link href="/routines/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Routine
          </Button>
        </Link>
      </div>

      {routines.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No routines yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Create your first skincare routine to start tracking your daily
              skincare regimen
            </p>
            <Link href="/routines/new">
              <Button>
                <Plus className="h-4 w-4" />
                Create Your First Routine
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {routines.map((routine) => (
            <Link key={routine.id} href={`/routines/${routine.id}`}>
              <Card className="hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                        {routine.name}
                      </h3>
                      {routine.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {routine.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant={timeOfDayVariant(routine.timeOfDay)} className="text-[10px]">
                      {routine.timeOfDay}
                    </Badge>
                    {!routine.isActive && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Paused
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(routine.scheduledTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {getDayNames(routine.daysOfWeek).join(", ")}
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3 w-3" />
                      {routine.steps.length} steps
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
