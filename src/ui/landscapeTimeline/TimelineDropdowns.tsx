import { Pressable, View } from "react-native";

import { Text } from "../../i18n";
import { landscapeTimelineStyles as styles } from "../landscapeTimelineStyles";

import type { BoardViewMode, RangeMode } from "./types";

type TimelineDropdownsProps = {
  activeMenu: "view" | "range" | "month" | "add";
  colors: {
    border: string;
    canvas: string;
    ink: string;
    navyInk: string;
    navySurface: string;
    surface: string;
  };
  monthOptions: { date: Date; label: string }[];
  onAddDeadline: () => void;
  onAddTask: () => void;
  onClose: () => void;
  onSetRangeMode: (mode: RangeMode) => void;
  onSetTimelineStart: (date: Date) => void;
  onSetViewMode: (mode: BoardViewMode) => void;
  rangeMode: RangeMode;
  timelineStart: Date;
  viewMode: BoardViewMode;
};

export function TimelineDropdowns({
  activeMenu,
  colors,
  monthOptions,
  onAddDeadline,
  onAddTask,
  onClose,
  onSetRangeMode,
  onSetTimelineStart,
  onSetViewMode,
  rangeMode,
  timelineStart,
  viewMode,
}: TimelineDropdownsProps) {
  return (
    <View style={styles.dropdownLayer}>
      {activeMenu === "view" ? (
        <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { label: "Timeline", value: "timeline" },
            { label: "Calendar view", value: "calendar" },
          ].map((option) => {
            const isActive = viewMode === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSetViewMode(option.value as BoardViewMode);
                  onClose();
                }}
                style={[styles.dropdownItem, isActive && { backgroundColor: colors.navySurface }]}
              >
                <Text style={[styles.dropdownItemLabel, { color: isActive ? colors.navyInk : colors.ink }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {activeMenu === "range" ? (
        <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { label: "Month view", value: "month" },
            { label: "Deadline view", value: "deadline" },
          ].map((option) => {
            const isActive = rangeMode === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSetRangeMode(option.value as RangeMode);
                  onClose();
                }}
                style={[styles.dropdownItem, isActive && { backgroundColor: colors.navySurface }]}
              >
                <Text style={[styles.dropdownItemLabel, { color: isActive ? colors.navyInk : colors.ink }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {activeMenu === "month" ? (
        <View style={[styles.monthPickerMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.monthPickerHeader}>
            <Pressable
              onPress={() =>
                onSetTimelineStart(
                  new Date(timelineStart.getFullYear() - 1, timelineStart.getMonth(), 1),
                )
              }
              style={[styles.yearButton, { borderColor: colors.border, backgroundColor: colors.canvas }]}
            >
              <Text style={[styles.yearButtonLabel, { color: colors.ink }]}>Prev</Text>
            </Pressable>
            <Text style={[styles.yearLabel, { color: colors.ink }]}>{timelineStart.getFullYear()}</Text>
            <Pressable
              onPress={() =>
                onSetTimelineStart(
                  new Date(timelineStart.getFullYear() + 1, timelineStart.getMonth(), 1),
                )
              }
              style={[styles.yearButton, { borderColor: colors.border, backgroundColor: colors.canvas }]}
            >
              <Text style={[styles.yearButtonLabel, { color: colors.ink }]}>Next</Text>
            </Pressable>
          </View>
          <View style={styles.monthGrid}>
            {monthOptions.map((option) => {
              const isActive = timelineStart.getMonth() === option.date.getMonth();

              return (
                <Pressable
                  key={option.label}
                  onPress={() => {
                    onSetTimelineStart(option.date);
                    onClose();
                  }}
                  style={[
                    styles.monthOption,
                    {
                      borderColor: isActive ? colors.navyInk : colors.border,
                      backgroundColor: isActive ? colors.navySurface : colors.canvas,
                    },
                  ]}
                >
                  <Text style={[styles.monthOptionLabel, { color: isActive ? colors.navyInk : colors.ink }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {activeMenu === "add" ? (
        <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            onPress={() => {
              onClose();
              onAddTask();
            }}
            style={[styles.dropdownItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
          >
            <Text style={[styles.dropdownItemLabel, { color: colors.ink }]}>Task</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onClose();
              onAddDeadline();
            }}
            style={styles.dropdownItem}
          >
            <Text style={[styles.dropdownItemLabel, { color: colors.ink }]}>Deadline</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
