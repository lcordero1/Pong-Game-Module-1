export type ProjectKind = "work" | "personal";

export type TaskStatus = "todo" | "doing" | "done";

export type Priority = 1 | 2 | 3;

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  kind: ProjectKind;
  archived: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: Priority;
  scheduledFor: string | null;
  scheduledStart: string | null;
  estimatedMinutes: number;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Briefing {
  id: string;
  kind: "morning" | "afternoon";
  content: string;
  createdAt: string;
}

export interface Store {
  projects: Project[];
  tasks: Task[];
  coachMessages: CoachMessage[];
  briefings: Briefing[];
}
