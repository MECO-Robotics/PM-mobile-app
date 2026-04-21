import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { mecoSnapshot } from "./src/data/mockData";
import {
  ManufacturingItem,
  PurchaseItem,
  Task,
  TaskStatus,
} from "./src/types/domain";
import { colors, radii, shadows, spacing } from "./src/theme";

type TabKey =
  | "dashboard"
  | "tasks"
  | "meetings"
  | "manufacturing"
  | "purchases"
  | "qa"
  | "metrics";

const tabs: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Overview" },
  { key: "tasks", label: "Tasks" },
  { key: "meetings", label: "Meetings" },
  { key: "manufacturing", label: "Fabrication" },
  { key: "purchases", label: "Purchases" },
  { key: "qa", label: "QA" },
  { key: "metrics", label: "Metrics" },
];

const taskStatusLabels: Record<TaskStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "waiting-for-qa": "Waiting for QA",
  complete: "Complete",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [subsystemFilter, setSubsystemFilter] = useState<string>("all");

  const memberById = new Map(
    mecoSnapshot.members.map((member) => [member.id, member]),
  );
  const subsystemById = new Map(
    mecoSnapshot.subsystems.map((subsystem) => [subsystem.id, subsystem]),
  );
  const tasksById = new Map(mecoSnapshot.tasks.map((task) => [task.id, task]));

  const filteredTasks = mecoSnapshot.tasks.filter((task) => {
    return subsystemFilter === "all" || task.subsystemId === subsystemFilter;
  });

  const completeTasks = mecoSnapshot.tasks.filter(
    (task) => task.status === "complete",
  ).length;
  const blockedTasks = mecoSnapshot.tasks.filter(
    (task) => task.blockers.length > 0,
  ).length;
  const waitingForQaCount =
    mecoSnapshot.tasks.filter((task) => task.status === "waiting-for-qa").length +
    mecoSnapshot.manufacturingItems.filter((item) => item.status === "qa").length;
  const overdueTasks = mecoSnapshot.tasks.filter(
    (task) => task.status !== "complete" && task.dueDate < "2026-04-21",
  ).length;
  const totalHours = mecoSnapshot.workLogs.reduce(
    (sum, workLog) => sum + workLog.hours,
    0,
  );
  const nextMeeting = mecoSnapshot.meetings[0];
  const openPurchaseCount = mecoSnapshot.purchaseItems.filter(
    (item) => item.status !== "delivered",
  ).length;
  const mentorBackedQaPasses = mecoSnapshot.qaReviews.filter(
    (review) => review.result === "pass" && review.mentorApproved,
  ).length;

  const tasksReadyNext = mecoSnapshot.tasks.filter((task) => {
    if (task.status === "complete" || task.blockers.length > 0) {
      return false;
    }

    return task.dependencyIds.every((dependencyId) => {
      return tasksById.get(dependencyId)?.status === "complete";
    });
  });

  const subsystemCards = mecoSnapshot.subsystems.map((subsystem) => {
    const tasks = mecoSnapshot.tasks.filter(
      (task) => task.subsystemId === subsystem.id,
    );
    const openTasks = tasks.filter((task) => task.status !== "complete").length;
    const progress = tasks.length === 0 ? 0 : (tasks.length - openTasks) / tasks.length;
    const blockers = tasks.reduce((sum, task) => sum + task.blockers.length, 0);

    return {
      ...subsystem,
      openTasks,
      blockers,
      progress,
    };
  });

  const metrics = [
    {
      label: "Completion rate",
      value: `${Math.round((completeTasks / mecoSnapshot.tasks.length) * 100)}%`,
      detail: `${completeTasks} of ${mecoSnapshot.tasks.length} tasks closed`,
      tone: "teal" as const,
    },
    {
      label: "Tracked hours",
      value: `${totalHours.toFixed(1)}h`,
      detail: "Mandatory work logs feed staffing forecasts",
      tone: "orange" as const,
    },
    {
      label: "Waiting for QA",
      value: `${waitingForQaCount}`,
      detail: "Tasks or fabrication items pending signoff",
      tone: "gold" as const,
    },
    {
      label: "Overdue items",
      value: `${overdueTasks}`,
      detail: "Items that need an escalation or replan",
      tone: "navy" as const,
    },
  ];

  const renderOverview = () => {
    return (
      <>
        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>MECO Operations Pulse</Text>
            <Text style={styles.heroTitle}>
              Keep implementation, QA, meetings, and fabrication in one lane.
            </Text>
            <Text style={styles.heroBody}>
              The mobile app centers every completion gate from the requirements
              doc: work logs, mentor-backed QA, blockers, and manufacturing/purchase
              dependencies.
            </Text>
          </View>
          <View style={styles.heroStats}>
            <HeroChip label="Next meeting" value={formatShortDate(nextMeeting.date)} />
            <HeroChip label="Open blockers" value={`${blockedTasks}`} />
            <HeroChip label="Mentor QA passes" value={`${mentorBackedQaPasses}`} />
          </View>
        </View>

        <View style={styles.metricGrid}>
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </View>

        <SectionCard
          title="Subsystem health"
          subtitle="Responsible engineer, mentors, risks, and progress at a glance."
        >
          {subsystemCards.map((subsystem) => (
            <View key={subsystem.id} style={styles.subsystemCard}>
              <View style={styles.rowBetween}>
                <View style={styles.subsystemTextGroup}>
                  <Text style={styles.subsystemName}>{subsystem.name}</Text>
                  <Text style={styles.subsystemMeta}>
                    Lead: {memberById.get(subsystem.responsibleEngineerId)?.name}
                  </Text>
                </View>
                <Pill
                  label={`${Math.round(subsystem.progress * 100)}% done`}
                  tone={subsystem.progress > 0.5 ? "teal" : "gold"}
                />
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(8, subsystem.progress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.cardMeta}>
                {subsystem.openTasks} open tasks, {subsystem.blockers} blocker notes
              </Text>
              <View style={styles.pillRow}>
                {subsystem.risks.map((risk) => (
                  <Pill key={risk} label={risk} tone="navy" />
                ))}
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard
          title="Next executable work"
          subtitle="Tasks with dependencies cleared and no active blockers."
        >
          {tasksReadyNext.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              owner={memberById.get(task.ownerId)?.name ?? "Unassigned"}
              mentor={memberById.get(task.mentorId)?.name ?? "No mentor"}
              subsystem={subsystemById.get(task.subsystemId)?.name ?? "Unknown"}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="Escalation feed"
          subtitle="What the team should talk through at standup today."
        >
          {mecoSnapshot.escalations.map((item) => (
            <View key={item.title} style={styles.alertCard}>
              <Pill label={item.severity.toUpperCase()} tone="orange" />
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertBody}>{item.detail}</Text>
            </View>
          ))}
        </SectionCard>
      </>
    );
  };

  const renderTasks = () => {
    const grouped = groupTasksByStatus(filteredTasks);

    return (
      <>
        <SectionCard
          title="Task workflow"
          subtitle="Each task carries ownership, blockers, manufacturing links, and QA gating."
        >
          <View style={styles.filterRow}>
            <FilterChip
              active={subsystemFilter === "all"}
              label="All subsystems"
              onPress={() => setSubsystemFilter("all")}
            />
            {mecoSnapshot.subsystems.map((subsystem) => (
              <FilterChip
                key={subsystem.id}
                active={subsystemFilter === subsystem.id}
                label={subsystem.name}
                onPress={() => setSubsystemFilter(subsystem.id)}
              />
            ))}
          </View>
          <View style={styles.metricRow}>
            {Object.entries(grouped).map(([status, tasks]) => (
              <StatusCounter
                key={status}
                label={taskStatusLabels[status as TaskStatus]}
                value={tasks.length}
              />
            ))}
          </View>
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              owner={memberById.get(task.ownerId)?.name ?? "Unassigned"}
              mentor={memberById.get(task.mentorId)?.name ?? "No mentor"}
              subsystem={subsystemById.get(task.subsystemId)?.name ?? "Unknown"}
            />
          ))}
        </SectionCard>
      </>
    );
  };

  const renderMeetings = () => {
    return (
      <>
        <SectionCard
          title="RSVP and attendance"
          subtitle="Meeting participation and man-hours stay visible for planning."
        >
          <View style={styles.featureHighlight}>
            <Text style={styles.featureHighlightTitle}>{nextMeeting.title}</Text>
            <Text style={styles.featureHighlightBody}>
              {formatLongDate(nextMeeting.date)} at {nextMeeting.time}.{" "}
              {nextMeeting.rsvpsYes} yes, {nextMeeting.rsvpsMaybe} maybe, and{" "}
              {nextMeeting.openSignIns} members still need to sign in.
            </Text>
          </View>
          {mecoSnapshot.attendanceRecords.map((record) => (
            <View key={record.id} style={styles.simpleRow}>
              <View>
                <Text style={styles.simpleRowTitle}>
                  {memberById.get(record.memberId)?.name}
                </Text>
                <Text style={styles.simpleRowBody}>{formatShortDate(record.date)}</Text>
              </View>
              <Pill label={`${record.totalHours.toFixed(1)}h`} tone="teal" />
            </View>
          ))}
        </SectionCard>

        <SectionCard
          title="Work log discipline"
          subtitle="Completion is blocked until implementation work has matching logs."
        >
          {mecoSnapshot.workLogs.map((workLog) => (
            <View key={workLog.id} style={styles.simpleRow}>
              <View style={styles.simpleRowCopy}>
                <Text style={styles.simpleRowTitle}>
                  {mecoSnapshot.tasks.find((task) => task.id === workLog.taskId)?.title}
                </Text>
                <Text style={styles.simpleRowBody}>
                  {workLog.hours.toFixed(1)}h by{" "}
                  {workLog.participantIds
                    .map((participantId) => memberById.get(participantId)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
              <Text style={styles.cardMeta}>{formatShortDate(workLog.date)}</Text>
            </View>
          ))}
        </SectionCard>
      </>
    );
  };

  const renderManufacturing = () => {
    return (
      <>
        <SectionCard
          title="Unified fabrication queue"
          subtitle="3D prints, CNC parts, and QA checkpoints in one mobile view."
        >
          {mecoSnapshot.manufacturingItems.map((item) => (
            <ManufacturingRow
              key={item.id}
              item={item}
              requester={memberById.get(item.requestedById)?.name ?? "Unknown"}
              subsystem={subsystemById.get(item.subsystemId)?.name ?? "Unknown"}
            />
          ))}
        </SectionCard>
      </>
    );
  };

  const renderPurchases = () => {
    return (
      <>
        <SectionCard
          title="Purchase workflow"
          subtitle="Mentor approvals, cost tracking, and delivery status stay tied to the subsystem."
        >
          <View style={styles.metricRow}>
            <StatusCounter label="Open requests" value={openPurchaseCount} />
            <StatusCounter
              label="Delivered"
              value={
                mecoSnapshot.purchaseItems.filter((item) => item.status === "delivered")
                  .length
              }
            />
          </View>
          {mecoSnapshot.purchaseItems.map((item) => (
            <PurchaseRow
              key={item.id}
              item={item}
              requester={memberById.get(item.requestedById)?.name ?? "Unknown"}
              subsystem={subsystemById.get(item.subsystemId)?.name ?? "Unknown"}
            />
          ))}
        </SectionCard>
      </>
    );
  };

  const renderQa = () => {
    return (
      <>
        <SectionCard
          title="Quality assurance rules"
          subtitle="A pass must include at least one mentor approval before anything can be marked complete."
        >
          <View style={styles.ruleCard}>
            <Text style={styles.ruleTitle}>Completion gate</Text>
            <Text style={styles.ruleBody}>
              Implementation complete is not the same as done. The app keeps a task in
              Waiting for QA until mentor-backed approval and work log submission are both
              satisfied.
            </Text>
          </View>
          {mecoSnapshot.qaReviews.map((review) => (
            <View key={review.id} style={styles.qaCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.qaTitle}>{review.subjectTitle}</Text>
                <Pill label={formatQaResult(review.result)} tone={qaTone(review.result)} />
              </View>
              <Text style={styles.qaBody}>{review.notes}</Text>
              <Text style={styles.cardMeta}>
                Reviewers:{" "}
                {review.participantIds
                  .map((participantId) => memberById.get(participantId)?.name)
                  .filter(Boolean)
                  .join(", ")}
              </Text>
              <Text style={styles.cardMeta}>
                Mentor approved: {review.mentorApproved ? "Yes" : "No"}
              </Text>
            </View>
          ))}
        </SectionCard>
      </>
    );
  };

  const renderMetrics = () => {
    const metricRows = [
      ["Average task actual", "8.1h"],
      ["Average QA turnaround", "1.4 days"],
      ["Manufacturing turnaround", "3.2 days"],
      ["Purchase lead time", "5.6 days"],
      ["Iteration-worthy failures", "1 this week"],
      ["Attendance coverage", "88% RSVP response"],
    ];

    return (
      <>
        <SectionCard
          title="Planning metrics"
          subtitle="The starter keeps the exact measurements the requirements doc called out."
        >
          {metricRows.map(([label, value]) => (
            <View key={label} style={styles.simpleRow}>
              <Text style={styles.simpleRowTitle}>{label}</Text>
              <Text style={styles.metricValueText}>{value}</Text>
            </View>
          ))}
        </SectionCard>
      </>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return renderOverview();
      case "tasks":
        return renderTasks();
      case "meetings":
        return renderMeetings();
      case "manufacturing":
        return renderManufacturing();
      case "purchases":
        return renderPurchases();
      case "qa":
        return renderQa();
      case "metrics":
        return renderMetrics();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>MECO Robotics</Text>
            <Text style={styles.title}>Project Operations Mobile</Text>
          </View>
          <Pill label={`${nextMeeting.rsvpsYes} RSVP'd`} tone="orange" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {renderActiveTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroChip}>
      <Text style={styles.heroChipLabel}>{label}</Text>
      <Text style={styles.heroChipValue}>{value}</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "teal" | "orange" | "gold" | "navy";
}) {
  return (
    <View style={[styles.metricCard, metricToneStyles[tone]]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "orange" | "teal" | "gold" | "navy";
}) {
  return (
    <View style={[styles.pill, pillToneStyles[tone]]}>
      <Text style={[styles.pillLabel, pillTextToneStyles[tone]]}>{label}</Text>
    </View>
  );
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatusCounter({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statusCounter}>
      <Text style={styles.statusCounterValue}>{value}</Text>
      <Text style={styles.statusCounterLabel}>{label}</Text>
    </View>
  );
}

function TaskRow({
  task,
  owner,
  mentor,
  subsystem,
}: {
  task: Task;
  owner: string;
  mentor: string;
  subsystem: string;
}) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.rowBetween}>
        <View style={styles.taskTitleGroup}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskSubtitle}>
            {subsystem} · owner {owner} · mentor {mentor}
          </Text>
        </View>
        <Pill label={taskStatusLabels[task.status]} tone={statusTone(task.status)} />
      </View>
      <Text style={styles.taskDescription}>{task.summary}</Text>
      <View style={styles.pillRow}>
        <Pill label={`Due ${formatShortDate(task.dueDate)}`} tone="navy" />
        <Pill label={`${task.priority.toUpperCase()} priority`} tone="orange" />
        {task.linkedManufacturingIds.length > 0 ? (
          <Pill label="Needs fabrication" tone="gold" />
        ) : null}
        {task.linkedPurchaseIds.length > 0 ? (
          <Pill label="Needs purchase" tone="gold" />
        ) : null}
      </View>
      {task.blockers.length > 0 ? (
        <View style={styles.calloutBox}>
          <Text style={styles.calloutTitle}>Blockers</Text>
          <Text style={styles.calloutBody}>{task.blockers.join(" | ")}</Text>
        </View>
      ) : null}
      <Text style={styles.cardMeta}>
        Estimated {task.estimatedHours.toFixed(1)}h · actual {task.actualHours.toFixed(1)}h
      </Text>
    </View>
  );
}

function ManufacturingRow({
  item,
  requester,
  subsystem,
}: {
  item: ManufacturingItem;
  requester: string;
  subsystem: string;
}) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.rowBetween}>
        <View style={styles.taskTitleGroup}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskSubtitle}>
            {subsystem} · {item.process.toUpperCase()} · requester {requester}
          </Text>
        </View>
        <Pill label={formatManufacturingStatus(item.status)} tone={manufacturingTone(item.status)} />
      </View>
      <Text style={styles.taskDescription}>
        Due {formatShortDate(item.dueDate)} · {item.quantity}x {item.material}
        {item.batchLabel ? ` · batch ${item.batchLabel}` : ""}
      </Text>
      <Text style={styles.cardMeta}>
        Mentor review: {item.mentorReviewed ? "complete" : "pending"} · QA records:{" "}
        {item.qaReviewCount}
      </Text>
    </View>
  );
}

function PurchaseRow({
  item,
  requester,
  subsystem,
}: {
  item: PurchaseItem;
  requester: string;
  subsystem: string;
}) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.rowBetween}>
        <View style={styles.taskTitleGroup}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskSubtitle}>
            {subsystem} · requester {requester} · vendor {item.vendor}
          </Text>
        </View>
        <Pill label={formatPurchaseStatus(item.status)} tone={purchaseTone(item.status)} />
      </View>
      <Text style={styles.taskDescription}>
        Estimate ${item.estimatedCost.toFixed(0)} · final{" "}
        {item.finalCost ? `$${item.finalCost.toFixed(0)}` : "pending"} · qty {item.quantity}
      </Text>
      <Text style={styles.cardMeta}>
        Mentor approved: {item.approvedByMentor ? "yes" : "no"} · link {item.linkLabel}
      </Text>
    </View>
  );
}

function formatShortDate(value: string) {
  return value.slice(5);
}

function formatLongDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function groupTasksByStatus(tasks: Task[]) {
  return {
    "not-started": tasks.filter((task) => task.status === "not-started"),
    "in-progress": tasks.filter((task) => task.status === "in-progress"),
    "waiting-for-qa": tasks.filter((task) => task.status === "waiting-for-qa"),
    complete: tasks.filter((task) => task.status === "complete"),
  };
}

function statusTone(status: TaskStatus): "orange" | "teal" | "gold" | "navy" {
  switch (status) {
    case "complete":
      return "teal";
    case "waiting-for-qa":
      return "gold";
    case "in-progress":
      return "orange";
    default:
      return "navy";
  }
}

function formatManufacturingStatus(status: ManufacturingItem["status"]) {
  if (status === "in-progress") {
    return "In Progress";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function manufacturingTone(
  status: ManufacturingItem["status"],
): "orange" | "teal" | "gold" | "navy" {
  if (status === "complete") {
    return "teal";
  }

  if (status === "qa") {
    return "gold";
  }

  if (status === "in-progress") {
    return "orange";
  }

  return "navy";
}

function formatPurchaseStatus(status: PurchaseItem["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function purchaseTone(
  status: PurchaseItem["status"],
): "orange" | "teal" | "gold" | "navy" {
  if (status === "delivered") {
    return "teal";
  }

  if (status === "approved" || status === "purchased") {
    return "gold";
  }

  if (status === "shipped") {
    return "orange";
  }

  return "navy";
}

function formatQaResult(result: "pass" | "minor-fix" | "iteration-worthy") {
  if (result === "minor-fix") {
    return "Minor fix";
  }

  if (result === "iteration-worthy") {
    return "Iteration";
  }

  return "Pass";
}

function qaTone(
  result: "pass" | "minor-fix" | "iteration-worthy",
): "orange" | "teal" | "gold" | "navy" {
  if (result === "pass") {
    return "teal";
  }

  if (result === "minor-fix") {
    return "gold";
  }

  return "orange";
}

const metricToneStyles = StyleSheet.create({
  teal: { backgroundColor: colors.mintSurface },
  orange: { backgroundColor: colors.orangeSurface },
  gold: { backgroundColor: colors.goldSurface },
  navy: { backgroundColor: colors.navySurface },
});

const pillToneStyles = StyleSheet.create({
  orange: { backgroundColor: colors.orangeSurface },
  teal: { backgroundColor: colors.mintSurface },
  gold: { backgroundColor: colors.goldSurface },
  navy: { backgroundColor: colors.navySurface },
});

const pillTextToneStyles = StyleSheet.create({
  orange: { color: colors.orangeInk },
  teal: { color: colors.mintInk },
  gold: { color: colors.goldInk },
  navy: { color: colors.navyInk },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    color: colors.orangeInk,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  tabRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  tabLabel: {
    color: colors.subtleText,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: colors.surface,
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.ink,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  heroEyebrow: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  heroBody: {
    color: colors.softText,
    fontSize: 15,
    lineHeight: 22,
  },
  heroStats: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  heroChip: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 104,
  },
  heroChipLabel: {
    color: colors.softText,
    fontSize: 12,
    marginBottom: 4,
  },
  heroChipValue: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "800",
  },
  metricGrid: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metricCard: {
    width: "47%",
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 120,
  },
  metricLabel: {
    color: colors.subtleText,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  metricDetail: {
    color: colors.subtleText,
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: colors.subtleText,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  sectionContent: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  subsystemCard: {
    backgroundColor: colors.canvas,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  subsystemTextGroup: {
    flex: 1,
    paddingRight: spacing.md,
  },
  subsystemName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  subsystemMeta: {
    color: colors.subtleText,
    marginTop: 4,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.track,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.orange,
    borderRadius: 999,
  },
  cardMeta: {
    color: colors.subtleText,
    fontSize: 13,
    lineHeight: 18,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  alertCard: {
    backgroundColor: colors.orangeSurface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  alertTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  alertBody: {
    color: colors.ink,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  filterChipLabel: {
    color: colors.ink,
    fontWeight: "700",
  },
  filterChipLabelActive: {
    color: colors.surface,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  statusCounter: {
    backgroundColor: colors.canvas,
    borderRadius: radii.lg,
    padding: spacing.md,
    minWidth: 132,
    flex: 1,
  },
  statusCounterValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
  },
  statusCounterLabel: {
    color: colors.subtleText,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  taskCard: {
    backgroundColor: colors.canvas,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  taskTitleGroup: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  taskTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  taskSubtitle: {
    color: colors.subtleText,
    marginTop: 4,
    lineHeight: 18,
  },
  taskDescription: {
    color: colors.ink,
    lineHeight: 21,
  },
  calloutBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  calloutTitle: {
    color: colors.orangeInk,
    fontWeight: "800",
    marginBottom: 4,
  },
  calloutBody: {
    color: colors.ink,
    lineHeight: 19,
  },
  featureHighlight: {
    backgroundColor: colors.navySurface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  featureHighlightTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  featureHighlightBody: {
    color: colors.subtleText,
    marginTop: spacing.xs,
    lineHeight: 21,
  },
  simpleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.canvas,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  simpleRowCopy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  simpleRowTitle: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 15,
  },
  simpleRowBody: {
    color: colors.subtleText,
    marginTop: 4,
  },
  ruleCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.orangeSurface,
  },
  ruleTitle: {
    color: colors.orangeInk,
    fontSize: 16,
    fontWeight: "800",
  },
  ruleBody: {
    color: colors.ink,
    marginTop: spacing.xs,
    lineHeight: 21,
  },
  qaCard: {
    backgroundColor: colors.canvas,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  qaTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
    paddingRight: spacing.sm,
  },
  qaBody: {
    color: colors.ink,
    lineHeight: 21,
  },
  metricValueText: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 16,
  },
});
