import type { Dispatch, SetStateAction } from "react";

import type { AppThemeColors } from "../theme";
import type {
  Discipline,
  Event,
  ManufacturingItem,
  Mechanism,
  Member,
  PartDefinition,
  PartInstance,
  PurchaseItem,
  QaReview,
  Subsystem,
  Task,
  WorkLog,
} from "../types/domain";
import type {
  ArchiveFilterMode,
  BlockerFilterMode,
  EventReportDraft,
  InventoryViewTab,
  ManufacturingViewTab,
  MaterialRollup,
  MilestoneSortField,
  PartLifecycleStatus,
  SummaryChipData,
  TaskSubteamTab,
  TaskViewTab,
  ViewTab,
  WorkLogSortMode,
} from "../ui/types";

export type AttendanceStatus = "yes" | "maybe" | "no";
export type AttendanceRow = {
  member: Member;
  status: AttendanceStatus;
};

export type PartInstanceStatusRow = {
  partInstance: PartInstance;
  status: PartLifecycleStatus;
};

export type RiskPriority = "high" | "medium" | "low";
export type RiskRow = {
  detail: string;
  id: string;
  priority: RiskPriority;
  source: string;
  subsystemId: string;
  title: string;
};

export type SubsystemCounts = {
  mechanisms: number;
  openTasks: number;
  risks: number;
  tasks: number;
};

type StateSetter<T> = Dispatch<SetStateAction<T>>;
type TextSetter = StateSetter<string>;

export interface AppScreenProps extends Record<string, any> {
  activeTaskSubteam: TaskSubteamTab;
  activeTaskSubteamLabel: string;
  appResponsiveStyles: Record<string, any>;
  attendancePreview: AttendanceRow[];
  attendanceSummary: SummaryChipData[];
  disciplinesById: Record<string, Discipline>;
  eventReports: EventReportDraft[];
  events: Event[];
  eventsById: Record<string, Event>;
  filteredManufacturing: ManufacturingItem[];
  filteredMaterialRollups: MaterialRollup[];
  filteredMilestones: Event[];
  filteredPartDefinitions: PartDefinition[];
  filteredPartInstances: PartInstanceStatusRow[];
  filteredPurchases: PurchaseItem[];
  filteredSubsystems: Subsystem[];
  filteredTaskQueue: Task[];
  filteredWorkLogs: WorkLog[];
  homeInventoryNeeds: PurchaseItem[];
  homePriorityTasks: Task[];
  homeTaskSummary: SummaryChipData[];
  inventoryView: InventoryViewTab;
  isCompactLayout: boolean;
  isLandscapeCardLayout: boolean;
  isLandscapeTimelineLayout: boolean;
  isSyncing: boolean;
  manufacturingArchiveFilter: ArchiveFilterMode;
  manufacturingMaterialFilter: string;
  manufacturingMaterialOptions: { id: string; name: string }[];
  manufacturingRequesterFilter: string;
  manufacturingSearch: string;
  manufacturingStatusFilter: string;
  manufacturingSubsystemFilter: string;
  manufacturingSummary: SummaryChipData[];
  manufacturingView: ManufacturingViewTab;
  materialsCategoryFilter: string;
  materialsSearch: string;
  materialsStockFilter: string;
  mechanisms: Mechanism[];
  mechanismsById: Record<string, Mechanism>;
  meetingAttendance: AttendanceRow[];
  members: Member[];
  membersById: Record<string, Member>;
  milestoneSearch: string;
  milestoneSortField: MilestoneSortField;
  milestoneSortOrder: "asc" | "desc";
  milestoneSummary: SummaryChipData[];
  milestoneTypeFilter: string;
  partDefinitions: PartDefinition[];
  partDefinitionsById: Record<string, PartDefinition>;
  partInstancesById: Record<string, PartInstance>;
  partInstancesWithStatus: PartInstanceStatusRow[];
  partsSearch: string;
  partsStatusFilter: string;
  partsSubsystemFilter: string;
  purchaseApprovalFilter: string;
  purchaseArchiveFilter: ArchiveFilterMode;
  purchaseRequesterFilter: string;
  purchaseSearch: string;
  purchaseStatusFilter: string;
  purchaseSubsystemFilter: string;
  purchaseVendorFilter: string;
  purchaseVendorOptions: { id: string; name: string }[];
  qaReviews: QaReview[];
  reportSummary: SummaryChipData[];
  riskRows: RiskRow[];
  riskSummary: SummaryChipData[];
  rosterAdmins: Member[];
  rosterMentors: Member[];
  rosterStudents: Member[];
  selectedMemberId: string | null;
  selectedSubsystem: Subsystem | null;
  setActiveTab: StateSetter<ViewTab>;
  setActiveTaskSubteam: StateSetter<TaskSubteamTab>;
  setAttendanceStatusByMemberId: StateSetter<Record<string, AttendanceStatus>>;
  setManufacturingArchiveFilter: StateSetter<ArchiveFilterMode>;
  setManufacturingMaterialFilter: TextSetter;
  setManufacturingRequesterFilter: TextSetter;
  setManufacturingSearch: TextSetter;
  setManufacturingStatusFilter: TextSetter;
  setManufacturingSubsystemFilter: TextSetter;
  setMaterialsCategoryFilter: TextSetter;
  setMaterialsSearch: TextSetter;
  setMaterialsStockFilter: TextSetter;
  setMilestoneSearch: TextSetter;
  setMilestoneSortField: StateSetter<MilestoneSortField>;
  setMilestoneSortOrder: StateSetter<"asc" | "desc">;
  setMilestoneTypeFilter: TextSetter;
  setPartsSearch: TextSetter;
  setPartsStatusFilter: TextSetter;
  setPartsSubsystemFilter: TextSetter;
  setPurchaseApprovalFilter: TextSetter;
  setPurchaseArchiveFilter: StateSetter<ArchiveFilterMode>;
  setPurchaseRequesterFilter: TextSetter;
  setPurchaseSearch: TextSetter;
  setPurchaseStatusFilter: TextSetter;
  setPurchaseSubsystemFilter: TextSetter;
  setPurchaseVendorFilter: TextSetter;
  setSelectedMemberId: StateSetter<string | null>;
  setSelectedSubsystemId: StateSetter<string>;
  setSubsystemSearch: TextSetter;
  setTaskArchiveFilter: StateSetter<ArchiveFilterMode>;
  setTaskBlockerFilter: StateSetter<BlockerFilterMode>;
  setTaskOwnerFilter: TextSetter;
  setTaskPriorityFilter: TextSetter;
  setTaskSearch: TextSetter;
  setTaskStatusFilter: TextSetter;
  setTaskSubsystemFilter: TextSetter;
  setTaskView: StateSetter<TaskViewTab>;
  setTimelineMilestoneFilter: TextSetter;
  setTimelineSubsystemFilter: TextSetter;
  setWorkLogSearch: TextSetter;
  setWorkLogSortMode: StateSetter<WorkLogSortMode>;
  setWorkLogSubsystemFilter: TextSetter;
  subsystemCountsById: Record<string, SubsystemCounts>;
  subsystemSearch: string;
  subsystems: Subsystem[];
  subsystemsById: Record<string, Subsystem>;
  taskArchiveFilter: ArchiveFilterMode;
  taskBlockerFilter: BlockerFilterMode;
  taskById: Record<string, Task>;
  taskOwnerFilter: string;
  taskPriorityFilter: string;
  taskSearch: string;
  taskStatusFilter: string;
  taskSubsystemFilter: string;
  taskSummary: SummaryChipData[];
  taskView: TaskViewTab;
  tasks: Task[];
  themeColors: AppThemeColors;
  timelineMilestoneFilter: string;
  timelineSubsystemFilter: string;
  timelineTasks: Task[];
  workLogSearch: string;
  workLogSortMode: WorkLogSortMode;
  workLogSubsystemFilter: string;
  workLogSummary: SummaryChipData[];
}
