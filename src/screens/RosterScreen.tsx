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

export function RosterScreen(props: AppScreenProps) {
  const {
    appResponsiveStyles,
    editTagStyle,
    members,
    openCreateMemberEditor,
    openEditMemberEditor,
    rosterAdmins,
    rosterMentors,
    rosterStudents,
    selectedMemberId,
    setSelectedMemberId,
    themeColors,
  } = props;

const renderRosterSection = (
  title: string,
  memberList: (typeof members)[number][],
) => {
  return (
    <View style={[styles.rosterSection, appResponsiveStyles.rosterSection]}>
      <View style={styles.rosterSectionHeader}>
        <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>{title}</Text>
        <View style={[styles.sidebarCountPill, appResponsiveStyles.navCount]}>
          <Text style={[styles.sidebarCountLabel, { color: themeColors.ink }]}>{memberList.length}</Text>
        </View>
      </View>

      {memberList.map((member) => {
        const isSelected = selectedMemberId === member.id;

        return (
          <Pressable
            key={member.id}
            onPress={() => setSelectedMemberId(member.id)}
            onLongPress={() => openEditMemberEditor(member.id)}
            style={[
              styles.memberRow,
              appResponsiveStyles.memberRow,
              isSelected && [styles.memberRowSelected, appResponsiveStyles.memberRowSelected],
            ]}
          >
            <View style={[styles.memberAvatar, appResponsiveStyles.memberAvatar]}>
              <Text style={[styles.memberAvatarLabel, { color: themeColors.navyInk }]}>{member.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.memberCopy}>
              <Text style={[styles.memberName, { color: themeColors.ink }]}>{member.name}</Text>
              <Text style={[styles.memberRole, { color: themeColors.subtleText }]}>{capitalize(member.role)}</Text>
            </View>
            <Pressable onPress={() => openEditMemberEditor(member.id)} style={styles.editTagButton}>
              <Text style={editTagStyle}>EDIT</Text>
            </Pressable>
          </Pressable>
        );
      })}
    </View>
  );
};

const renderScreen = () => {
  return (
    <WorkspacePanel
      title="Roster"
      subtitle="Role-grouped people lists with quick selection for ownership and mentorship updates."
      actions={
        <Pressable onPress={openCreateMemberEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
          <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add person</Text>
        </Pressable>
      }
    >
      <SummaryRow
        chips={[
          { label: "Students", value: String(rosterStudents.length) },
          { label: "Mentors", value: String(rosterMentors.length) },
          { label: "Admins", value: String(rosterAdmins.length) },
        ]}
      />

      {renderRosterSection("Students", rosterStudents)}
      {renderRosterSection("Mentors", rosterMentors)}
      {renderRosterSection("Admins", rosterAdmins)}

      <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.roster} />
    </WorkspacePanel>
  );
};

  return renderScreen();
}
