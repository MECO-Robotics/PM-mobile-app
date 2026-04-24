import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { mecoSnapshot } from "./src/data/mockData";
import type {
  MemberRole,
  ManufacturingItem,
  PurchaseItem,
  PartInstance,
  Subsystem,
  Task,
  TaskPriority,
  TaskStatus,
  WorkLog,
} from "./src/types/domain";
import { colors, radii, shadows, spacing } from "./src/theme";

type ViewTab =
  | "tasks"
  | "worklogs"
  | "manufacturing"
  | "inventory"
  | "subsystems"
  | "roster";

type TaskViewTab = "timeline" | "queue";
type ManufacturingViewTab = "cnc" | "prints" | "fabrication";
type InventoryViewTab = "materials" | "parts" | "purchases";

type StatusGroup = "success" | "info" | "warning" | "danger" | "neutral";

type PartLifecycleStatus = "planned" | "needed" | "available" | "installed" | "retired";

type WorkLogSortMode = "recent" | "oldest" | "longest" | "shortest";

type NavItem = {
  key: ViewTab;
  label: string;
  shortLabel: string;
  count: number;
};

type Option = {
  id: string;
  name: string;
};

type SummaryChipData = {
  label: string;
  value: string;
};

type MaterialRollup = {
  id: string;
  name: string;
  category: string;
  onHand: number;
  reorderPoint: number;
  openDemand: number;
  vendor: string;
  stock: "low" | "ok";
};

type EditorMode = "create" | "edit";

type TaskDraft = {
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

type WorkLogDraft = {
  taskId: string;
  date: string;
  hours: string;
  participantIdsText: string;
  notes: string;
};

type ManufacturingDraft = {
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

type PurchaseDraft = {
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

type MemberDraft = {
  name: string;
  role: MemberRole;
};

type SubsystemDraft = {
  name: string;
  description: string;
  responsibleEngineerId: string;
  mentorIdsText: string;
  risksText: string;
};

type PartDefinitionDraft = {
  name: string;
  partNumber: string;
  revision: string;
  type: string;
  source: string;
};

const TASK_VIEW_OPTIONS: { value: TaskViewTab; label: string }[] = [
  { value: "timeline", label: "Timeline" },
  { value: "queue", label: "Queue" },
];

const MANUFACTURING_VIEW_OPTIONS: { value: ManufacturingViewTab; label: string }[] = [
  { value: "cnc", label: "CNC" },
  { value: "prints", label: "3D print" },
  { value: "fabrication", label: "Fabrication" },
];

const INVENTORY_VIEW_OPTIONS: { value: InventoryViewTab; label: string }[] = [
  { value: "materials", label: "Materials" },
  { value: "parts", label: "Parts" },
  { value: "purchases", label: "Purchases" },
];

const TASK_STATUS_OPTIONS: Option[] = [
  { id: "not-started", name: "Not started" },
  { id: "in-progress", name: "In progress" },
  { id: "waiting-for-qa", name: "Waiting for QA" },
  { id: "complete", name: "Complete" },
];

const TASK_PRIORITY_OPTIONS: Option[] = [
  { id: "critical", name: "Critical" },
  { id: "high", name: "High" },
  { id: "medium", name: "Medium" },
  { id: "low", name: "Low" },
];

const MANUFACTURING_STATUS_OPTIONS: Option[] = [
  { id: "requested", name: "Requested" },
  { id: "approved", name: "Approved" },
  { id: "in-progress", name: "In progress" },
  { id: "qa", name: "QA" },
  { id: "complete", name: "Complete" },
];

const PART_STATUS_OPTIONS: Option[] = [
  { id: "planned", name: "Planned" },
  { id: "needed", name: "Needed" },
  { id: "available", name: "Available" },
  { id: "installed", name: "Installed" },
  { id: "retired", name: "Retired" },
];

const PURCHASE_STATUS_OPTIONS: Option[] = [
  { id: "requested", name: "Requested" },
  { id: "approved", name: "Approved" },
  { id: "purchased", name: "Purchased" },
  { id: "shipped", name: "Shipped" },
  { id: "delivered", name: "Delivered" },
];

const PURCHASE_APPROVAL_OPTIONS: Option[] = [
  { id: "approved", name: "Approved" },
  { id: "waiting", name: "Waiting" },
];

const MATERIAL_CATEGORY_OPTIONS: Option[] = [
  { id: "metal", name: "Metal" },
  { id: "plastic", name: "Plastic" },
  { id: "filament", name: "Filament" },
  { id: "electronics", name: "Electronics" },
  { id: "hardware", name: "Hardware" },
  { id: "consumable", name: "Consumable" },
  { id: "other", name: "Other" },
];

const WORKLOG_SORT_OPTIONS: { id: WorkLogSortMode; name: string }[] = [
  { id: "recent", name: "Newest first" },
  { id: "oldest", name: "Oldest first" },
  { id: "longest", name: "Longest first" },
  { id: "shortest", name: "Shortest first" },
];

const STATUS_GROUPS: Record<Exclude<StatusGroup, "neutral">, Set<string>> = {
  success: new Set(["complete", "delivered", "available", "installed", "pass"]),
  info: new Set(["in-progress", "shipped", "purchased", "approved"]),
  warning: new Set(["waiting-for-qa", "qa", "requested", "high", "waiting", "needed"]),
  danger: new Set(["not-started", "critical", "retired", "iteration-worthy"]),
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  "waiting-for-qa": "Waiting for QA",
  complete: "Complete",
};

const SUBVIEW_INTERACTION_GUIDANCE: Record<string, string> = {
  timeline:
    "Use the filters to focus ownership and due dates, then tap any item to inspect linked mechanism and QA status.",
  queue:
    "Use search and quick filters, then scan queue rows for owner, due date, status, and priority in one card.",
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

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>("tasks");
  const [taskView, setTaskView] = useState<TaskViewTab>("queue");
  const [manufacturingView, setManufacturingView] =
    useState<ManufacturingViewTab>("cnc");
  const [inventoryView, setInventoryView] = useState<InventoryViewTab>("purchases");
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [activePersonFilter, setActivePersonFilter] = useState("all");

  const [members, setMembers] = useState(() => mecoSnapshot.members);
  const [subsystems, setSubsystems] = useState(() => mecoSnapshot.subsystems);
  const [tasks, setTasks] = useState(() => mecoSnapshot.tasks);
  const [workLogs, setWorkLogs] = useState(() => mecoSnapshot.workLogs);
  const [manufacturingItems, setManufacturingItems] = useState(
    () => mecoSnapshot.manufacturingItems,
  );
  const [purchaseItems, setPurchaseItems] = useState(() => mecoSnapshot.purchaseItems);
  const [partDefinitions, setPartDefinitions] = useState(
    () => mecoSnapshot.partDefinitions,
  );
  const [partInstances, setPartInstances] = useState(() => mecoSnapshot.partInstances);

  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskSubsystemFilter, setTaskSubsystemFilter] = useState("all");
  const [taskOwnerFilter, setTaskOwnerFilter] = useState("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all");

  const [workLogSearch, setWorkLogSearch] = useState("");
  const [workLogSubsystemFilter, setWorkLogSubsystemFilter] = useState("all");
  const [workLogSortMode, setWorkLogSortMode] =
    useState<WorkLogSortMode>("recent");

  const [manufacturingSearch, setManufacturingSearch] = useState("");
  const [manufacturingSubsystemFilter, setManufacturingSubsystemFilter] =
    useState("all");
  const [manufacturingRequesterFilter, setManufacturingRequesterFilter] =
    useState("all");
  const [manufacturingStatusFilter, setManufacturingStatusFilter] =
    useState("all");
  const [manufacturingMaterialFilter, setManufacturingMaterialFilter] =
    useState("all");

  const [materialsSearch, setMaterialsSearch] = useState("");
  const [materialsCategoryFilter, setMaterialsCategoryFilter] = useState("all");
  const [materialsStockFilter, setMaterialsStockFilter] = useState("all");

  const [partsSearch, setPartsSearch] = useState("");
  const [partsSubsystemFilter, setPartsSubsystemFilter] = useState("all");
  const [partsStatusFilter, setPartsStatusFilter] = useState("all");

  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchaseSubsystemFilter, setPurchaseSubsystemFilter] = useState("all");
  const [purchaseRequesterFilter, setPurchaseRequesterFilter] = useState("all");
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState("all");
  const [purchaseVendorFilter, setPurchaseVendorFilter] = useState("all");
  const [purchaseApprovalFilter, setPurchaseApprovalFilter] = useState("all");

  const [subsystemSearch, setSubsystemSearch] = useState("");
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string>(
    subsystems[0]?.id ?? "",
  );

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const [taskEditorMode, setTaskEditorMode] = useState<EditorMode | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(buildTaskDraft());

  const [workLogEditorMode, setWorkLogEditorMode] = useState<EditorMode | null>(null);
  const [activeWorkLogId, setActiveWorkLogId] = useState<string | null>(null);
  const [workLogDraft, setWorkLogDraft] = useState<WorkLogDraft>(
    buildWorkLogDraft(),
  );

  const [manufacturingEditorMode, setManufacturingEditorMode] = useState<EditorMode | null>(
    null,
  );
  const [activeManufacturingId, setActiveManufacturingId] = useState<string | null>(null);
  const [manufacturingDraft, setManufacturingDraft] = useState<ManufacturingDraft>(
    buildManufacturingDraft("cnc"),
  );

  const [purchaseEditorMode, setPurchaseEditorMode] = useState<EditorMode | null>(null);
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseDraft>(buildPurchaseDraft());

  const [memberEditorMode, setMemberEditorMode] = useState<EditorMode | null>(null);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(buildMemberDraft());

  const [subsystemEditorMode, setSubsystemEditorMode] = useState<EditorMode | null>(null);
  const [activeSubsystemId, setActiveSubsystemId] = useState<string | null>(null);
  const [subsystemDraft, setSubsystemDraft] = useState<SubsystemDraft>(
    buildSubsystemDraft(),
  );

  const [partDefinitionEditorMode, setPartDefinitionEditorMode] = useState<EditorMode | null>(
    null,
  );
  const [activePartDefinitionId, setActivePartDefinitionId] = useState<string | null>(null);
  const [partDefinitionDraft, setPartDefinitionDraft] = useState<PartDefinitionDraft>(
    buildPartDefinitionDraft(),
  );

  const membersById = useMemo(() => {
    return Object.fromEntries(
      members.map((member) => [member.id, member]),
    ) as Record<string, (typeof members)[number]>;
  }, [members]);

  const subsystemsById = useMemo(() => {
    return Object.fromEntries(
      subsystems.map((subsystem) => [subsystem.id, subsystem]),
    ) as Record<string, (typeof subsystems)[number]>;
  }, [subsystems]);

  const disciplinesById = useMemo(() => {
    return Object.fromEntries(
      mecoSnapshot.disciplines.map((discipline) => [discipline.id, discipline]),
    ) as Record<string, (typeof mecoSnapshot.disciplines)[number]>;
  }, []);

  const mechanismsById = useMemo(() => {
    return Object.fromEntries(
      mecoSnapshot.mechanisms.map((mechanism) => [mechanism.id, mechanism]),
    ) as Record<string, (typeof mecoSnapshot.mechanisms)[number]>;
  }, []);

  const partDefinitionsById = useMemo(() => {
    return Object.fromEntries(
      partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition]),
    ) as Record<string, (typeof partDefinitions)[number]>;
  }, [partDefinitions]);

  const partInstancesById = useMemo(() => {
    return Object.fromEntries(
      partInstances.map((partInstance) => [partInstance.id, partInstance]),
    ) as Record<string, (typeof partInstances)[number]>;
  }, [partInstances]);

  const eventsById = useMemo(() => {
    return Object.fromEntries(
      mecoSnapshot.events.map((event) => [event.id, event]),
    ) as Record<string, (typeof mecoSnapshot.events)[number]>;
  }, []);

  const taskById = useMemo(() => {
    return Object.fromEntries(
      tasks.map((task) => [task.id, task]),
    ) as Record<string, Task>;
  }, [tasks]);

  const navigationItems = useMemo<NavItem[]>(() => {
    const openManufacturing = manufacturingItems.filter(
      (item) => item.status !== "complete",
    ).length;

    return [
      {
        key: "tasks",
        label: "Tasks",
        shortLabel: "TS",
        count: tasks.length,
      },
      {
        key: "worklogs",
        label: "Worklogs",
        shortLabel: "WL",
        count: workLogs.length,
      },
      {
        key: "manufacturing",
        label: "Manufacturing",
        shortLabel: "MF",
        count: openManufacturing,
      },
      {
        key: "inventory",
        label: "Inventory",
        shortLabel: "IN",
        count: partDefinitions.length + purchaseItems.length,
      },
      {
        key: "subsystems",
        label: "Subsystems",
        shortLabel: "SS",
        count: subsystems.length,
      },
      {
        key: "roster",
        label: "Roster",
        shortLabel: "RO",
        count: members.length,
      },
    ];
  }, [tasks, workLogs, manufacturingItems, partDefinitions, purchaseItems, subsystems, members]);

  const taskSummary = useMemo(() => {
    const blocked = tasks.filter((task) => task.blockers.length > 0).length;
    const waiting = tasks.filter(
      (task) => task.status === "waiting-for-qa",
    ).length;
    const complete = tasks.filter(
      (task) => task.status === "complete",
    ).length;

    return [
      { label: "Total tasks", value: String(tasks.length) },
      { label: "Blocked", value: String(blocked) },
      { label: "Waiting QA", value: String(waiting) },
      { label: "Complete", value: String(complete) },
    ] satisfies SummaryChipData[];
  }, [tasks]);

  const filteredTaskQueue = useMemo(() => {
    const search = taskSearch.trim().toLowerCase();

    return [...tasks]
      .filter((task) => {
        if (
          activePersonFilter !== "all" &&
          task.ownerId !== activePersonFilter &&
          task.mentorId !== activePersonFilter
        ) {
          return false;
        }

        if (taskStatusFilter !== "all" && task.status !== taskStatusFilter) {
          return false;
        }

        if (taskSubsystemFilter !== "all" && task.subsystemId !== taskSubsystemFilter) {
          return false;
        }

        if (taskOwnerFilter !== "all" && task.ownerId !== taskOwnerFilter) {
          return false;
        }

        if (taskPriorityFilter !== "all" && task.priority !== taskPriorityFilter) {
          return false;
        }

        if (!search) {
          return true;
        }

        const subsystemName = subsystemsById[task.subsystemId]?.name ?? "";
        const ownerName = membersById[task.ownerId]?.name ?? "";
        const mechanismName = task.mechanismId ? (mechanismsById[task.mechanismId]?.name ?? "") : "";

        return `${task.title} ${task.summary} ${subsystemName} ${ownerName} ${mechanismName}`
          .toLowerCase()
          .includes(search);
      })
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  }, [
    tasks,
    activePersonFilter,
    membersById,
    mechanismsById,
    subsystemsById,
    taskOwnerFilter,
    taskPriorityFilter,
    taskSearch,
    taskStatusFilter,
    taskSubsystemFilter,
  ]);

  const timelineTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => {
        if (activePersonFilter === "all") {
          return true;
        }

        return task.ownerId === activePersonFilter || task.mentorId === activePersonFilter;
      })
      .sort((left, right) =>
      left.dueDate.localeCompare(right.dueDate),
    );
  }, [tasks, activePersonFilter]);

  const filteredWorkLogs = useMemo(() => {
    const search = workLogSearch.trim().toLowerCase();

    const filtered = workLogs.filter((workLog) => {
      const task = taskById[workLog.taskId];

      if (
        activePersonFilter !== "all" &&
        !workLog.participantIds.includes(activePersonFilter)
      ) {
        return false;
      }

      if (workLogSubsystemFilter !== "all" && task?.subsystemId !== workLogSubsystemFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      const participantNames = workLog.participantIds
        .map((participantId) => membersById[participantId]?.name ?? "")
        .join(" ");
      const taskText = `${task?.title ?? ""} ${task?.summary ?? ""}`;
      const subsystemText = task ? (subsystemsById[task.subsystemId]?.name ?? "") : "";

      return `${workLog.notes} ${taskText} ${participantNames} ${subsystemText}`
        .toLowerCase()
        .includes(search);
    });

    return filtered.sort((left, right) => {
      if (workLogSortMode === "oldest") {
        return left.date.localeCompare(right.date);
      }

      if (workLogSortMode === "longest") {
        return right.hours - left.hours || right.date.localeCompare(left.date);
      }

      if (workLogSortMode === "shortest") {
        return left.hours - right.hours || right.date.localeCompare(left.date);
      }

      return right.date.localeCompare(left.date);
    });
  }, [
    activePersonFilter,
    membersById,
    subsystemsById,
    taskById,
    workLogs,
    workLogSearch,
    workLogSortMode,
    workLogSubsystemFilter,
  ]);

  const workLogSummary = useMemo(() => {
    const participantIds = new Set<string>();
    const taskIds = new Set<string>();
    const totalHours = filteredWorkLogs.reduce((sum, workLog) => {
      taskIds.add(workLog.taskId);
      workLog.participantIds.forEach((participantId) => participantIds.add(participantId));
      return sum + workLog.hours;
    }, 0);

    return [
      { label: "Entries", value: String(filteredWorkLogs.length) },
      { label: "Tracked hours", value: `${totalHours.toFixed(1)}h` },
      { label: "People", value: String(participantIds.size) },
      { label: "Tasks", value: String(taskIds.size) },
    ] satisfies SummaryChipData[];
  }, [filteredWorkLogs]);

  const visibleManufacturingProcess: ManufacturingItem["process"] =
    manufacturingView === "cnc"
      ? "cnc"
      : manufacturingView === "prints"
        ? "3d-print"
        : "fabrication";

  const manufacturingMaterialOptions = useMemo(() => {
    const uniqueMaterials = Array.from(
      new Set(manufacturingItems.map((item) => item.material)),
    ).sort((left, right) => left.localeCompare(right));

    return uniqueMaterials.map((material) => ({ id: material, name: material }));
  }, [manufacturingItems]);

  const filteredManufacturing = useMemo(() => {
    const search = manufacturingSearch.trim().toLowerCase();

    return manufacturingItems
      .filter((item) => item.process === visibleManufacturingProcess)
      .filter((item) => {
        if (activePersonFilter !== "all" && item.requestedById !== activePersonFilter) {
          return false;
        }

        if (
          manufacturingSubsystemFilter !== "all" &&
          item.subsystemId !== manufacturingSubsystemFilter
        ) {
          return false;
        }

        if (
          manufacturingRequesterFilter !== "all" &&
          item.requestedById !== manufacturingRequesterFilter
        ) {
          return false;
        }

        if (manufacturingStatusFilter !== "all" && item.status !== manufacturingStatusFilter) {
          return false;
        }

        if (manufacturingMaterialFilter !== "all" && item.material !== manufacturingMaterialFilter) {
          return false;
        }

        if (!search) {
          return true;
        }

        const subsystemName = subsystemsById[item.subsystemId]?.name ?? "";
        const requesterName = membersById[item.requestedById]?.name ?? "";

        return `${item.title} ${item.material} ${subsystemName} ${requesterName}`
          .toLowerCase()
          .includes(search);
      })
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  }, [
    activePersonFilter,
    manufacturingItems,
    manufacturingMaterialFilter,
    manufacturingRequesterFilter,
    manufacturingSearch,
    manufacturingStatusFilter,
    manufacturingSubsystemFilter,
    membersById,
    subsystemsById,
    visibleManufacturingProcess,
  ]);

  const manufacturingSummary = useMemo(() => {
    const completeCount = filteredManufacturing.filter(
      (item) => item.status === "complete",
    ).length;
    const qaCount = filteredManufacturing.filter((item) => item.status === "qa").length;
    const reviewedCount = filteredManufacturing.filter(
      (item) => item.mentorReviewed,
    ).length;

    return [
      { label: "Queue", value: String(filteredManufacturing.length) },
      { label: "In QA", value: String(qaCount) },
      { label: "Mentor reviewed", value: String(reviewedCount) },
      { label: "Complete", value: String(completeCount) },
    ] satisfies SummaryChipData[];
  }, [filteredManufacturing]);

  const purchaseVendorOptions = useMemo(() => {
    const vendors = Array.from(
      new Set(purchaseItems.map((item) => item.vendor)),
    ).sort((left, right) => left.localeCompare(right));

    return vendors.map((vendor) => ({ id: vendor, name: vendor }));
  }, [purchaseItems]);

  const materialRollups = useMemo(() => {
    const rows: MaterialRollup[] = [];

    for (const materialName of manufacturingMaterialOptions.map((option) => option.id)) {
      const relatedManufacturing = manufacturingItems.filter(
        (item) => item.material === materialName,
      );
      const relatedPurchases = purchaseItems.filter((item) => {
        const text = `${item.title} ${item.vendor} ${item.linkLabel}`.toLowerCase();
        return materialName
          .toLowerCase()
          .split(" ")
          .some((token) => token.length > 3 && text.includes(token));
      });

      const openDemand = relatedManufacturing
        .filter((item) => item.status !== "complete")
        .reduce((sum, item) => sum + item.quantity, 0);
      const supplied = relatedPurchases
        .filter((item) => item.status === "delivered" || item.status === "purchased")
        .reduce((sum, item) => sum + item.quantity, 0);
      const reorderPoint = Math.max(1, Math.ceil(openDemand * 0.6));
      const onHand = Math.max(0, supplied - Math.ceil(openDemand * 0.35));
      const category = inferMaterialCategory(materialName);
      const vendor = relatedPurchases[0]?.vendor ?? "Mixed";

      rows.push({
        id: materialName.toLowerCase().replace(/\s+/g, "-"),
        name: materialName,
        category,
        onHand,
        reorderPoint,
        openDemand,
        vendor,
        stock: onHand <= reorderPoint ? "low" : "ok",
      });
    }

    return rows.sort((left, right) => left.name.localeCompare(right.name));
  }, [manufacturingMaterialOptions, manufacturingItems, purchaseItems]);

  const filteredMaterialRollups = useMemo(() => {
    const search = materialsSearch.trim().toLowerCase();

    return materialRollups.filter((row) => {
      if (materialsCategoryFilter !== "all" && row.category !== materialsCategoryFilter) {
        return false;
      }

      if (materialsStockFilter !== "all" && row.stock !== materialsStockFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      return `${row.name} ${row.vendor} ${row.category}`.toLowerCase().includes(search);
    });
  }, [materialRollups, materialsCategoryFilter, materialsSearch, materialsStockFilter]);

  const partInstancesWithStatus = useMemo(() => {
    return partInstances.map((partInstance) => ({
      partInstance,
      status: derivePartLifecycleStatus(partInstance, tasks),
    }));
  }, [partInstances, tasks]);

  const filteredPartDefinitions = useMemo(() => {
    const search = partsSearch.trim().toLowerCase();

    return partDefinitions.filter((partDefinition) => {
      if (!search) {
        return true;
      }

      return `${partDefinition.name} ${partDefinition.partNumber} ${partDefinition.type} ${partDefinition.source}`
        .toLowerCase()
        .includes(search);
    });
  }, [partsSearch, partDefinitions]);

  const filteredPartInstances = useMemo(() => {
    const search = partsSearch.trim().toLowerCase();

    return partInstancesWithStatus.filter(({ partInstance, status }) => {
      if (partsSubsystemFilter !== "all" && partInstance.subsystemId !== partsSubsystemFilter) {
        return false;
      }

      if (partsStatusFilter !== "all" && status !== partsStatusFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      const definition = partDefinitionsById[partInstance.partDefinitionId];
      const mechanismName = partInstance.mechanismId
        ? (mechanismsById[partInstance.mechanismId]?.name ?? "")
        : "";

      return `${partInstance.name} ${definition?.name ?? ""} ${definition?.partNumber ?? ""} ${mechanismName}`
        .toLowerCase()
        .includes(search);
    });
  }, [
    mechanismsById,
    partDefinitionsById,
    partInstancesWithStatus,
    partsSearch,
    partsStatusFilter,
    partsSubsystemFilter,
  ]);

  const filteredPurchases = useMemo(() => {
    const search = purchaseSearch.trim().toLowerCase();

    return purchaseItems.filter((item) => {
      if (activePersonFilter !== "all" && item.requestedById !== activePersonFilter) {
        return false;
      }

      if (purchaseSubsystemFilter !== "all" && item.subsystemId !== purchaseSubsystemFilter) {
        return false;
      }

      if (purchaseRequesterFilter !== "all" && item.requestedById !== purchaseRequesterFilter) {
        return false;
      }

      if (purchaseStatusFilter !== "all" && item.status !== purchaseStatusFilter) {
        return false;
      }

      if (purchaseVendorFilter !== "all" && item.vendor !== purchaseVendorFilter) {
        return false;
      }

      if (
        purchaseApprovalFilter !== "all" &&
        (purchaseApprovalFilter === "approved"
          ? !item.approvedByMentor
          : item.approvedByMentor)
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const requesterName = membersById[item.requestedById]?.name ?? "";
      const subsystemName = subsystemsById[item.subsystemId]?.name ?? "";

      return `${item.title} ${item.vendor} ${requesterName} ${subsystemName}`
        .toLowerCase()
        .includes(search);
    });
  }, [
    activePersonFilter,
    membersById,
    purchaseItems,
    purchaseApprovalFilter,
    purchaseRequesterFilter,
    purchaseSearch,
    purchaseStatusFilter,
    purchaseSubsystemFilter,
    purchaseVendorFilter,
    subsystemsById,
  ]);

  const subsystemCountsById = useMemo(() => {
    const counts = Object.fromEntries(
      subsystems.map((subsystem) => [
        subsystem.id,
        { mechanisms: 0, tasks: 0, openTasks: 0, risks: subsystem.risks.length },
      ]),
    ) as Record<string, { mechanisms: number; tasks: number; openTasks: number; risks: number }>;

    for (const mechanism of mecoSnapshot.mechanisms) {
      counts[mechanism.subsystemId].mechanisms += 1;
    }

    for (const task of tasks) {
      counts[task.subsystemId].tasks += 1;
      if (task.status !== "complete") {
        counts[task.subsystemId].openTasks += 1;
      }
    }

    return counts;
  }, [subsystems, tasks]);

  const filteredSubsystems = useMemo(() => {
    const search = subsystemSearch.trim().toLowerCase();

    return subsystems.filter((subsystem) => {
      if (!search) {
        return true;
      }

      const leadName = membersById[subsystem.responsibleEngineerId]?.name ?? "";
      const mentorNames = subsystem.mentorIds
        .map((mentorId) => membersById[mentorId]?.name ?? "")
        .join(" ");
      const mechanismNames = mecoSnapshot.mechanisms
        .filter((mechanism) => mechanism.subsystemId === subsystem.id)
        .map((mechanism) => mechanism.name)
        .join(" ");

      return `${subsystem.name} ${subsystem.description} ${leadName} ${mentorNames} ${mechanismNames} ${subsystem.risks.join(" ")}`
        .toLowerCase()
        .includes(search);
    });
  }, [membersById, subsystemSearch, subsystems]);

  const selectedSubsystem =
    filteredSubsystems.find((subsystem) => subsystem.id === selectedSubsystemId) ?? null;

  const rosterStudents = members.filter((member) => member.role === "student");
  const rosterMentors = members.filter((member) => member.role === "mentor");
  const rosterAdmins = members.filter((member) => member.role === "admin");

  const activeTabLabel = navigationItems.find((item) => item.key === activeTab)?.label ?? "Tasks";

  useEffect(() => {
    if (activePersonFilter === "all") {
      return;
    }

    if (!members.some((member) => member.id === activePersonFilter)) {
      setActivePersonFilter("all");
    }
  }, [activePersonFilter, members]);

  useEffect(() => {
    if (selectedMemberId && !members.some((member) => member.id === selectedMemberId)) {
      setSelectedMemberId(null);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    if (selectedSubsystemId && !subsystems.some((subsystem) => subsystem.id === selectedSubsystemId)) {
      setSelectedSubsystemId(subsystems[0]?.id ?? "");
    }
  }, [selectedSubsystemId, subsystems]);

  const openCreateTaskEditor = () => {
    setActiveTaskId(null);
    setTaskDraft(
      buildTaskDraft({
        subsystemId: subsystems[0]?.id ?? "",
        disciplineId: mecoSnapshot.disciplines[0]?.id ?? "",
        ownerId: members[0]?.id ?? "",
        mentorId: members.find((member) => member.role === "mentor")?.id ?? members[0]?.id ?? "",
        dueDate: isoToday(),
      }),
    );
    setTaskEditorMode("create");
  };

  const openEditTaskEditor = (task: Task) => {
    setActiveTaskId(task.id);
    setTaskDraft(buildTaskDraft(task));
    setTaskEditorMode("edit");
  };

  const closeTaskEditor = () => {
    setTaskEditorMode(null);
    setActiveTaskId(null);
  };

  const saveTaskDraft = () => {
    const blockers = splitList(taskDraft.blockersText);
    const title = taskDraft.title.trim();
    const summary = taskDraft.summary.trim();

    if (!title || !summary || !taskDraft.subsystemId || !taskDraft.ownerId || !taskDraft.mentorId) {
      return;
    }

    const payload: Task = {
      id: activeTaskId ?? buildId("task", title),
      title,
      summary,
      subsystemId: taskDraft.subsystemId,
      disciplineId:
        taskDraft.disciplineId || mecoSnapshot.disciplines[0]?.id || "mechanical",
      requirementId: null,
      mechanismId: taskDraft.mechanismId,
      partInstanceId: taskDraft.partInstanceId,
      targetEventId: taskDraft.targetEventId,
      ownerId: taskDraft.ownerId,
      mentorId: taskDraft.mentorId,
      dueDate: taskDraft.dueDate || isoToday(),
      priority: taskDraft.priority,
      status: taskDraft.status,
      dependencyIds: [],
      blockers,
      linkedManufacturingIds: [],
      linkedPurchaseIds: [],
      estimatedHours: 0,
      actualHours: 0,
    };

    setTasks((current) => {
      if (taskEditorMode === "edit" && activeTaskId) {
        return current.map((task) => (task.id === activeTaskId ? payload : task));
      }

      return [payload, ...current];
    });
    closeTaskEditor();
  };

  const deleteTaskDraft = () => {
    if (!activeTaskId) {
      return;
    }

    setTasks((current) => current.filter((task) => task.id !== activeTaskId));
    closeTaskEditor();
  };

  const openCreateWorkLogEditor = () => {
    setActiveWorkLogId(null);
    setWorkLogDraft(
      buildWorkLogDraft({
        taskId: tasks[0]?.id ?? "",
        date: isoToday(),
        participantIds: members[0]?.id ? [members[0].id] : [],
      }),
    );
    setWorkLogEditorMode("create");
  };

  const openEditWorkLogEditor = (workLog: WorkLog) => {
    setActiveWorkLogId(workLog.id);
    setWorkLogDraft(buildWorkLogDraft(workLog));
    setWorkLogEditorMode("edit");
  };

  const closeWorkLogEditor = () => {
    setWorkLogEditorMode(null);
    setActiveWorkLogId(null);
  };

  const saveWorkLogDraft = () => {
    const participants = splitList(workLogDraft.participantIdsText).filter((participantId) =>
      members.some((member) => member.id === participantId),
    );
    const parsedHours = Number(workLogDraft.hours);

    if (!workLogDraft.taskId || Number.isNaN(parsedHours) || parsedHours <= 0 || participants.length === 0) {
      return;
    }

    const payload: WorkLog = {
      id: activeWorkLogId ?? buildId("log", workLogDraft.taskId),
      taskId: workLogDraft.taskId,
      date: workLogDraft.date || isoToday(),
      hours: parsedHours,
      participantIds: participants,
      notes: workLogDraft.notes.trim(),
    };

    setWorkLogs((current) => {
      if (workLogEditorMode === "edit" && activeWorkLogId) {
        return current.map((workLog) => (workLog.id === activeWorkLogId ? payload : workLog));
      }

      return [payload, ...current];
    });
    closeWorkLogEditor();
  };

  const deleteWorkLogDraft = () => {
    if (!activeWorkLogId) {
      return;
    }

    setWorkLogs((current) => current.filter((workLog) => workLog.id !== activeWorkLogId));
    closeWorkLogEditor();
  };

  const openCreateManufacturingEditor = () => {
    const process =
      manufacturingView === "cnc"
        ? "cnc"
        : manufacturingView === "prints"
          ? "3d-print"
          : "fabrication";

    setActiveManufacturingId(null);
    setManufacturingDraft(
      buildManufacturingDraft(process, {
        subsystemId: subsystems[0]?.id ?? "",
        requestedById: members[0]?.id ?? "",
        dueDate: isoToday(),
      }),
    );
    setManufacturingEditorMode("create");
  };

  const openEditManufacturingEditor = (item: ManufacturingItem) => {
    setActiveManufacturingId(item.id);
    setManufacturingDraft(buildManufacturingDraft(item.process, item));
    setManufacturingEditorMode("edit");
  };

  const closeManufacturingEditor = () => {
    setManufacturingEditorMode(null);
    setActiveManufacturingId(null);
  };

  const saveManufacturingDraft = () => {
    const parsedQty = Number(manufacturingDraft.quantity);
    const parsedQa = Number(manufacturingDraft.qaReviewCount);

    if (
      !manufacturingDraft.title.trim() ||
      !manufacturingDraft.subsystemId ||
      !manufacturingDraft.requestedById ||
      Number.isNaN(parsedQty) ||
      parsedQty <= 0
    ) {
      return;
    }

    const payload: ManufacturingItem = {
      id: activeManufacturingId ?? buildId("mf", manufacturingDraft.title),
      title: manufacturingDraft.title.trim(),
      subsystemId: manufacturingDraft.subsystemId,
      requestedById: manufacturingDraft.requestedById,
      process: manufacturingDraft.process,
      dueDate: manufacturingDraft.dueDate || isoToday(),
      material: manufacturingDraft.material.trim() || "Unknown material",
      quantity: parsedQty,
      status: manufacturingDraft.status,
      mentorReviewed: manufacturingDraft.mentorReviewed,
      batchLabel: manufacturingDraft.batchLabel.trim() || undefined,
      qaReviewCount: Number.isNaN(parsedQa) ? 0 : Math.max(0, parsedQa),
    };

    setManufacturingItems((current) => {
      if (manufacturingEditorMode === "edit" && activeManufacturingId) {
        return current.map((item) => (item.id === activeManufacturingId ? payload : item));
      }

      return [payload, ...current];
    });
    closeManufacturingEditor();
  };

  const deleteManufacturingDraft = () => {
    if (!activeManufacturingId) {
      return;
    }

    setManufacturingItems((current) => current.filter((item) => item.id !== activeManufacturingId));
    closeManufacturingEditor();
  };

  const openCreatePurchaseEditor = () => {
    setActivePurchaseId(null);
    setPurchaseDraft(
      buildPurchaseDraft({
        subsystemId: subsystems[0]?.id ?? "",
        requestedById: members[0]?.id ?? "",
      }),
    );
    setPurchaseEditorMode("create");
  };

  const openEditPurchaseEditor = (item: PurchaseItem) => {
    setActivePurchaseId(item.id);
    setPurchaseDraft(buildPurchaseDraft(item));
    setPurchaseEditorMode("edit");
  };

  const closePurchaseEditor = () => {
    setPurchaseEditorMode(null);
    setActivePurchaseId(null);
  };

  const savePurchaseDraft = () => {
    const parsedQty = Number(purchaseDraft.quantity);
    const parsedEstimate = Number(purchaseDraft.estimatedCost);
    const parsedFinal = purchaseDraft.finalCost.trim() ? Number(purchaseDraft.finalCost) : undefined;

    if (
      !purchaseDraft.title.trim() ||
      !purchaseDraft.subsystemId ||
      !purchaseDraft.requestedById ||
      Number.isNaN(parsedQty) ||
      parsedQty <= 0 ||
      Number.isNaN(parsedEstimate)
    ) {
      return;
    }

    const payload: PurchaseItem = {
      id: activePurchaseId ?? buildId("buy", purchaseDraft.title),
      title: purchaseDraft.title.trim(),
      subsystemId: purchaseDraft.subsystemId,
      requestedById: purchaseDraft.requestedById,
      quantity: parsedQty,
      vendor: purchaseDraft.vendor.trim() || "Unknown vendor",
      linkLabel: purchaseDraft.linkLabel.trim() || "n/a",
      estimatedCost: parsedEstimate,
      finalCost:
        typeof parsedFinal === "number" && !Number.isNaN(parsedFinal) ? parsedFinal : undefined,
      approvedByMentor: purchaseDraft.approvedByMentor,
      status: purchaseDraft.status,
    };

    setPurchaseItems((current) => {
      if (purchaseEditorMode === "edit" && activePurchaseId) {
        return current.map((item) => (item.id === activePurchaseId ? payload : item));
      }

      return [payload, ...current];
    });
    closePurchaseEditor();
  };

  const deletePurchaseDraft = () => {
    if (!activePurchaseId) {
      return;
    }

    setPurchaseItems((current) => current.filter((item) => item.id !== activePurchaseId));
    closePurchaseEditor();
  };

  const openCreateMemberEditor = () => {
    setActiveMemberId(null);
    setMemberDraft(buildMemberDraft());
    setMemberEditorMode("create");
  };

  const openEditMemberEditor = (memberId: string) => {
    const member = members.find((candidate) => candidate.id === memberId);
    if (!member) {
      return;
    }

    setActiveMemberId(member.id);
    setMemberDraft(buildMemberDraft(member));
    setMemberEditorMode("edit");
  };

  const closeMemberEditor = () => {
    setMemberEditorMode(null);
    setActiveMemberId(null);
  };

  const saveMemberDraft = () => {
    if (!memberDraft.name.trim()) {
      return;
    }

    const payload = {
      id: activeMemberId ?? buildId("member", memberDraft.name),
      name: memberDraft.name.trim(),
      role: memberDraft.role,
    };

    setMembers((current) => {
      if (memberEditorMode === "edit" && activeMemberId) {
        return current.map((member) => (member.id === activeMemberId ? payload : member));
      }

      return [payload, ...current];
    });
    closeMemberEditor();
  };

  const deleteMemberDraft = () => {
    if (!activeMemberId) {
      return;
    }

    setMembers((current) => current.filter((member) => member.id !== activeMemberId));
    closeMemberEditor();
  };

  const openCreateSubsystemEditor = () => {
    setActiveSubsystemId(null);
    setSubsystemDraft(
      buildSubsystemDraft({
        responsibleEngineerId: members[0]?.id ?? "",
      }),
    );
    setSubsystemEditorMode("create");
  };

  const openEditSubsystemEditor = (subsystem: Subsystem) => {
    setActiveSubsystemId(subsystem.id);
    setSubsystemDraft(buildSubsystemDraft(subsystem));
    setSubsystemEditorMode("edit");
  };

  const closeSubsystemEditor = () => {
    setSubsystemEditorMode(null);
    setActiveSubsystemId(null);
  };

  const saveSubsystemDraft = () => {
    const mentors = splitList(subsystemDraft.mentorIdsText).filter((mentorId) =>
      members.some((member) => member.id === mentorId),
    );
    const risks = splitList(subsystemDraft.risksText);

    if (!subsystemDraft.name.trim() || !subsystemDraft.responsibleEngineerId) {
      return;
    }

    const payload: Subsystem = {
      id: activeSubsystemId ?? buildId("subsystem", subsystemDraft.name),
      name: subsystemDraft.name.trim(),
      description: subsystemDraft.description.trim(),
      isCore: false,
      parentSubsystemId: null,
      responsibleEngineerId: subsystemDraft.responsibleEngineerId,
      mentorIds: mentors,
      risks,
    };

    setSubsystems((current) => {
      if (subsystemEditorMode === "edit" && activeSubsystemId) {
        return current.map((subsystem) =>
          subsystem.id === activeSubsystemId ? payload : subsystem,
        );
      }

      return [payload, ...current];
    });
    closeSubsystemEditor();
  };

  const deleteSubsystemDraft = () => {
    if (!activeSubsystemId) {
      return;
    }

    setSubsystems((current) => current.filter((subsystem) => subsystem.id !== activeSubsystemId));
    closeSubsystemEditor();
  };

  const openCreatePartDefinitionEditor = () => {
    setActivePartDefinitionId(null);
    setPartDefinitionDraft(buildPartDefinitionDraft());
    setPartDefinitionEditorMode("create");
  };

  const openEditPartDefinitionEditor = (partDefinitionId: string) => {
    const partDefinition = partDefinitions.find((candidate) => candidate.id === partDefinitionId);
    if (!partDefinition) {
      return;
    }

    setActivePartDefinitionId(partDefinition.id);
    setPartDefinitionDraft(buildPartDefinitionDraft(partDefinition));
    setPartDefinitionEditorMode("edit");
  };

  const closePartDefinitionEditor = () => {
    setPartDefinitionEditorMode(null);
    setActivePartDefinitionId(null);
  };

  const savePartDefinitionDraft = () => {
    if (!partDefinitionDraft.name.trim() || !partDefinitionDraft.partNumber.trim()) {
      return;
    }

    const payload = {
      id: activePartDefinitionId ?? buildId("part", partDefinitionDraft.name),
      name: partDefinitionDraft.name.trim(),
      partNumber: partDefinitionDraft.partNumber.trim(),
      revision: partDefinitionDraft.revision.trim() || "A",
      type: partDefinitionDraft.type.trim() || "custom",
      source: partDefinitionDraft.source.trim() || "unknown",
    };

    setPartDefinitions((current) => {
      if (partDefinitionEditorMode === "edit" && activePartDefinitionId) {
        return current.map((partDefinition) =>
          partDefinition.id === activePartDefinitionId ? payload : partDefinition,
        );
      }

      return [payload, ...current];
    });
    closePartDefinitionEditor();
  };

  const deletePartDefinitionDraft = () => {
    if (!activePartDefinitionId) {
      return;
    }

    setPartDefinitions((current) =>
      current.filter((partDefinition) => partDefinition.id !== activePartDefinitionId),
    );
    closePartDefinitionEditor();
  };

  const resetWorkspaceData = () => {
    setMembers(mecoSnapshot.members);
    setSubsystems(mecoSnapshot.subsystems);
    setTasks(mecoSnapshot.tasks);
    setWorkLogs(mecoSnapshot.workLogs);
    setManufacturingItems(mecoSnapshot.manufacturingItems);
    setPurchaseItems(mecoSnapshot.purchaseItems);
    setPartDefinitions(mecoSnapshot.partDefinitions);
    setPartInstances(mecoSnapshot.partInstances);
    setActivePersonFilter("all");
    closeTaskEditor();
    closeWorkLogEditor();
    closeManufacturingEditor();
    closePurchaseEditor();
    closeMemberEditor();
    closeSubsystemEditor();
    closePartDefinitionEditor();
  };

  const renderTaskTimeline = () => {
    return (
      <WorkspacePanel
        title="Task timeline"
        subtitle="Calendar-ordered milestones and ownership cues for the next execution window."
        actions={
          <Pressable onPress={openCreateTaskEditor} style={styles.primaryAction}>
            <Text style={styles.primaryActionLabel}>Add task</Text>
          </Pressable>
        }
      >
        <SummaryRow chips={taskSummary} />

        {timelineTasks.map((task) => {
          const progress = timelineProgress(task.status);
          const subsystemName = subsystemsById[task.subsystemId]?.name ?? "Unknown";
          const ownerName = membersById[task.ownerId]?.name ?? "Unassigned";

          return (
            <Pressable
              key={task.id}
              onPress={() => openEditTaskEditor(task)}
              style={styles.timelineRow}
            >
              <View style={styles.timelineRowHeader}>
                <View style={styles.timelineRowText}>
                  <Text style={styles.timelineTitle}>{task.title}</Text>
                  <Text style={styles.timelineMeta}>
                    {subsystemName} - {ownerName} - due {formatDate(task.dueDate)}
                  </Text>
                </View>
                <StatusPill label={STATUS_LABELS[task.status]} value={task.status} />
              </View>

              <View style={styles.timelineTrack}>
                <View style={[styles.timelineFill, { width: `${Math.max(8, progress * 100)}%` }]} />
              </View>
            </Pressable>
          );
        })}

        <InteractionNote text={SUBVIEW_INTERACTION_GUIDANCE.timeline} />
      </WorkspacePanel>
    );
  };

  const renderTaskQueue = () => {
    return (
      <WorkspacePanel
        title="Task queue"
        subtitle="Search and filter queue cards to keep ownership, due dates, and QA state in view."
        actions={
          <Pressable onPress={openCreateTaskEditor} style={styles.primaryAction}>
            <Text style={styles.primaryActionLabel}>Add</Text>
          </Pressable>
        }
      >
        <FilterToolbar>
          <SearchField
            onChangeText={setTaskSearch}
            placeholder="Search tasks"
            value={taskSearch}
          />

          <OptionChipRow
            allLabel="All subsystems"
            onChange={setTaskSubsystemFilter}
            options={subsystems.map((subsystem) => ({
              id: subsystem.id,
              name: subsystem.name,
            }))}
            value={taskSubsystemFilter}
          />

          <OptionChipRow
            allLabel="All owners"
            onChange={setTaskOwnerFilter}
            options={members.map((member) => ({
              id: member.id,
              name: member.name,
            }))}
            value={taskOwnerFilter}
          />

          <OptionChipRow
            allLabel="All statuses"
            onChange={setTaskStatusFilter}
            options={TASK_STATUS_OPTIONS}
            value={taskStatusFilter}
          />

          <OptionChipRow
            allLabel="All priorities"
            onChange={setTaskPriorityFilter}
            options={TASK_PRIORITY_OPTIONS}
            value={taskPriorityFilter}
          />
        </FilterToolbar>

        <SummaryRow chips={taskSummary} />

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderText, styles.tableHeaderPrimary]}>Task</Text>
          <Text style={styles.tableHeaderText}>Owner</Text>
          <Text style={styles.tableHeaderText}>Due</Text>
          <Text style={styles.tableHeaderText}>Status</Text>
        </View>

        {filteredTaskQueue.map((task) => {
          const subsystemName = subsystemsById[task.subsystemId]?.name ?? "Unknown";
          const ownerName = membersById[task.ownerId]?.name ?? "Unassigned";
          const disciplineName = disciplinesById[task.disciplineId]?.name ?? "Unknown discipline";
          const mechanismName = task.mechanismId
            ? (mechanismsById[task.mechanismId]?.name ?? "Unknown mechanism")
            : "No mechanism";
          const linkedPart = task.partInstanceId
            ? (partInstancesById[task.partInstanceId]?.name ?? "Unknown part")
            : "No part";
          const targetEvent = task.targetEventId
            ? (eventsById[task.targetEventId]?.title ?? "Event")
            : "No event";

          return (
            <Pressable
              key={task.id}
              onPress={() => openEditTaskEditor(task)}
              style={styles.queueRowCard}
            >
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={styles.queueRowTitle}>{task.title}</Text>
                  <Text style={styles.queueRowSubtitle}>
                    {subsystemName} - {disciplineName}
                  </Text>
                </View>
                <Text style={styles.editTag}>EDIT</Text>
              </View>

              <Text style={styles.queueRowBody}>{task.summary}</Text>

              <Text style={styles.queueMetaLine}>
                Owner {ownerName} | Due {formatDate(task.dueDate)} | Event {targetEvent}
              </Text>
              <Text style={styles.queueMetaLine}>
                Mechanism {mechanismName} | Part {linkedPart}
              </Text>

              <View style={styles.queuePillRow}>
                <StatusPill label={STATUS_LABELS[task.status]} value={task.status} />
                <StatusPill label={`${task.priority} priority`} value={task.priority} />
                {task.linkedManufacturingIds.length > 0 ? (
                  <StatusPill label="Needs fabrication" value="waiting" />
                ) : null}
                {task.linkedPurchaseIds.length > 0 ? (
                  <StatusPill label="Needs purchase" value="requested" />
                ) : null}
              </View>

              {task.blockers.length > 0 ? (
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutTitle}>Blockers</Text>
                  <Text style={styles.calloutBody}>{task.blockers.join(" | ")}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}

        {filteredTaskQueue.length === 0 ? <EmptyState text="No tasks match the current filters." /> : null}

        <InteractionNote text={SUBVIEW_INTERACTION_GUIDANCE.queue} />
      </WorkspacePanel>
    );
  };

  const renderTasks = () => {
    return (
      <>
        <SectionTabs
          activeValue={taskView}
          onChange={(value) => setTaskView(value as TaskViewTab)}
          options={TASK_VIEW_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
        {taskView === "timeline" ? renderTaskTimeline() : renderTaskQueue()}
      </>
    );
  };

  const renderWorkLogs = () => {
    return (
      <WorkspacePanel
        title="Work logs"
        subtitle="Search by task or notes, then verify hours, participants, and linked subsystem impact."
        actions={
          <Pressable onPress={openCreateWorkLogEditor} style={styles.primaryAction}>
            <Text style={styles.primaryActionLabel}>Add</Text>
          </Pressable>
        }
      >
        <FilterToolbar>
          <SearchField
            onChangeText={setWorkLogSearch}
            placeholder="Search work logs"
            value={workLogSearch}
          />

          <OptionChipRow
            allLabel="All subsystems"
            onChange={setWorkLogSubsystemFilter}
            options={subsystems.map((subsystem) => ({
              id: subsystem.id,
              name: subsystem.name,
            }))}
            value={workLogSubsystemFilter}
          />

          <OptionChipRow
            allLabel="Sort"
            onChange={(value) => setWorkLogSortMode(value as WorkLogSortMode)}
            options={WORKLOG_SORT_OPTIONS.map((option) => ({
              id: option.id,
              name: option.name,
            }))}
            value={workLogSortMode}
          />
        </FilterToolbar>

        <SummaryRow chips={workLogSummary} />

        {filteredWorkLogs.map((workLog) => {
          const task = taskById[workLog.taskId];
          const subsystemName = task ? (subsystemsById[task.subsystemId]?.name ?? "Unknown") : "Unknown";
          const people = workLog.participantIds
            .map((participantId) => membersById[participantId]?.name)
            .filter((name): name is string => Boolean(name));

          return (
            <Pressable
              key={workLog.id}
              onPress={() => openEditWorkLogEditor(workLog)}
              style={styles.queueRowCard}
            >
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={styles.queueRowTitle}>{formatDate(workLog.date)}</Text>
                  <Text style={styles.queueRowSubtitle}>{workLog.hours.toFixed(1)}h logged</Text>
                </View>
                <Text style={styles.editTag}>OPEN</Text>
              </View>

              <Text style={styles.queueMetaLine}>Task: {task?.title ?? "Missing task"}</Text>
              <Text style={styles.queueMetaLine}>Subsystem: {subsystemName}</Text>
              <Text style={styles.queueMetaLine}>People: {people.join(", ") || "Unassigned"}</Text>
              <Text style={styles.queueRowBody}>{workLog.notes || "No notes recorded."}</Text>
            </Pressable>
          );
        })}

        {filteredWorkLogs.length === 0 ? <EmptyState text="No work logs match the current filters." /> : null}

        <InteractionNote text={SUBVIEW_INTERACTION_GUIDANCE.worklogs} />
      </WorkspacePanel>
    );
  };

  const renderManufacturing = () => {
    const title =
      manufacturingView === "cnc"
        ? "CNC queue"
        : manufacturingView === "prints"
          ? "3D print queue"
          : "Fabrication queue";

    const guidanceKey =
      manufacturingView === "cnc"
        ? "cnc"
        : manufacturingView === "prints"
          ? "prints"
          : "fabrication";

    return (
      <>
        <SectionTabs
          activeValue={manufacturingView}
          onChange={(value) => setManufacturingView(value as ManufacturingViewTab)}
          options={MANUFACTURING_VIEW_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />

        <WorkspacePanel
          title={title}
          subtitle="Unified manufacturing rows for part, material, quantity, due date, status, and mentor review."
          actions={
            <Pressable onPress={openCreateManufacturingEditor} style={styles.primaryAction}>
              <Text style={styles.primaryActionLabel}>Add</Text>
            </Pressable>
          }
        >
          <FilterToolbar>
            <SearchField
              onChangeText={setManufacturingSearch}
              placeholder="Search queue"
              value={manufacturingSearch}
            />

            <OptionChipRow
              allLabel="All subsystems"
              onChange={setManufacturingSubsystemFilter}
              options={subsystems.map((subsystem) => ({
                id: subsystem.id,
                name: subsystem.name,
              }))}
              value={manufacturingSubsystemFilter}
            />

            <OptionChipRow
              allLabel="All requesters"
              onChange={setManufacturingRequesterFilter}
              options={members.map((member) => ({
                id: member.id,
                name: member.name,
              }))}
              value={manufacturingRequesterFilter}
            />

            <OptionChipRow
              allLabel="All materials"
              onChange={setManufacturingMaterialFilter}
              options={manufacturingMaterialOptions}
              value={manufacturingMaterialFilter}
            />

            <OptionChipRow
              allLabel="All statuses"
              onChange={setManufacturingStatusFilter}
              options={MANUFACTURING_STATUS_OPTIONS}
              value={manufacturingStatusFilter}
            />
          </FilterToolbar>

          <SummaryRow chips={manufacturingSummary} />

          {filteredManufacturing.map((item) => {
            const subsystemName = subsystemsById[item.subsystemId]?.name ?? "Unknown";
            const requesterName = membersById[item.requestedById]?.name ?? "Unassigned";

            return (
              <Pressable
                key={item.id}
                onPress={() => openEditManufacturingEditor(item)}
                style={styles.queueRowCard}
              >
                <View style={styles.queueRowHeader}>
                  <View style={styles.queueRowPrimaryText}>
                    <Text style={styles.queueRowTitle}>{item.title}</Text>
                    <Text style={styles.queueRowSubtitle}>
                      {subsystemName} - {requesterName}
                    </Text>
                  </View>
                  <Text style={styles.editTag}>EDIT</Text>
                </View>

                <Text style={styles.queueMetaLine}>
                  Material {item.material} | Qty {item.quantity} | Due {formatDate(item.dueDate)}
                </Text>
                <Text style={styles.queueMetaLine}>
                  Batch {item.batchLabel ?? "Unbatched"} | Mentor {item.mentorReviewed ? "Reviewed" : "Pending"}
                </Text>

                <View style={styles.queuePillRow}>
                  <StatusPill label={item.status.replace("-", " ")} value={item.status} />
                  <StatusPill label={item.process === "3d-print" ? "3D print" : item.process} value="info" />
                </View>
              </Pressable>
            );
          })}

          {filteredManufacturing.length === 0 ? (
            <EmptyState text="No manufacturing items match the current filters." />
          ) : null}

          <InteractionNote text={SUBVIEW_INTERACTION_GUIDANCE[guidanceKey]} />
        </WorkspacePanel>
      </>
    );
  };

  const renderInventoryMaterials = () => {
    return (
      <WorkspacePanel
        title="Materials manager"
        subtitle="Rollup view for material demand, inferred on-hand stock, and reorder signals."
        actions={
          <Pressable onPress={openCreatePurchaseEditor} style={styles.primaryAction}>
            <Text style={styles.primaryActionLabel}>Restock</Text>
          </Pressable>
        }
      >
        <FilterToolbar>
          <SearchField
            onChangeText={setMaterialsSearch}
            placeholder="Search materials"
            value={materialsSearch}
          />

          <OptionChipRow
            allLabel="All categories"
            onChange={setMaterialsCategoryFilter}
            options={MATERIAL_CATEGORY_OPTIONS}
            value={materialsCategoryFilter}
          />

          <OptionChipRow
            allLabel="All stock"
            onChange={setMaterialsStockFilter}
            options={[
              { id: "ok", name: "Stock OK" },
              { id: "low", name: "Low stock" },
            ]}
            value={materialsStockFilter}
          />
        </FilterToolbar>

        {filteredMaterialRollups.map((row) => (
          <View key={row.id} style={styles.queueRowCard}>
            <View style={styles.queueRowHeader}>
              <View style={styles.queueRowPrimaryText}>
                <Text style={styles.queueRowTitle}>{row.name}</Text>
                <Text style={styles.queueRowSubtitle}>
                  {capitalize(row.category)} - vendor {row.vendor}
                </Text>
              </View>
              <Text style={styles.editTag}>EDIT</Text>
            </View>

            <Text style={styles.queueMetaLine}>
              On hand {row.onHand} | Reorder {row.reorderPoint} | Open demand {row.openDemand}
            </Text>

            <View style={styles.queuePillRow}>
              <StatusPill
                label={row.stock === "low" ? "Low stock" : "Stock OK"}
                value={row.stock === "low" ? "critical" : "complete"}
              />
            </View>
          </View>
        ))}

        {filteredMaterialRollups.length === 0 ? (
          <EmptyState text="No materials match the current filters." />
        ) : null}

        <InteractionNote text={SUBVIEW_INTERACTION_GUIDANCE.materials} />
      </WorkspacePanel>
    );
  };

  const renderInventoryParts = () => {
    return (
      <WorkspacePanel
        title="Part manager"
        subtitle="Definition catalog on top with subsystem part instances and lifecycle state below."
        actions={
          <Pressable onPress={openCreatePartDefinitionEditor} style={styles.primaryAction}>
            <Text style={styles.primaryActionLabel}>Add</Text>
          </Pressable>
        }
      >
        <FilterToolbar>
          <SearchField
            onChangeText={setPartsSearch}
            placeholder="Search parts"
            value={partsSearch}
          />

          <OptionChipRow
            allLabel="All subsystems"
            onChange={setPartsSubsystemFilter}
            options={subsystems.map((subsystem) => ({
              id: subsystem.id,
              name: subsystem.name,
            }))}
            value={partsSubsystemFilter}
          />

          <OptionChipRow
            allLabel="All statuses"
            onChange={setPartsStatusFilter}
            options={PART_STATUS_OPTIONS}
            value={partsStatusFilter}
          />
        </FilterToolbar>

        <Text style={styles.subsectionLabel}>Part definitions</Text>
        {filteredPartDefinitions.map((partDefinition) => (
          <Pressable
            key={partDefinition.id}
            onPress={() => openEditPartDefinitionEditor(partDefinition.id)}
            style={styles.queueRowCard}
          >
            <View style={styles.queueRowHeader}>
              <View style={styles.queueRowPrimaryText}>
                <Text style={styles.queueRowTitle}>{partDefinition.name}</Text>
                <Text style={styles.queueRowSubtitle}>
                  {partDefinition.partNumber} - rev {partDefinition.revision}
                </Text>
              </View>
              <Text style={styles.editTag}>EDIT</Text>
            </View>

            <Text style={styles.queueMetaLine}>
              Type {partDefinition.type} | Source {partDefinition.source}
            </Text>
          </Pressable>
        ))}

        <Text style={styles.subsectionLabel}>Part instances</Text>
        {filteredPartInstances.map(({ partInstance, status }) => {
          const definition = partDefinitionsById[partInstance.partDefinitionId];
          const mechanismName = partInstance.mechanismId
            ? (mechanismsById[partInstance.mechanismId]?.name ?? "Unknown mechanism")
            : "Unassigned";
          const subsystemName = subsystemsById[partInstance.subsystemId]?.name ?? "Unknown";

          return (
            <View key={partInstance.id} style={styles.queueRowCard}>
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={styles.queueRowTitle}>{partInstance.name}</Text>
                  <Text style={styles.queueRowSubtitle}>
                    {definition?.name ?? "Unknown definition"} - {subsystemName}
                  </Text>
                </View>
                <StatusPill label={status} value={status} />
              </View>

              <Text style={styles.queueMetaLine}>
                Mechanism {mechanismName} | Qty {partInstance.quantity}
              </Text>
              <Text style={styles.queueMetaLine}>
                Tracking {partInstance.trackIndividually ? "Individual" : "Bulk"}
              </Text>
            </View>
          );
        })}

        {filteredPartDefinitions.length === 0 && filteredPartInstances.length === 0 ? (
          <EmptyState text="No parts match the current filters." />
        ) : null}

        <InteractionNote text={SUBVIEW_INTERACTION_GUIDANCE.parts} />
      </WorkspacePanel>
    );
  };

  const renderInventoryPurchases = () => {
    return (
      <WorkspacePanel
        title="Purchase list"
        subtitle="Review request status, vendor, mentor approval, and cost deltas in one queue."
        actions={
          <Pressable onPress={openCreatePurchaseEditor} style={styles.primaryAction}>
            <Text style={styles.primaryActionLabel}>Add</Text>
          </Pressable>
        }
      >
        <FilterToolbar>
          <SearchField
            onChangeText={setPurchaseSearch}
            placeholder="Search purchases"
            value={purchaseSearch}
          />

          <OptionChipRow
            allLabel="All subsystems"
            onChange={setPurchaseSubsystemFilter}
            options={subsystems.map((subsystem) => ({
              id: subsystem.id,
              name: subsystem.name,
            }))}
            value={purchaseSubsystemFilter}
          />

          <OptionChipRow
            allLabel="All requesters"
            onChange={setPurchaseRequesterFilter}
            options={members.map((member) => ({
              id: member.id,
              name: member.name,
            }))}
            value={purchaseRequesterFilter}
          />

          <OptionChipRow
            allLabel="All statuses"
            onChange={setPurchaseStatusFilter}
            options={PURCHASE_STATUS_OPTIONS}
            value={purchaseStatusFilter}
          />

          <OptionChipRow
            allLabel="All vendors"
            onChange={setPurchaseVendorFilter}
            options={purchaseVendorOptions}
            value={purchaseVendorFilter}
          />

          <OptionChipRow
            allLabel="All approvals"
            onChange={setPurchaseApprovalFilter}
            options={PURCHASE_APPROVAL_OPTIONS}
            value={purchaseApprovalFilter}
          />
        </FilterToolbar>

        {filteredPurchases.map((item) => {
          const subsystemName = subsystemsById[item.subsystemId]?.name ?? "Unknown";
          const requesterName = membersById[item.requestedById]?.name ?? "Unassigned";

          return (
            <Pressable
              key={item.id}
              onPress={() => openEditPurchaseEditor(item)}
              style={styles.queueRowCard}
            >
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={styles.queueRowTitle}>{item.title}</Text>
                  <Text style={styles.queueRowSubtitle}>
                    {subsystemName} - requester {requesterName}
                  </Text>
                </View>
                <Text style={styles.editTag}>EDIT</Text>
              </View>

              <Text style={styles.queueMetaLine}>
                Vendor {item.vendor} | Qty {item.quantity}
              </Text>
              <Text style={styles.queueMetaLine}>
                Est ${item.estimatedCost.toFixed(0)} | Final {item.finalCost ? `$${item.finalCost.toFixed(0)}` : "pending"}
              </Text>

              <View style={styles.queuePillRow}>
                <StatusPill label={item.status} value={item.status} />
                <StatusPill
                  label={item.approvedByMentor ? "Mentor approved" : "Mentor waiting"}
                  value={item.approvedByMentor ? "approved" : "waiting"}
                />
              </View>
            </Pressable>
          );
        })}

        {filteredPurchases.length === 0 ? (
          <EmptyState text="No purchase items match the current filters." />
        ) : null}

        <InteractionNote text={SUBVIEW_INTERACTION_GUIDANCE.purchases} />
      </WorkspacePanel>
    );
  };

  const renderInventory = () => {
    return (
      <>
        <SectionTabs
          activeValue={inventoryView}
          onChange={(value) => setInventoryView(value as InventoryViewTab)}
          options={INVENTORY_VIEW_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />

        {inventoryView === "materials"
          ? renderInventoryMaterials()
          : inventoryView === "parts"
            ? renderInventoryParts()
            : renderInventoryPurchases()}
      </>
    );
  };

  const renderSubsystems = () => {
    const visibleMechanismCount = mecoSnapshot.mechanisms.filter((mechanism) => {
      return filteredSubsystems.some((subsystem) => subsystem.id === mechanism.subsystemId);
    }).length;

    return (
      <WorkspacePanel
        title="Subsystem manager"
        subtitle="Review ownership, risk, and mechanism coverage with expandable subsystem cards."
        actions={
          <Pressable onPress={openCreateSubsystemEditor} style={styles.primaryAction}>
            <Text style={styles.primaryActionLabel}>Add subsystem</Text>
          </Pressable>
        }
      >
        <FilterToolbar>
          <SearchField
            onChangeText={setSubsystemSearch}
            placeholder="Search subsystems"
            value={subsystemSearch}
          />
        </FilterToolbar>

        <SummaryRow
          chips={[
            { label: "Visible subsystems", value: String(filteredSubsystems.length) },
            { label: "Visible mechanisms", value: String(visibleMechanismCount) },
          ]}
        />

        {filteredSubsystems.map((subsystem) => {
          const counts = subsystemCountsById[subsystem.id];
          const isSelected = selectedSubsystem?.id === subsystem.id;
          const mentorNames = subsystem.mentorIds
            .map((mentorId) => membersById[mentorId]?.name ?? "Unknown")
            .join(", ");
          const subsystemMechanisms = mecoSnapshot.mechanisms.filter(
            (mechanism) => mechanism.subsystemId === subsystem.id,
          );

          return (
            <View key={subsystem.id} style={styles.subsystemCard}>
              <Pressable
                onPress={() => {
                  setSelectedSubsystemId((current) =>
                    current === subsystem.id ? "" : subsystem.id,
                  );
                }}
                onLongPress={() => openEditSubsystemEditor(subsystem)}
                style={styles.subsystemCardHeader}
              >
                <View style={styles.queueRowPrimaryText}>
                  <Text style={styles.queueRowTitle}>{subsystem.name}</Text>
                  <Text style={styles.queueRowSubtitle}>
                    Lead {membersById[subsystem.responsibleEngineerId]?.name ?? "Unassigned"} - Mentors {mentorNames || "None"}
                  </Text>
                </View>
                <Text style={styles.editTag}>{isSelected ? "HIDE" : "OPEN"}</Text>
              </Pressable>

              <Text style={styles.queueRowBody}>{subsystem.description}</Text>
              <Text style={styles.queueMetaLine}>
                Mechanisms {counts.mechanisms} | Open tasks {counts.openTasks}/{counts.tasks} | Risks {counts.risks}
              </Text>

              {subsystem.risks.length > 0 ? (
                <View style={styles.queuePillRow}>
                  {subsystem.risks.map((risk) => (
                    <StatusPill key={risk} label={risk} value="warning" />
                  ))}
                </View>
              ) : null}

              {isSelected ? (
                <View style={styles.subsystemExpansion}>
                  {subsystemMechanisms.map((mechanism) => (
                    <View key={mechanism.id} style={styles.mechanismCard}>
                      <View style={styles.queueRowHeader}>
                        <View style={styles.queueRowPrimaryText}>
                          <Text style={styles.queueRowTitle}>{mechanism.name}</Text>
                          <Text style={styles.queueRowBody}>{mechanism.description}</Text>
                        </View>
                        <Text style={styles.editTag}>EDIT</Text>
                      </View>
                    </View>
                  ))}

                  {subsystemMechanisms.length === 0 ? (
                    <Text style={styles.emptyStateText}>No mechanisms yet.</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}

        {filteredSubsystems.length === 0 ? (
          <EmptyState text="No subsystems match the current search." />
        ) : null}

        <InteractionNote text={SUBVIEW_INTERACTION_GUIDANCE.subsystems} />
      </WorkspacePanel>
    );
  };

  const renderRosterSection = (
    title: string,
    memberList: (typeof mecoSnapshot.members)[number][],
  ) => {
    return (
      <View style={styles.rosterSection}>
        <View style={styles.rosterSectionHeader}>
          <Text style={styles.subsectionLabel}>{title}</Text>
          <View style={styles.sidebarCountPill}>
            <Text style={styles.sidebarCountLabel}>{memberList.length}</Text>
          </View>
        </View>

        {memberList.map((member) => {
          const isSelected = selectedMemberId === member.id;

          return (
            <Pressable
              key={member.id}
              onPress={() => setSelectedMemberId(member.id)}
              onLongPress={() => openEditMemberEditor(member.id)}
              style={[styles.memberRow, isSelected && styles.memberRowSelected]}
            >
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarLabel}>{member.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.memberCopy}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{capitalize(member.role)}</Text>
              </View>
              <Pressable onPress={() => openEditMemberEditor(member.id)} style={styles.editTagButton}>
                <Text style={styles.editTag}>EDIT</Text>
              </Pressable>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderRoster = () => {
    return (
      <WorkspacePanel
        title="Roster"
        subtitle="Role-grouped people lists with quick selection for ownership and mentorship updates."
        actions={
          <Pressable onPress={openCreateMemberEditor} style={styles.primaryAction}>
            <Text style={styles.primaryActionLabel}>Add person</Text>
          </Pressable>
        }
      >
        <SummaryRow
          chips={[
            { label: "Students", value: String(rosterStudents.length) },
            { label: "Mentors", value: String(rosterMentors.length) },
            { label: "Admins", value: String(rosterAdmins.length) },
          ]}
        />

        {renderRosterSection("Students", rosterStudents)}
        {renderRosterSection("Mentors", rosterMentors)}
        {renderRosterSection("Admins", rosterAdmins)}

        <InteractionNote text={SUBVIEW_INTERACTION_GUIDANCE.roster} />
      </WorkspacePanel>
    );
  };

  const renderActiveTab = () => {
    if (activeTab === "tasks") {
      return renderTasks();
    }

    if (activeTab === "worklogs") {
      return renderWorkLogs();
    }

    if (activeTab === "manufacturing") {
      return renderManufacturing();
    }

    if (activeTab === "inventory") {
      return renderInventory();
    }

    if (activeTab === "subsystems") {
      return renderSubsystems();
    }

    return renderRoster();
  };

  const renderEditorModals = () => {
    const taskOptions = tasks.map((task) => ({ id: task.id, name: task.title }));
    const memberOptions = members.map((member) => ({ id: member.id, name: member.name }));
    const subsystemOptions = subsystems.map((subsystem) => ({
      id: subsystem.id,
      name: subsystem.name,
    }));

    return (
      <>
        <EditorModal
          onCancel={closeTaskEditor}
          onDelete={taskEditorMode === "edit" ? deleteTaskDraft : undefined}
          onSave={saveTaskDraft}
          saveLabel={taskEditorMode === "edit" ? "Update task" : "Create task"}
          title={taskEditorMode === "edit" ? "Edit task" : "Create task"}
          visible={Boolean(taskEditorMode)}
        >
          <ModalField
            label="Title"
            onChangeText={(value) => setTaskDraft((current) => ({ ...current, title: value }))}
            placeholder="Task title"
            value={taskDraft.title}
          />
          <ModalField
            label="Summary"
            multiline
            onChangeText={(value) => setTaskDraft((current) => ({ ...current, summary: value }))}
            placeholder="Task summary"
            value={taskDraft.summary}
          />
          <ModalField
            label="Due date (YYYY-MM-DD)"
            onChangeText={(value) => setTaskDraft((current) => ({ ...current, dueDate: value }))}
            placeholder="2026-04-24"
            value={taskDraft.dueDate}
          />
          <OptionChipRow
            allLabel="Subsystem"
            onChange={(value) =>
              setTaskDraft((current) => ({ ...current, subsystemId: value === "all" ? "" : value }))
            }
            options={subsystemOptions}
            value={taskDraft.subsystemId || "all"}
          />
          <OptionChipRow
            allLabel="Owner"
            onChange={(value) =>
              setTaskDraft((current) => ({ ...current, ownerId: value === "all" ? "" : value }))
            }
            options={memberOptions}
            value={taskDraft.ownerId || "all"}
          />
          <OptionChipRow
            allLabel="Mentor"
            onChange={(value) =>
              setTaskDraft((current) => ({ ...current, mentorId: value === "all" ? "" : value }))
            }
            options={memberOptions}
            value={taskDraft.mentorId || "all"}
          />
          <OptionChipRow
            allLabel="Status"
            onChange={(value) =>
              setTaskDraft((current) => ({
                ...current,
                status: (value === "all" ? "not-started" : value) as TaskStatus,
              }))
            }
            options={TASK_STATUS_OPTIONS}
            value={taskDraft.status}
          />
          <OptionChipRow
            allLabel="Priority"
            onChange={(value) =>
              setTaskDraft((current) => ({
                ...current,
                priority: (value === "all" ? "medium" : value) as TaskPriority,
              }))
            }
            options={TASK_PRIORITY_OPTIONS}
            value={taskDraft.priority}
          />
          <ModalField
            label="Blockers (comma separated)"
            onChangeText={(value) =>
              setTaskDraft((current) => ({ ...current, blockersText: value }))
            }
            placeholder="Waiting on batch, cable routing"
            value={taskDraft.blockersText}
          />
        </EditorModal>

        <EditorModal
          onCancel={closeWorkLogEditor}
          onDelete={workLogEditorMode === "edit" ? deleteWorkLogDraft : undefined}
          onSave={saveWorkLogDraft}
          saveLabel={workLogEditorMode === "edit" ? "Update work log" : "Create work log"}
          title={workLogEditorMode === "edit" ? "Edit work log" : "Create work log"}
          visible={Boolean(workLogEditorMode)}
        >
          <OptionChipRow
            allLabel="Task"
            onChange={(value) =>
              setWorkLogDraft((current) => ({ ...current, taskId: value === "all" ? "" : value }))
            }
            options={taskOptions}
            value={workLogDraft.taskId || "all"}
          />
          <ModalField
            label="Date (YYYY-MM-DD)"
            onChangeText={(value) => setWorkLogDraft((current) => ({ ...current, date: value }))}
            placeholder="2026-04-24"
            value={workLogDraft.date}
          />
          <ModalField
            label="Hours"
            onChangeText={(value) => setWorkLogDraft((current) => ({ ...current, hours: value }))}
            placeholder="2.5"
            value={workLogDraft.hours}
          />
          <ModalField
            label="Participants (member IDs, comma separated)"
            onChangeText={(value) =>
              setWorkLogDraft((current) => ({ ...current, participantIdsText: value }))
            }
            placeholder="ava,jordan"
            value={workLogDraft.participantIdsText}
          />
          <ModalField
            label="Notes"
            multiline
            onChangeText={(value) => setWorkLogDraft((current) => ({ ...current, notes: value }))}
            placeholder="What was completed"
            value={workLogDraft.notes}
          />
        </EditorModal>

        <EditorModal
          onCancel={closeManufacturingEditor}
          onDelete={manufacturingEditorMode === "edit" ? deleteManufacturingDraft : undefined}
          onSave={saveManufacturingDraft}
          saveLabel={manufacturingEditorMode === "edit" ? "Update item" : "Create item"}
          title={manufacturingEditorMode === "edit" ? "Edit manufacturing item" : "Create manufacturing item"}
          visible={Boolean(manufacturingEditorMode)}
        >
          <ModalField
            label="Title"
            onChangeText={(value) =>
              setManufacturingDraft((current) => ({ ...current, title: value }))
            }
            placeholder="Part title"
            value={manufacturingDraft.title}
          />
          <OptionChipRow
            allLabel="Subsystem"
            onChange={(value) =>
              setManufacturingDraft((current) => ({
                ...current,
                subsystemId: value === "all" ? "" : value,
              }))
            }
            options={subsystemOptions}
            value={manufacturingDraft.subsystemId || "all"}
          />
          <OptionChipRow
            allLabel="Requester"
            onChange={(value) =>
              setManufacturingDraft((current) => ({
                ...current,
                requestedById: value === "all" ? "" : value,
              }))
            }
            options={memberOptions}
            value={manufacturingDraft.requestedById || "all"}
          />
          <OptionChipRow
            allLabel="Process"
            onChange={(value) =>
              setManufacturingDraft((current) => ({
                ...current,
                process: (value === "all" ? current.process : value) as ManufacturingItem["process"],
              }))
            }
            options={MANUFACTURING_VIEW_OPTIONS.map((option) => ({
              id: option.value === "prints" ? "3d-print" : option.value,
              name: option.label,
            }))}
            value={manufacturingDraft.process}
          />
          <OptionChipRow
            allLabel="Status"
            onChange={(value) =>
              setManufacturingDraft((current) => ({
                ...current,
                status: (value === "all" ? "requested" : value) as ManufacturingItem["status"],
              }))
            }
            options={MANUFACTURING_STATUS_OPTIONS}
            value={manufacturingDraft.status}
          />
          <ModalField
            label="Material"
            onChangeText={(value) =>
              setManufacturingDraft((current) => ({ ...current, material: value }))
            }
            placeholder="Material"
            value={manufacturingDraft.material}
          />
          <ModalField
            label="Quantity"
            onChangeText={(value) =>
              setManufacturingDraft((current) => ({ ...current, quantity: value }))
            }
            placeholder="1"
            value={manufacturingDraft.quantity}
          />
          <ModalField
            label="Due date (YYYY-MM-DD)"
            onChangeText={(value) =>
              setManufacturingDraft((current) => ({ ...current, dueDate: value }))
            }
            placeholder="2026-04-24"
            value={manufacturingDraft.dueDate}
          />
          <ModalField
            label="Batch label"
            onChangeText={(value) =>
              setManufacturingDraft((current) => ({ ...current, batchLabel: value }))
            }
            placeholder="B-17"
            value={manufacturingDraft.batchLabel}
          />
          <ModalField
            label="QA review count"
            onChangeText={(value) =>
              setManufacturingDraft((current) => ({ ...current, qaReviewCount: value }))
            }
            placeholder="0"
            value={manufacturingDraft.qaReviewCount}
          />
          <ToggleField
            label="Mentor reviewed"
            onToggle={(value) =>
              setManufacturingDraft((current) => ({ ...current, mentorReviewed: value }))
            }
            value={manufacturingDraft.mentorReviewed}
          />
        </EditorModal>

        <EditorModal
          onCancel={closePurchaseEditor}
          onDelete={purchaseEditorMode === "edit" ? deletePurchaseDraft : undefined}
          onSave={savePurchaseDraft}
          saveLabel={purchaseEditorMode === "edit" ? "Update purchase" : "Create purchase"}
          title={purchaseEditorMode === "edit" ? "Edit purchase" : "Create purchase"}
          visible={Boolean(purchaseEditorMode)}
        >
          <ModalField
            label="Title"
            onChangeText={(value) => setPurchaseDraft((current) => ({ ...current, title: value }))}
            placeholder="Item title"
            value={purchaseDraft.title}
          />
          <OptionChipRow
            allLabel="Subsystem"
            onChange={(value) =>
              setPurchaseDraft((current) => ({
                ...current,
                subsystemId: value === "all" ? "" : value,
              }))
            }
            options={subsystemOptions}
            value={purchaseDraft.subsystemId || "all"}
          />
          <OptionChipRow
            allLabel="Requester"
            onChange={(value) =>
              setPurchaseDraft((current) => ({
                ...current,
                requestedById: value === "all" ? "" : value,
              }))
            }
            options={memberOptions}
            value={purchaseDraft.requestedById || "all"}
          />
          <OptionChipRow
            allLabel="Status"
            onChange={(value) =>
              setPurchaseDraft((current) => ({
                ...current,
                status: (value === "all" ? "requested" : value) as PurchaseItem["status"],
              }))
            }
            options={PURCHASE_STATUS_OPTIONS}
            value={purchaseDraft.status}
          />
          <ModalField
            label="Vendor"
            onChangeText={(value) => setPurchaseDraft((current) => ({ ...current, vendor: value }))}
            placeholder="Vendor"
            value={purchaseDraft.vendor}
          />
          <ModalField
            label="Link label"
            onChangeText={(value) => setPurchaseDraft((current) => ({ ...current, linkLabel: value }))}
            placeholder="vendor.com/item"
            value={purchaseDraft.linkLabel}
          />
          <ModalField
            label="Quantity"
            onChangeText={(value) => setPurchaseDraft((current) => ({ ...current, quantity: value }))}
            placeholder="1"
            value={purchaseDraft.quantity}
          />
          <ModalField
            label="Estimated cost"
            onChangeText={(value) =>
              setPurchaseDraft((current) => ({ ...current, estimatedCost: value }))
            }
            placeholder="82"
            value={purchaseDraft.estimatedCost}
          />
          <ModalField
            label="Final cost (optional)"
            onChangeText={(value) => setPurchaseDraft((current) => ({ ...current, finalCost: value }))}
            placeholder="61"
            value={purchaseDraft.finalCost}
          />
          <ToggleField
            label="Mentor approved"
            onToggle={(value) =>
              setPurchaseDraft((current) => ({ ...current, approvedByMentor: value }))
            }
            value={purchaseDraft.approvedByMentor}
          />
        </EditorModal>

        <EditorModal
          onCancel={closePartDefinitionEditor}
          onDelete={
            partDefinitionEditorMode === "edit" ? deletePartDefinitionDraft : undefined
          }
          onSave={savePartDefinitionDraft}
          saveLabel={
            partDefinitionEditorMode === "edit"
              ? "Update part definition"
              : "Create part definition"
          }
          title={
            partDefinitionEditorMode === "edit"
              ? "Edit part definition"
              : "Create part definition"
          }
          visible={Boolean(partDefinitionEditorMode)}
        >
          <ModalField
            label="Name"
            onChangeText={(value) =>
              setPartDefinitionDraft((current) => ({ ...current, name: value }))
            }
            placeholder="Part name"
            value={partDefinitionDraft.name}
          />
          <ModalField
            label="Part number"
            onChangeText={(value) =>
              setPartDefinitionDraft((current) => ({ ...current, partNumber: value }))
            }
            placeholder="DRV-101"
            value={partDefinitionDraft.partNumber}
          />
          <ModalField
            label="Revision"
            onChangeText={(value) =>
              setPartDefinitionDraft((current) => ({ ...current, revision: value }))
            }
            placeholder="A"
            value={partDefinitionDraft.revision}
          />
          <ModalField
            label="Type"
            onChangeText={(value) =>
              setPartDefinitionDraft((current) => ({ ...current, type: value }))
            }
            placeholder="custom"
            value={partDefinitionDraft.type}
          />
          <ModalField
            label="Source"
            onChangeText={(value) =>
              setPartDefinitionDraft((current) => ({ ...current, source: value }))
            }
            placeholder="Onshape"
            value={partDefinitionDraft.source}
          />
        </EditorModal>

        <EditorModal
          onCancel={closeMemberEditor}
          onDelete={memberEditorMode === "edit" ? deleteMemberDraft : undefined}
          onSave={saveMemberDraft}
          saveLabel={memberEditorMode === "edit" ? "Update member" : "Create member"}
          title={memberEditorMode === "edit" ? "Edit member" : "Create member"}
          visible={Boolean(memberEditorMode)}
        >
          <ModalField
            label="Name"
            onChangeText={(value) => setMemberDraft((current) => ({ ...current, name: value }))}
            placeholder="Person name"
            value={memberDraft.name}
          />
          <OptionChipRow
            allLabel="Role"
            onChange={(value) =>
              setMemberDraft((current) => ({
                ...current,
                role: (value === "all" ? "student" : value) as MemberRole,
              }))
            }
            options={[
              { id: "student", name: "Student" },
              { id: "mentor", name: "Mentor" },
              { id: "admin", name: "Admin" },
            ]}
            value={memberDraft.role}
          />
        </EditorModal>

        <EditorModal
          onCancel={closeSubsystemEditor}
          onDelete={subsystemEditorMode === "edit" ? deleteSubsystemDraft : undefined}
          onSave={saveSubsystemDraft}
          saveLabel={subsystemEditorMode === "edit" ? "Update subsystem" : "Create subsystem"}
          title={subsystemEditorMode === "edit" ? "Edit subsystem" : "Create subsystem"}
          visible={Boolean(subsystemEditorMode)}
        >
          <ModalField
            label="Name"
            onChangeText={(value) =>
              setSubsystemDraft((current) => ({ ...current, name: value }))
            }
            placeholder="Subsystem name"
            value={subsystemDraft.name}
          />
          <ModalField
            label="Description"
            multiline
            onChangeText={(value) =>
              setSubsystemDraft((current) => ({ ...current, description: value }))
            }
            placeholder="Subsystem description"
            value={subsystemDraft.description}
          />
          <OptionChipRow
            allLabel="Responsible engineer"
            onChange={(value) =>
              setSubsystemDraft((current) => ({
                ...current,
                responsibleEngineerId: value === "all" ? "" : value,
              }))
            }
            options={memberOptions}
            value={subsystemDraft.responsibleEngineerId || "all"}
          />
          <ModalField
            label="Mentor IDs (comma separated)"
            onChangeText={(value) =>
              setSubsystemDraft((current) => ({ ...current, mentorIdsText: value }))
            }
            placeholder="jordan,riley"
            value={subsystemDraft.mentorIdsText}
          />
          <ModalField
            label="Risks (comma separated)"
            onChangeText={(value) =>
              setSubsystemDraft((current) => ({ ...current, risksText: value }))
            }
            placeholder="Risk one, risk two"
            value={subsystemDraft.risksText}
          />
        </EditorModal>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <Pressable
              onPress={() => setIsNavCollapsed((current) => !current)}
              style={styles.iconButton}
            >
              <Text style={styles.iconButtonLabel}>NAV</Text>
            </Pressable>

            <View style={styles.brandWrap}>
              <Text style={styles.brandEyebrow}>MECO Robotics</Text>
              <Text style={styles.brandTitle}>{activeTabLabel}</Text>
            </View>
          </View>

          <View style={styles.topbarRight}>
            <View style={styles.userChip}>
              <Text style={styles.userChipLabel}>Local access</Text>
            </View>

            <Pressable onPress={resetWorkspaceData} style={styles.iconButton}>
              <Text style={styles.iconButtonLabel}>REF</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sidebarNavRow}
        >
          {navigationItems.map((item) => {
            const isActive = activeTab === item.key;

            return (
              <Pressable
                key={item.key}
                onPress={() => setActiveTab(item.key)}
                style={[styles.sidebarTab, isActive && styles.sidebarTabActive]}
              >
                <View style={[styles.sidebarIconBubble, isActive && styles.sidebarIconBubbleActive]}>
                  <Text style={[styles.sidebarIconLabel, isActive && styles.sidebarIconLabelActive]}>
                    {item.shortLabel}
                  </Text>
                </View>

                {!isNavCollapsed ? (
                  <Text style={[styles.sidebarTabLabel, isActive && styles.sidebarTabLabelActive]}>
                    {item.label}
                  </Text>
                ) : null}

                <View style={[styles.sidebarCountPill, isActive && styles.sidebarCountPillActive]}>
                  <Text style={[styles.sidebarCountLabel, isActive && styles.sidebarCountLabelActive]}>
                    {item.count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.personFilterStrip}>
          <OptionChipRow
            allLabel="All people"
            onChange={setActivePersonFilter}
            options={members.map((member) => ({ id: member.id, name: member.name }))}
            value={activePersonFilter}
          />
        </View>

        {renderActiveTab()}
      </ScrollView>
      {renderEditorModals()}
    </SafeAreaView>
  );
}

function WorkspacePanel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderCopy}>
          <Text style={styles.panelTitle}>{title}</Text>
          <Text style={styles.panelSubtitle}>{subtitle}</Text>
        </View>
        {actions ? <View style={styles.panelActions}>{actions}</View> : null}
      </View>

      <View style={styles.panelContent}>{children}</View>
    </View>
  );
}

function SectionTabs<T extends string>({
  activeValue,
  onChange,
  options,
}: {
  activeValue: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sectionTabsRow}
    >
      {options.map((option) => {
        const isActive = option.value === activeValue;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.sectionTab, isActive && styles.sectionTabActive]}
          >
            <Text style={[styles.sectionTabLabel, isActive && styles.sectionTabLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function FilterToolbar({ children }: { children: ReactNode }) {
  return <View style={styles.filterToolbar}>{children}</View>;
}

function SearchField({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.searchFieldWrap}>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtleText}
        style={styles.searchFieldInput}
        value={value}
      />
    </View>
  );
}

function OptionChipRow({
  allLabel,
  options,
  value,
  onChange,
}: {
  allLabel: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.optionChipRow}
    >
      <Pressable
        onPress={() => onChange("all")}
        style={[styles.optionChip, value === "all" && styles.optionChipActive]}
      >
        <Text style={[styles.optionChipLabel, value === "all" && styles.optionChipLabelActive]}>
          {allLabel}
        </Text>
      </Pressable>

      {options.map((option) => {
        const isActive = value === option.id;

        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.optionChip, isActive && styles.optionChipActive]}
          >
            <Text style={[styles.optionChipLabel, isActive && styles.optionChipLabelActive]}>
              {option.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SummaryRow({ chips }: { chips: SummaryChipData[] }) {
  return (
    <View style={styles.summaryRow}>
      {chips.map((chip) => (
        <View key={chip.label} style={styles.summaryChip}>
          <Text style={styles.summaryChipLabel}>{chip.label}</Text>
          <Text style={styles.summaryChipValue}>{chip.value}</Text>
        </View>
      ))}
    </View>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  const group = getStatusGroup(value);

  return (
    <View style={[styles.statusPill, statusToneStyles[group]]}>
      <Text style={[styles.statusPillLabel, statusToneLabelStyles[group]]}>{label}</Text>
    </View>
  );
}

function InteractionNote({ text }: { text: string }) {
  return (
    <View style={styles.interactionNote}>
      <Text style={styles.interactionNoteLabel}>How to use this view</Text>
      <Text style={styles.interactionNoteText}>{text}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyStateWrap}>
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

function EditorModal({
  visible,
  title,
  saveLabel,
  onSave,
  onCancel,
  onDelete,
  children,
}: {
  visible: boolean;
  title: string;
  saveLabel: string;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.modalScrim}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          <View style={styles.modalActions}>
            {onDelete ? (
              <Pressable onPress={onDelete} style={styles.modalDeleteButton}>
                <Text style={styles.modalDeleteButtonLabel}>Delete</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onCancel} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelButtonLabel}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onSave} style={styles.modalSaveButton}>
              <Text style={styles.modalSaveButtonLabel}>{saveLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ModalField({
  label,
  value,
  placeholder,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.modalField}>
      <Text style={styles.modalFieldLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtleText}
        style={[styles.modalFieldInput, multiline && styles.modalFieldInputMultiline]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
    </View>
  );
}

function ToggleField({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onToggle(!value)}
      style={[styles.toggleField, value && styles.toggleFieldActive]}
    >
      <Text style={styles.toggleFieldLabel}>{label}</Text>
      <Text style={[styles.toggleFieldValue, value && styles.toggleFieldValueActive]}>
        {value ? "Yes" : "No"}
      </Text>
    </Pressable>
  );
}

function buildTaskDraft(seed?: Partial<Task>): TaskDraft {
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

function buildWorkLogDraft(seed?: Partial<WorkLog>): WorkLogDraft {
  return {
    taskId: seed?.taskId ?? "",
    date: seed?.date ?? isoToday(),
    hours: typeof seed?.hours === "number" ? String(seed.hours) : "",
    participantIdsText: seed?.participantIds?.join(",") ?? "",
    notes: seed?.notes ?? "",
  };
}

function buildManufacturingDraft(
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

function buildPurchaseDraft(seed?: Partial<PurchaseItem>): PurchaseDraft {
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

function buildMemberDraft(seed?: Partial<{ name: string; role: MemberRole }>): MemberDraft {
  return {
    name: seed?.name ?? "",
    role: seed?.role ?? "student",
  };
}

function buildSubsystemDraft(seed?: Partial<Subsystem>): SubsystemDraft {
  return {
    name: seed?.name ?? "",
    description: seed?.description ?? "",
    responsibleEngineerId: seed?.responsibleEngineerId ?? "",
    mentorIdsText: seed?.mentorIds?.join(",") ?? "",
    risksText: seed?.risks?.join(", ") ?? "",
  };
}

function buildPartDefinitionDraft(
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

function buildId(prefix: string, seed: string) {
  const normalized = seed
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${normalized || "item"}-${suffix}`;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function getStatusGroup(value: string): StatusGroup {
  for (const [group, candidates] of Object.entries(STATUS_GROUPS) as Array<
    [Exclude<StatusGroup, "neutral">, Set<string>]
  >) {
    if (candidates.has(value)) {
      return group;
    }
  }

  return "neutral";
}

function timelineProgress(status: TaskStatus): number {
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

function inferMaterialCategory(materialName: string): string {
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

function derivePartLifecycleStatus(
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

function formatDate(value: string) {
  return value.slice(5);
}

function capitalize(value: string) {
  if (value.length === 0) {
    return value;
  }

  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

const statusToneStyles = StyleSheet.create({
  success: {
    backgroundColor: "rgba(61, 153, 108, 0.16)",
  },
  info: {
    backgroundColor: "rgba(76, 121, 207, 0.12)",
  },
  warning: {
    backgroundColor: "rgba(233, 131, 53, 0.14)",
  },
  danger: {
    backgroundColor: "rgba(234, 28, 45, 0.12)",
  },
  neutral: {
    backgroundColor: "rgba(112, 128, 154, 0.16)",
  },
});

const statusToneLabelStyles = StyleSheet.create({
  success: {
    color: "#246847",
  },
  info: {
    color: "#275098",
  },
  warning: {
    color: "#a84712",
  },
  danger: {
    color: "#b31222",
  },
  neutral: {
    color: "#54627b",
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  screenContent: {
    paddingBottom: spacing.xxl,
  },
  topbar: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.card,
  },
  topbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  topbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  iconButtonLabel: {
    fontWeight: "800",
    color: colors.navyInk,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  brandWrap: {
    flex: 1,
    minWidth: 0,
  },
  brandEyebrow: {
    color: colors.subtleText,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  brandTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  userChip: {
    borderRadius: 999,
    backgroundColor: colors.navySurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  userChipLabel: {
    color: colors.navyInk,
    fontWeight: "700",
    fontSize: 12,
  },
  sidebarNavRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  personFilterStrip: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sidebarTab: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sidebarTabActive: {
    borderColor: colors.blue,
    backgroundColor: colors.navySurface,
  },
  sidebarIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarIconBubbleActive: {
    backgroundColor: colors.blue,
  },
  sidebarIconLabel: {
    color: colors.navyInk,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  sidebarIconLabelActive: {
    color: colors.white,
  },
  sidebarTabLabel: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 13,
  },
  sidebarTabLabelActive: {
    color: colors.navyInk,
  },
  sidebarCountPill: {
    minWidth: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  sidebarCountPillActive: {
    backgroundColor: colors.blue,
  },
  sidebarCountLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  sidebarCountLabelActive: {
    color: colors.white,
  },
  sectionTabsRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  sectionTab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  sectionTabActive: {
    backgroundColor: colors.navySurface,
    borderColor: colors.blue,
  },
  sectionTabLabel: {
    color: colors.subtleText,
    fontWeight: "700",
    fontSize: 13,
  },
  sectionTabLabelActive: {
    color: colors.navyInk,
  },
  panel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...shadows.card,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  panelHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  panelActions: {
    alignItems: "flex-end",
  },
  panelTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
  },
  panelSubtitle: {
    color: colors.subtleText,
    marginTop: 4,
    lineHeight: 19,
  },
  panelContent: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  primaryAction: {
    borderRadius: 999,
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  primaryActionLabel: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 13,
  },
  filterToolbar: {
    gap: spacing.sm,
  },
  searchFieldWrap: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    height: 42,
    justifyContent: "center",
  },
  searchFieldInput: {
    color: colors.ink,
    fontSize: 14,
  },
  optionChipRow: {
    gap: spacing.xs,
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  optionChipActive: {
    backgroundColor: colors.navySurface,
    borderColor: colors.blue,
  },
  optionChipLabel: {
    color: colors.subtleText,
    fontSize: 12,
    fontWeight: "700",
  },
  optionChipLabelActive: {
    color: colors.navyInk,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryChip: {
    minWidth: 120,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flex: 1,
  },
  summaryChipLabel: {
    color: colors.subtleText,
    textTransform: "uppercase",
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  summaryChipValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginTop: 2,
  },
  tableHeaderText: {
    color: colors.subtleText,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
    flex: 1,
  },
  tableHeaderPrimary: {
    flex: 2,
  },
  queueRowCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    padding: spacing.md,
    gap: 6,
  },
  queueRowHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  queueRowPrimaryText: {
    flex: 1,
    minWidth: 0,
  },
  queueRowTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  queueRowSubtitle: {
    color: colors.subtleText,
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  queueRowBody: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  queueMetaLine: {
    color: colors.subtleText,
    fontSize: 13,
    lineHeight: 18,
  },
  editTag: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: 11,
    color: colors.subtleText,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  editTagButton: {
    borderRadius: 999,
  },
  queuePillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 4,
  },
  statusPill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  calloutBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    marginTop: 4,
  },
  calloutTitle: {
    color: colors.orangeInk,
    fontWeight: "800",
    marginBottom: 4,
  },
  calloutBody: {
    color: colors.ink,
    lineHeight: 19,
  },
  interactionNote: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.navySurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  interactionNoteLabel: {
    color: colors.navyInk,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontSize: 10,
    fontWeight: "800",
  },
  interactionNoteText: {
    color: colors.subtleText,
    lineHeight: 18,
    fontSize: 13,
  },
  emptyStateWrap: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.canvas,
  },
  emptyStateText: {
    color: colors.subtleText,
    lineHeight: 18,
  },
  timelineRow: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    padding: spacing.md,
    gap: spacing.sm,
  },
  timelineRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  timelineRowText: {
    flex: 1,
  },
  timelineTitle: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 15,
  },
  timelineMeta: {
    color: colors.subtleText,
    fontSize: 13,
    marginTop: 2,
  },
  timelineTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.track,
    overflow: "hidden",
  },
  timelineFill: {
    height: "100%",
    backgroundColor: colors.blue,
  },
  subsectionLabel: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 16,
    marginTop: 2,
  },
  subsystemCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    padding: spacing.md,
    gap: 7,
  },
  subsystemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  subsystemExpansion: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  mechanismCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  rosterSection: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rosterSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  memberRow: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  memberRowSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.navySurface,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.navySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarLabel: {
    color: colors.navyInk,
    fontSize: 13,
    fontWeight: "800",
  },
  memberCopy: {
    flex: 1,
  },
  memberName: {
    color: colors.ink,
    fontWeight: "800",
  },
  memberRole: {
    color: colors.subtleText,
    marginTop: 2,
    fontSize: 12,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "88%",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...shadows.card,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
  },
  modalContent: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  modalField: {
    gap: 6,
  },
  modalFieldLabel: {
    color: colors.subtleText,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontWeight: "700",
  },
  modalFieldInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.ink,
    minHeight: 42,
  },
  modalFieldInputMultiline: {
    minHeight: 92,
  },
  toggleField: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleFieldActive: {
    borderColor: colors.blue,
    backgroundColor: colors.navySurface,
  },
  toggleFieldLabel: {
    color: colors.ink,
    fontWeight: "700",
  },
  toggleFieldValue: {
    color: colors.subtleText,
    fontWeight: "700",
  },
  toggleFieldValueActive: {
    color: colors.navyInk,
  },
  modalActions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    alignItems: "center",
  },
  modalDeleteButton: {
    borderRadius: 999,
    backgroundColor: colors.orangeSurface,
    borderWidth: 1,
    borderColor: colors.orange,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginRight: "auto",
  },
  modalDeleteButtonLabel: {
    color: colors.orangeInk,
    fontWeight: "800",
  },
  modalCancelButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  modalCancelButtonLabel: {
    color: colors.subtleText,
    fontWeight: "700",
  },
  modalSaveButton: {
    borderRadius: 999,
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  modalSaveButtonLabel: {
    color: colors.white,
    fontWeight: "800",
  },
});

