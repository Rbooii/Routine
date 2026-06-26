import { z } from "zod";

// ── Auth Schemas ─────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

// ── Product Schemas ──────────────────────────

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name is too long"),
  brand: z.string().max(100).optional(),
  category: z.enum([
    "CLEANSER",
    "TONER",
    "SERUM",
    "MOISTURIZER",
    "SUNSCREEN",
    "EXFOLIANT",
    "MASK",
    "EYE_CREAM",
    "LIP_CARE",
    "TREATMENT",
    "SPOT_TREATMENT",
    "PRESCRIPTION",
    "OTHER",
  ]),
  description: z.string().max(500).optional(),
  ingredients: z.array(z.string().min(1)).default([]),
});

// ── Routine Schemas ──────────────────────────

export const routineStepSchema = z.object({
  action: z.string().min(1, "Action is required"),
  instructions: z.string().optional(),
  waitTimeSeconds: z.number().int().min(0).max(600).default(60),
  isMixingStep: z.boolean().default(false),
  productIds: z.array(z.string()).min(1, "At least one product is required"),
  quantities: z.record(z.string(), z.string().optional()).optional(),
});

export const routineSchema = z.object({
  name: z
    .string()
    .min(1, "Routine name is required")
    .max(100, "Routine name is too long"),
  description: z.string().max(500).optional(),
  timeOfDay: z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT", "CUSTOM"]),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format"),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, "Select at least one day"),
  steps: z
    .array(routineStepSchema)
    .min(1, "Add at least one step to your routine"),
});

// ── Settings Schemas ─────────────────────────

export const notificationPrefSchema = z.object({
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  reminderMinutesBefore: z.number().int().min(1).max(60),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(50),
  timezone: z.string(),
  skinType: z
    .enum(["NORMAL", "DRY", "OILY", "COMBINATION", "SENSITIVE"])
    .optional()
    .nullable(),
});

// ── Type Exports ─────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type RoutineStepInput = z.infer<typeof routineStepSchema>;
export type RoutineInput = z.infer<typeof routineSchema>;
export type NotificationPrefInput = z.infer<typeof notificationPrefSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
