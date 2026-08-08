import { z } from "zod";

/** Shared input rules for anything a member types. Used by forms and writes. */

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Handles need at least 3 characters.")
  .max(20, "Handles can be at most 20 characters.")
  .regex(/^[a-z0-9_]+$/, "Use letters, numbers and underscores only.");

export const emailSchema = z.string().trim().min(1, "Email is required.").email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Passwords can be at most 72 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const signUpSchema = z.object({
  email: emailSchema,
  handle: handleSchema,
  password: passwordSchema,
});

export const postSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write something first.")
    .max(1000, "Posts are limited to 1000 characters."),
});

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Add a display name.").max(50, "Keep it under 50 characters."),
  handle: handleSchema,
  bio: z.string().trim().max(280, "Bios are limited to 280 characters.").optional(),
});

/** Flatten a Zod error into a field → first message map. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
