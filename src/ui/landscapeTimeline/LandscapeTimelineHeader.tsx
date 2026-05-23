import { useState } from "react";
import { Pressable, View } from "react-native";

import { Text } from "../../i18n";
import type { AppThemeColors } from "../../theme";
import { LandscapeTimelineMonthPicker } from "./LandscapeTimelineMonthPicker";
import { landscapeTimelineHeaderStyles as styles } from "./landscapeTimelineHeaderStyles";

export type LandscapeTaskViewMode = "timeline" | "calendar";

type Props = {
  canAddTask?: boolean;
  colors: AppThemeColors;
  locale: string;
  onAddDeadline: () => void;
  onAddTask: () => void;
  onSelectMonth: (date: Date) => void;
  onSelectViewMode: (mode: LandscapeTaskViewMode) => void;
  timelineStart: Date;
  timelineYear: number;
  viewMode: LandscapeTaskViewMode;
};

const VIEW_OPTIONS: { id: LandscapeTaskViewMode; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "calendar", label: "Calendar" },
];

export function LandscapeTimelineHeader({
  canAddTask = true,
  colors,
  locale,
  onAddDeadline,
  onAddTask,
  onSelectMonth,
  onSelectViewMode,
  timelineStart,
  timelineYear,
  viewMode,
}: Props) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.ink }]}>Subsystem timeline</Text>
      <View style={styles.controls}>
        <View style={[styles.viewSwitch, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {VIEW_OPTIONS.map((option) => {
            const isActive = viewMode === option.id;

            return (
              <Pressable
                key={option.id}
                onPress={() => onSelectViewMode(option.id)}
                style={[
                  styles.viewSwitchButton,
                  isActive ? { backgroundColor: colors.navySurface } : null,
                ]}
              >
                <Text style={[styles.viewSwitchLabel, { color: isActive ? colors.navyInk : colors.subtleText }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <LandscapeTimelineMonthPicker
          colors={colors}
          locale={locale}
          onSelectMonth={onSelectMonth}
          timelineStart={timelineStart}
          timelineYear={timelineYear}
        />
        <View style={styles.addMenuAnchor}>
          <Pressable
            onPress={() => setIsAddMenuOpen((current) => !current)}
            style={[styles.addButton, { backgroundColor: colors.blue }]}
          >
            <Text style={styles.addLabel}>Add</Text>
          </Pressable>
          {isAddMenuOpen ? (
            <View style={[styles.addMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {canAddTask ? (
                <Pressable
                  onPress={() => {
                    setIsAddMenuOpen(false);
                    onAddTask();
                  }}
                  style={styles.addMenuItem}
                >
                  <Text style={[styles.addMenuItemText, { color: colors.ink }]}>Add task</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => {
                  setIsAddMenuOpen(false);
                  onAddDeadline();
                }}
                style={styles.addMenuItem}
              >
                <Text style={[styles.addMenuItemText, { color: colors.ink }]}>Add deadline</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
