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
import type { WorkLogSortMode } from "../ui/types";

import type { AppScreenProps } from "./types";
import { AttendanceStatusMark } from "./AttendanceStatusMark";

export function WorkLogsScreen(props: AppScreenProps) {
  const {
    appResponsiveStyles,
    editTagStyle,
    filteredWorkLogs,
    membersById,
    openCreateWorkLogEditor,
    openEditWorkLogEditor,
    setWorkLogSearch,
    setWorkLogSortMode,
    setWorkLogSubsystemFilter,
    subsystems,
    subsystemsById,
    taskById,
    workLogSearch,
    workLogSortMode,
    workLogSubsystemFilter,
    workLogSummary,
  } = props;

const renderScreen = () => {
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

  return renderScreen();
}
