import type {
  EventType,
  ManufacturingItem,
  MemberRole,
  PurchaseItem,
  TaskPriority,
  TaskStatus,
} from "../types/domain";
export type ViewTab =
  | "tasks"
  | "worklogs"
  | "manufacturing"
  | "inventory"
  | "subsystems"
  | "roster";

export type TaskViewTab = "timeline" | "queue" | "milestones";
export type ManufacturingViewTab = "cnc" | "prints" | "fabrication";
export type InventoryViewTab = "materials" | "parts" | "purchases";

export type StatusGroup = "success" | "info" | "warning" | "danger" | "neutral";

export type PartLifecycleStatus = "planned" | "needed" | "available" | "installed" | "retired";

export type WorkLogSortMode = "recent" | "oldest" | "longest" | "shortest";

export type NavItem = {
  key: ViewTab;
  label: string;
  shortLabel: string;
  count: number;
};

export type Option = {
  id: string;
  name: string;
};

export type SummaryChipData = {
  label: string;
  value: string;
};

export type MaterialRollup = {
  id: string;
  name: string;
  category: string;
  onHand: number;
  reorderPoint: number;
  openDemand: number;
  vendor: string;
  stock: "low" | "ok";
};

export type EditorMode = "create" | "edit";

export type TaskDraft = {
  title: string;
  summary: string;
  subsystemId: string;
  disciplineId: string;
  ownerId: string;
  mentorId: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  mechanismId: string | null;
  partInstanceId: string | null;
  targetEventId: string | null;
  blockersText: string;
};

export type WorkLogDraft = {
  taskId: string;
  date: string;
  hours: string;
  participantIdsText: string;
  notes: string;
};

export type ManufacturingDraft = {
  title: string;
  subsystemId: string;
  requestedById: string;
  process: ManufacturingItem["process"];
  dueDate: string;
  material: string;
  quantity: string;
  status: ManufacturingItem["status"];
  mentorReviewed: boolean;
  batchLabel: string;
  qaReviewCount: string;
};

export type PurchaseDraft = {
  title: string;
  subsystemId: string;
  requestedById: string;
  quantity: string;
  vendor: string;
  linkLabel: string;
  estimatedCost: string;
  finalCost: string;
  approvedByMentor: boolean;
  status: PurchaseItem["status"];
};

export type MemberDraft = {
  name: string;
  role: MemberRole;
};

export type SubsystemDraft = {
  name: string;
  description: string;
  responsibleEngineerId: string;
  mentorIdsText: string;
  risksText: string;
};

export type PartDefinitionDraft = {
  name: string;
  partNumber: string;
  revision: string;
  type: string;
  source: string;
};

export type MilestoneDraft = {
  title: string;
  type: EventType;
  isExternal: boolean;
  description: string;
  relatedSubsystemIdsText: string;
};

export type MilestoneSortField = "startDateTime" | "title" | "type";

export type EventStyle = {
  label: string;
  borderColor: string;
  chipBackground: string;
  chipText: string;
};


