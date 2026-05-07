import { StyleSheet } from "react-native";

import { colors, spacing } from "../theme";

export const landscapeTimelineStyles = StyleSheet.create({
  shell: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  controlButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  addButton: {
    minHeight: 46,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "900",
  },
  board: {
    minHeight: 268,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  contentRow: {
    flexDirection: "row",
  },
  sidebar: {
    width: 332,
    borderRightWidth: 1,
  },
  sidebarHeader: {
    height: 74,
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  sidebarHeaderCell: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  sidebarHeaderText: {
    fontSize: 17,
    fontWeight: "900",
  },
  laneLabel: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  subsystemDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  lanePrimary: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "900",
  },
  laneSecondary: {
    width: 92,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },
  chart: {
    position: "relative",
  },
  monthLabel: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  monthText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dayHeaderRow: {
    height: 42,
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  dayHeaderCell: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },
  weekday: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  dayNumber: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "900",
  },
  lane: {
    height: 58,
    position: "relative",
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  dayCell: {
    width: 56,
    borderRightWidth: 1,
  },
  taskBar: {
    position: "absolute",
    top: 12,
    height: 30,
    borderRadius: 5,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  taskBarText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  todayMarker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
  },
  emptyState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
});
