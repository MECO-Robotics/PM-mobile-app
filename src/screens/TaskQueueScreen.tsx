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
import type { ArchiveFilterMode, BlockerFilterMode } from "../ui/types";

import type { AppScreenProps } from "./types";
import { AttendanceStatusMark } from "./AttendanceStatusMark";

export function TaskQueueScreen(props: AppScreenProps) {
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
      title={`${activeTaskSubteamLabel} task queue`}
      subtitle="Search and filter queue cards for the selected subteam's work."
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

        <OptionChipRow
          allLabel="All blockers"
          onChange={(value) => setTaskBlockerFilter(value as BlockerFilterMode)}
          options={BLOCKER_FILTER_OPTIONS}
          value={taskBlockerFilter}
        />

        <OptionChipRow
          allLabel="Any archive"
          onChange={(value) => setTaskArchiveFilter(value as ArchiveFilterMode)}
          options={ARCHIVE_FILTER_OPTIONS}
          value={taskArchiveFilter}
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
            style={[
              styles.queueRowCard,
              appResponsiveStyles.rowCard,
              isLandscapeCardLayout && styles.queueRowCardLandscape,
            ]}
          >
            <View style={isLandscapeCardLayout && styles.taskCardLandscapeContent}>
              <View style={isLandscapeCardLayout && styles.taskCardLandscapeMain}>
                <View style={styles.queueRowHeader}>
                  <View style={styles.queueRowPrimaryText}>
                    <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{task.title}</Text>
                    <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                      {subsystemName} - {disciplineName}
                    </Text>
                  </View>
                  <Text style={editTagStyle}>EDIT</Text>
                </View>

                <Text numberOfLines={isLandscapeCardLayout ? 3 : 2} style={[styles.queueRowBody, appResponsiveStyles.rowBody]}>{task.summary}</Text>

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
              </View>

              <View style={isLandscapeCardLayout && styles.taskCardLandscapeAside}>
                <View style={styles.compactMetaGrid}>
                  <View style={[styles.compactMetaItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <Text style={[styles.compactMetaText, { color: themeColors.subtleText }]}>Owner {ownerName}</Text>
                  </View>
                  <View style={[styles.compactMetaItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <Text style={[styles.compactMetaText, { color: themeColors.subtleText }]}>Due {formatDate(task.dueDate)}</Text>
                  </View>
                  <View style={[styles.compactMetaItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <Text style={[styles.compactMetaText, { color: themeColors.subtleText }]}>Milestone {targetEvent}</Text>
                  </View>
                  <View style={[styles.compactMetaItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <Text style={[styles.compactMetaText, { color: themeColors.subtleText }]}>Mechanism {mechanismName}</Text>
                  </View>
                  <View style={[styles.compactMetaItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <Text style={[styles.compactMetaText, { color: themeColors.subtleText }]}>Part {linkedPart}</Text>
                  </View>
                </View>
              </View>
            </View>

            {task.blockers.length > 0 ? (
              <View style={[styles.calloutBox, appResponsiveStyles.calloutBox]}>
                <Text style={[styles.calloutTitle, appResponsiveStyles.calloutTitle]}>Blockers</Text>
                <Text style={[styles.calloutBody, appResponsiveStyles.calloutBody]}>{task.blockers.join(" | ")}</Text>
                <View style={styles.quickActionRow}>
                  <Pressable
                    onPress={() => clearTaskBlockers(task)}
                    style={[styles.quickActionButton, appResponsiveStyles.quickActionButton]}
                  >
                    <Text style={[styles.quickActionButtonLabel, appResponsiveStyles.quickActionButtonLabel]}>
                      Clear blockers
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openCreateQaReportEditor(task.id)}
                    style={[styles.quickActionButton, appResponsiveStyles.quickActionButton]}
                  >
                    <Text style={[styles.quickActionButtonLabel, appResponsiveStyles.quickActionButtonLabel]}>
                      QA report
                    </Text>
                  </Pressable>
                </View>
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

  return renderScreen();
}
