"use client";

import { useState, useTransition } from "react";
import { formatTime, formatWaitTime } from "@/lib/utils";
import { logRoutineStep } from "@/lib/actions/routine-actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Timer,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TodayRoutineCardProps {
  routine: {
    id: string;
    name: string;
    timeOfDay: string;
    scheduledTime: string;
    steps: {
      id: string;
      order: number;
      action: string;
      instructions: string | null;
      waitTimeSeconds: number;
      isMixingStep: boolean;
      products: {
        quantity: string | null;
        product: { id: string; name: string; brand: string | null; category: string };
      }[];
    }[];
  };
  log: {
    id: string;
    status: string;
    stepLogs: {
      stepId: string;
      isCompleted: boolean;
    }[];
  } | null;
}

const timeOfDayVariant = (timeOfDay: string) => {
  switch (timeOfDay) {
    case "MORNING":
      return "morning" as const;
    case "EVENING":
    case "NIGHT":
      return "evening" as const;
    default:
      return "secondary" as const;
  }
};

export function TodayRoutineCard({ routine, log }: TodayRoutineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set(log ? log.stepLogs.filter((sl) => sl.isCompleted).map((sl) => sl.stepId) : [])
  );

  const totalSteps = routine.steps.length;
  const completedCount = completedSteps.size;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  const isComplete = completedCount === totalSteps && totalSteps > 0;

  function handleToggleStep(stepId: string) {
    const newCompleted = new Set(completedSteps);
    const willComplete = !newCompleted.has(stepId);

    if (willComplete) {
      newCompleted.add(stepId);
    } else {
      newCompleted.delete(stepId);
    }
    setCompletedSteps(newCompleted);

    startTransition(async () => {
      await logRoutineStep(routine.id, stepId, willComplete);
      if (willComplete && newCompleted.size === totalSteps) {
        toast.success("🎉 Routine completed! Great job!", {
          description: `You finished "${routine.name}"`,
        });
      }
    });
  }

  return (
    <Card
      className={`transition-all duration-300 ${
        isComplete ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20" : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">{routine.name}</h3>
                {isComplete && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={timeOfDayVariant(routine.timeOfDay)} className="text-[10px]">
                  {routine.timeOfDay}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(routine.scheduledTime)}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalSteps} steps
            </span>
            <span className="text-xs font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="pt-2 space-y-2">
              {routine.steps.map((step, index) => {
                const isStepCompleted = completedSteps.has(step.id);
                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
                      isStepCompleted
                        ? "bg-green-50 dark:bg-green-950/20 opacity-75"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <Checkbox
                      checked={isStepCompleted}
                      onCheckedChange={() => handleToggleStep(step.id)}
                      disabled={isPending}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            isStepCompleted ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {step.order}. {step.action}
                        </span>
                        {step.isMixingStep && (
                          <FlaskConical className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      {/* Products */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {step.products.map((sp) => (
                          <Badge
                            key={sp.product.id}
                            variant="outline"
                            className="text-[10px] py-0"
                          >
                            {sp.product.name}
                            {sp.quantity && ` · ${sp.quantity}`}
                          </Badge>
                        ))}
                      </div>
                      {step.instructions && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.instructions}
                        </p>
                      )}
                      {step.waitTimeSeconds > 0 &&
                        index < routine.steps.length - 1 && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            Wait {formatWaitTime(step.waitTimeSeconds)}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}

              {isComplete && (
                <div className="text-center py-2">
                  <Sparkles className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                    All done! Your skin thanks you ✨
                  </p>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
