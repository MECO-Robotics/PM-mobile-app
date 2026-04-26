import type { ReactNode } from "react";
import { useState } from "react";
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
import { getResponsiveMetrics, scaleFont } from "./responsive";
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
  const metrics = getResponsiveMetrics(width);

  return (
    <View
      style={[
        styles.panel,
        {
          marginHorizontal: metrics.gutter,
          padding: metrics.panelPadding,
        },
      ]}
    >
      <View style={[styles.panelHeader, metrics.isCompact && styles.panelHeaderCompact]}>
        <View style={styles.panelHeaderCopy}>
          <Text style={[styles.panelTitle, { fontSize: scaleFont(18, metrics) }]}>
            {title}
          </Text>
          <Text
            style={[
              styles.panelSubtitle,
              {
                fontSize: scaleFont(13, metrics),
                lineHeight: scaleFont(18, metrics),
              },
            ]}
          >
            {subtitle}
          </Text>
        </View>
        {actions ? (
          <View style={[styles.panelActions, metrics.isCompact && styles.panelActionsCompact]}>
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
  const { width } = useWindowDimensions();
  const metrics = getResponsiveMetrics(width);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.sectionTabsRow, { paddingHorizontal: metrics.gutter }]}
    >
      {options.map((option) => {
        const isActive = option.value === activeValue;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.sectionTab,
              {
                paddingHorizontal: metrics.chipPaddingHorizontal + 4,
                paddingVertical: metrics.chipPaddingVertical,
              },
              isActive && styles.sectionTabActive,
            ]}
          >
            <Text
              style={[
                styles.sectionTabLabel,
                { fontSize: scaleFont(13, metrics) },
                isActive && styles.sectionTabLabelActive,
              ]}
            >
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
  const { width } = useWindowDimensions();
  const metrics = getResponsiveMetrics(width);

  return (
    <View
      style={[
        styles.searchFieldWrap,
        {
          height: metrics.controlHeight,
          paddingHorizontal: metrics.chipPaddingHorizontal + 4,
        },
      ]}
    >
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtleText}
        style={[styles.searchFieldInput, { fontSize: scaleFont(14, metrics) }]}
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
  const { width } = useWindowDimensions();
  const metrics = getResponsiveMetrics(width);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.optionChipRow}
    >
      <Pressable
        onPress={() => onChange("all")}
        style={[
          styles.optionChip,
          {
            paddingHorizontal: metrics.chipPaddingHorizontal,
            paddingVertical: metrics.chipPaddingVertical,
          },
          value === "all" && styles.optionChipActive,
        ]}
      >
        <Text
          style={[
            styles.optionChipLabel,
            { fontSize: scaleFont(12, metrics) },
            value === "all" && styles.optionChipLabelActive,
          ]}
        >
          {allLabel}
        </Text>
      </Pressable>

      {options.map((option) => {
        const isActive = value === option.id;

        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[
              styles.optionChip,
              {
                paddingHorizontal: metrics.chipPaddingHorizontal,
                paddingVertical: metrics.chipPaddingVertical,
              },
              isActive && styles.optionChipActive,
            ]}
          >
            <Text
              style={[
                styles.optionChipLabel,
                { fontSize: scaleFont(12, metrics) },
                isActive && styles.optionChipLabelActive,
              ]}
            >
              {option.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SummaryRow({ chips }: { chips: SummaryChipData[] }) {
  const { width } = useWindowDimensions();
  const metrics = getResponsiveMetrics(width);
  const minChipWidth = metrics.isVeryCompact ? 92 : 104;

  return (
    <View style={styles.summaryRow}>
      {chips.map((chip) => (
        <View
          key={chip.label}
          style={[
            styles.summaryChip,
            {
              minWidth: minChipWidth,
              paddingVertical: metrics.isVeryCompact ? 7 : 8,
            },
          ]}
        >
          <Text style={[styles.summaryChipLabel, { fontSize: scaleFont(10, metrics) }]}>
            {chip.label}
          </Text>
          <Text style={[styles.summaryChipValue, { fontSize: scaleFont(18, metrics) }]}>
            {chip.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function StatusPill({ label, value }: { label: string; value: string }) {
  const group = getStatusGroup(value);
  const { width } = useWindowDimensions();
  const metrics = getResponsiveMetrics(width);

  return (
    <View style={[styles.statusPill, statusToneStyles[group]]}>
      <Text
        style={[
          styles.statusPillLabel,
          { fontSize: scaleFont(12, metrics) },
          statusToneLabelStyles[group],
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function InteractionNote({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
      onPress={() => setIsExpanded((current) => !current)}
      style={[styles.interactionNote, isExpanded && styles.interactionNoteExpanded]}
    >
      <View style={styles.interactionNoteHeader}>
        <Text style={styles.interactionNoteLabel}>Help for this view</Text>
        <Text style={styles.interactionNoteToggle}>{isExpanded ? "Hide" : "Show"}</Text>
      </View>
      {isExpanded ? <Text style={styles.interactionNoteText}>{text}</Text> : null}
    </Pressable>
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
