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

import type { AppScreenProps } from "./types";
import { AttendanceStatusMark } from "./AttendanceStatusMark";

const RISK_PRIORITY_COLUMNS = [
  { label: "High", priority: "high" },
  { label: "Medium", priority: "medium" },
  { label: "Low", priority: "low" },
];

export function RisksScreen(props: AppScreenProps) {
  const {
    appResponsiveStyles,
    isLandscapeCardLayout,
    riskRows,
    riskSummary,
    subsystemsById,
    themeColors,
  } = props;

const renderScreen = () => {
  const renderRiskCard = (risk: (typeof riskRows)[number]) => {
    const subsystemName = risk.subsystemId
      ? (subsystemsById[risk.subsystemId]?.name ?? "Unknown subsystem")
      : "Cross-system";
    const priorityLabel = capitalize(risk.priority);

    return (
      <View
        key={risk.id}
        style={[
          styles.queueRowCard,
          appResponsiveStyles.rowCard,
          isLandscapeCardLayout && styles.riskLandscapeItem,
          risk.priority === "high"
            ? styles.riskSeverityHigh
            : risk.priority === "medium"
              ? styles.riskSeverityMedium
              : styles.riskSeverityLow,
        ]}
      >
        <View style={styles.queueRowHeader}>
          <View style={styles.queueRowPrimaryText}>
            <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{risk.title}</Text>
            <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
              {risk.source} - {subsystemName}
            </Text>
          </View>
          <StatusPill
            label={priorityLabel}
            value={
              risk.priority === "high"
                ? "critical"
                : risk.priority === "medium"
                  ? "high"
                  : "low"
            }
          />
        </View>
        <Text
          numberOfLines={isLandscapeCardLayout ? 4 : undefined}
          style={[styles.queueRowBody, appResponsiveStyles.rowBody]}
        >
          {risk.detail}
        </Text>
      </View>
    );
  };

  const riskPriorityColumns = RISK_PRIORITY_COLUMNS.map((column) => ({
    ...column,
    risks: riskRows.filter((risk) => risk.priority === column.priority),
  }));

  return (
    <WorkspacePanel
      title="Risk management"
      subtitle="Open blockers, subsystem risks, and iteration-worthy QA findings grouped into one risk register."
    >
      <SummaryRow chips={riskSummary} />

      {isLandscapeCardLayout ? (
        <View style={styles.riskLandscapeBoard}>
          {riskPriorityColumns.map((column) => (
            <View
              key={column.priority}
              style={[
                styles.riskLandscapeColumn,
                {
                  backgroundColor: themeColors.canvas,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.riskLandscapeColumnHeader}>
                <View
                  style={[
                    styles.riskPriorityBadge,
                    column.priority === "high"
                      ? styles.riskPriorityBadgeHigh
                      : column.priority === "medium"
                        ? styles.riskPriorityBadgeMedium
                        : styles.riskPriorityBadgeLow,
                  ]}
                >
                  <Text
                    style={[
                      styles.riskPriorityBadgeText,
                      column.priority === "high"
                        ? styles.riskPriorityBadgeTextHigh
                        : column.priority === "medium"
                          ? styles.riskPriorityBadgeTextMedium
                          : styles.riskPriorityBadgeTextLow,
                    ]}
                  >
                    {column.label}
                  </Text>
                </View>
                <View style={[styles.riskColumnCount, { backgroundColor: themeColors.surface }]}>
                  <Text style={[styles.riskColumnCountText, { color: themeColors.navyInk }]}>
                    {column.risks.length}
                  </Text>
                </View>
              </View>

              {column.risks.map(renderRiskCard)}
            </View>
          ))}
        </View>
      ) : (
        riskRows.map(renderRiskCard)
      )}

      {riskRows.length === 0 ? <EmptyState text="No active risks are currently visible." /> : null}
      <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.risks} />
    </WorkspacePanel>
  );
};

  return renderScreen();
}
