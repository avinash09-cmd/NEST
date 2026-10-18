// src/lib/validations.ts
import { z } from "zod";

export const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name:         z.string().min(2, "Name must be at least 2 characters"),
  email:        z.string().email("Invalid email address"),
  password:     z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  phone:        z.string().optional(),
  address:      z.string().optional(),
  neighborhood: z.string().optional(),
});

export const complaintSchema = z.object({
  title:       z.string().min(5, "Title too short").max(120, "Title too long"),
  description: z.string().min(20, "Description too short").max(2000, "Description too long"),
  category:    z.string().min(1, "Category required"),
  location:    z.string().min(5, "Please provide a location"),
  latitude:    z.number().optional(),
  longitude:   z.number().optional(),
  isAnonymous: z.boolean().default(false),
  attachments: z.array(z.string().url()).optional(),
});

export const suggestionSchema = z.object({
  title:    z.string().min(5, "Title too short").max(120, "Title too long"),
  content:  z.string().min(20, "Content too short").max(2000, "Too long"),
  category: z.string().min(1, "Please select a category"),
});

export const alertSchema = z.object({
  title:        z.string().min(5).max(120),
  message:      z.string().min(10).max(1000),
  type:         z.string(),
  priority:     z.string(),
  neighborhood: z.string().optional(),
  expiresAt:    z.string().optional(),
});

export const emergencySchema = z.object({
  title:        z.string().min(5).max(120),
  description:  z.string().min(10).max(2000),
  type:         z.string(),
  severity:     z.string(),
  location:     z.string().min(5),
  latitude:     z.number().optional(),
  longitude:    z.number().optional(),
  affectedArea: z.string().optional(),
  contactName:  z.string().optional(),
  contactPhone: z.string().optional(),
});

export const waterReadingSchema = z.object({
  location:    z.string().min(3),
  zone:        z.string().min(1),
  ph:          z.number().min(0).max(14),
  turbidity:   z.number().min(0),
  chlorine:    z.number().min(0),
  tds:         z.number().min(0),
  temperature: z.number().min(-10).max(100),
  dissolvedO2: z.number().min(0).optional(),
  conductivity:z.number().min(0).optional(),
  hardness:    z.number().min(0).optional(),
  nitrates:    z.number().min(0).optional(),
  bacteria:    z.boolean().default(false),
  collectedBy: z.string().optional(),
  notes:       z.string().optional(),
});

export type LoginInput        = z.infer<typeof loginSchema>;
export type RegisterInput     = z.infer<typeof registerSchema>;
export type ComplaintInput    = z.infer<typeof complaintSchema>;
export type SuggestionInput   = z.infer<typeof suggestionSchema>;
export type AlertInput        = z.infer<typeof alertSchema>;
export type EmergencyInput    = z.infer<typeof emergencySchema>;
export type WaterReadingInput = z.infer<typeof waterReadingSchema>;
