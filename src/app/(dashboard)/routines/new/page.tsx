"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRoutine } from "@/lib/actions/routine-actions";
import { getProducts } from "@/lib/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  FlaskConical,
  GripVertical,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect } from "react";
import { getDayNames } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
};

type StepData = {
  action: string;
  instructions: string;
  waitTimeSeconds: number;
  isMixingStep: boolean;
  productIds: string[];
  quantities: Record<string, string>;
};

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const TIME_PRESETS: Record<string, string> = {
  MORNING: "07:00",
  AFTERNOON: "12:00",
  EVENING: "18:00",
  NIGHT: "21:00",
  CUSTOM: "",
};

export default function NewRoutinePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0); // Wizard step: 0=basics, 1=steps, 2=review

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<string>("MORNING");
  const [scheduledTime, setScheduledTime] = useState("07:00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [steps, setSteps] = useState<StepData[]>([
    {
      action: "Apply",
      instructions: "",
      waitTimeSeconds: 60,
      isMixingStep: false,
      productIds: [],
      quantities: {},
    },
  ]);

  // Products list
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function addStep() {
    setSteps((prev) => [
      ...prev,
      {
        action: "Apply",
        instructions: "",
        waitTimeSeconds: 60,
        isMixingStep: false,
        productIds: [],
        quantities: {},
      },
    ]);
  }

  function removeStep(index: number) {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStep(index: number, data: Partial<StepData>) {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, ...data } : step))
    );
  }

  function toggleProductInStep(stepIndex: number, productId: string) {
    const step = steps[stepIndex];
    const newProductIds = step.productIds.includes(productId)
      ? step.productIds.filter((id) => id !== productId)
      : [...step.productIds, productId];
    updateStep(stepIndex, { productIds: newProductIds });
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Please enter a routine name");
      return;
    }
    if (daysOfWeek.length === 0) {
      toast.error("Select at least one day");
      return;
    }
    if (steps.some((s) => s.productIds.length === 0)) {
      toast.error("Each step needs at least one product");
      return;
    }

    startTransition(async () => {
      const result = await createRoutine({
        name,
        description: description || undefined,
        timeOfDay,
        scheduledTime,
        daysOfWeek,
        steps,
      });
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  const wizardSteps = ["Basics", "Steps", "Review"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/routines">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Routine</h1>
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {wizardSteps.length}: {wizardSteps[currentStep]}
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2">
        {wizardSteps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 0: Basics */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Routine Details</CardTitle>
            <CardDescription>Give your routine a name and set the schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Routine Name</Label>
              <Input
                id="name"
                placeholder="e.g., Morning Skincare, Post-Laser Recovery"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this routine..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time of Day</Label>
                <Select
                  value={timeOfDay}
                  onValueChange={(v) => {
                    setTimeOfDay(v);
                    if (TIME_PRESETS[v]) setScheduledTime(TIME_PRESETS[v]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">🌅 Morning</SelectItem>
                    <SelectItem value="AFTERNOON">☀️ Afternoon</SelectItem>
                    <SelectItem value="EVENING">🌇 Evening</SelectItem>
                    <SelectItem value="NIGHT">🌙 Night</SelectItem>
                    <SelectItem value="CUSTOM">⏰ Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Days of the Week</Label>
              <div className="flex gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`h-9 w-9 rounded-full text-xs font-medium transition-all ${
                      daysOfWeek.includes(day.value)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Steps */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Routine Steps</CardTitle>
              <CardDescription>
                Add products and set the application order.
                {products.length === 0 && (
                  <span className="block mt-1 text-primary">
                    💡 You need to add products first.{" "}
                    <Link href="/products" className="underline font-medium">
                      Go to Products →
                    </Link>
                  </span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          {steps.map((step, index) => (
            <Card key={index} className="relative">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Step {index + 1}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeStep(index)}
                    disabled={steps.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Action</Label>
                    <Select
                      value={step.action}
                      onValueChange={(v) => updateStep(index, { action: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Apply">Apply</SelectItem>
                        <SelectItem value="Mix and Apply">Mix & Apply</SelectItem>
                        <SelectItem value="Cleanse">Cleanse</SelectItem>
                        <SelectItem value="Rinse">Rinse</SelectItem>
                        <SelectItem value="Pat dry">Pat dry</SelectItem>
                        <SelectItem value="Massage">Massage</SelectItem>
                        <SelectItem value="Wait">Wait</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Wait time after</Label>
                    <Select
                      value={String(step.waitTimeSeconds)}
                      onValueChange={(v) =>
                        updateStep(index, { waitTimeSeconds: parseInt(v) })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No wait</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="120">2 minutes</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Instructions (optional)</Label>
                  <Input
                    placeholder="e.g., Apply to damp skin in circular motions"
                    value={step.instructions}
                    onChange={(e) =>
                      updateStep(index, { instructions: e.target.value })
                    }
                    className="h-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={step.isMixingStep}
                    onCheckedChange={(checked) =>
                      updateStep(index, { isMixingStep: checked })
                    }
                  />
                  <Label className="text-xs flex items-center gap-1 cursor-pointer">
                    <FlaskConical className="h-3 w-3" />
                    Mix products together
                  </Label>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-xs">Select Products</Label>
                  {products.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No products added yet
                    </p>
                  ) : (
                    <div className="grid gap-1.5 max-h-40 overflow-y-auto">
                      {products.map((product) => (
                        <label
                          key={product.id}
                          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-sm ${
                            step.productIds.includes(product.id)
                              ? "bg-primary/10"
                              : "hover:bg-muted"
                          }`}
                        >
                          <Checkbox
                            checked={step.productIds.includes(product.id)}
                            onCheckedChange={() =>
                              toggleProductInStep(index, product.id)
                            }
                          />
                          <span className="flex-1">{product.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {product.category}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addStep} className="w-full">
            <Plus className="h-4 w-4" />
            Add Step
          </Button>
        </div>
      )}

      {/* Step 2: Review */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Review Your Routine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{name || "—"}</p>
            </div>
            {description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{description}</p>
              </div>
            )}
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {timeOfDay} · {scheduledTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days</p>
                <p className="font-medium">
                  {daysOfWeek.length === 7
                    ? "Every day"
                    : getDayNames(daysOfWeek).join(", ")}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {steps.length} Step{steps.length > 1 ? "s" : ""}
              </p>
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <span className="text-xs text-muted-foreground w-5">
                    {i + 1}.
                  </span>
                  <span className="text-sm font-medium">{step.action}</span>
                  {step.isMixingStep && (
                    <FlaskConical className="h-3 w-3 text-primary" />
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {step.productIds.length} product
                    {step.productIds.length !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < 2 ? (
          <Button onClick={() => setCurrentStep((s) => s + 1)}>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isPending ? "Creating..." : "Create Routine"}
          </Button>
        )}
      </div>
    </div>
  );
}
