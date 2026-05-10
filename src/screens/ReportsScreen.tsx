// @ts-nocheck
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

export function ReportsScreen(props: AppScreenProps) {
  const {
    appResponsiveStyles,
    eventReports,
    eventsById,
    membersById,
    openCreateEventReportEditor,
    openCreateQaReportEditor,
    qaReviews,
    reportSummary,
  } = props;

const renderScreen = () => {
  return (
    <WorkspacePanel
      title="QA and event reports"
      subtitle="Capture task QA outcomes, event findings, and iteration-worthy follow-up in one place."
      actions={
        <View style={styles.quickActionRow}>
          <Pressable onPress={() => openCreateQaReportEditor()} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>QA</Text>
          </Pressable>
          <Pressable onPress={() => openCreateEventReportEditor()} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
            <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Event</Text>
          </Pressable>
        </View>
      }
    >
      <SummaryRow chips={reportSummary} />

      <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>QA reports</Text>
      <View style={styles.reportGrid}>
        {qaReviews.map((review) => {
          const people = review.participantIds
            .map((participantId) => membersById[participantId]?.name)
            .filter((name): name is string => Boolean(name))
            .join(", ");

          return (
            <View key={review.id} style={[styles.queueRowCard, appResponsiveStyles.rowCard]}>
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{review.subjectTitle}</Text>
                  <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                    {people || "No participants"} - mentor {review.mentorApproved ? "approved" : "pending"}
                  </Text>
                </View>
                <StatusPill label={review.result.replace("-", " ")} value={review.result} />
              </View>
              <Text style={[styles.queueRowBody, appResponsiveStyles.rowBody]}>{review.notes}</Text>
              {review.result === "iteration-worthy" ? (
                <View style={[styles.calloutBox, appResponsiveStyles.calloutBox]}>
                  <Text style={[styles.calloutTitle, appResponsiveStyles.calloutTitle]}>Iteration</Text>
                  <Text style={[styles.calloutBody, appResponsiveStyles.calloutBody]}>
                    This finding should create or anchor a design iteration.
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>Event reports</Text>
      {eventReports.map((report, index) => {
        const event = eventsById[report.eventId];

        return (
          <View key={`${report.eventId}-${index}`} style={[styles.queueRowCard, appResponsiveStyles.rowCard]}>
            <View style={styles.queueRowHeader}>
              <View style={styles.queueRowPrimaryText}>
                <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{event?.title ?? "Event report"}</Text>
                <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                  Follow-up {report.followUpTaskTitle || "none"}
                </Text>
              </View>
              <StatusPill label="Report" value="info" />
            </View>
            <Text style={[styles.queueRowBody, appResponsiveStyles.rowBody]}>{report.summary}</Text>
            {report.findingText ? (
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>Finding {report.findingText}</Text>
            ) : null}
          </View>
        );
      })}

      {eventReports.length === 0 ? <EmptyState text="No event reports have been added yet." /> : null}
      <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.reports} />
    </WorkspacePanel>
  );
};

  return renderScreen();
}
