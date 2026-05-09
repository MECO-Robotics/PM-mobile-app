import { StyleSheet } from "react-native";

import { spacing } from "../../theme";
import { planner } from "./landscapeTimelinePalette";

export const landscapeTimelineStyles = StyleSheet.create({
  shell: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  board: {
    minHeight: 268,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: planner.border,
    backgroundColor: planner.chart,
    overflow: "hidden",
  },
  contentRow: {
    flexDirection: "row",
  },
  emptyState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: planner.chart,
  },
  emptyText: {
    color: planner.muted,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
});
