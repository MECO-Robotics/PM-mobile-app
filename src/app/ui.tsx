import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { colors } from "../theme";
import { getStatusGroup } from "./helpers";
import { statusToneLabelStyles, statusToneStyles, styles } from "./styles";
import type { Option, SummaryChipData } from "./types";
export function WorkspacePanel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const isCompactLayout = width < 430;

  return (
    <View style={[styles.panel, isCompactLayout && styles.panelCompact]}>
      <View style={[styles.panelHeader, isCompactLayout && styles.panelHeaderCompact]}>
        <View style={styles.panelHeaderCopy}>
          <Text style={styles.panelTitle}>{title}</Text>
          <Text style={styles.panelSubtitle}>{subtitle}</Text>
        </View>
        {actions ? (
          <View style={[styles.panelActions, isCompactLayout && styles.panelActionsCompact]}>
            {actions}
          </View>
        ) : null}
      </View>

      <View style={styles.panelContent}>{children}</View>
    </View>
  );
}

export function SectionTabs<T extends string>({
  activeValue,
  onChange,
  options,
}: {
  activeValue: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sectionTabsRow}
    >
      {options.map((option) => {
        const isActive = option.value === activeValue;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.sectionTab, isActive && styles.sectionTabActive]}
          >
            <Text style={[styles.sectionTabLabel, isActive && styles.sectionTabLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function FilterToolbar({ children }: { children: ReactNode }) {
  return <View style={styles.filterToolbar}>{children}</View>;
}

export function SearchField({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.searchFieldWrap}>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtleText}
        style={styles.searchFieldInput}
        value={value}
      />
    </View>
  );
}

export function OptionChipRow({
  allLabel,
  options,
  value,
  onChange,
}: {
  allLabel: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.optionChipRow}
    >
      <Pressable
        onPress={() => onChange("all")}
        style={[styles.optionChip, value === "all" && styles.optionChipActive]}
      >
        <Text style={[styles.optionChipLabel, value === "all" && styles.optionChipLabelActive]}>
          {allLabel}
        </Text>
      </Pressable>

      {options.map((option) => {
        const isActive = value === option.id;

        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.optionChip, isActive && styles.optionChipActive]}
          >
            <Text style={[styles.optionChipLabel, isActive && styles.optionChipLabelActive]}>
              {option.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SummaryRow({ chips }: { chips: SummaryChipData[] }) {
  return (
    <View style={styles.summaryRow}>
      {chips.map((chip) => (
        <View key={chip.label} style={styles.summaryChip}>
          <Text style={styles.summaryChipLabel}>{chip.label}</Text>
          <Text style={styles.summaryChipValue}>{chip.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function StatusPill({ label, value }: { label: string; value: string }) {
  const group = getStatusGroup(value);

  return (
    <View style={[styles.statusPill, statusToneStyles[group]]}>
      <Text style={[styles.statusPillLabel, statusToneLabelStyles[group]]}>{label}</Text>
    </View>
  );
}

export function InteractionNote({ text }: { text: string }) {
  return (
    <View style={styles.interactionNote}>
      <Text style={styles.interactionNoteLabel}>How to use this view</Text>
      <Text style={styles.interactionNoteText}>{text}</Text>
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyStateWrap}>
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

export function EditorModal({
  visible,
  title,
  saveLabel,
  onSave,
  onCancel,
  onDelete,
  children,
}: {
  visible: boolean;
  title: string;
  saveLabel: string;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const isCompactLayout = width < 430;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={[styles.modalScrim, isCompactLayout && styles.modalScrimCompact]}>
        <View style={[styles.modalCard, isCompactLayout && styles.modalCardCompact]}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          <View style={[styles.modalActions, isCompactLayout && styles.modalActionsCompact]}>
            {onDelete ? (
              <Pressable
                onPress={onDelete}
                style={[
                  styles.modalDeleteButton,
                  isCompactLayout && styles.modalActionButtonCompact,
                ]}
              >
                <Text style={styles.modalDeleteButtonLabel}>Delete</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onCancel}
              style={[styles.modalCancelButton, isCompactLayout && styles.modalActionButtonCompact]}
            >
              <Text style={styles.modalCancelButtonLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              style={[styles.modalSaveButton, isCompactLayout && styles.modalActionButtonCompact]}
            >
              <Text style={styles.modalSaveButtonLabel}>{saveLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ModalField({
  label,
  value,
  placeholder,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.modalField}>
      <Text style={styles.modalFieldLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtleText}
        style={[styles.modalFieldInput, multiline && styles.modalFieldInputMultiline]}
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
  return (
    <Pressable
      onPress={() => onToggle(!value)}
      style={[styles.toggleField, value && styles.toggleFieldActive]}
    >
      <Text style={styles.toggleFieldLabel}>{label}</Text>
      <Text style={[styles.toggleFieldValue, value && styles.toggleFieldValueActive]}>
        {value ? "Yes" : "No"}
      </Text>
    </Pressable>
  );
}

