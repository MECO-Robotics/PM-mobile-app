import type {
  Event,
  ManufacturingItem,
  MemberRole,
  PartInstance,
  PurchaseItem,
  Subsystem,
  Task,
  TaskStatus,
  WorkLog,
} from "../types/domain";

import { STATUS_GROUPS } from "./constants";
import type {
  ManufacturingDraft,
  MemberDraft,
  MilestoneDraft,
  PartDefinitionDraft,
  PartLifecycleStatus,
  PurchaseDraft,
  StatusGroup,
  SubsystemDraft,
  TaskDraft,
  WorkLogDraft,
} from "./types";
export function buildTaskDraft(seed?: Partial<Task>): TaskDraft {
  return {
    title: seed?.title ?? "",
    summary: seed?.summary ?? "",
    subsystemId: seed?.subsystemId ?? "",
    disciplineId: seed?.disciplineId ?? "",
    ownerId: seed?.ownerId ?? "",
    mentorId: seed?.mentorId ?? "",
    dueDate: seed?.dueDate ?? isoToday(),
    priority: seed?.priority ?? "medium",
    status: seed?.status ?? "not-started",
    mechanismId: seed?.mechanismId ?? null,
    partInstanceId: seed?.partInstanceId ?? null,
    targetEventId: seed?.targetEventId ?? null,
    blockersText: seed?.blockers?.join(", ") ?? "",
  };
}

export function buildMilestoneDraft(seed?: Partial<Event>): MilestoneDraft {
  return {
    title: seed?.title ?? "",
    type: seed?.type ?? "internal-review",
    isExternal: seed?.isExternal ?? false,
    description: seed?.description ?? "",
    relatedSubsystemIdsText: seed?.relatedSubsystemIds?.join(", ") ?? "",
  };
}

export function buildWorkLogDraft(seed?: Partial<WorkLog>): WorkLogDraft {
  return {
    taskId: seed?.taskId ?? "",
    date: seed?.date ?? isoToday(),
    hours: typeof seed?.hours === "number" ? String(seed.hours) : "",
    participantIdsText: seed?.participantIds?.join(",") ?? "",
    notes: seed?.notes ?? "",
  };
}

export function buildManufacturingDraft(
  process: ManufacturingItem["process"],
  seed?: Partial<ManufacturingItem>,
): ManufacturingDraft {
  return {
    title: seed?.title ?? "",
    subsystemId: seed?.subsystemId ?? "",
    requestedById: seed?.requestedById ?? "",
    process: seed?.process ?? process,
    dueDate: seed?.dueDate ?? isoToday(),
    material: seed?.material ?? "",
    quantity: typeof seed?.quantity === "number" ? String(seed.quantity) : "1",
    status: seed?.status ?? "requested",
    mentorReviewed: seed?.mentorReviewed ?? false,
    batchLabel: seed?.batchLabel ?? "",
    qaReviewCount: typeof seed?.qaReviewCount === "number" ? String(seed.qaReviewCount) : "0",
  };
}

export function buildPurchaseDraft(seed?: Partial<PurchaseItem>): PurchaseDraft {
  return {
    title: seed?.title ?? "",
    subsystemId: seed?.subsystemId ?? "",
    requestedById: seed?.requestedById ?? "",
    quantity: typeof seed?.quantity === "number" ? String(seed.quantity) : "1",
    vendor: seed?.vendor ?? "",
    linkLabel: seed?.linkLabel ?? "",
    estimatedCost:
      typeof seed?.estimatedCost === "number" ? String(seed.estimatedCost) : "",
    finalCost: typeof seed?.finalCost === "number" ? String(seed.finalCost) : "",
    approvedByMentor: seed?.approvedByMentor ?? false,
    status: seed?.status ?? "requested",
  };
}

export function buildMemberDraft(seed?: Partial<{ name: string; role: MemberRole }>): MemberDraft {
  return {
    name: seed?.name ?? "",
    role: seed?.role ?? "student",
  };
}

export function buildSubsystemDraft(seed?: Partial<Subsystem>): SubsystemDraft {
  return {
    name: seed?.name ?? "",
    description: seed?.description ?? "",
    responsibleEngineerId: seed?.responsibleEngineerId ?? "",
    mentorIdsText: seed?.mentorIds?.join(",") ?? "",
    risksText: seed?.risks?.join(", ") ?? "",
  };
}

export function buildPartDefinitionDraft(
  seed?: Partial<{
    name: string;
    partNumber: string;
    revision: string;
    type: string;
    source: string;
  }>,
): PartDefinitionDraft {
  return {
    name: seed?.name ?? "",
    partNumber: seed?.partNumber ?? "",
    revision: seed?.revision ?? "A",
    type: seed?.type ?? "custom",
    source: seed?.source ?? "",
  };
}

export function buildId(prefix: string, seed: string) {
  const normalized = seed
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${normalized || "item"}-${suffix}`;
}

export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function getStatusGroup(value: string): StatusGroup {
  for (const [group, candidates] of Object.entries(STATUS_GROUPS) as Array<
    [Exclude<StatusGroup, "neutral">, Set<string>]
  >) {
    if (candidates.has(value)) {
      return group;
    }
  }

  return "neutral";
}

export function timelineProgress(status: TaskStatus): number {
  if (status === "complete") {
    return 1;
  }

  if (status === "waiting-for-qa") {
    return 0.8;
  }

  if (status === "in-progress") {
    return 0.55;
  }

  return 0.18;
}

export function inferMaterialCategory(materialName: string): string {
  const name = materialName.toLowerCase();

  if (name.includes("poly") || name.includes("abs") || name.includes("pla")) {
    return "plastic";
  }

  if (name.includes("onyx") || name.includes("filament")) {
    return "filament";
  }

  if (name.includes("wire") || name.includes("sensor") || name.includes("pcb")) {
    return "electronics";
  }

  if (name.includes("bolt") || name.includes("screw") || name.includes("nut")) {
    return "hardware";
  }

  if (name.includes("alu") || name.includes("steel") || name.includes("metal")) {
    return "metal";
  }

  return "other";
}

export function derivePartLifecycleStatus(
  partInstance: PartInstance,
  tasks: Task[],
): PartLifecycleStatus {
  const linkedTasks = tasks.filter((task) => task.partInstanceId === partInstance.id);

  if (linkedTasks.length === 0) {
    return "planned";
  }

  if (linkedTasks.every((task) => task.status === "complete")) {
    return "installed";
  }

  if (linkedTasks.some((task) => task.status === "waiting-for-qa")) {
    return "available";
  }

  if (linkedTasks.some((task) => task.status === "in-progress")) {
    return "needed";
  }

  return "planned";
}

export function formatDate(value: string) {
  return value.slice(5);
}

export function datePortion(dateTime: string) {
  return dateTime.slice(0, 10);
}

export function timePortion(dateTime: string) {
  if (dateTime.length < 16) {
    return "12:00";
  }

  return dateTime.slice(11, 16);
}

export function buildDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

export function compareDateTimes(a: string, b: string) {
  return new Date(a).getTime() - new Date(b).getTime();
}

export function localTodayDate() {
  const now = new Date();
  const offsetAdjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return offsetAdjusted.toISOString().slice(0, 10);
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function capitalize(value: string) {
  if (value.length === 0) {
    return value;
  }

  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

