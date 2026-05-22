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
import type { ArchiveFilterMode } from "../ui/types";

import type { AppScreenProps } from "./types";
import { AttendanceStatusMark } from "./AttendanceStatusMark";

export function TaskTimelineScreen(props: AppScreenProps) {
  const {
    activeTaskSubteam,
    activeTaskSubteamLabel,
    appResponsiveStyles,
    canManageTasks,
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
    tasks,
    themeColors,
    timelineMilestoneFilter,
    timelineSubsystemFilter,
    timelineTasks,
  } = props;

const renderScreen = () => {
  return (
    <WorkspacePanel
      title={`${activeTaskSubteamLabel} timeline`}
      subtitle="Calendar-ordered milestones and ownership cues for the selected subteam."
      actions={
        canManageTasks ? (
          <Pressable onPress={openCreateTaskEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add task</Text>
          </Pressable>
        ) : null
      }
    >
      <FilterToolbar>
        <OptionChipRow
          allLabel="All subsystems"
          onChange={setTimelineSubsystemFilter}
          options={subsystems.map((subsystem) => ({
            id: subsystem.id,
            name: subsystem.name,
          }))}
          value={timelineSubsystemFilter}
        />
        <OptionChipRow
          allLabel="All milestones"
          onChange={setTimelineMilestoneFilter}
          options={eventOptions}
          value={timelineMilestoneFilter}
        />
        <OptionChipRow
          allLabel="Any archive"
          onChange={(value) => setTaskArchiveFilter(value as ArchiveFilterMode)}
          options={ARCHIVE_FILTER_OPTIONS}
          value={taskArchiveFilter}
        />
      </FilterToolbar>
      <SummaryRow chips={taskSummary} />

      {timelineTasks.map((task) => {
        const progress = timelineProgress(task.status);
        const subsystemName = subsystemsById[task.subsystemId]?.name ?? "Unknown";
        const ownerName = task.ownerId
          ? (membersById[task.ownerId]?.name ?? "Unassigned")
          : "Unassigned";
        const targetEvent = task.targetEventId ? eventsById[task.targetEventId]?.title : null;

        return (
          <Pressable
            key={task.id}
            onPress={canManageTasks ? () => openEditTaskEditor(task) : undefined}
            style={[styles.timelineRow, appResponsiveStyles.rowCard]}
          >
            <View style={styles.timelineRowHeader}>
              <View style={styles.timelineRowText}>
                <Text style={[styles.timelineTitle, appResponsiveStyles.rowTitle]}>{task.title}</Text>
                <Text style={[styles.timelineMeta, appResponsiveStyles.metaLine]}>
                  {subsystemName} - {ownerName} - due {formatDate(task.dueDate)}
                  {targetEvent ? ` - ${targetEvent}` : ""}
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

      {timelineTasks.length === 0 ? <EmptyState text="No timeline tasks match the current filters." /> : null}

      <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.timeline} />
    </WorkspacePanel>
  );
};

  return renderScreen();
}
