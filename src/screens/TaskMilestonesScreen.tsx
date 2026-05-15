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
import type { MilestoneSortField } from "../ui/types";

import type { AppScreenProps } from "./types";
import { AttendanceStatusMark } from "./AttendanceStatusMark";

export function TaskMilestonesScreen(props: AppScreenProps) {
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
            <View style={styles.quickActionRow}>
              <Pressable
                onPress={() => openCreateEventReportEditor(milestone.id)}
                style={[styles.quickActionButton, appResponsiveStyles.quickActionButton]}
              >
                <Text style={[styles.quickActionButtonLabel, appResponsiveStyles.quickActionButtonLabel]}>
                  Event report
                </Text>
              </Pressable>
            </View>
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

  return renderScreen();
}
