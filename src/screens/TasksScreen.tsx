import { Image, Pressable, ScrollView, View } from "react-native";

import { Text } from "../i18n";
import {
  ARCHIVE_FILTER_OPTIONS,
  BLOCKER_FILTER_OPTIONS,
  EVENT_TYPE_OPTIONS,
  EVENT_TYPE_STYLES,
  INVENTORY_VIEW_OPTIONS,
  MANUFACTURING_STATUS_OPTIONS,
  MANUFACTURING_VIEW_OPTIONS,
  MATERIAL_CATEGORY_OPTIONS,
  PART_STATUS_OPTIONS,
  PURCHASE_APPROVAL_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
  STATUS_LABELS,
  SUBVIEW_INTERACTION_GUIDANCE,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_SUBTEAM_OPTIONS,
  TASK_VIEW_OPTIONS,
  WORKLOG_SORT_OPTIONS,
} from "../ui/constants";
import {
  capitalize,
  datePortion,
  formatDate,
  formatDateTime,
  splitList,
  timePortion,
  timelineProgress,
} from "../ui/helpers";
import { LandscapeSubsystemTimeline } from "../ui/landscapeTimeline/LandscapeSubsystemTimeline";
import { styles } from "../ui/styles";
import {
  EmptyState,
  FilterToolbar,
  InteractionNote,
  OptionChipRow,
  SearchField,
  SectionTabs,
  StatusPill,
  SummaryRow,
  WorkspacePanel,
} from "../ui/ui";

import type { AppScreenProps } from "./types";
import { AttendanceStatusMark } from "./AttendanceStatusMark";
import { TaskMilestonesScreen } from "./TaskMilestonesScreen";
import { TaskQueueScreen } from "./TaskQueueScreen";
import { TaskTimelineScreen } from "./TaskTimelineScreen";

export function TasksScreen(props: AppScreenProps) {
  const {
    activeTaskSubteam,
    activeTaskSubteamLabel,
    appResponsiveStyles,
    clearTaskBlockers,
    disciplinesById,
    editTagStyle,
    eventOptions,
    events,
    eventsById,
    filteredMilestones,
    filteredTaskQueue,
    isCompactLayout,
    isLandscapeCardLayout,
    isLandscapeTimelineLayout,
    mechanismsById,
    members,
    membersById,
    milestoneSearch,
    milestoneSortField,
    milestoneSortOrder,
    milestoneSummary,
    milestoneTypeFilter,
    openCreateEventReportEditor,
    openCreateMilestoneEditor,
    openCreateQaReportEditor,
    openCreateTaskEditor,
    openEditMilestoneEditor,
    openEditTaskEditor,
    partInstancesById,
    setActiveTaskSubteam,
    setMilestoneSearch,
    setMilestoneSortField,
    setMilestoneSortOrder,
    setMilestoneTypeFilter,
    setTaskArchiveFilter,
    setTaskBlockerFilter,
    setTaskOwnerFilter,
    setTaskPriorityFilter,
    setTaskSearch,
    setTaskStatusFilter,
    setTaskSubsystemFilter,
    setTaskView,
    setTimelineMilestoneFilter,
    setTimelineSubsystemFilter,
    subsystems,
    subsystemsById,
    taskArchiveFilter,
    taskBlockerFilter,
    taskOwnerFilter,
    taskPriorityFilter,
    taskSearch,
    taskStatusFilter,
    taskSubsystemFilter,
    taskSummary,
    taskView,
    themeColors,
    timelineMilestoneFilter,
    timelineSubsystemFilter,
    timelineTasks,
  } = props;

const renderScreen = () => {
  if (isLandscapeTimelineLayout) {
    return (
      <LandscapeSubsystemTimeline
        colors={themeColors}
        events={events}
        membersById={membersById}
        onAddDeadline={openCreateMilestoneEditor}
        onAddTask={openCreateTaskEditor}
        onTaskPress={openEditTaskEditor}
        subsystems={subsystems}
        tasks={timelineTasks}
      />
    );
  }

  return (
    <>
      <SectionTabs
        activeValue={activeTaskSubteam}
        onChange={setActiveTaskSubteam}
        options={TASK_SUBTEAM_OPTIONS}
      />
      {taskView === "timeline"
        ? <TaskTimelineScreen {...props} />
        : taskView === "queue"
          ? <TaskQueueScreen {...props} />
          : <TaskMilestonesScreen {...props} />}
    </>
  );
};

  return renderScreen();
}
