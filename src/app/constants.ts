import type { EventType, TaskStatus } from "../types/domain";
import type {
  EventStyle,
  InventoryViewTab,
  ManufacturingViewTab,
  Option,
  StatusGroup,
  TaskViewTab,
  WorkLogSortMode,
} from "./types";
export const TASK_VIEW_OPTIONS: { value: TaskViewTab; label: string }[] = [
  { value: "timeline", label: "Timeline" },
  { value: "queue", label: "Queue" },
  { value: "milestones", label: "Milestones" },
];

export const MANUFACTURING_VIEW_OPTIONS: { value: ManufacturingViewTab; label: string }[] = [
  { value: "cnc", label: "CNC" },
  { value: "prints", label: "3D print" },
  { value: "fabrication", label: "Fabrication" },
];

export const INVENTORY_VIEW_OPTIONS: { value: InventoryViewTab; label: string }[] = [
  { value: "materials", label: "Materials" },
  { value: "parts", label: "Parts" },
  { value: "purchases", label: "Purchases" },
];

export const TASK_STATUS_OPTIONS: Option[] = [
  { id: "not-started", name: "Not started" },
  { id: "in-progress", name: "In progress" },
  { id: "waiting-for-qa", name: "Waiting for QA" },
  { id: "complete", name: "Complete" },
];

export const TASK_PRIORITY_OPTIONS: Option[] = [
  { id: "critical", name: "Critical" },
  { id: "high", name: "High" },
  { id: "medium", name: "Medium" },
  { id: "low", name: "Low" },
];

export const MANUFACTURING_STATUS_OPTIONS: Option[] = [
  { id: "requested", name: "Requested" },
  { id: "approved", name: "Approved" },
  { id: "in-progress", name: "In progress" },
  { id: "qa", name: "QA" },
  { id: "complete", name: "Complete" },
];

export const PART_STATUS_OPTIONS: Option[] = [
  { id: "planned", name: "Planned" },
  { id: "needed", name: "Needed" },
  { id: "available", name: "Available" },
  { id: "installed", name: "Installed" },
  { id: "retired", name: "Retired" },
];

export const PURCHASE_STATUS_OPTIONS: Option[] = [
  { id: "requested", name: "Requested" },
  { id: "approved", name: "Approved" },
  { id: "purchased", name: "Purchased" },
  { id: "shipped", name: "Shipped" },
  { id: "delivered", name: "Delivered" },
];

export const PURCHASE_APPROVAL_OPTIONS: Option[] = [
  { id: "approved", name: "Approved" },
  { id: "waiting", name: "Waiting" },
];

export const MATERIAL_CATEGORY_OPTIONS: Option[] = [
  { id: "metal", name: "Metal" },
  { id: "plastic", name: "Plastic" },
  { id: "filament", name: "Filament" },
  { id: "electronics", name: "Electronics" },
  { id: "hardware", name: "Hardware" },
  { id: "consumable", name: "Consumable" },
  { id: "other", name: "Other" },
];

export const WORKLOG_SORT_OPTIONS: { id: WorkLogSortMode; name: string }[] = [
  { id: "recent", name: "Newest first" },
  { id: "oldest", name: "Oldest first" },
  { id: "longest", name: "Longest first" },
  { id: "shortest", name: "Shortest first" },
];

export const EVENT_TYPE_OPTIONS: Option[] = [
  { id: "drive-practice", name: "Drive practice" },
  { id: "competition", name: "Competition" },
  { id: "deadline", name: "Deadline" },
  { id: "internal-review", name: "Internal review" },
  { id: "demo", name: "Demo" },
];

export const EVENT_TYPE_STYLES: Record<EventType, EventStyle> = {
  "drive-practice": {
    label: "Drive practice",
    borderColor: "rgba(22, 71, 142, 0.32)",
    chipBackground: "rgba(22, 71, 142, 0.18)",
    chipText: "#0d2e5c",
  },
  competition: {
    label: "Competition",
    borderColor: "rgba(76, 121, 207, 0.35)",
    chipBackground: "rgba(76, 121, 207, 0.2)",
    chipText: "#1f3f7a",
  },
  deadline: {
    label: "Deadline",
    borderColor: "rgba(234, 28, 45, 0.36)",
    chipBackground: "rgba(234, 28, 45, 0.18)",
    chipText: "#8e1120",
  },
  "internal-review": {
    label: "Internal review",
    borderColor: "rgba(36, 104, 71, 0.34)",
    chipBackground: "rgba(36, 104, 71, 0.18)",
    chipText: "#1d5338",
  },
  demo: {
    label: "Demo",
    borderColor: "rgba(84, 98, 123, 0.35)",
    chipBackground: "rgba(84, 98, 123, 0.22)",
    chipText: "#36475f",
  },
};

export const STATUS_GROUPS: Record<Exclude<StatusGroup, "neutral">, Set<string>> = {
  success: new Set(["complete", "delivered", "available", "installed", "pass"]),
  info: new Set(["in-progress", "shipped", "purchased", "approved"]),
  warning: new Set(["waiting-for-qa", "qa", "requested", "high", "waiting", "needed"]),
  danger: new Set(["not-started", "critical", "retired", "iteration-worthy"]),
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  "waiting-for-qa": "Waiting for QA",
  complete: "Complete",
};

export const SUBVIEW_INTERACTION_GUIDANCE: Record<string, string> = {
  timeline:
    "Use the filters to focus ownership and due dates, then tap any item to inspect linked mechanism and QA status.",
  queue:
    "Use search and quick filters, then scan queue rows for owner, due date, status, and priority in one card.",
  milestones:
    "Use search and filters to review milestones, edit rows to adjust dates/type, and use Add to create new milestones tied to subsystems.",
  worklogs:
    "Search notes and tasks, sort by date or hours, and keep the hours, people, and touched-task metrics visible.",
  cnc:
    "Filter CNC jobs by subsystem, requester, material, and status to keep machine utilization visible.",
  prints:
    "Filter print jobs by subsystem and status, and review mentor/QA readiness before marking complete.",
  fabrication:
    "Track freeform fabrication requests in the same queue format used for CNC and print work.",
  materials:
    "Use material rollups to identify low stock and upcoming demand from the fabrication queue.",
  parts:
    "Review reusable definitions first, then inspect subsystem instances and lifecycle state below.",
  purchases:
    "Filter by status, vendor, requester, and mentor approval to keep buying decisions transparent.",
  subsystems:
    "Tap a subsystem card to expand mechanism coverage and compare open work against ownership.",
  roster:
    "Select people from each role section to keep ownership and mentor assignment easy to read.",
};

