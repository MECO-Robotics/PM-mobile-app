import { StyleSheet } from "react-native";

import { spacing } from "../../theme";
import { planner } from "./landscapeTimelinePalette";

export const landscapeTimelineSidebarStyles = StyleSheet.create({
  sidebar: {
    width: 330,
    borderRightWidth: 1,
    borderColor: planner.border,
  },
  sidebarHeader: {
    height: 66,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: planner.border,
    backgroundColor: planner.header,
  },
  sidebarHeaderCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderColor: planner.border,
  },
  projectHeaderCell: {
    flex: 0.82,
  },
  sidebarHeaderText: {
    fontSize: 16,
    fontWeight: "900",
  },
  headerEye: {
    color: planner.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  laneLabel: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderBottomColor: planner.border,
    backgroundColor: planner.panel,
  },
  projectCell: {
    flex: 0.82,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
    borderColor: planner.border,
    backgroundColor: planner.project,
  },
  subsystemCell: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  disclosure: {
    color: planner.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  projectLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "900",
  },
  subsystemDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  lanePrimary: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "900",
  },
  laneSecondary: {
    color: planner.muted,
    fontSize: 9,
    fontWeight: "700",
    textAlign: "right",
  },
});
