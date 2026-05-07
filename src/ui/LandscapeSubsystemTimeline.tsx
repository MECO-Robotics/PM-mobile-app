import { Pressable, ScrollView, View } from "react-native";

import { Text, useTranslation } from "../i18n";
import type { Event, Member, Subsystem, Task } from "../types/domain";
import type { AppThemeColors } from "../theme";
import { getAppLocale } from "./helpers";
import { landscapeTimelineStyles as styles } from "./landscapeTimelineStyles";

const DAY_WIDTH = 56;
const VISIBLE_DAY_COUNT = 31;
const SUBSYSTEM_COLORS = ["#ea1c2d", "#f59e0b", "#8b5cf6", "#14b8a6", "#3b82f6"];
const TASK_COLORS = ["#c05283", "#7657d6", "#cf7346", "#64748b", "#2563eb"];

type Props = {
  colors: AppThemeColors;
  events: Event[];
  membersById: Record<string, Member>;
  onAddTask: () => void;
  onTaskPress: (task: Task) => void;
  subsystems: Subsystem[];
  tasks: Task[];
};

function parseDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date) {
  return Math.round((parseDate(toDateKey(end)).getTime() - parseDate(toDateKey(start)).getTime()) / 86400000);
}

function getTaskStartDate(task: Task) {
  if (task.startDate) {
    return parseDate(task.startDate);
  }

  const estimatedDays = Math.max(1, Math.min(5, Math.ceil(task.estimatedHours / 4)));
  return addDays(parseDate(task.dueDate), -estimatedDays + 1);
}

function getTimelineDays(anchor: Date) {
  return Array.from({ length: VISIBLE_DAY_COUNT }, (_value, index) => addDays(anchor, index));
}

function getLaneTaskRange(task: Task, monthStart: Date, dayCount: number) {
  const startIndex = Math.max(0, Math.min(dayCount - 1, daysBetween(monthStart, getTaskStartDate(task))));
  const endIndex = Math.max(0, Math.min(dayCount - 1, daysBetween(monthStart, parseDate(task.dueDate))));
  const firstIndex = Math.min(startIndex, endIndex);
  const lastIndex = Math.max(startIndex, endIndex);

  return {
    left: firstIndex * DAY_WIDTH + 6,
    width: Math.max(DAY_WIDTH - 12, (lastIndex - firstIndex + 1) * DAY_WIDTH - 12),
  };
}

function formatMonth(anchor: Date, locale: string) {
  return anchor.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

function buildLanes(tasks: Task[], subsystems: Subsystem[]) {
  const subsystemsById = Object.fromEntries(
    subsystems.map((subsystem) => [subsystem.id, subsystem]),
  ) as Record<string, Subsystem>;

  return [...tasks]
    .sort((left, right) => {
      const subsystemDelta = left.subsystemId.localeCompare(right.subsystemId);
      return subsystemDelta !== 0 ? subsystemDelta : left.dueDate.localeCompare(right.dueDate);
    })
    .map((task, index) => ({
      id: task.id,
      task,
      subsystem: subsystemsById[task.subsystemId] ?? null,
      color: TASK_COLORS[index % TASK_COLORS.length],
    }));
}

export function LandscapeSubsystemTimeline({
  colors,
  events,
  membersById,
  onAddTask,
  onTaskPress,
  subsystems,
  tasks,
}: Props) {
  const { t } = useTranslation();
  const locale = getAppLocale();
  const lanes = buildLanes(tasks, subsystems);
  const timelineStart = parseDate(toDateKey(new Date()));
  const timelineDays = getTimelineDays(timelineStart);
  const chartWidth = timelineDays.length * DAY_WIDTH;
  const todayKey = toDateKey(new Date());
  const todayIndex = timelineDays.findIndex((day) => toDateKey(day) === todayKey);
  const visibleEventIndexes = events
    .map((event) => daysBetween(timelineStart, parseDate(event.startDateTime)))
    .filter((index) => index >= 0 && index < timelineDays.length);

  return (
    <View style={[styles.shell, { backgroundColor: colors.canvas }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Subsystem timeline</Text>
        <View style={styles.controls}>
          <View style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.controlLabel, { color: colors.subtleText }]}>Filters</Text>
          </View>
          <View style={[styles.controlButton, { borderColor: colors.blue, backgroundColor: colors.navySurface }]}>
            <Text style={[styles.controlLabel, { color: colors.navyInk }]}>Month</Text>
          </View>
          <View style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.controlLabel, { color: colors.ink }]}>{formatMonth(timelineStart, locale)}</Text>
          </View>
          <Pressable onPress={onAddTask} style={[styles.addButton, { backgroundColor: colors.blue }]}>
            <Text style={styles.addLabel}>Add</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.board, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {lanes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.subtleText }]}>
              Add tasks to populate the subsystem timeline.
            </Text>
          </View>
        ) : (
          <View style={styles.contentRow}>
            <View style={[styles.sidebar, { borderColor: colors.border }]}>
              <View style={[styles.sidebarHeader, { borderColor: colors.border }]}>
                <View style={styles.sidebarHeaderCell}>
                  <Text style={[styles.sidebarHeaderText, { color: colors.ink }]}>Project</Text>
                </View>
                <View style={styles.sidebarHeaderCell}>
                  <Text style={[styles.sidebarHeaderText, { color: colors.ink }]}>Subsystem</Text>
                </View>
              </View>
              {lanes.map((lane, index) => {
                const owner = lane.task.ownerId ? membersById[lane.task.ownerId]?.name : null;

                return (
                  <View
                    key={lane.id}
                    style={[styles.laneLabel, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  >
                    <View
                      style={[
                        styles.subsystemDot,
                        { backgroundColor: SUBSYSTEM_COLORS[index % SUBSYSTEM_COLORS.length] },
                      ]}
                    />
                    <Text numberOfLines={1} style={[styles.lanePrimary, { color: colors.ink }]}>
                      {lane.subsystem?.name ?? t("Unknown")}
                    </Text>
                    <Text numberOfLines={1} style={[styles.laneSecondary, { color: colors.subtleText }]}>
                      {owner ?? t("Unassigned")}
                    </Text>
                  </View>
                );
              })}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.chart, { width: chartWidth }]}>
                <View style={[styles.monthLabel, { borderColor: colors.border }]}>
                  <Text style={[styles.monthText, { color: colors.navyInk }]}>
                    {timelineStart.toLocaleDateString(locale, { month: "long" })}
                  </Text>
                </View>
                <View style={[styles.dayHeaderRow, { borderColor: colors.border }]}>
                  {timelineDays.map((day) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <View
                        key={toDateKey(day)}
                        style={[
                          styles.dayHeaderCell,
                          {
                            backgroundColor: isWeekend ? colors.navySurface : colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.weekday, { color: colors.subtleText }]}>
                          {day.toLocaleDateString(locale, { weekday: "short" }).toLocaleUpperCase(locale)}
                        </Text>
                        <Text style={[styles.dayNumber, { color: colors.ink }]}>{day.getDate()}</Text>
                      </View>
                    );
                  })}
                </View>

                {lanes.map((lane) => {
                  const range = getLaneTaskRange(lane.task, timelineStart, timelineDays.length);

                  return (
                    <View key={lane.id} style={[styles.lane, { borderColor: colors.border }]}>
                      {timelineDays.map((day) => {
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        return (
                          <View
                            key={`${lane.id}-${toDateKey(day)}`}
                            style={[
                              styles.dayCell,
                              {
                                backgroundColor: isWeekend ? colors.navySurface : colors.canvas,
                                borderColor: colors.border,
                              },
                            ]}
                          />
                        );
                      })}
                      <Pressable
                        onPress={() => onTaskPress(lane.task)}
                        style={[styles.taskBar, { left: range.left, width: range.width, backgroundColor: lane.color }]}
                      >
                        <Text numberOfLines={1} style={styles.taskBarText}>{lane.task.title}</Text>
                      </Pressable>
                    </View>
                  );
                })}

                {todayIndex >= 0 ? (
                  <View style={[styles.todayMarker, { left: todayIndex * DAY_WIDTH, backgroundColor: colors.blue }]} />
                ) : null}
                {visibleEventIndexes.map((eventIndex, index) => (
                  <View
                    key={`${eventIndex}-${index}`}
                    style={[
                      styles.todayMarker,
                      {
                        left: eventIndex * DAY_WIDTH + DAY_WIDTH - 2,
                        backgroundColor: colors.orange,
                        opacity: 0.7,
                      },
                    ]}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}
