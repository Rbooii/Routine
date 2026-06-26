"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema, loginSchema } from "@/lib/validations";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function register(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = registerSchema.safeParse(data);
  if (!validated.success) {
    return {
      error: validated.error.errors.map((e) => e.message).join(". "),
    };
  }

  const { name, email, password } = validated.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { error: "An account with this email already exists" };
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      hashedPassword,
      notificationPref: {
        create: {
          emailEnabled: true,
          pushEnabled: false,
          reminderMinutesBefore: 5,
        },
      },
    },
  });

  // Auto sign-in after registration
  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but auto-login failed. Please log in manually." };
    }
    throw error;
  }

  redirect("/dashboard");
}

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    return {
      error: validated.error.errors.map((e) => e.message).join(". "),
    };
  }

  try {
    await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email or password" };
      }
      return { error: "Something went wrong. Please try again." };
    }
    throw error;
  }

  redirect("/dashboard");
}
