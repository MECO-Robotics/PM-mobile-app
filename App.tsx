import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  EVENT_TYPE_OPTIONS,
  EVENT_TYPE_STYLES,
  INVENTORY_VIEW_OPTIONS,
  MANUFACTURING_STATUS_OPTIONS,
  MANUFACTURING_VIEW_OPTIONS,
  MATERIAL_CATEGORY_OPTIONS,
  ACQUISITION_METHOD_OPTIONS,
  PART_SOURCE_OPTIONS,
  PART_STATUS_OPTIONS,
  PURCHASE_APPROVAL_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
  STATUS_LABELS,
  SUBVIEW_INTERACTION_GUIDANCE,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_VIEW_OPTIONS,
  WORKLOG_SORT_OPTIONS,
} from "./src/ui/constants";
import {
  buildDateTime,
  buildManufacturingDraft,
  buildMemberDraft,
  buildMilestoneDraft,
  buildPartDefinitionDraft,
  buildPurchaseDraft,
  buildSubsystemDraft,
  buildTaskDraft,
  buildWorkLogDraft,
  capitalize,
  compareDateTimes,
  datePortion,
  derivePartLifecycleStatus,
  formatDate,
  formatDateTime,
  inferMaterialCategory,
  isoToday,
  localTodayDate,
  splitList,
  timePortion,
  timelineProgress,
} from "./src/ui/helpers";
import { getResponsiveMetrics, scaleFont } from "./src/ui/responsive";
import { styles } from "./src/ui/styles";
import type {
  AcquisitionMethod,
  EditorMode,
  InventoryViewTab,
  ManufacturingDraft,
  ManufacturingViewTab,
  MaterialRollup,
  MemberDraft,
  MilestoneDraft,
  MilestoneSortField,
  NavItem,
  PartDefinitionDraft,
  PurchaseDraft,
  SummaryChipData,
  SubsystemDraft,
  TaskDraft,
  TaskViewTab,
  ViewTab,
  WorkLogDraft,
  WorkLogSortMode,
} from "./src/ui/types";
import {
  EditorModal,
  EmptyState,
  FilterToolbar,
  InteractionNote,
  ModalField,
  OptionChipRow,
  SearchField,
  StatusPill,
  SummaryRow,
  ToggleField,
  WorkspacePanel,
} from "./src/ui/ui";
import { AppThemeProvider } from "./src/ui/themeContext";
import {
  ApiRequestError,
  requestJson,
  resolveApiBaseUrl,
} from "./src/data/api";
import { mecoSnapshot } from "./src/data/mockData";
import type {
  MemberRole,
  ManufacturingItem,
  Event,
  EventType,
  PlatformBootstrapPayload,
  PublicAuthConfig,
  PurchaseItem,
  SessionResponse,
  SessionUser,
  Subsystem,
  Task,
  TaskPriority,
  TaskStatus,
  WorkLog,
} from "./src/types/domain";
import { appThemes, colors } from "./src/theme";

const SWIPE_ACTIVATION_DISTANCE = 18;
const SWIPE_COMMIT_DISTANCE = 52;
const SUBTAB_SWIPE_ACTIVATION_DISTANCE = 24;
const SUBTAB_SWIPE_COMMIT_DISTANCE = 72;

function parseClientError(error: unknown) {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Request failed unexpectedly.";
}

export default function App() {
  const { width } = useWindowDimensions();
  const responsiveMetrics = useMemo(() => getResponsiveMetrics(width), [width]);
  const isCompactLayout = responsiveMetrics.isCompact;
  const isVeryCompactLayout = responsiveMetrics.isVeryCompact;
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);

  const [apiToken, setApiToken] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "connecting" | "connected" | "offline"
  >("connecting");
  const [syncError, setSyncError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ViewTab>("tasks");
  const [taskView, setTaskView] = useState<TaskViewTab>("queue");
  const [manufacturingView, setManufacturingView] =
    useState<ManufacturingViewTab>("cnc");
  const [inventoryView, setInventoryView] = useState<InventoryViewTab>("purchases");
  const [isNavMenuVisible, setIsNavMenuVisible] = useState(false);
  const [isProjectOverlayVisible, setIsProjectOverlayVisible] = useState(false);
  const [isPersonMenuVisible, setIsPersonMenuVisible] = useState(false);
  const [isPeopleFilterVisible, setIsPeopleFilterVisible] = useState(
    () => !isVeryCompactLayout,
  );
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);
  const [activePersonFilter, setActivePersonFilter] = useState("all");

  const [members, setMembers] = useState(() => mecoSnapshot.members);
  const [subsystems, setSubsystems] = useState(() => mecoSnapshot.subsystems);
  const [disciplines, setDisciplines] = useState(() => mecoSnapshot.disciplines);
  const [mechanisms, setMechanisms] = useState(() => mecoSnapshot.mechanisms);
  const [tasks, setTasks] = useState(() => mecoSnapshot.tasks);
  const [events, setEvents] = useState(() => mecoSnapshot.events);
  const [workLogs, setWorkLogs] = useState(() => mecoSnapshot.workLogs);
  const [manufacturingItems, setManufacturingItems] = useState(
    () => mecoSnapshot.manufacturingItems,
  );
  const [purchaseItems, setPurchaseItems] = useState(() => mecoSnapshot.purchaseItems);
  const [partDefinitions, setPartDefinitions] = useState(
    () => mecoSnapshot.partDefinitions,
  );
  const [partInstances, setPartInstances] = useState(() => mecoSnapshot.partInstances);
  const themeMode = isDarkModeEnabled ? "dark" : "light";
  const themeColors = appThemes[themeMode];

  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskSubsystemFilter, setTaskSubsystemFilter] = useState("all");
  const [taskOwnerFilter, setTaskOwnerFilter] = useState("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all");

  const [milestoneSearch, setMilestoneSearch] = useState("");
  const [milestoneTypeFilter, setMilestoneTypeFilter] = useState("all");
  const [milestoneSortField, setMilestoneSortField] =
    useState<MilestoneSortField>("startDateTime");
  const [milestoneSortOrder, setMilestoneSortOrder] = useState<"asc" | "desc">("asc");

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

  const [milestoneEditorMode, setMilestoneEditorMode] = useState<EditorMode | null>(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneDraft>(
    buildMilestoneDraft(),
  );
  const [milestoneStartDate, setMilestoneStartDate] = useState("");
  const [milestoneStartTime, setMilestoneStartTime] = useState("18:00");
  const [milestoneEndDate, setMilestoneEndDate] = useState("");
  const [milestoneEndTime, setMilestoneEndTime] = useState("");
  const [milestoneError, setMilestoneError] = useState<string | null>(null);

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

  const applyBootstrapPayload = useCallback((payload: PlatformBootstrapPayload) => {
    setMembers(payload.members);
    setSubsystems(payload.subsystems);
    setDisciplines(payload.disciplines);
    setMechanisms(payload.mechanisms);
    setTasks(payload.tasks);
    setEvents(payload.events);
    setWorkLogs(payload.workLogs);
    setManufacturingItems(payload.manufacturingItems);
    setPurchaseItems(payload.purchaseItems);
    setPartDefinitions(payload.partDefinitions);
    setPartInstances(payload.partInstances);
  }, []);

  const refreshWorkspaceFromServer = useCallback(
    async (token: string | null) => {
      const payload = await requestJson<PlatformBootstrapPayload>(
        apiBaseUrl,
        "/api/bootstrap",
        undefined,
        token,
      );
      applyBootstrapPayload(payload);
    },
    [apiBaseUrl, applyBootstrapPayload],
  );

  const syncFromBackend = useCallback(async () => {
    setIsSyncing(true);
    setBackendStatus("connecting");
    setSyncError(null);

    try {
      const authConfig = await requestJson<PublicAuthConfig>(
        apiBaseUrl,
        "/api/auth/config",
      );

      let token = process.env.EXPO_PUBLIC_API_TOKEN?.trim() ?? "";
      token = token.length > 0 ? token : "";

      if (!token && authConfig.devBypassAvailable) {
        const session = await requestJson<SessionResponse>(
          apiBaseUrl,
          "/api/auth/dev-bypass",
          { method: "POST" },
        );
        token = session.token;
        setSessionUser(session.user);
      }

      const resolvedToken = token || null;
      setApiToken(resolvedToken);
      await refreshWorkspaceFromServer(resolvedToken);
      setBackendStatus("connected");
    } catch (error) {
      setBackendStatus("offline");
      setSyncError(parseClientError(error));
    } finally {
      setIsSyncing(false);
    }
  }, [apiBaseUrl, refreshWorkspaceFromServer]);

  const runMutation = useCallback(
    async (path: string, init: RequestInit) => {
      setIsSyncing(true);
      setSyncError(null);

      try {
        await requestJson(apiBaseUrl, path, init, apiToken);
        await refreshWorkspaceFromServer(apiToken);
        setBackendStatus("connected");
        return true;
      } catch (error) {
        setBackendStatus("offline");
        setSyncError(parseClientError(error));
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [apiBaseUrl, apiToken, refreshWorkspaceFromServer],
  );

  const membersById = useMemo(() => {
    return Object.fromEntries(
      members.map((member) => [member.id, member]),
    ) as Record<string, (typeof members)[number]>;
  }, [members]);
  const signedInMember = useMemo(() => {
    const sessionName = sessionUser?.name.trim().toLowerCase();
    const sessionEmail = sessionUser?.email.trim().toLowerCase();
    const sessionAccount = sessionUser?.accountId.trim().toLowerCase();
    const sessionMatch = members.find((member) => {
      return (
        member.id.toLowerCase() === sessionAccount ||
        member.name.trim().toLowerCase() === sessionName ||
        member.email?.trim().toLowerCase() === sessionEmail
      );
    });

    if (sessionMatch) {
      return sessionMatch;
    }

    if (selectedMemberId && membersById[selectedMemberId]) {
      return membersById[selectedMemberId];
    }

    if (activePersonFilter !== "all" && membersById[activePersonFilter]) {
      return membersById[activePersonFilter];
    }

    return members[0] ?? null;
  }, [activePersonFilter, members, membersById, selectedMemberId, sessionUser]);
  const canMentorApprove =
    signedInMember?.role === "mentor" ||
    signedInMember?.role === "lead" ||
    signedInMember?.role === "admin";

  const subsystemsById = useMemo(() => {
    return Object.fromEntries(
      subsystems.map((subsystem) => [subsystem.id, subsystem]),
    ) as Record<string, (typeof subsystems)[number]>;
  }, [subsystems]);

  const disciplinesById = useMemo(() => {
    return Object.fromEntries(
      disciplines.map((discipline) => [discipline.id, discipline]),
    ) as Record<string, (typeof disciplines)[number]>;
  }, [disciplines]);

  const mechanismsById = useMemo(() => {
    return Object.fromEntries(
      mechanisms.map((mechanism) => [mechanism.id, mechanism]),
    ) as Record<string, (typeof mechanisms)[number]>;
  }, [mechanisms]);

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
      events.map((event) => [event.id, event]),
    ) as Record<string, (typeof events)[number]>;
  }, [events]);

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
        const ownerName = task.ownerId ? (membersById[task.ownerId]?.name ?? "") : "";
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

  const filteredMilestones = useMemo(() => {
    const search = milestoneSearch.trim().toLowerCase();

    return [...events]
      .filter((event) =>
        milestoneTypeFilter === "all" ? true : event.type === milestoneTypeFilter,
      )
      .filter((event) => {
        if (!search) {
          return true;
        }

        const relatedSubsystemNames = event.relatedSubsystemIds
          .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
          .join(" ")
          .toLowerCase();

        return (
          event.title.toLowerCase().includes(search) ||
          event.description.toLowerCase().includes(search) ||
          relatedSubsystemNames.includes(search)
        );
      })
      .sort((left, right) => {
        const leftValue =
          milestoneSortField === "title"
            ? left.title.toLowerCase()
            : milestoneSortField === "type"
              ? EVENT_TYPE_STYLES[left.type].label
              : left.startDateTime;
        const rightValue =
          milestoneSortField === "title"
            ? right.title.toLowerCase()
            : milestoneSortField === "type"
              ? EVENT_TYPE_STYLES[right.type].label
              : right.startDateTime;

        if (leftValue < rightValue) {
          return milestoneSortOrder === "asc" ? -1 : 1;
        }

        if (leftValue > rightValue) {
          return milestoneSortOrder === "asc" ? 1 : -1;
        }

        return 0;
      });
  }, [
    events,
    milestoneSearch,
    milestoneSortField,
    milestoneSortOrder,
    milestoneTypeFilter,
    subsystemsById,
  ]);

  const milestoneSummary = useMemo(() => {
    const externalCount = filteredMilestones.filter((milestone) => milestone.isExternal).length;

    return [
      { label: "Milestones", value: String(filteredMilestones.length) },
      { label: "External", value: String(externalCount) },
    ] satisfies SummaryChipData[];
  }, [filteredMilestones]);

  const eventOptions = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      name: `${event.title} (${formatDateTime(event.startDateTime)})`,
    }));
  }, [events]);

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
        const requesterName = item.requestedById
          ? (membersById[item.requestedById]?.name ?? "")
          : "";

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
      const reorderPoint = Math.max(1, Math.ceil(openDemand / 2));
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

      const requesterName = item.requestedById
        ? (membersById[item.requestedById]?.name ?? "")
        : "";
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

    for (const mechanism of mechanisms) {
      if (counts[mechanism.subsystemId]) {
        counts[mechanism.subsystemId].mechanisms += 1;
      }
    }

    for (const task of tasks) {
      const bucket = counts[task.subsystemId];
      if (!bucket) {
        continue;
      }

      bucket.tasks += 1;
      if (task.status !== "complete") {
        bucket.openTasks += 1;
      }
    }

    return counts;
  }, [mechanisms, subsystems, tasks]);

  const filteredSubsystems = useMemo(() => {
    const search = subsystemSearch.trim().toLowerCase();

    return subsystems.filter((subsystem) => {
      if (!search) {
        return true;
      }

      const leadName = subsystem.responsibleEngineerId
        ? (membersById[subsystem.responsibleEngineerId]?.name ?? "")
        : "";
      const mentorNames = subsystem.mentorIds
        .map((mentorId) => membersById[mentorId]?.name ?? "")
        .join(" ");
      const mechanismNames = mechanisms
        .filter((mechanism) => mechanism.subsystemId === subsystem.id)
        .map((mechanism) => mechanism.name)
        .join(" ");

      return `${subsystem.name} ${subsystem.description} ${leadName} ${mentorNames} ${mechanismNames} ${subsystem.risks.join(" ")}`
        .toLowerCase()
        .includes(search);
    });
  }, [mechanisms, membersById, subsystemSearch, subsystems]);

  const selectedSubsystem =
    filteredSubsystems.find((subsystem) => subsystem.id === selectedSubsystemId) ?? null;

  const rosterStudents = members.filter((member) => member.role === "student");
  const rosterMentors = members.filter(
    (member) => member.role === "mentor" || member.role === "lead",
  );
  const rosterAdmins = members.filter((member) => member.role === "admin");

  const activeTabLabel = navigationItems.find((item) => item.key === activeTab)?.label ?? "Tasks";
  const activeSubtabOptions = useMemo(() => {
    if (activeTab === "tasks") {
      return TASK_VIEW_OPTIONS;
    }

    if (activeTab === "manufacturing") {
      return MANUFACTURING_VIEW_OPTIONS;
    }

    if (activeTab === "inventory") {
      return INVENTORY_VIEW_OPTIONS;
    }

    return [];
  }, [activeTab]);
  const activeSubtabValue =
    activeTab === "tasks"
      ? taskView
      : activeTab === "manufacturing"
        ? manufacturingView
        : activeTab === "inventory"
          ? inventoryView
          : null;
  const activeSubtabIndex =
    activeSubtabValue === null
      ? -1
      : activeSubtabOptions.findIndex((option) => option.value === activeSubtabValue);
  const hasSubtabPages = activeSubtabOptions.length > 1;
  const syncStatusLabel =
    backendStatus === "connected"
      ? isSyncing
        ? "Syncing"
        : "Backend live"
      : backendStatus === "connecting"
        ? "Connecting"
        : "Backend offline";
  const appResponsiveStyles = useMemo(
    () => ({
      topbar: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        marginHorizontal: responsiveMetrics.gutter,
        paddingHorizontal: responsiveMetrics.panelPadding,
        paddingVertical: responsiveMetrics.isVeryCompact ? 8 : 10,
      },
      navStrip: {
        paddingHorizontal: responsiveMetrics.gutter,
      },
      iconButton: {
        backgroundColor: themeColors.canvas,
        borderColor: themeColors.border,
        minHeight: responsiveMetrics.controlHeight,
        paddingHorizontal: responsiveMetrics.chipPaddingHorizontal,
      },
      iconButtonLabel: {
        color: themeColors.navyInk,
        fontSize: scaleFont(12, responsiveMetrics),
      },
      brandEyebrow: {
        color: themeColors.subtleText,
        fontSize: scaleFont(11, responsiveMetrics),
      },
      brandTitle: {
        color: themeColors.ink,
        fontSize: scaleFont(isCompactLayout ? 16 : 18, responsiveMetrics),
      },
      userChipLabel: {
        fontSize: scaleFont(12, responsiveMetrics),
      },
      shellIconLabel: {
        color: themeColors.navyInk,
        fontSize: scaleFont(14, responsiveMetrics),
      },
      primaryAction: {
        minHeight: responsiveMetrics.controlHeight,
        paddingHorizontal: responsiveMetrics.chipPaddingHorizontal + 4,
      },
      primaryActionLabel: {
        fontSize: scaleFont(13, responsiveMetrics),
      },
      rowCard: {
        backgroundColor: themeColors.canvas,
        borderColor: themeColors.border,
        padding: responsiveMetrics.cardPadding,
      },
      rowTitle: {
        color: themeColors.ink,
        fontSize: scaleFont(15, responsiveMetrics),
      },
      rowSubtitle: {
        color: themeColors.subtleText,
        fontSize: scaleFont(13, responsiveMetrics),
        lineHeight: scaleFont(18, responsiveMetrics),
      },
      rowBody: {
        color: themeColors.ink,
        fontSize: scaleFont(14, responsiveMetrics),
        lineHeight: scaleFont(20, responsiveMetrics),
      },
      metaLine: {
        color: themeColors.subtleText,
        fontSize: scaleFont(13, responsiveMetrics),
        lineHeight: scaleFont(18, responsiveMetrics),
      },
      editTag: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        color: themeColors.subtleText,
      },
      navTab: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      },
      navTabActive: {
        backgroundColor: themeColors.navySurface,
        borderColor: themeColors.blue,
      },
      navLabel: {
        color: themeColors.ink,
      },
      navLabelActive: {
        color: themeColors.navyInk,
      },
      navBubble: {
        backgroundColor: themeColors.canvas,
      },
      navCount: {
        backgroundColor: themeColors.canvas,
      },
      overlayCard: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      },
      navDrawer: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        padding: responsiveMetrics.isVeryCompact ? 12 : responsiveMetrics.panelPadding,
        width: Math.min(width - responsiveMetrics.gutter * 2, 336),
      },
      settingsRow: {
        backgroundColor: themeColors.canvas,
        borderColor: themeColors.border,
      },
      settingsRowActive: {
        backgroundColor: themeColors.navySurface,
        borderColor: themeColors.blue,
      },
      tableHeaderText: {
        color: themeColors.subtleText,
      },
      calloutBox: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      },
      calloutTitle: {
        color: themeColors.orangeInk,
      },
      calloutBody: {
        color: themeColors.ink,
      },
      subsectionLabel: {
        color: themeColors.ink,
      },
      rosterSection: {
        backgroundColor: themeColors.canvas,
        borderColor: themeColors.border,
      },
      memberRow: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      },
      memberRowSelected: {
        backgroundColor: themeColors.navySurface,
        borderColor: themeColors.blue,
      },
      memberAvatar: {
        backgroundColor: themeColors.navySurface,
      },
      quickActionButton: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      },
      quickActionButtonLabel: {
        color: themeColors.navyInk,
        fontSize: scaleFont(12, responsiveMetrics),
      },
    }),
    [isCompactLayout, responsiveMetrics, themeColors, width],
  );
  const editTagStyle = [styles.editTag, appResponsiveStyles.editTag];
  const closeNavigationMenu = useCallback(() => setIsNavMenuVisible(false), []);
  const openNavigationMenu = useCallback(() => setIsNavMenuVisible(true), []);
  const selectNavigationTab = useCallback((tab: ViewTab) => {
    setActiveTab(tab);
    setIsNavMenuVisible(false);
  }, []);
  const selectSubtabByIndex = useCallback(
    (nextIndex: number) => {
      const nextOption = activeSubtabOptions[nextIndex];
      if (!nextOption) {
        return;
      }

      if (activeTab === "tasks") {
        setTaskView(nextOption.value as TaskViewTab);
        return;
      }

      if (activeTab === "manufacturing") {
        setManufacturingView(nextOption.value as ManufacturingViewTab);
        return;
      }

      if (activeTab === "inventory") {
        setInventoryView(nextOption.value as InventoryViewTab);
      }
    },
    [activeSubtabOptions, activeTab],
  );
  const subtabSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => {
          if (!hasSubtabPages) {
            return false;
          }

          const horizontalDistance = Math.abs(gesture.dx);
          return (
            horizontalDistance > SUBTAB_SWIPE_ACTIVATION_DISTANCE &&
            horizontalDistance > Math.abs(gesture.dy) + 20
          );
        },
        onPanResponderRelease: (_event, gesture) => {
          if (!hasSubtabPages || Math.abs(gesture.dx) < SUBTAB_SWIPE_COMMIT_DISTANCE) {
            return;
          }

          if (activeSubtabIndex < 0) {
            return;
          }

          const direction = gesture.dx < 0 ? 1 : -1;
          const nextIndex = Math.max(
            0,
            Math.min(activeSubtabOptions.length - 1, activeSubtabIndex + direction),
          );

          if (nextIndex !== activeSubtabIndex) {
            selectSubtabByIndex(nextIndex);
          }
        },
      }),
    [
      activeSubtabIndex,
      activeSubtabOptions.length,
      hasSubtabPages,
      selectSubtabByIndex,
    ],
  );
  const navigationOpenSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => {
          const horizontalDistance = Math.abs(gesture.dx);
          return (
            horizontalDistance > SWIPE_ACTIVATION_DISTANCE &&
            horizontalDistance > Math.abs(gesture.dy) + 8
          );
        },
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dx) >= SWIPE_COMMIT_DISTANCE) {
            openNavigationMenu();
          }
        },
      }),
    [openNavigationMenu],
  );
  const navigationCloseSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => {
          const horizontalDistance = Math.abs(gesture.dx);
          return (
            horizontalDistance > SWIPE_ACTIVATION_DISTANCE &&
            horizontalDistance > Math.abs(gesture.dy) + 8
          );
        },
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dx) >= SWIPE_COMMIT_DISTANCE) {
            closeNavigationMenu();
          }
        },
      }),
    [closeNavigationMenu],
  );

  useEffect(() => {
    void syncFromBackend();
  }, [syncFromBackend]);

  useEffect(() => {
    if (isVeryCompactLayout) {
      setIsPeopleFilterVisible(false);
    }
  }, [isVeryCompactLayout]);

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
        disciplineId: disciplines[0]?.id ?? "",
        ownerId: members[0]?.id ?? "",
        mentorId:
          members.find((member) => member.role === "mentor" || member.role === "lead")?.id ??
          members[0]?.id ??
          "",
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

  const saveTaskDraft = async () => {
    const blockers = splitList(taskDraft.blockersText);
    const title = taskDraft.title.trim();
    const summary = taskDraft.summary.trim();

    if (!title || !summary || !taskDraft.subsystemId || !taskDraft.ownerId || !taskDraft.mentorId) {
      return;
    }

    const payload = {
      title,
      summary,
      subsystemId: taskDraft.subsystemId,
      disciplineId:
        taskDraft.disciplineId || disciplines[0]?.id || "mechanical",
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

    const isEdit = taskEditorMode === "edit" && activeTaskId;
    const ok = await runMutation(
      isEdit ? `/api/tasks/${activeTaskId}` : "/api/tasks",
      {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );

    if (ok) {
      closeTaskEditor();
    }
  };

  const openCreateMilestoneEditor = () => {
    setMilestoneEditorMode("create");
    setActiveMilestoneId(null);
    setMilestoneDraft(buildMilestoneDraft());
    setMilestoneStartDate(localTodayDate());
    setMilestoneStartTime("18:00");
    setMilestoneEndDate("");
    setMilestoneEndTime("");
    setMilestoneError(null);
  };

  const openEditMilestoneEditor = (event: Event) => {
    setMilestoneEditorMode("edit");
    setActiveMilestoneId(event.id);
    setMilestoneDraft({
      title: event.title,
      type: event.type,
      isExternal: event.isExternal,
      description: event.description,
      relatedSubsystemIdsText: event.relatedSubsystemIds.join(", "),
    });
    setMilestoneStartDate(datePortion(event.startDateTime));
    setMilestoneStartTime(timePortion(event.startDateTime));
    setMilestoneEndDate(event.endDateTime ? datePortion(event.endDateTime) : "");
    setMilestoneEndTime(event.endDateTime ? timePortion(event.endDateTime) : "");
    setMilestoneError(null);
  };

  const closeMilestoneEditor = () => {
    setMilestoneEditorMode(null);
    setActiveMilestoneId(null);
    setMilestoneError(null);
  };

  const saveMilestoneDraft = async () => {
    const title = milestoneDraft.title.trim();

    if (!milestoneStartDate || !title) {
      setMilestoneError("Milestone title and start date are required.");
      return;
    }

    const parsedSubsystemIds = splitList(milestoneDraft.relatedSubsystemIdsText)
      .filter((subsystemId) => subsystemsById[subsystemId]);

    const startDateTime = buildDateTime(
      milestoneStartDate,
      milestoneStartTime || "12:00",
    );
    const hasEnd =
      milestoneEndDate.trim().length > 0 || milestoneEndTime.trim().length > 0;
    const endDateTime = hasEnd
      ? buildDateTime(
          milestoneEndDate.trim() || milestoneStartDate,
          milestoneEndTime.trim() || milestoneStartTime,
        )
      : null;

    if (endDateTime && compareDateTimes(endDateTime, startDateTime) < 0) {
      setMilestoneError("End date/time must be after start date/time.");
      return;
    }

    const payload = {
      title,
      type: milestoneDraft.type,
      startDateTime,
      endDateTime,
      isExternal: milestoneDraft.isExternal,
      description: milestoneDraft.description.trim(),
      relatedSubsystemIds: Array.from(new Set(parsedSubsystemIds)),
    };

    const isEdit = milestoneEditorMode === "edit" && activeMilestoneId;
    const ok = await runMutation(
      isEdit ? `/api/events/${activeMilestoneId}` : "/api/events",
      {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );

    if (ok) {
      closeMilestoneEditor();
    }
  };

  const deleteMilestoneDraft = async () => {
    if (!activeMilestoneId) {
      return;
    }

    const ok = await runMutation(`/api/events/${activeMilestoneId}`, {
      method: "DELETE",
    });

    if (ok) {
      closeMilestoneEditor();
    }
  };

  const deleteTaskDraft = async () => {
    if (!activeTaskId) {
      return;
    }

    const ok = await runMutation(`/api/tasks/${activeTaskId}`, {
      method: "DELETE",
    });

    if (ok) {
      closeTaskEditor();
    }
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

  const saveWorkLogDraft = async () => {
    const participants = splitList(workLogDraft.participantIdsText).filter((participantId) =>
      members.some((member) => member.id === participantId),
    );
    const parsedHours = Number(workLogDraft.hours);

    if (!workLogDraft.taskId || Number.isNaN(parsedHours) || parsedHours <= 0 || participants.length === 0) {
      return;
    }

    const payload = {
      taskId: workLogDraft.taskId,
      date: workLogDraft.date || isoToday(),
      hours: parsedHours,
      participantIds: participants,
      notes: workLogDraft.notes.trim(),
    };

    const isEdit = workLogEditorMode === "edit" && activeWorkLogId;
    const ok = await runMutation(
      isEdit ? `/api/work-logs/${activeWorkLogId}` : "/api/work-logs",
      {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );

    if (ok) {
      closeWorkLogEditor();
    }
  };

  const deleteWorkLogDraft = async () => {
    if (!activeWorkLogId) {
      return;
    }

    const ok = await runMutation(`/api/work-logs/${activeWorkLogId}`, {
      method: "DELETE",
    });

    if (ok) {
      closeWorkLogEditor();
    }
  };

  const openCreateManufacturingEditor = () => {
    const process =
      manufacturingView === "cnc"
        ? "cnc"
        : manufacturingView === "prints"
          ? "3d-print"
          : "fabrication";
    const requesterId = signedInMember?.id ?? members[0]?.id ?? "";

    setActiveManufacturingId(null);
    setManufacturingDraft(
      buildManufacturingDraft(process, {
        subsystemId: subsystems[0]?.id ?? "",
        requestedById: requesterId,
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

  const saveManufacturingDraft = async () => {
    const parsedQty = Number(manufacturingDraft.quantity);

    if (
      !manufacturingDraft.title.trim() ||
      !manufacturingDraft.subsystemId ||
      !manufacturingDraft.requestedById ||
      Number.isNaN(parsedQty) ||
      parsedQty <= 0
    ) {
      return;
    }

    const payload = {
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
    };

    const isEdit = manufacturingEditorMode === "edit" && activeManufacturingId;
    const ok = await runMutation(
      isEdit ? `/api/manufacturing/${activeManufacturingId}` : "/api/manufacturing",
      {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );

    if (ok) {
      closeManufacturingEditor();
    }
  };

  const deleteManufacturingDraft = async () => {
    if (!activeManufacturingId) {
      return;
    }

    const ok = await runMutation(`/api/manufacturing/${activeManufacturingId}`, {
      method: "DELETE",
    });

    if (ok) {
      closeManufacturingEditor();
    }
  };

  const patchManufacturingItem = async (
    item: ManufacturingItem,
    patch: Partial<Pick<ManufacturingItem, "mentorReviewed" | "status">>,
  ) => {
    const nextItem = { ...item, ...patch };

    setManufacturingItems((current) =>
      current.map((manufacturingItem) =>
        manufacturingItem.id === item.id ? nextItem : manufacturingItem,
      ),
    );

    await runMutation(`/api/manufacturing/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: nextItem.title,
        subsystemId: nextItem.subsystemId,
        requestedById: nextItem.requestedById,
        process: nextItem.process,
        dueDate: nextItem.dueDate,
        material: nextItem.material,
        quantity: nextItem.quantity,
        status: nextItem.status,
        mentorReviewed: nextItem.mentorReviewed,
        batchLabel: nextItem.batchLabel,
      }),
    });
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

  const openMaterialRestockEditor = (row: MaterialRollup) => {
    const relatedManufacturingItem = manufacturingItems.find(
      (item) => item.material === row.name && item.status !== "complete",
    );
    const relatedPurchase = purchaseItems.find((item) => {
      const text = `${item.title} ${item.vendor} ${item.linkLabel}`.toLowerCase();
      return row.name
        .toLowerCase()
        .split(" ")
        .some((token) => token.length > 3 && text.includes(token));
    });

    setActivePurchaseId(null);
    setPurchaseDraft(
      buildPurchaseDraft({
        title: `Restock ${row.name}`,
        subsystemId: relatedManufacturingItem?.subsystemId ?? subsystems[0]?.id ?? "",
        requestedById: signedInMember?.id ?? members[0]?.id ?? "",
        quantity: row.reorderPoint,
        vendor: row.vendor === "Mixed" ? "" : row.vendor,
        linkLabel: relatedPurchase?.linkLabel ?? "",
        status: "requested",
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

  const savePurchaseDraft = async () => {
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

    const payload = {
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

    const isEdit = purchaseEditorMode === "edit" && activePurchaseId;
    const ok = await runMutation(
      isEdit ? `/api/purchases/${activePurchaseId}` : "/api/purchases",
      {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );

    if (ok) {
      closePurchaseEditor();
    }
  };

  const deletePurchaseDraft = async () => {
    if (!activePurchaseId) {
      return;
    }

    const ok = await runMutation(`/api/purchases/${activePurchaseId}`, {
      method: "DELETE",
    });

    if (ok) {
      closePurchaseEditor();
    }
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

  const saveMemberDraft = async () => {
    if (!memberDraft.name.trim()) {
      return;
    }

    const payload = {
      name: memberDraft.name.trim(),
      role: memberDraft.role,
    };

    const isEdit = memberEditorMode === "edit" && activeMemberId;
    const ok = await runMutation(
      isEdit ? `/api/members/${activeMemberId}` : "/api/members",
      {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );

    if (ok) {
      closeMemberEditor();
    }
  };

  const deleteMemberDraft = async () => {
    if (!activeMemberId) {
      return;
    }

    const ok = await runMutation(`/api/members/${activeMemberId}`, {
      method: "DELETE",
    });

    if (ok) {
      closeMemberEditor();
    }
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

  const saveSubsystemDraft = async () => {
    const mentors = splitList(subsystemDraft.mentorIdsText).filter((mentorId) =>
      members.some((member) => member.id === mentorId),
    );
    const risks = splitList(subsystemDraft.risksText);
    const name = subsystemDraft.name.trim();
    const description = subsystemDraft.description.trim() || "No description provided.";

    if (!name || !subsystemDraft.responsibleEngineerId) {
      return;
    }

    const payload = {
      name,
      description,
      parentSubsystemId: null,
      responsibleEngineerId: subsystemDraft.responsibleEngineerId,
      mentorIds: mentors,
      risks,
    };

    const isEdit = subsystemEditorMode === "edit" && activeSubsystemId;
    const ok = await runMutation(
      isEdit ? `/api/subsystems/${activeSubsystemId}` : "/api/subsystems",
      {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );

    if (ok) {
      closeSubsystemEditor();
    }
  };

  const deleteSubsystemDraft = async () => {
    if (!activeSubsystemId) {
      return;
    }

    const ok = await runMutation(`/api/subsystems/${activeSubsystemId}`, {
      method: "DELETE",
    });

    if (ok) {
      closeSubsystemEditor();
    }
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

  const createPartAcquisitionWork = async (
    partName: string,
    acquisitionMethod: AcquisitionMethod,
  ) => {
    if (acquisitionMethod === "stock") {
      return;
    }

    const subsystemId = subsystems[0]?.id ?? "";
    const requesterId = signedInMember?.id ?? members[0]?.id ?? "";
    const ownerId = requesterId;
    const mentorId =
      members.find((member) => member.role === "mentor" || member.role === "lead")?.id ??
      requesterId;
    const dueDate = isoToday();

    if (!subsystemId || !requesterId || !ownerId || !mentorId) {
      return;
    }

    if (acquisitionMethod === "manufacture") {
      await runMutation("/api/manufacturing", {
        method: "POST",
        body: JSON.stringify({
          title: `Make ${partName}`,
          subsystemId,
          requestedById: requesterId,
          process: "cnc",
          dueDate,
          material: partDefinitionDraft.source,
          quantity: 1,
          status: "requested",
          mentorReviewed: false,
          batchLabel: undefined,
        }),
      });
    } else {
      await runMutation("/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          title: `Buy ${partName}`,
          subsystemId,
          requestedById: requesterId,
          quantity: 1,
          vendor: partDefinitionDraft.source,
          linkLabel: "n/a",
          estimatedCost: 0,
          approvedByMentor: false,
          status: "requested",
        }),
      });
    }

    await runMutation("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: `Acquire ${partName}`,
        summary:
          acquisitionMethod === "manufacture"
            ? `Manufacture ${partName} and move it through QA.`
            : `Purchase ${partName} and confirm it is ready for installation.`,
        subsystemId,
        disciplineId: disciplines[0]?.id || "mechanical",
        mechanismId: null,
        partInstanceId: null,
        targetEventId: null,
        ownerId,
        mentorId,
        dueDate,
        priority: "medium",
        status: "not-started",
        dependencyIds: [],
        blockers: [],
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        estimatedHours: 0,
        actualHours: 0,
      }),
    });
  };

  const savePartDefinitionDraft = async () => {
    if (!partDefinitionDraft.name.trim() || !partDefinitionDraft.partNumber.trim()) {
      return;
    }

    const partName = partDefinitionDraft.name.trim();
    const payload = {
      name: partName,
      partNumber: partDefinitionDraft.partNumber.trim(),
      revision: partDefinitionDraft.revision.trim() || "A",
      type: partDefinitionDraft.source === "Onshape" ? "custom" : "cots",
      source: partDefinitionDraft.source.trim() || "Onshape",
      description: "",
    };

    const isEdit = partDefinitionEditorMode === "edit" && activePartDefinitionId;
    const ok = await runMutation(
      isEdit
        ? `/api/part-definitions/${activePartDefinitionId}`
        : "/api/part-definitions",
      {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      },
    );

    if (ok) {
      if (!isEdit) {
        await createPartAcquisitionWork(partName, partDefinitionDraft.acquisitionMethod);
      }

      closePartDefinitionEditor();
    }
  };

  const deletePartDefinitionDraft = async () => {
    if (!activePartDefinitionId) {
      return;
    }

    const ok = await runMutation(`/api/part-definitions/${activePartDefinitionId}`, {
      method: "DELETE",
    });

    if (ok) {
      closePartDefinitionEditor();
    }
  };

  const resetWorkspaceData = () => {
    setActivePersonFilter("all");
    closeTaskEditor();
    closeWorkLogEditor();
    closeMilestoneEditor();
    closeManufacturingEditor();
    closePurchaseEditor();
    closeMemberEditor();
    closeSubsystemEditor();
    closePartDefinitionEditor();
    void syncFromBackend();
  };

  const renderTaskTimeline = () => {
    return (
      <WorkspacePanel
        title="Task timeline"
        subtitle="Calendar-ordered milestones and ownership cues for the next execution window."
        actions={
          <Pressable onPress={openCreateTaskEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add task</Text>
          </Pressable>
        }
      >
        <SummaryRow chips={taskSummary} />

        {timelineTasks.map((task) => {
          const progress = timelineProgress(task.status);
          const subsystemName = subsystemsById[task.subsystemId]?.name ?? "Unknown";
          const ownerName = task.ownerId
            ? (membersById[task.ownerId]?.name ?? "Unassigned")
            : "Unassigned";

          return (
            <Pressable
              key={task.id}
              onPress={() => openEditTaskEditor(task)}
              style={[styles.timelineRow, appResponsiveStyles.rowCard]}
            >
              <View style={styles.timelineRowHeader}>
                <View style={styles.timelineRowText}>
                  <Text style={[styles.timelineTitle, appResponsiveStyles.rowTitle]}>{task.title}</Text>
                  <Text style={[styles.timelineMeta, appResponsiveStyles.metaLine]}>
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

        <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.timeline} />
      </WorkspacePanel>
    );
  };

  const renderTaskQueue = () => {
    return (
      <WorkspacePanel
        title="Task queue"
        subtitle="Search and filter queue cards to keep ownership, due dates, and QA state in view."
        actions={
          <Pressable onPress={openCreateTaskEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add</Text>
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

        {!isCompactLayout ? (
          <View style={styles.tableHeaderRow}>
            <Text
              style={[
                styles.tableHeaderText,
                styles.tableHeaderPrimary,
                appResponsiveStyles.tableHeaderText,
              ]}
            >
              Task
            </Text>
            <Text style={[styles.tableHeaderText, appResponsiveStyles.tableHeaderText]}>Owner</Text>
            <Text style={[styles.tableHeaderText, appResponsiveStyles.tableHeaderText]}>Due</Text>
            <Text style={[styles.tableHeaderText, appResponsiveStyles.tableHeaderText]}>Status</Text>
          </View>
        ) : null}

        {filteredTaskQueue.map((task) => {
          const subsystemName = subsystemsById[task.subsystemId]?.name ?? "Unknown";
          const ownerName = task.ownerId
            ? (membersById[task.ownerId]?.name ?? "Unassigned")
            : "Unassigned";
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
              style={[styles.queueRowCard, appResponsiveStyles.rowCard]}
            >
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{task.title}</Text>
                  <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                    {subsystemName} - {disciplineName}
                  </Text>
                </View>
                <Text style={editTagStyle}>EDIT</Text>
              </View>

              <Text style={[styles.queueRowBody, appResponsiveStyles.rowBody]}>{task.summary}</Text>

              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Owner {ownerName} | Due {formatDate(task.dueDate)} | Event {targetEvent}
              </Text>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
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
                <View style={[styles.calloutBox, appResponsiveStyles.calloutBox]}>
                  <Text style={[styles.calloutTitle, appResponsiveStyles.calloutTitle]}>Blockers</Text>
                  <Text style={[styles.calloutBody, appResponsiveStyles.calloutBody]}>{task.blockers.join(" | ")}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}

        {filteredTaskQueue.length === 0 ? <EmptyState text="No tasks match the current filters." /> : null}

        <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.queue} />
      </WorkspacePanel>
    );
  };

  const renderTaskMilestones = () => {
    const milestoneTypeOptions = EVENT_TYPE_OPTIONS.map((option) => ({
      id: option.id,
      name: option.name,
    }));

    const getMilestoneSortIcon = (field: MilestoneSortField) => {
      if (milestoneSortField !== field) {
        return "";
      }

      return milestoneSortOrder === "asc" ? " ^" : " v";
    };

    const toggleMilestoneSort = (field: MilestoneSortField) => {
      if (milestoneSortField === field) {
        setMilestoneSortOrder((current) => (current === "asc" ? "desc" : "asc"));
        return;
      }

      setMilestoneSortField(field);
      setMilestoneSortOrder("asc");
    };

    return (
      <WorkspacePanel
        title="Milestones"
        subtitle="Search, filter, and edit timeline events with subsystem context and linked task impact."
        actions={
          <Pressable onPress={openCreateMilestoneEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add</Text>
          </Pressable>
        }
      >
        <FilterToolbar>
          <SearchField
            onChangeText={setMilestoneSearch}
            placeholder="Search milestones"
            value={milestoneSearch}
          />

          <OptionChipRow
            allLabel="All types"
            onChange={setMilestoneTypeFilter}
            options={milestoneTypeOptions}
            value={milestoneTypeFilter}
          />

        </FilterToolbar>

        <SummaryRow chips={milestoneSummary} />

        {!isCompactLayout ? (
          <View style={styles.tableHeaderRow}>
            <Pressable
              onPress={() => toggleMilestoneSort("title")}
              style={styles.tableHeaderButtonPrimary}
            >
              <Text
                style={[
                  styles.tableHeaderText,
                  styles.tableHeaderPrimary,
                  appResponsiveStyles.tableHeaderText,
                ]}
              >
                Milestone{getMilestoneSortIcon("title")}
              </Text>
            </Pressable>
            <Pressable onPress={() => toggleMilestoneSort("type")} style={styles.tableHeaderButton}>
              <Text style={[styles.tableHeaderText, appResponsiveStyles.tableHeaderText]}>Type{getMilestoneSortIcon("type")}</Text>
            </Pressable>
            <Pressable
              onPress={() => toggleMilestoneSort("startDateTime")}
              style={styles.tableHeaderButton}
            >
              <Text style={[styles.tableHeaderText, appResponsiveStyles.tableHeaderText]}>
                Start{getMilestoneSortIcon("startDateTime")}
              </Text>
            </Pressable>
            <Text style={[styles.tableHeaderText, appResponsiveStyles.tableHeaderText]}>End</Text>
            <Text style={[styles.tableHeaderText, appResponsiveStyles.tableHeaderText]}>Subsystems</Text>
          </View>
        ) : null}

        {filteredMilestones.map((milestone) => {
          const eventStyle = EVENT_TYPE_STYLES[milestone.type];
          const subsystemNames = milestone.relatedSubsystemIds
            .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "Unknown subsystem")
            .join(", ");

          return (
            <Pressable
              key={milestone.id}
              onPress={() => openEditMilestoneEditor(milestone)}
              style={[styles.queueRowCard, appResponsiveStyles.rowCard]}
            >
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{milestone.title}</Text>
                  <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                    {milestone.description || "No description provided."}
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: eventStyle.borderColor,
                    backgroundColor: eventStyle.chipBackground,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: eventStyle.chipText, fontSize: 11, fontWeight: "700" }}>
                    {eventStyle.label}
                  </Text>
                </View>
              </View>

              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Start {formatDateTime(milestone.startDateTime)} | End{" "}
                {milestone.endDateTime ? formatDateTime(milestone.endDateTime) : "No end"}
              </Text>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Subsystems {subsystemNames || "All subsystems"} | {milestone.isExternal ? "External" : "Internal"}
              </Text>
            </Pressable>
          );
        })}

        {filteredMilestones.length === 0 ? (
          <EmptyState text="No milestones match the current filters." />
        ) : null}

        <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.milestones} />
      </WorkspacePanel>
    );
  };

  const renderTasks = () => {
    return (
      <>
        {taskView === "timeline"
          ? renderTaskTimeline()
          : taskView === "queue"
            ? renderTaskQueue()
            : renderTaskMilestones()}
      </>
    );
  };

  const renderWorkLogs = () => {
    return (
      <WorkspacePanel
        title="Work logs"
        subtitle="Search by task or notes, then verify hours, participants, and linked subsystem impact."
        actions={
          <Pressable onPress={openCreateWorkLogEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add</Text>
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
              style={[styles.queueRowCard, appResponsiveStyles.rowCard]}
            >
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{formatDate(workLog.date)}</Text>
                  <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>{workLog.hours.toFixed(1)}h logged</Text>
                </View>
                <Text style={editTagStyle}>OPEN</Text>
              </View>

              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>Task: {task?.title ?? "Missing task"}</Text>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>Subsystem: {subsystemName}</Text>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>People: {people.join(", ") || "Unassigned"}</Text>
              <Text style={[styles.queueRowBody, appResponsiveStyles.rowBody]}>{workLog.notes || "No notes recorded."}</Text>
            </Pressable>
          );
        })}

        {filteredWorkLogs.length === 0 ? <EmptyState text="No work logs match the current filters." /> : null}

        <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.worklogs} />
      </WorkspacePanel>
    );
  };

  const renderManufacturing = () => {
    const title =
      manufacturingView === "cnc"
        ? "CNC"
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
        <WorkspacePanel
          title={title}
          subtitle="Unified manufacturing rows for part, material, quantity, due date, status, and mentor review."
          actions={
            <Pressable onPress={openCreateManufacturingEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
              <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add</Text>
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
            const requesterName = item.requestedById
              ? (membersById[item.requestedById]?.name ?? "Unassigned")
              : "Unassigned";
            const canApproveItem = canMentorApprove && !item.mentorReviewed;
            const canStartItem =
              item.mentorReviewed &&
              (item.status === "requested" || item.status === "approved");
            const canCompleteItem = item.status !== "complete";

            return (
              <Pressable
                key={item.id}
                onPress={() => openEditManufacturingEditor(item)}
                style={[styles.queueRowCard, appResponsiveStyles.rowCard]}
              >
                <View style={styles.queueRowHeader}>
                  <View style={styles.queueRowPrimaryText}>
                    <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{item.title}</Text>
                    <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                      {subsystemName} - {requesterName}
                    </Text>
                  </View>
                  <Text style={editTagStyle}>EDIT</Text>
                </View>

                <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                  Material {item.material} | Qty {item.quantity} | Due {formatDate(item.dueDate)}
                </Text>
                <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                  Batch {item.batchLabel ?? "Unbatched"} | Mentor {item.mentorReviewed ? "Reviewed" : "Pending"}
                </Text>

                <View style={styles.queuePillRow}>
                  <StatusPill label={item.status.replace("-", " ")} value={item.status} />
                  <StatusPill label={item.process === "3d-print" ? "3D print" : item.process} value="info" />
                </View>

                <View style={styles.quickActionRow}>
                  {canApproveItem ? (
                    <Pressable
                      onPress={() =>
                        patchManufacturingItem(item, {
                          mentorReviewed: true,
                          status: item.status === "requested" ? "approved" : item.status,
                        })
                      }
                      style={[
                        styles.quickActionButton,
                        appResponsiveStyles.quickActionButton,
                        styles.quickActionButtonPrimary,
                      ]}
                    >
                      <Text style={styles.quickActionButtonPrimaryLabel}>Approve</Text>
                    </Pressable>
                  ) : null}

                  {canStartItem ? (
                    <Pressable
                      onPress={() =>
                        patchManufacturingItem(item, {
                          status: item.status === "qa" ? "qa" : "in-progress",
                        })
                      }
                      style={[styles.quickActionButton, appResponsiveStyles.quickActionButton]}
                    >
                      <Text style={[styles.quickActionButtonLabel, appResponsiveStyles.quickActionButtonLabel]}>
                        Start
                      </Text>
                    </Pressable>
                  ) : null}

                  {item.status === "in-progress" ? (
                    <Pressable
                      onPress={() => patchManufacturingItem(item, { status: "qa" })}
                      style={[styles.quickActionButton, appResponsiveStyles.quickActionButton]}
                    >
                      <Text style={[styles.quickActionButtonLabel, appResponsiveStyles.quickActionButtonLabel]}>
                        QA
                      </Text>
                    </Pressable>
                  ) : null}

                  {canCompleteItem ? (
                    <Pressable
                      onPress={() =>
                        patchManufacturingItem(item, {
                          mentorReviewed: true,
                          status: "complete",
                        })
                      }
                      style={[styles.quickActionButton, appResponsiveStyles.quickActionButton]}
                    >
                      <Text style={[styles.quickActionButtonLabel, appResponsiveStyles.quickActionButtonLabel]}>
                        Complete
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
            );
          })}

          {filteredManufacturing.length === 0 ? (
            <EmptyState text="No manufacturing items match the current filters." />
          ) : null}

          <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE[guidanceKey]} />
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
          <Pressable onPress={openCreatePurchaseEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Restock</Text>
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
          <View key={row.id} style={[styles.queueRowCard, appResponsiveStyles.rowCard]}>
            <View style={styles.queueRowHeader}>
              <View style={styles.queueRowPrimaryText}>
                <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{row.name}</Text>
                <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                  {capitalize(row.category)} - vendor {row.vendor}
                </Text>
              </View>
              <Pressable
                onPress={() => openMaterialRestockEditor(row)}
                style={[
                  styles.quickActionButton,
                  appResponsiveStyles.quickActionButton,
                  styles.quickActionButtonPrimary,
                ]}
              >
                <Text style={styles.quickActionButtonPrimaryLabel}>Restock</Text>
              </Pressable>
            </View>

            <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
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

        <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.materials} />
      </WorkspacePanel>
    );
  };

  const renderInventoryParts = () => {
    const partDefinitionStatsById = Object.fromEntries(
      partDefinitions.map((partDefinition) => {
        const matchingInstances = partInstancesWithStatus.filter(
          ({ partInstance }) => partInstance.partDefinitionId === partDefinition.id,
        );
        const count = matchingInstances.reduce(
          (sum, { partInstance }) => sum + partInstance.quantity,
          0,
        );
        const spares = matchingInstances
          .filter(({ status }) => status === "available")
          .reduce((sum, { partInstance }) => sum + partInstance.quantity, 0);

        return [partDefinition.id, { count, spares }];
      }),
    ) as Record<string, { count: number; spares: number }>;
    const visibleInstanceCount = filteredPartInstances.reduce(
      (sum, { partInstance }) => sum + partInstance.quantity,
      0,
    );
    const visibleSpareCount = filteredPartInstances
      .filter(({ status }) => status === "available")
      .reduce((sum, { partInstance }) => sum + partInstance.quantity, 0);

    return (
      <WorkspacePanel
        title="Part manager"
        subtitle="Definition catalog on top with subsystem part instances and lifecycle state below."
        actions={
          <Pressable onPress={openCreatePartDefinitionEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add</Text>
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

        <SummaryRow
          chips={[
            { label: "Definitions", value: String(filteredPartDefinitions.length) },
            { label: "Instances", value: String(visibleInstanceCount) },
            { label: "Spares", value: String(visibleSpareCount) },
          ]}
        />

        <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>Part definitions</Text>
        {filteredPartDefinitions.map((partDefinition) => {
          const stats = partDefinitionStatsById[partDefinition.id] ?? {
            count: 0,
            spares: 0,
          };

          return (
            <Pressable
              key={partDefinition.id}
              onPress={() => openEditPartDefinitionEditor(partDefinition.id)}
              style={[styles.queueRowCard, appResponsiveStyles.rowCard]}
            >
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{partDefinition.name}</Text>
                  <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                    {partDefinition.partNumber} - rev {partDefinition.revision}
                  </Text>
                </View>
                <Text style={editTagStyle}>EDIT</Text>
              </View>

              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Source {partDefinition.source} | Count {stats.count} | Spares {stats.spares}
              </Text>
            </Pressable>
          );
        })}

        <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>Part instances</Text>
        {filteredPartInstances.map(({ partInstance, status }) => {
          const definition = partDefinitionsById[partInstance.partDefinitionId];
          const mechanismName = partInstance.mechanismId
            ? (mechanismsById[partInstance.mechanismId]?.name ?? "Unknown mechanism")
            : "Unassigned";
          const subsystemName = subsystemsById[partInstance.subsystemId]?.name ?? "Unknown";

          return (
            <View key={partInstance.id} style={[styles.queueRowCard, appResponsiveStyles.rowCard]}>
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{partInstance.name}</Text>
                  <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                    {definition?.name ?? "Unknown definition"} - {subsystemName}
                  </Text>
                </View>
                <StatusPill label={status} value={status} />
              </View>

              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Mechanism {mechanismName} | Qty {partInstance.quantity}
              </Text>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Tracking {partInstance.trackIndividually ? "Individual" : "Bulk"}
              </Text>
            </View>
          );
        })}

        {filteredPartDefinitions.length === 0 && filteredPartInstances.length === 0 ? (
          <EmptyState text="No parts match the current filters." />
        ) : null}

        <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.parts} />
      </WorkspacePanel>
    );
  };

  const renderInventoryPurchases = () => {
    return (
      <WorkspacePanel
        title="Purchase list"
        subtitle="Review request status, vendor, mentor approval, and cost deltas in one queue."
        actions={
          <Pressable onPress={openCreatePurchaseEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add</Text>
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
          const requesterName = item.requestedById
            ? (membersById[item.requestedById]?.name ?? "Unassigned")
            : "Unassigned";

          return (
            <Pressable
              key={item.id}
              onPress={() => openEditPurchaseEditor(item)}
              style={[styles.queueRowCard, appResponsiveStyles.rowCard]}
            >
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{item.title}</Text>
                  <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                    {subsystemName} - requester {requesterName}
                  </Text>
                </View>
                <Text style={editTagStyle}>EDIT</Text>
              </View>

              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Vendor {item.vendor} | Qty {item.quantity}
              </Text>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
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

        <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.purchases} />
      </WorkspacePanel>
    );
  };

  const renderInventory = () => {
    return (
      <>
        {inventoryView === "materials"
          ? renderInventoryMaterials()
          : inventoryView === "parts"
            ? renderInventoryParts()
            : renderInventoryPurchases()}
      </>
    );
  };

  const renderSubsystems = () => {
    const visibleMechanismCount = mechanisms.filter((mechanism) => {
      return filteredSubsystems.some((subsystem) => subsystem.id === mechanism.subsystemId);
    }).length;

    return (
      <WorkspacePanel
        title="Subsystem manager"
        subtitle="Review ownership, risk, and mechanism coverage with expandable subsystem cards."
        actions={
          <Pressable onPress={openCreateSubsystemEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add subsystem</Text>
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
          const subsystemMechanisms = mechanisms.filter(
            (mechanism) => mechanism.subsystemId === subsystem.id,
          );

          return (
            <View key={subsystem.id} style={[styles.subsystemCard, appResponsiveStyles.rowCard]}>
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
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{subsystem.name}</Text>
                  <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                    Lead{" "}
                    {subsystem.responsibleEngineerId
                      ? (membersById[subsystem.responsibleEngineerId]?.name ?? "Unassigned")
                      : "Unassigned"}{" "}
                    - Mentors {mentorNames || "None"}
                  </Text>
                </View>
                <Text style={editTagStyle}>{isSelected ? "HIDE" : "OPEN"}</Text>
              </Pressable>

              <Text style={[styles.queueRowBody, appResponsiveStyles.rowBody]}>{subsystem.description}</Text>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
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
                    <View key={mechanism.id} style={[styles.mechanismCard, appResponsiveStyles.rowCard]}>
                      <View style={styles.queueRowHeader}>
                        <View style={styles.queueRowPrimaryText}>
                          <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{mechanism.name}</Text>
                          <Text style={[styles.queueRowBody, appResponsiveStyles.rowBody]}>{mechanism.description}</Text>
                        </View>
                        <Text style={editTagStyle}>EDIT</Text>
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

        <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.subsystems} />
      </WorkspacePanel>
    );
  };

  const renderRosterSection = (
    title: string,
    memberList: (typeof members)[number][],
  ) => {
    return (
      <View style={[styles.rosterSection, appResponsiveStyles.rosterSection]}>
        <View style={styles.rosterSectionHeader}>
          <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>{title}</Text>
          <View style={[styles.sidebarCountPill, appResponsiveStyles.navCount]}>
            <Text style={[styles.sidebarCountLabel, { color: themeColors.ink }]}>{memberList.length}</Text>
          </View>
        </View>

        {memberList.map((member) => {
          const isSelected = selectedMemberId === member.id;

          return (
            <Pressable
              key={member.id}
              onPress={() => setSelectedMemberId(member.id)}
              onLongPress={() => openEditMemberEditor(member.id)}
              style={[
                styles.memberRow,
                appResponsiveStyles.memberRow,
                isSelected && [styles.memberRowSelected, appResponsiveStyles.memberRowSelected],
              ]}
            >
              <View style={[styles.memberAvatar, appResponsiveStyles.memberAvatar]}>
                <Text style={[styles.memberAvatarLabel, { color: themeColors.navyInk }]}>{member.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.memberCopy}>
                <Text style={[styles.memberName, { color: themeColors.ink }]}>{member.name}</Text>
                <Text style={[styles.memberRole, { color: themeColors.subtleText }]}>{capitalize(member.role)}</Text>
              </View>
              <Pressable onPress={() => openEditMemberEditor(member.id)} style={styles.editTagButton}>
                <Text style={editTagStyle}>EDIT</Text>
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
          <Pressable onPress={openCreateMemberEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add person</Text>
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

        <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.roster} />
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
    const disciplineOptions = disciplines.map((discipline) => ({
      id: discipline.id,
      name: discipline.name,
    }));
    const mechanismOptions = mechanisms
      .filter((mechanism) => mechanism.subsystemId === taskDraft.subsystemId)
      .map((mechanism) => ({
        id: mechanism.id,
        name: mechanism.name,
      }));
    const mechanismAndTaskPartOptions = taskDraft.mechanismId
      ? partInstances
          .filter((partInstance) => partInstance.mechanismId === taskDraft.mechanismId)
          .map((partInstance) => ({
            id: partInstance.id,
            name: `${partInstance.name} (${partDefinitionsById[partInstance.partDefinitionId]?.name ?? "part"})`,
          }))
      : [];

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
              setTaskDraft((current) => {
                const subsystemId = value === "all" ? "" : value;
                const nextMechanisms = mechanisms.filter(
                  (mechanism) => mechanism.subsystemId === subsystemId,
                );
                const mechanismId = nextMechanisms[0]?.id ?? null;
                const partInstanceId = mechanismId
                  ? partInstances.find((partInstance) => partInstance.mechanismId === mechanismId)
                      ?.id ?? null
                  : null;

                return {
                  ...current,
                  subsystemId,
                  mechanismId,
                  partInstanceId,
                };
              })
            }
            options={subsystemOptions}
            value={taskDraft.subsystemId || "all"}
          />
          <OptionChipRow
            allLabel="Discipline"
            onChange={(value) =>
              setTaskDraft((current) => ({ ...current, disciplineId: value === "all" ? "" : value }))
            }
            options={disciplineOptions}
            value={taskDraft.disciplineId || "all"}
          />
          <OptionChipRow
            allLabel="Mechanism"
            onChange={(value) =>
              setTaskDraft((current) => {
                const mechanismId = value === "all" ? null : value;
                const partInstanceId = mechanismId
                  ? partInstances.find((partInstance) => partInstance.mechanismId === mechanismId)
                      ?.id ?? null
                  : null;

                return {
                  ...current,
                  mechanismId,
                  partInstanceId,
                };
              })
            }
            options={mechanismOptions}
            value={taskDraft.mechanismId || "all"}
          />
          <OptionChipRow
            allLabel="Part instance"
            onChange={(value) =>
              setTaskDraft((current) => ({
                ...current,
                partInstanceId: value === "all" ? null : value,
              }))
            }
            options={mechanismAndTaskPartOptions}
            value={taskDraft.partInstanceId || "all"}
          />
          <OptionChipRow
            allLabel="Target event"
            onChange={(value) =>
              setTaskDraft((current) => ({
                ...current,
                targetEventId: value === "all" ? null : value,
              }))
            }
            options={eventOptions}
            value={taskDraft.targetEventId || "all"}
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
          <View style={styles.modalField}>
            <Text style={styles.modalFieldLabel}>Traceability</Text>
            <Text style={styles.modalFieldInput}>
              {`${subsystemsById[taskDraft.subsystemId]?.name ?? "No subsystem"} / `}
              {`${disciplinesById[taskDraft.disciplineId]?.name ?? "No discipline"} / `}
              {`${taskDraft.mechanismId ? mechanismsById[taskDraft.mechanismId]?.name : "No mechanism"} / `}
              {`${taskDraft.partInstanceId ? partInstancesById[taskDraft.partInstanceId]?.name : "No part instance"} / `}
              {`${taskDraft.targetEventId ? eventsById[taskDraft.targetEventId]?.title : "No event"}`}
            </Text>
          </View>
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
          onCancel={closeMilestoneEditor}
          onDelete={milestoneEditorMode === "edit" ? deleteMilestoneDraft : undefined}
          onSave={saveMilestoneDraft}
          saveLabel={milestoneEditorMode === "edit" ? "Update milestone" : "Create milestone"}
          title={milestoneEditorMode === "edit" ? "Edit milestone" : "Create milestone"}
          visible={Boolean(milestoneEditorMode)}
        >
          <ModalField
            label="Title"
            onChangeText={(value) =>
              setMilestoneDraft((current) => ({ ...current, title: value }))
            }
            placeholder="Milestone title"
            value={milestoneDraft.title}
          />
          <OptionChipRow
            allLabel="Type"
            onChange={(value) =>
              setMilestoneDraft((current) => ({
                ...current,
                type: value === "all" ? "internal-review" : (value as EventType),
              }))
            }
            options={EVENT_TYPE_OPTIONS}
            value={milestoneDraft.type}
          />
          <ModalField
            label="Start date (YYYY-MM-DD)"
            onChangeText={(value) => setMilestoneStartDate(value)}
            placeholder={localTodayDate()}
            value={milestoneStartDate}
          />
          <ModalField
            label="Start time (HH:mm)"
            onChangeText={(value) => setMilestoneStartTime(value)}
            placeholder="18:00"
            value={milestoneStartTime}
          />
          <ModalField
            label="End date (optional, YYYY-MM-DD)"
            onChangeText={(value) => setMilestoneEndDate(value)}
            placeholder="2026-04-30"
            value={milestoneEndDate}
          />
          <ModalField
            label="End time (optional, HH:mm)"
            onChangeText={(value) => setMilestoneEndTime(value)}
            placeholder="20:00"
            value={milestoneEndTime}
          />
          <ModalField
            label="Description"
            multiline
            onChangeText={(value) =>
              setMilestoneDraft((current) => ({ ...current, description: value }))
            }
            placeholder="Milestone details"
            value={milestoneDraft.description}
          />
          <ModalField
            label="Related subsystem IDs (comma separated)"
            onChangeText={(value) =>
              setMilestoneDraft((current) => ({
                ...current,
                relatedSubsystemIdsText: value,
              }))
            }
            placeholder="drive, controls"
            value={milestoneDraft.relatedSubsystemIdsText}
          />
          <ToggleField
            label="External milestone"
            onToggle={(value) =>
              setMilestoneDraft((current) => ({ ...current, isExternal: value }))
            }
            value={milestoneDraft.isExternal}
          />

          {milestoneError ? <Text style={{ color: colors.orangeInk }}>{milestoneError}</Text> : null}
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
          {manufacturingEditorMode === "create" ? (
            <View style={styles.modalField}>
              <Text style={[styles.modalFieldLabel, { color: themeColors.subtleText }]}>
                Requester
              </Text>
              <Text
                style={[
                  styles.modalFieldInput,
                  {
                    backgroundColor: themeColors.canvas,
                    borderColor: themeColors.border,
                    color: themeColors.ink,
                  },
                ]}
              >
                {membersById[manufacturingDraft.requestedById]?.name ??
                  signedInMember?.name ??
                  "Signed-in person"}
              </Text>
            </View>
          ) : (
            <>
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
            </>
          )}
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
          {manufacturingEditorMode === "edit" ? (
            <ToggleField
              label="Mentor reviewed"
              onToggle={(value) =>
                setManufacturingDraft((current) => ({ ...current, mentorReviewed: value }))
              }
              value={manufacturingDraft.mentorReviewed}
            />
          ) : null}
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
            label="Acquisition website"
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
          <OptionChipRow
            allLabel="Source"
            onChange={(value) =>
              setPartDefinitionDraft((current) => ({
                ...current,
                source: value === "all" ? "Onshape" : value,
                acquisitionMethod:
                  value === "FRC Supplier" || value === "COTS"
                    ? "purchase"
                    : current.acquisitionMethod,
              }))
            }
            options={PART_SOURCE_OPTIONS}
            value={partDefinitionDraft.source || "Onshape"}
          />
          {partDefinitionEditorMode === "create" ? (
            <OptionChipRow
              allLabel="Acquisition method"
              onChange={(value) =>
                setPartDefinitionDraft((current) => ({
                  ...current,
                  acquisitionMethod: (value === "all"
                    ? "manufacture"
                    : value) as AcquisitionMethod,
                }))
              }
              options={ACQUISITION_METHOD_OPTIONS}
              value={partDefinitionDraft.acquisitionMethod}
            />
          ) : null}
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
              { id: "lead", name: "Lead" },
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

  const renderNavigationMenu = () => (
    <Modal
      animationType="fade"
      onRequestClose={closeNavigationMenu}
      transparent
      visible={isNavMenuVisible}
    >
      <Pressable onPress={closeNavigationMenu} style={styles.navDrawerScrim}>
        <Pressable
          accessibilityRole="menu"
          onPress={() => undefined}
          style={[styles.navDrawer, appResponsiveStyles.navDrawer]}
          {...navigationCloseSwipeResponder.panHandlers}
        >
          <View style={styles.navDrawerHeader}>
            <View>
              <Text style={[styles.navDrawerTitle, { color: themeColors.ink }]}>
                Workspace
              </Text>
              <Text style={[styles.navDrawerSubtitle, { color: themeColors.subtleText }]}>
                {activeTabLabel}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close navigation"
              accessibilityRole="button"
              onPress={closeNavigationMenu}
              style={[styles.navDrawerCloseButton, appResponsiveStyles.iconButton]}
            >
              <Text style={[styles.navDrawerCloseLabel, { color: themeColors.navyInk }]}>
                X
              </Text>
            </Pressable>
          </View>

          <View style={styles.navDrawerList}>
            {navigationItems.map((item) => {
              const isActive = activeTab === item.key;

              return (
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isActive }}
                  key={item.key}
                  onPress={() => selectNavigationTab(item.key)}
                  style={[
                    styles.navDrawerItem,
                    appResponsiveStyles.navTab,
                    isActive && [styles.navDrawerItemActive, appResponsiveStyles.navTabActive],
                  ]}
                >
                  <View
                    style={[
                      styles.sidebarIconBubble,
                      appResponsiveStyles.navBubble,
                      isActive && styles.sidebarIconBubbleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sidebarIconLabel,
                        { color: themeColors.navyInk },
                        isActive && styles.sidebarIconLabelActive,
                      ]}
                    >
                      {item.shortLabel}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.navDrawerItemLabel,
                      { color: themeColors.ink },
                      isActive && { color: themeColors.navyInk },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <View
                    style={[
                      styles.sidebarCountPill,
                      appResponsiveStyles.navCount,
                      isActive && styles.sidebarCountPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sidebarCountLabel,
                        { color: themeColors.ink },
                        isActive && styles.sidebarCountLabelActive,
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderProjectOverlay = () => (
    <Modal
      animationType="fade"
      onRequestClose={() => setIsProjectOverlayVisible(false)}
      transparent
      visible={isProjectOverlayVisible}
    >
      <Pressable
        onPress={() => setIsProjectOverlayVisible(false)}
        style={styles.overlayScrim}
      >
        <Pressable onPress={() => undefined} style={[styles.overlayCard, appResponsiveStyles.overlayCard]}>
          <View style={styles.overlayHeader}>
            <View style={[styles.projectMark, { backgroundColor: themeColors.navySurface }]}>
              <Text style={[styles.projectMarkLabel, { color: themeColors.navyInk }]}>RB</Text>
            </View>
            <View style={styles.overlayHeaderCopy}>
              <Text style={[styles.overlayTitle, { color: themeColors.ink }]}>MECO Robotics</Text>
              <Text style={[styles.overlaySubtitle, { color: themeColors.subtleText }]}>Robot project selector</Text>
            </View>
          </View>

          <Text style={[styles.overlayBody, { color: themeColors.ink }]}>
            Tap this project chip from the top bar to inspect or edit the active robot
            workspace without leaving the current view.
          </Text>

          <View style={styles.overlayActionRow}>
            <Pressable style={styles.overlayActionButton}>
              <Text style={styles.overlayActionLabel}>Edit robot</Text>
            </Pressable>
            <Pressable
              style={[
                styles.overlaySecondaryButton,
                { backgroundColor: themeColors.canvas, borderColor: themeColors.border },
              ]}
            >
              <Text style={[styles.overlaySecondaryLabel, { color: themeColors.navyInk }]}>Switch project</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderPersonMenu = () => (
    <Modal
      animationType="fade"
      onRequestClose={() => setIsPersonMenuVisible(false)}
      transparent
      visible={isPersonMenuVisible}
    >
      <Pressable onPress={() => setIsPersonMenuVisible(false)} style={styles.overlayScrim}>
        <Pressable onPress={() => undefined} style={[styles.overlayCard, appResponsiveStyles.overlayCard]}>
          <View style={styles.overlayHeader}>
            <View style={[styles.personMark, { backgroundColor: themeColors.navySurface }]}>
              <Text style={[styles.personMarkLabel, { color: themeColors.navyInk }]}>ME</Text>
            </View>
            <View style={styles.overlayHeaderCopy}>
              <Text style={[styles.overlayTitle, { color: themeColors.ink }]}>Personal settings</Text>
              <Text style={[styles.overlaySubtitle, { color: themeColors.subtleText }]}>{syncStatusLabel}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setIsDarkModeEnabled((current) => !current)}
            style={[
              styles.settingsRow,
              appResponsiveStyles.settingsRow,
              isDarkModeEnabled && [styles.settingsRowActive, appResponsiveStyles.settingsRowActive],
            ]}
          >
            <View>
              <Text style={[styles.settingsRowTitle, { color: themeColors.ink }]}>Dark mode</Text>
              <Text style={[styles.settingsRowSubtitle, { color: themeColors.subtleText }]}>
                {isDarkModeEnabled ? "Preference on" : "Preference off"}
              </Text>
            </View>
            <Text style={[styles.settingsRowValue, { color: themeColors.navyInk }]}>{isDarkModeEnabled ? "On" : "Off"}</Text>
          </Pressable>

          <Pressable
            onPress={resetWorkspaceData}
            style={[styles.settingsRow, appResponsiveStyles.settingsRow]}
          >
            <View>
              <Text style={[styles.settingsRowTitle, { color: themeColors.ink }]}>Refresh data</Text>
              <Text style={[styles.settingsRowSubtitle, { color: themeColors.subtleText }]}>Sync the current workspace</Text>
            </View>
            <Text style={[styles.settingsRowValue, { color: themeColors.navyInk }]}>Run</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <AppThemeProvider value={{ colors: themeColors, mode: themeMode }}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.canvas }]}>
      <StatusBar style={isDarkModeEnabled ? "light" : "dark"} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={[styles.screen, { backgroundColor: themeColors.canvas }]}
        contentContainerStyle={styles.screenContent}
      >
        <View style={[styles.topbar, appResponsiveStyles.topbar]}>
          <View style={styles.topbarLeft}>
            <Pressable
              accessibilityLabel="Open navigation"
              accessibilityRole="button"
              onPress={openNavigationMenu}
              style={[styles.iconButton, appResponsiveStyles.iconButton]}
            >
              <View style={styles.menuIcon}>
                <View style={[styles.menuIconBar, { backgroundColor: themeColors.navyInk }]} />
                <View style={[styles.menuIconBar, { backgroundColor: themeColors.navyInk }]} />
                <View style={[styles.menuIconBar, { backgroundColor: themeColors.navyInk }]} />
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setIsProjectOverlayVisible(true)}
              style={styles.brandWrap}
            >
              <Text style={[styles.brandEyebrow, appResponsiveStyles.brandEyebrow]}>
                MECO Robotics
              </Text>
              {!isCompactLayout ? (
                <Text
                  numberOfLines={1}
                  style={[styles.brandTitle, appResponsiveStyles.brandTitle]}
                >
                  {activeTabLabel}
                </Text>
              ) : null}
              {hasSubtabPages ? (
                <View style={styles.topbarSubtabDots}>
                  {activeSubtabOptions.map((option, index) => {
                    const isActive = index === activeSubtabIndex;

                    return (
                      <View
                        key={option.value}
                        style={[
                          styles.topbarSubtabDot,
                          {
                            backgroundColor: isActive ? themeColors.blue : themeColors.border,
                            opacity: isActive ? 1 : 0.75,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              ) : null}
            </Pressable>
          </View>

          <View style={[styles.topbarRight, isCompactLayout && styles.topbarRightCompact]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsPeopleFilterVisible((current) => !current)}
              style={[styles.iconButton, appResponsiveStyles.iconButton]}
            >
              <View style={[styles.eyeIcon, { borderColor: themeColors.navyInk }]}>
                <View style={[styles.eyePupil, { backgroundColor: themeColors.navyInk }]} />
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setIsPersonMenuVisible(true)}
              style={[
                styles.personButton,
                appResponsiveStyles.iconButton,
                { backgroundColor: themeColors.navySurface, borderColor: themeColors.blue },
              ]}
            >
              <Text style={[styles.personButtonLabel, { color: themeColors.navyInk }]}>ME</Text>
            </Pressable>
          </View>
        </View>

        {syncError ? (
          <View style={[styles.calloutBox, appResponsiveStyles.calloutBox]}>
            <Text style={[styles.calloutTitle, appResponsiveStyles.calloutTitle]}>Backend sync issue</Text>
            <Text style={[styles.calloutBody, appResponsiveStyles.calloutBody]}>{syncError}</Text>
          </View>
        ) : null}

        {isPeopleFilterVisible ? (
          <View style={[styles.personFilterStrip, appResponsiveStyles.navStrip]}>
            <OptionChipRow
              allLabel="All people"
              onChange={setActivePersonFilter}
              options={members.map((member) => ({ id: member.id, name: member.name }))}
              value={activePersonFilter}
            />
          </View>
        ) : null}

        <View {...subtabSwipeResponder.panHandlers}>{renderActiveTab()}</View>
      </ScrollView>
      <View style={styles.navSwipeEdge} {...navigationOpenSwipeResponder.panHandlers} />
      {renderEditorModals()}
      {renderNavigationMenu()}
      {renderProjectOverlay()}
      {renderPersonMenu()}
      </SafeAreaView>
    </AppThemeProvider>
  );
}
