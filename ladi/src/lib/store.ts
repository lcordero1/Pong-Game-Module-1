import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Project, Store, Task, CoachMessage, Briefing } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "ladi.json");

const SEED_PROJECTS: Project[] = [
  {
    id: "proj-newsletter",
    name: "Newsletter",
    description: "Writing, editing, and publishing the newsletter.",
    color: "#f59e0b",
    kind: "personal",
    archived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "proj-podcast",
    name: "Podcast",
    description: "Episode planning, recording, editing, and release.",
    color: "#8b5cf6",
    kind: "personal",
    archived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "proj-speaking",
    name: "Speaker Engagements",
    description: "Outreach, prep, and follow-up for speaking gigs.",
    color: "#ec4899",
    kind: "personal",
    archived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "proj-ai-skills",
    name: "AI & Video Skills",
    description: "Learning AI tools and improving video production.",
    color: "#10b981",
    kind: "personal",
    archived: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "proj-work-ai",
    name: "Work AI Initiative",
    description: "Integrating AI into daily workflows at work.",
    color: "#3b82f6",
    kind: "work",
    archived: false,
    createdAt: new Date().toISOString(),
  },
];

let writeQueue: Promise<void> = Promise.resolve();

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const initial: Store = {
      projects: SEED_PROJECTS,
      tasks: [],
      coachMessages: [],
      briefings: [],
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

export async function readStore(): Promise<Store> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as Store;
}

export async function writeStore(store: Store): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const tmp = `${DATA_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
    await fs.rename(tmp, DATA_FILE);
  });
  return writeQueue;
}

export async function mutate(fn: (store: Store) => void | Promise<void>): Promise<Store> {
  const store = await readStore();
  await fn(store);
  await writeStore(store);
  return store;
}

export function newId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

export async function listProjects(): Promise<Project[]> {
  const store = await readStore();
  return store.projects.filter((p) => !p.archived);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const store = await readStore();
  return store.projects.find((p) => p.id === id);
}

export async function listTasks(filter?: { projectId?: string }): Promise<Task[]> {
  const store = await readStore();
  let tasks = store.tasks;
  if (filter?.projectId) tasks = tasks.filter((t) => t.projectId === filter.projectId);
  return tasks;
}

export async function createTask(input: Omit<Task, "id" | "createdAt" | "completedAt">): Promise<Task> {
  const task: Task = {
    ...input,
    id: newId("task"),
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  await mutate((store) => {
    store.tasks.push(task);
  });
  return task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | null> {
  let updated: Task | null = null;
  await mutate((store) => {
    const idx = store.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const next: Task = { ...store.tasks[idx], ...patch };
    if (patch.status === "done" && !store.tasks[idx].completedAt) {
      next.completedAt = new Date().toISOString();
    }
    if (patch.status && patch.status !== "done") {
      next.completedAt = null;
    }
    store.tasks[idx] = next;
    updated = next;
  });
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  await mutate((store) => {
    store.tasks = store.tasks.filter((t) => t.id !== id);
  });
}

export async function createProject(input: Omit<Project, "id" | "createdAt" | "archived">): Promise<Project> {
  const project: Project = {
    ...input,
    id: newId("proj"),
    archived: false,
    createdAt: new Date().toISOString(),
  };
  await mutate((store) => {
    store.projects.push(project);
  });
  return project;
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project | null> {
  let updated: Project | null = null;
  await mutate((store) => {
    const idx = store.projects.findIndex((p) => p.id === id);
    if (idx === -1) return;
    store.projects[idx] = { ...store.projects[idx], ...patch };
    updated = store.projects[idx];
  });
  return updated;
}

export async function appendCoachMessage(message: Omit<CoachMessage, "id" | "createdAt">): Promise<CoachMessage> {
  const msg: CoachMessage = {
    ...message,
    pending: message.pending ?? null,
    id: newId("msg"),
    createdAt: new Date().toISOString(),
  };
  await mutate((store) => {
    store.coachMessages.push(msg);
  });
  return msg;
}

export async function clearCoachPending(messageId: string): Promise<void> {
  await mutate((store) => {
    const m = store.coachMessages.find((m) => m.id === messageId);
    if (m) m.pending = null;
  });
}

export async function findPendingAssistant(): Promise<CoachMessage | null> {
  const store = await readStore();
  for (let i = store.coachMessages.length - 1; i >= 0; i--) {
    const m = store.coachMessages[i];
    if (m.role === "assistant" && m.pending && m.pending.length > 0) return m;
  }
  return null;
}

export async function listCoachMessages(limit = 40): Promise<CoachMessage[]> {
  const store = await readStore();
  return store.coachMessages.slice(-limit);
}

export async function clearCoachMessages(): Promise<void> {
  await mutate((store) => {
    store.coachMessages = [];
  });
}

export async function appendBriefing(briefing: Omit<Briefing, "id" | "createdAt">): Promise<Briefing> {
  const b: Briefing = {
    ...briefing,
    id: newId("brief"),
    createdAt: new Date().toISOString(),
  };
  await mutate((store) => {
    store.briefings.push(b);
    store.briefings = store.briefings.slice(-20);
  });
  return b;
}

export async function latestBriefing(): Promise<Briefing | null> {
  const store = await readStore();
  return store.briefings.at(-1) ?? null;
}
