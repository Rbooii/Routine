import { getRoutine } from "@/lib/actions/routine-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatTime, formatWaitTime, getDayNames } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  Clock,
  Calendar,
  FlaskConical,
  Timer,
  Package,
  ListChecks,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { RoutineActions } from "@/components/routines/routine-actions";

interface Props {
  params: Promise<{ id: string }>;
}

const timeOfDayVariant = (t: string) => {
  if (t === "MORNING") return "morning" as const;
  if (t === "EVENING" || t === "NIGHT") return "evening" as const;
  return "secondary" as const;
};

export default async function RoutineDetailPage({ params }: Props) {
  const { id } = await params;
  const routine = await getRoutine(id);

  if (!routine) notFound();

  const allIngredients = (routine.steps as any[])
    .flatMap((step: any) => step.products.flatMap((sp: any) => sp.product.ingredients as string[]))
    .map((i: string) => i.toLowerCase().trim());

  const uniqueIngredients = Array.from(new Set(allIngredients));

  const conflicts = uniqueIngredients.length > 1
    ? await prisma.ingredientConflict.findMany({
        where: {
          ingredientA: { in: uniqueIngredients },
          ingredientB: { in: uniqueIngredients },
        },
      })
    : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/routines">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{routine.name}</h1>
            {routine.description && (
              <p className="text-sm text-muted-foreground">{routine.description}</p>
            )}
          </div>
        </div>
        <RoutineActions routineId={routine.id} isActive={routine.isActive} />
      </div>

      {conflicts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive-foreground">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2 text-destructive font-semibold">
              <AlertTriangle className="h-5 w-5" />
              Ingredient Conflict Warnings
            </div>
            <p className="text-sm text-muted-foreground">
              Some ingredients in this routine may conflict with each other and cause irritation or reduced effectiveness:
            </p>
            <ul className="space-y-2">
              {conflicts.map((conflict: any) => (
                <li key={conflict.id} className="text-sm rounded-lg bg-background/50 border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={conflict.severity === "CRITICAL" || conflict.severity === "HIGH" ? "destructive" : "secondary"}>
                      {conflict.severity}
                    </Badge>
                    <span className="font-semibold capitalize text-foreground">
                      {conflict.ingredientA} + {conflict.ingredientB}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {conflict.description}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={timeOfDayVariant(routine.timeOfDay)}>
                {routine.timeOfDay}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatTime(routine.scheduledTime)}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {routine.daysOfWeek.length === 7
                ? "Every day"
                : getDayNames(routine.daysOfWeek).join(", ")}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ListChecks className="h-4 w-4" />
              {routine.steps.length} steps
            </div>
            {!routine.isActive && (
              <Badge variant="outline" className="text-muted-foreground">
                Paused
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Steps</h2>
        <div className="space-y-3">
          {(routine.steps as any[]).map((step: any, index) => (
            <Card key={step.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">
                      {step.order}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{step.action}</span>
                      {step.isMixingStep && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <FlaskConical className="h-2.5 w-2.5" />
                          Mix
                        </Badge>
                      )}
                    </div>

                    {step.instructions && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.instructions}
                      </p>
                    )}

                    {/* Products */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(step.products as any[]).map((sp: any) => (
                        <Badge
                          key={sp.product.id}
                          variant="outline"
                          className="gap-1 text-xs"
                        >
                          <Package className="h-2.5 w-2.5" />
                          {sp.product.name}
                          {sp.product.brand && (
                            <span className="text-muted-foreground">
                              · {sp.product.brand}
                            </span>
                          )}
                          {sp.quantity && (
                            <span className="text-muted-foreground">
                              · {sp.quantity}
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>

                    {step.waitTimeSeconds > 0 &&
                      index < routine.steps.length - 1 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          Wait {formatWaitTime(step.waitTimeSeconds)} before next
                          step
                        </div>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
