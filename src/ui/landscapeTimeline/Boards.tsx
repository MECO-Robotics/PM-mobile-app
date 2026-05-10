import { Pressable, ScrollView, View } from "react-native";

import { Text, useTranslation } from "../../i18n";
import type { Task } from "../../types/domain";
import { landscapeTimelineStyles as styles } from "../landscapeTimelineStyles";

import { DAY_WIDTH, getLaneTaskRange, taskTouchesDay, toDateKey } from "./dateUtils";
import type { TimelineBoardProps } from "./types";

const SUBSYSTEM_COLORS = ["#ea1c2d", "#f59e0b", "#8b5cf6", "#14b8a6", "#3b82f6"];
const TASK_COLORS = ["#c05283", "#7657d6", "#cf7346", "#64748b", "#2563eb"];
const LANE_HEIGHT = 74;

type CalendarBoardProps = {
  calendarDays: Date[];
  colors: {
    border: string;
    canvas: string;
    ink: string;
    navyInk: string;
    navySurface: string;
    subtleText: string;
  };
  locale: string;
  onTaskPress: (task: Task) => void;
  timelineStart: Date;
  visibleTasks: Task[];
};

export function CalendarBoard({
  calendarDays,
  colors,
  locale,
  onTaskPress,
  timelineStart,
  visibleTasks,
}: CalendarBoardProps) {
  const todayKey = toDateKey(new Date());

  return (
    <View>
      <View style={[styles.calendarWeekHeader, { borderColor: colors.border }]}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
          <View key={weekday} style={[styles.calendarHeaderCell, { borderColor: colors.border }]}>
            <Text style={[styles.weekday, { color: colors.subtleText }]}>
              {weekday.toLocaleUpperCase(locale)}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {calendarDays.map((day) => {
          const dateKey = toDateKey(day);
          const isCurrentMonth = day.getMonth() === timelineStart.getMonth();
          const isToday = dateKey === todayKey;
          const dayTasks = visibleTasks.filter((task) => taskTouchesDay(task, day)).slice(0, 3);

          return (
            <View
              key={dateKey}
              style={[
                styles.calendarDay,
                {
                  backgroundColor: isCurrentMonth ? colors.canvas : colors.navySurface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.calendarDayNumber, { color: isToday ? colors.navyInk : colors.ink }]}>
                {day.getDate()}
              </Text>
              {dayTasks.map((task, index) => (
                <Pressable
                  key={`${dateKey}-${task.id}`}
                  onPress={() => onTaskPress(task)}
                  style={[
                    styles.calendarTaskPill,
                    { backgroundColor: TASK_COLORS[index % TASK_COLORS.length] },
                  ]}
                >
                  <Text numberOfLines={1} style={styles.calendarTaskText}>
                    {task.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function TimelineBoard({
  colors,
  lanes,
  locale,
  membersById,
  onTaskPress,
  timelineDays,
  timelineStart,
  visibleEventIndexes,
}: TimelineBoardProps) {
  const { t } = useTranslation();
  const chartWidth = timelineDays.length * DAY_WIDTH;
  const todayKey = toDateKey(new Date());
  const todayIndex = timelineDays.findIndex((day) => toDateKey(day) === todayKey);
  const projectGroups = lanes.reduce<{ label: string; lanes: typeof lanes }[]>((groups, lane) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.label === lane.projectLabel) {
      lastGroup.lanes.push(lane);
    } else {
      groups.push({ label: lane.projectLabel, lanes: [lane] });
    }

    return groups;
  }, []);

  return (
    <View style={styles.contentRow}>
      <View style={[styles.sidebar, { borderColor: colors.border }]}>
        <View style={[styles.sidebarHeader, { borderColor: colors.border }]}>
          <View style={styles.projectHeaderCell}>
            <Text style={[styles.sidebarHeaderText, { color: colors.ink }]}>Project</Text>
          </View>
          <View style={styles.subsystemHeaderCell}>
            <Text style={[styles.sidebarHeaderText, { color: colors.ink }]}>Subsystem</Text>
          </View>
        </View>
        <View style={styles.sidebarBody}>
          <View style={[styles.projectColumn, { borderColor: colors.border }]}>
            {projectGroups.map((group) => (
              <View
                key={group.label}
                style={[
                  styles.projectGroupCell,
                  {
                    backgroundColor: colors.canvas,
                    borderColor: colors.border,
                    height: group.lanes.length * LANE_HEIGHT,
                  },
                ]}
              >
                <Text numberOfLines={2} style={[styles.projectGroupLabel, { color: colors.ink }]}>
                  {group.label}
                </Text>
                <Text style={[styles.projectGroupCount, { color: colors.subtleText }]}>
                  {group.lanes.reduce((sum, lane) => sum + lane.completedCount, 0)}/
                  {group.lanes.reduce((sum, lane) => sum + lane.totalCount, 0)}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.subsystemColumn}>
            {lanes.map((lane, index) => {
              const owners = Array.from(
                new Set(
                  lane.tasks
                    .map((task) => (task.ownerId ? membersById[task.ownerId]?.name : null))
                    .filter(Boolean),
                ),
              );

              return (
                <View
                  key={lane.id}
                  style={[
                    styles.laneLabel,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
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
                  <Text style={[styles.laneCount, { color: colors.subtleText }]}>
                    {lane.completedCount}/{lane.totalCount}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.laneSecondary, { color: colors.subtleText }]}
                  >
                    {owners[0] ?? t("Unassigned")}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
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

          {lanes.map((lane) => (
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
                {lane.tasks.map((task, taskIndex) => {
                  const range = getLaneTaskRange(task, timelineStart, timelineDays.length);

                  return (
                    <Pressable
                      key={task.id}
                      onPress={() => onTaskPress(task)}
                      style={[
                        styles.taskBar,
                        {
                          left: range.left,
                          top: 12 + (taskIndex % 2) * 28,
                          width: range.width,
                          backgroundColor: TASK_COLORS[taskIndex % TASK_COLORS.length],
                        },
                      ]}
                    >
                      <Text numberOfLines={1} style={styles.taskBarText}>
                        {task.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
          ))}

          {todayIndex >= 0 ? (
            <View
              style={[
                styles.todayMarker,
                { left: todayIndex * DAY_WIDTH, backgroundColor: colors.blue },
              ]}
            />
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
  );
}
