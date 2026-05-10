import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { Text } from "../i18n";
import type { Event, Member, Subsystem, Task } from "../types/domain";
import type { AppThemeColors } from "../theme";
import { getAppLocale } from "./helpers";
import { landscapeTimelineStyles as styles } from "./landscapeTimelineStyles";
import { CalendarBoard, TimelineBoard } from "./landscapeTimeline/Boards";
import {
  addDays,
  daysBetween,
  formatMonth,
  getCalendarDays,
  getNextDeadline,
  parseDate,
  startOfMonth,
  toDateKey,
  VISIBLE_DAY_COUNT,
} from "./landscapeTimeline/dateUtils";
import { TimelineDropdowns } from "./landscapeTimeline/TimelineDropdowns";
import type { BoardViewMode, RangeMode, TimelineLane } from "./landscapeTimeline/types";

const TASK_COLORS = ["#c05283", "#7657d6", "#cf7346", "#64748b", "#2563eb"];

type Props = {
  colors: AppThemeColors;
  events: Event[];
  membersById: Record<string, Member>;
  onAddDeadline: () => void;
  onAddTask: () => void;
  onTaskPress: (task: Task) => void;
  subsystems: Subsystem[];
  tasks: Task[];
};

function buildLanes(tasks: Task[], subsystems: Subsystem[]) {
  const subsystemsById = Object.fromEntries(
    subsystems.map((subsystem) => [subsystem.id, subsystem]),
  ) as Record<string, Subsystem>;
  const groupedTasks = new Map<
    string,
    {
      projectLabel: string;
      subsystem: Subsystem | null;
      tasks: Task[];
    }
  >();

  tasks.forEach((task) => {
    const subsystem = subsystemsById[task.subsystemId] ?? null;
    const parentSubsystem = subsystem?.parentSubsystemId
      ? subsystemsById[subsystem.parentSubsystemId]
      : null;
    const projectLabel =
      task.projectId ??
      task.workstreamId ??
      parentSubsystem?.name ??
      subsystem?.name ??
      "Robot";
    const groupKey = `${projectLabel}:${task.subsystemId}`;
    const group = groupedTasks.get(groupKey) ?? {
      projectLabel,
      subsystem,
      tasks: [],
    };

    group.tasks.push(task);
    groupedTasks.set(groupKey, group);
  });

  return Array.from(groupedTasks.entries())
    .map(([id, group], index): TimelineLane => {
      const sortedTasks = [...group.tasks].sort((left, right) =>
        left.dueDate.localeCompare(right.dueDate),
      );

      return {
        id,
        projectLabel: group.projectLabel,
        subsystem: group.subsystem,
        tasks: sortedTasks,
        completedCount: sortedTasks.filter((task) => task.status === "complete").length,
        totalCount: sortedTasks.length,
        color: TASK_COLORS[index % TASK_COLORS.length],
      };
    })
    .sort((left, right) => {
      const projectDelta = left.projectLabel.localeCompare(right.projectLabel);
      return projectDelta !== 0
        ? projectDelta
        : (left.subsystem?.name ?? "").localeCompare(right.subsystem?.name ?? "");
    });
}

export function LandscapeSubsystemTimeline({
  colors,
  events,
  membersById,
  onAddDeadline,
  onAddTask,
  onTaskPress,
  subsystems,
  tasks,
}: Props) {
  const locale = getAppLocale();
  const [viewMode, setViewMode] = useState<BoardViewMode>("timeline");
  const [rangeMode, setRangeMode] = useState<RangeMode>("month");
  const [activeMenu, setActiveMenu] = useState<"view" | "range" | "month" | "add" | null>(null);
  const [timelineStart, setTimelineStart] = useState(() =>
    startOfMonth(parseDate(toDateKey(new Date()))),
  );
  const nextDeadline = getNextDeadline(events, timelineStart);
  const rangeEnd =
    rangeMode === "deadline" && nextDeadline
      ? nextDeadline
      : addDays(timelineStart, VISIBLE_DAY_COUNT - 1);
  const timelineDayCount = Math.max(1, daysBetween(timelineStart, rangeEnd) + 1);
  const timelineDays = Array.from({ length: timelineDayCount }, (_value, index) =>
    addDays(timelineStart, index),
  );
  const calendarDays = getCalendarDays(timelineStart);
  const lanes = buildLanes(tasks, subsystems);
  const visibleEventIndexes = events
    .map((event) => daysBetween(timelineStart, parseDate(event.startDateTime)))
    .filter((index) => index >= 0 && index < timelineDays.length);
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_value, index) => {
        const monthDate = new Date(timelineStart.getFullYear(), index, 1);

        return {
          date: monthDate,
          label: monthDate.toLocaleDateString(locale, { month: "long" }),
        };
      }),
    [locale, timelineStart],
  );

  const openMenu = (menu: "view" | "range" | "month" | "add") => {
    setActiveMenu((current) => (current === menu ? null : menu));
  };

  return (
    <View style={[styles.shell, { backgroundColor: colors.canvas }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Subsystem timeline</Text>
        <View style={styles.controls}>
          <Pressable
            onPress={() => openMenu("view")}
            style={[
              styles.controlButton,
              {
                borderColor: activeMenu === "view" ? colors.blue : colors.border,
                backgroundColor: activeMenu === "view" ? colors.navySurface : colors.surface,
              },
            ]}
          >
            <Text style={[styles.controlLabel, { color: activeMenu === "view" ? colors.navyInk : colors.subtleText }]}>
              View
            </Text>
          </Pressable>
          <Pressable
            onPress={() => openMenu("range")}
            style={[styles.controlButton, { borderColor: colors.blue, backgroundColor: colors.navySurface }]}
          >
            <Text style={[styles.controlLabel, { color: colors.navyInk }]}>
              {rangeMode === "month" ? "Month" : "Deadline"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => openMenu("month")}
            style={[
              styles.controlButton,
              {
                borderColor: activeMenu === "month" ? colors.blue : colors.border,
                backgroundColor: activeMenu === "month" ? colors.navySurface : colors.surface,
              },
            ]}
          >
            <Text style={[styles.controlLabel, { color: colors.ink }]}>
              {formatMonth(timelineStart, locale)}
            </Text>
          </Pressable>
          <Pressable onPress={() => openMenu("add")} style={[styles.addButton, { backgroundColor: colors.blue }]}>
            <Text style={styles.addLabel}>Add</Text>
          </Pressable>
        </View>
      </View>

      {activeMenu ? (
        <TimelineDropdowns
          activeMenu={activeMenu}
          colors={colors}
          monthOptions={monthOptions}
          onAddDeadline={onAddDeadline}
          onAddTask={onAddTask}
          onClose={() => setActiveMenu(null)}
          onSetRangeMode={setRangeMode}
          onSetTimelineStart={setTimelineStart}
          onSetViewMode={setViewMode}
          rangeMode={rangeMode}
          timelineStart={timelineStart}
          viewMode={viewMode}
        />
      ) : null}

      <View style={[styles.board, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {lanes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.subtleText }]}>
              Add tasks to populate the subsystem timeline.
            </Text>
          </View>
        ) : viewMode === "calendar" ? (
          <CalendarBoard
            calendarDays={calendarDays}
            colors={colors}
            locale={locale}
            onTaskPress={onTaskPress}
            timelineStart={timelineStart}
            visibleTasks={tasks}
          />
        ) : (
          <TimelineBoard
            colors={colors}
            lanes={lanes}
            locale={locale}
            membersById={membersById}
            onTaskPress={onTaskPress}
            timelineDays={timelineDays}
            timelineStart={timelineStart}
            visibleEventIndexes={visibleEventIndexes}
          />
        )}
      </View>
    </View>
  );
}
