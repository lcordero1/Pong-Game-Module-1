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

export type StoredContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  /**
   * Either plain text (simple conversational turns) or an array of content
   * blocks. Block array is used when tool_use / tool_result are involved.
   */
  content: string | StoredContentBlock[];
  /**
   * For an assistant message: list of tool_use_ids still awaiting Ladi's
   * approve/deny. Null/empty once all have been resolved.
   */
  pending: string[] | null;
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
