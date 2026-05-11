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
import { LandscapeSubsystemTimeline } from "../ui/LandscapeSubsystemTimeline";
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

export function HomeScreen(props: AppScreenProps) {
  const {
    appResponsiveStyles,
    attendancePreview,
    homeInventoryNeeds,
    homePriorityTasks,
    homeTaskSummary,
    isSyncing,
    membersById,
    openEditPurchaseEditor,
    openInventoryPurchases,
    openTaskQueueFromTask,
    setActiveTab,
    subsystemsById,
    syncFromBackend,
    tasks,
  } = props;

const renderScreen = () => {
  return (
    <WorkspacePanel
      title="Home"
      subtitle="Priority tasks and workspace status for the next execution window."
      actions={
        <Pressable onPress={syncFromBackend} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
          <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>
            {isSyncing ? "Refreshing" : "Refresh"}
          </Text>
        </Pressable>
      }
    >
      <View style={styles.homeSection}>
        <Pressable
          accessibilityRole="button"
          onPress={openInventoryPurchases}
          style={styles.homeSectionHeader}
        >
          <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>
            Inventory to buy
          </Text>
          <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
            Top {homeInventoryNeeds.length} purchase items still waiting.
          </Text>
        </Pressable>
        {homeInventoryNeeds.map((item) => {
          const requesterName = item.requestedById
            ? (membersById[item.requestedById]?.name ?? "Unassigned")
            : "Unassigned";

          return (
            <Pressable
              key={item.id}
              onPress={() => openEditPurchaseEditor(item)}
              style={[styles.inventoryAlertRow, appResponsiveStyles.rowCard]}
            >
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                    {item.vendor} - Qty {item.quantity} - requester {requesterName}
                  </Text>
                </View>
                <StatusPill label={item.status} value={item.status} />
              </View>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Estimated ${item.estimatedCost.toFixed(0)}
              </Text>
            </Pressable>
          );
        })}
        {homeInventoryNeeds.length === 0 ? (
          <EmptyState text="No purchase items need buying right now." />
        ) : null}
      </View>

      <View style={[styles.calloutBox, appResponsiveStyles.calloutBox]}>
        <Text style={[styles.calloutTitle, appResponsiveStyles.calloutTitle]}>
          Tasks for this meeting
        </Text>
        <SummaryRow chips={homeTaskSummary} />
      </View>

      {homePriorityTasks.map((task) => {
        const subsystemName = subsystemsById[task.subsystemId]?.name ?? "Unknown";
        const ownerName = task.ownerId
          ? (membersById[task.ownerId]?.name ?? "Unassigned")
          : "Unassigned";

        return (
          <Pressable
            key={task.id}
            onPress={() => openTaskQueueFromTask(task)}
            style={[styles.queueRowCard, appResponsiveStyles.rowCard]}
          >
            <View style={styles.queueRowHeader}>
              <View style={styles.queueRowPrimaryText}>
                <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>
                  {task.title}
                </Text>
                <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                  {subsystemName} - {ownerName} - due {formatDate(task.dueDate)}
                </Text>
              </View>
              <StatusPill label={task.priority} value={task.priority} />
            </View>
            <Text numberOfLines={2} style={[styles.queueRowBody, appResponsiveStyles.rowBody]}>
              {task.summary}
            </Text>
            <View style={styles.queuePillRow}>
              <StatusPill label={STATUS_LABELS[task.status]} value={task.status} />
              {task.blockers.length > 0 ? (
                <StatusPill label="Blocked" value="critical" />
              ) : null}
            </View>
          </Pressable>
        );
      })}

      {homePriorityTasks.length === 0 ? (
        <EmptyState text="No open tasks need attention right now." />
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => setActiveTab("attendance")}
        style={styles.homeSection}
      >
        <View style={styles.homeSectionHeader}>
          <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>
            Meeting attendance
          </Text>
          <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
            Top {attendancePreview.length} coming to the meeting - tap for everyone.
          </Text>
        </View>
        {attendancePreview.map(({ member, status }) => (
          <View
            key={member.id}
            style={[styles.attendanceRow, appResponsiveStyles.rowCard]}
          >
            <View style={styles.queueRowPrimaryText}>
              <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>
                {member.name}
              </Text>
              <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                {capitalize(member.role)}
              </Text>
            </View>
            {<AttendanceStatusMark status={status} />}
          </View>
        ))}
        {attendancePreview.length === 0 ? (
          <EmptyState text="No one is marked as coming yet." />
        ) : null}
      </Pressable>
    </WorkspacePanel>
  );
};

  return renderScreen();
}
