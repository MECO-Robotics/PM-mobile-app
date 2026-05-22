import { View } from "react-native";

import { Text } from "../../i18n";
import { styles } from "../../ui/styles";
import { useAppTheme } from "../../ui/themeContext";

export type QaDetailRow = {
  label: string;
  value: string;
  multiline?: boolean;
};

export function QaDetailFields({ rows }: { rows: QaDetailRow[] }) {
  return (
    <View style={styles.modalContent}>
      {rows.map((row) => (
        <QaDetailField key={row.label} {...row} />
      ))}
    </View>
  );
}

function QaDetailField({ label, value, multiline = false }: QaDetailRow) {
  const { colors: themeColors } = useAppTheme();

  return (
    <View style={styles.modalField}>
      <Text style={[styles.modalFieldLabel, { color: themeColors.subtleText }]}>{label}</Text>
      <View
        style={[
          styles.modalFieldInput,
          {
            backgroundColor: themeColors.canvas,
            borderColor: themeColors.border,
            minHeight: multiline ? 92 : 52,
            justifyContent: multiline ? "flex-start" : "center",
          },
        ]}
      >
        <Text
          style={{
            color: themeColors.ink,
            fontSize: 16,
            fontWeight: "800",
            lineHeight: 22,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
