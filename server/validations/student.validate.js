import { z } from "zod";

const studentValidation = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  class: z.string().min(1, "Class is required"),
  age: z.string().min(1, "Age is required").max(100),
  institute: z.string().min(1, "Institute is required"),
  isValid: z.boolean().optional().default(false),
  isTeacher: z.boolean().optional().default(false),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must not exceed 32 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export { studentValidation };