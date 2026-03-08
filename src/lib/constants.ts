import type { PomodoroSettings, Task } from "./types";

export const TASKS_STORAGE_KEY = "focusinflow_tasks";
export const SESSIONS_STORAGE_KEY = "focusinflow_sessions";
export const SETTINGS_STORAGE_KEY = "focusinflow_settings";

export const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  breakMinutes: 5,
};

export const IMPORTANCE_LEVELS: Task["importance"][] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export const IMPORTANCE_MAP: Record<Task["importance"], number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};
