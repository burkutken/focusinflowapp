
import type { User } from 'firebase/auth';

export interface TaskStep {
  id: string;
  title: string;
  completed: boolean;
  completedBy?: string | null; // User ID of who completed the step
}

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    apiKey?: string;
}

export interface Task {
  id: string;
  userId: string; // The creator of the task
  title: string;
  description: string;
  importance: "low" | "medium" | "high" | "urgent";
  deadline: string; // ISO string
  createdAt: string; // ISO string
  steps: TaskStep[];
  pomodoroSessions: number;
  completedAt: string | null; // ISO string
  members: UserProfile[]; // Users this task is shared with
  memberIds: string[]; // For Firestore queries
}

export interface PomodoroSession {
  id:string;
  completedAt: string; // ISO string
  workMinutes: number;
  breakMinutes: number;
  taskId?: string;
  taskTitle?: string;
}

export interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
}

export interface UserRole {
  uid: string;
  email: string | null;
  status: 'Free' | 'Premium' | 'Lifetime' | 'Admin';
  nickname?: string | null;
}
