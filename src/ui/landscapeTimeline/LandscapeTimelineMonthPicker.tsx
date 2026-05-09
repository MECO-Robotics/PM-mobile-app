import { useState } from "react";
import { Pressable, View } from "react-native";

import { Text } from "../../i18n";
import type { AppThemeColors } from "../../theme";
import { landscapeTimelineHeaderStyles as styles } from "./landscapeTimelineHeaderStyles";

type Props = {
  colors: AppThemeColors;
  locale: string;
  onSelectMonth: (date: Date) => void;
  timelineStart: Date;
  timelineYear: number;
};

function formatMonth(anchor: Date, locale: string) {
  return anchor.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

function getMonthOptions(year: number, locale: string) {
  return Array.from({ length: 12 }, (_value, monthIndex) => {
    const date = new Date(year, monthIndex, 1);

    return {
      date,
      label: date.toLocaleDateString(locale, { month: "short" }),
      monthIndex,
    };
  });
}

export function LandscapeTimelineMonthPicker({
  colors,
  locale,
  onSelectMonth,
  timelineStart,
  timelineYear,
}: Props) {
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  const monthOptions = getMonthOptions(timelineYear, locale);

  return (
    <>
      <Pressable
        onPress={() => setIsMonthMenuOpen((current) => !current)}
        style={[
          styles.controlButton,
          styles.controlButtonActive,
          { borderColor: colors.blue, backgroundColor: colors.navySurface },
        ]}
      >
        <Text style={[styles.controlLabel, styles.controlLabelActive, { color: colors.navyInk }]}>Month</Text>
      </Pressable>
      <View style={styles.monthMenuAnchor}>
        <Pressable
          onPress={() => setIsMonthMenuOpen((current) => !current)}
          style={[styles.controlButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Text style={[styles.controlLabel, { color: colors.ink }]}>{formatMonth(timelineStart, locale)}</Text>
        </Pressable>
        {isMonthMenuOpen ? (
          <View style={[styles.monthMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {monthOptions.map((option) => {
              const isSelected = option.monthIndex === timelineStart.getMonth();

              return (
                <Pressable
                  key={option.monthIndex}
                  onPress={() => {
                    onSelectMonth(option.date);
                    setIsMonthMenuOpen(false);
                  }}
                  style={[
                    styles.monthMenuItem,
                    isSelected ? { backgroundColor: colors.navySurface } : null,
                  ]}
                >
                  <Text style={[styles.monthMenuItemText, { color: isSelected ? colors.navyInk : colors.ink }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </>
  );
}
