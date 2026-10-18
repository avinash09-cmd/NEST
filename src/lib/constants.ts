// src/lib/constants.ts

export const APP_NAME = "N.E.S.T.";
export const APP_FULL_NAME = "Neighborhood Emergency and Safety Tool";

export const COMPLAINT_CATEGORIES = [
  { value: "ROAD_DAMAGE",        label: "Road Damage" },
  { value: "STREET_LIGHTING",    label: "Street Lighting" },
  { value: "GARBAGE_COLLECTION", label: "Garbage Collection" },
  { value: "WATER_SUPPLY",       label: "Water Supply" },
  { value: "SEWAGE_DRAINAGE",    label: "Sewage & Drainage" },
  { value: "NOISE_POLLUTION",    label: "Noise Pollution" },
  { value: "PUBLIC_SAFETY",      label: "Public Safety" },
  { value: "PARK_MAINTENANCE",   label: "Park Maintenance" },
  { value: "ILLEGAL_DUMPING",    label: "Illegal Dumping" },
  { value: "BUILDING_HAZARD",    label: "Building Hazard" },
  { value: "ANIMAL_CONTROL",     label: "Animal Control" },
  { value: "OTHER",              label: "Other" },
] as const;

export const PRIORITY_COLORS = {
  LOW:      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  HIGH:     "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
} as const;

export const STATUS_COLORS = {
  PENDING:      "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  UNDER_REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED:     "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CLOSED:       "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
} as const;

export const WATER_STATUS_COLORS = {
  SAFE:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CAUTION:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  UNSAFE:   "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
} as const;

export const WATER_THRESHOLDS = {
  ph:        { min: 6.5, max: 8.5 },
  turbidity: { max: 1 },
  chlorine:  { min: 0.2, max: 4.0 },
  tds:       { max: 500 },
  nitrates:  { max: 10 },
} as const;

export const PAGINATION_LIMIT = 10;
