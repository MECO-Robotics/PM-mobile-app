import { useState } from "react";
import { useWindowDimensions, View } from "react-native";

import type { Event, Member, Subsystem, Task } from "../../types/domain";
import type { AppThemeColors } from "../../theme";
import { getAppLocale, localTodayDate } from "../helpers";
import { LandscapeCalendarView } from "./LandscapeCalendarView";
import { LandscapeTimelineBoard } from "./LandscapeTimelineBoard";
import {
  buildLanes,
  expandLanesForViewport,
  getMonthStartDate,
  getTimelineDays,
  parseDate,
} from "./landscapeTimelineModel";
import {
  LandscapeTimelineHeader,
  type LandscapeTaskViewMode,
} from "./LandscapeTimelineHeader";
import { landscapeTimelineStyles as styles } from "./landscapeTimelineStyles";

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

export function LandscapeSubsystemTimeline({
  colors,
  events,
  onAddDeadline,
  onAddTask,
  onTaskPress,
  subsystems,
  tasks,
}: Props) {
  const locale = getAppLocale();
  const todayKey = localTodayDate();
  const today = parseDate(todayKey);
  const [selectedMonthStart, setSelectedMonthStart] = useState(() =>
    getMonthStartDate(today),
  );
  const [viewMode, setViewMode] = useState<LandscapeTaskViewMode>("timeline");
  const { height } = useWindowDimensions();
  const timelineStart = selectedMonthStart;
  const timelineYear = timelineStart.getFullYear();
  const timelineDays = getTimelineDays(timelineStart);
  const packedLanes = buildLanes(tasks, subsystems, timelineStart, timelineDays.length);
  const lanes = expandLanesForViewport(packedLanes, height);
  const laneHeight = lanes.reduce((sum, lane) => sum + lane.height, 0);

  return (
    <View style={[styles.shell, { backgroundColor: colors.canvas }]}>
      <LandscapeTimelineHeader
        colors={colors}
        locale={locale}
        onAddDeadline={onAddDeadline}
        onAddTask={onAddTask}
        onSelectMonth={setSelectedMonthStart}
        onSelectViewMode={setViewMode}
        timelineStart={timelineStart}
        timelineYear={timelineYear}
        viewMode={viewMode}
      />
      {viewMode === "timeline" ? (
        <LandscapeTimelineBoard
          colors={colors}
          events={events}
          laneHeight={laneHeight}
          lanes={lanes}
          locale={locale}
          onTaskPress={onTaskPress}
          timelineDays={timelineDays}
          timelineStart={timelineStart}
          todayKey={todayKey}
        />
      ) : (
        <LandscapeCalendarView
          colors={colors}
          events={events}
          lanes={lanes}
          locale={locale}
          onTaskPress={onTaskPress}
          timelineStart={timelineStart}
          todayKey={todayKey}
        />
      )}
    </View>
  );
}
