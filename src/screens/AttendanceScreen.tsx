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

import type { AppScreenProps, AttendanceStatus } from "./types";
import { AttendanceStatusMark } from "./AttendanceStatusMark";

const ATTENDANCE_STATUS_OPTIONS: { status: AttendanceStatus; label: string }[] = [
  { status: "yes", label: "Present" },
  { status: "maybe", label: "Maybe" },
  { status: "no", label: "Out" },
];

export function AttendanceScreen(props: AppScreenProps) {
  const {
    appResponsiveStyles,
    attendanceSummary,
    canManageMeetings,
    isSyncing,
    meetingAttendance,
    meetings,
    members,
    openCreateMeetingEditor,
    setAttendanceStatusByMemberId,
    syncFromBackend,
    themeColors,
  } = props;

const renderScreen = () => {
  return (
    <WorkspacePanel
      title="Attendance"
      subtitle={`${members.length} people loaded from the workspace server.`}
      actions={
        <View style={styles.quickActionRow}>
          <Pressable onPress={syncFromBackend} style={[styles.quickActionButton, appResponsiveStyles.quickActionButton]}>
            <Text style={[styles.quickActionButtonLabel, appResponsiveStyles.quickActionButtonLabel]}>
              {isSyncing ? "Refreshing" : "Refresh"}
            </Text>
          </Pressable>
          {canManageMeetings ? (
            <Pressable onPress={openCreateMeetingEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
              <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>
                Add meeting
              </Text>
            </Pressable>
          ) : null}
        </View>
      }
    >
      <SummaryRow chips={attendanceSummary} />

      <View style={styles.homeSection}>
        <View style={styles.homeSectionHeader}>
          <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>
            Meetings
          </Text>
          <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
            Upcoming sessions loaded from the server.
          </Text>
        </View>
        {meetings.map((meeting) => (
          <View key={meeting.id} style={[styles.queueRowCard, appResponsiveStyles.rowCard]}>
            <View style={styles.queueRowHeader}>
              <View style={styles.queueRowPrimaryText}>
                <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>
                  {meeting.title}
                </Text>
                <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                  {meeting.date} - {meeting.time}
                </Text>
              </View>
              <StatusPill label={`${meeting.openSignIns} open`} value="waiting" />
            </View>
            <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
              RSVPs: {meeting.rsvpsYes} yes / {meeting.rsvpsMaybe} maybe
            </Text>
          </View>
        ))}
        {meetings.length === 0 ? <EmptyState text="No meetings were returned by the server." /> : null}
      </View>

      <View style={styles.homeSection}>
        <View style={styles.homeSectionHeader}>
          <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>
            People
          </Text>
          <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
            Synced from the server and sorted alphabetically.
          </Text>
        </View>
        {meetingAttendance.map(({ member, status }) => (
          <View
            key={member.id}
            style={[styles.attendanceRow, appResponsiveStyles.rowCard]}
          >
            <View style={[styles.memberAvatar, appResponsiveStyles.memberAvatar]}>
              <Text style={[styles.memberAvatarLabel, { color: themeColors.navyInk }]}>
                {member.name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.queueRowPrimaryText}>
              <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>
                {member.name}
              </Text>
              <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                {capitalize(member.role)}
                {member.email ? ` - ${member.email}` : ""}
              </Text>
            </View>
            <View style={styles.attendanceStatusControls}>
              {ATTENDANCE_STATUS_OPTIONS.map((option) => {
                const isSelected = status === option.status;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={option.status}
                    onPress={() =>
                      setAttendanceStatusByMemberId((current) => ({
                        ...current,
                        [member.id]: option.status,
                      }))
                    }
                    style={[
                      styles.attendanceStatusButton,
                      isSelected && styles.attendanceStatusButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.attendanceStatusButtonLabel,
                        isSelected && styles.attendanceStatusButtonLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        {meetingAttendance.length === 0 ? (
          <EmptyState text="No people were returned by the server." />
        ) : null}
      </View>
    </WorkspacePanel>
  );
};

  return renderScreen();
}
