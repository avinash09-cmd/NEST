// src/types/index.ts
import type {
  User, Complaint, Alert, Emergency,
  WaterQualityReading, Suggestion, Notification,
  ComplaintComment,
} from "@prisma/client";

export type SafeUser = Omit<User, "password">;

export type ComplaintWithUser = Complaint & {
  user: SafeUser;
  comments: (ComplaintComment & { user: SafeUser })[];
};

export type AlertWithCreator = Alert & {
  createdBy: SafeUser;
};

export type EmergencyWithReporter = Emergency & {
  reportedBy: SafeUser;
};

export type DashboardStats = {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  activeAlerts: number;
  activeEmergencies: number;
  waterSafeZones: number;
  waterUnsafeZones: number;
  unreadNotifications: number;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type {
  User, Complaint, Alert, Emergency,
  WaterQualityReading, Suggestion, Notification,
  ComplaintComment,
};
