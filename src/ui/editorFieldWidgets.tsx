import { Pressable, Text, TextInput, type KeyboardTypeOptions, View } from "react-native";

import { styles } from "./styles";
import { useAppTheme } from "./themeContext";

export function ModalField({
  label,
  value,
  placeholder,
  onChangeText,
  multiline = false,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
}) {
  const { colors: themeColors } = useAppTheme();

  return (
    <View style={styles.modalField}>
      <Text style={[styles.modalFieldLabel, { color: themeColors.subtleText }]}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.subtleText}
        style={[
          styles.modalFieldInput,
          {
            backgroundColor: themeColors.canvas,
            borderColor: themeColors.border,
            color: themeColors.ink,
          },
          multiline && styles.modalFieldInputMultiline,
        ]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
    </View>
  );
}

export function ToggleField({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}) {
  const { colors: themeColors } = useAppTheme();

  return (
    <Pressable
      onPress={() => onToggle(!value)}
      style={[
        styles.toggleField,
        { backgroundColor: themeColors.canvas, borderColor: themeColors.border },
        value && [styles.toggleFieldActive, { backgroundColor: themeColors.navySurface }],
      ]}
    >
      <Text style={[styles.toggleFieldLabel, { color: themeColors.ink }]}>{label}</Text>
      <Text
        style={[
          styles.toggleFieldValue,
          { color: themeColors.subtleText },
          value && [styles.toggleFieldValueActive, { color: themeColors.navyInk }],
        ]}
      >
        {value ? "Yes" : "No"}
      </Text>
    </Pressable>
  );
}
