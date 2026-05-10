import { View } from "react-native";

import { Text } from "../i18n";
import { styles } from "../ui/styles";

type AttendanceStatusMarkProps = {
  status: "yes" | "maybe" | "no";
};

export function AttendanceStatusMark({ status }: AttendanceStatusMarkProps) {
  const color =
    status === "yes"
      ? "#166534"
      : status === "maybe"
        ? "#92400e"
        : "#991b1b";
  const label = status === "yes" ? "✓" : status === "maybe" ? "?" : "×";

  return (
    <View style={[styles.attendanceMark, { borderColor: color }]}>
      <Text style={[styles.attendanceMarkLabel, { color }]}>{label}</Text>
    </View>
  );
}
