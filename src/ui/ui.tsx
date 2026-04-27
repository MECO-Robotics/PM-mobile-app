import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { getStatusGroup } from "./helpers";
import { getResponsiveMetrics, scaleFont } from "./responsive";
import { statusToneLabelStyles, statusToneStyles, styles } from "./styles";
import { useAppTheme } from "./themeContext";
import type { Option, SummaryChipData } from "./types";

const SUBTAB_SWIPE_ACTIVATION_DISTANCE = 18;
const SUBTAB_SWIPE_COMMIT_DISTANCE = 48;

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
  const { colors: themeColors } = useAppTheme();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
        {
          marginHorizontal: metrics.gutter,
          padding: metrics.panelPadding,
        },
      ]}
    >
      <View style={[styles.panelHeader, metrics.isCompact && styles.panelHeaderCompact]}>
        <View style={styles.panelHeaderCopy}>
          <Text
            style={[
              styles.panelTitle,
              { color: themeColors.ink, fontSize: scaleFont(18, metrics) },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.panelSubtitle,
              {
                color: themeColors.subtleText,
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
  const { colors: themeColors } = useAppTheme();
  const activeIndex = options.findIndex((option) => option.value === activeValue);
  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => {
          const horizontalDistance = Math.abs(gesture.dx);
          return (
            options.length > 1 &&
            horizontalDistance > SUBTAB_SWIPE_ACTIVATION_DISTANCE &&
            horizontalDistance > Math.abs(gesture.dy) + 8
          );
        },
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dx) < SUBTAB_SWIPE_COMMIT_DISTANCE) {
            return;
          }

          const currentIndex = activeIndex >= 0 ? activeIndex : 0;
          const nextIndex =
            gesture.dx < 0
              ? Math.min(options.length - 1, currentIndex + 1)
              : Math.max(0, currentIndex - 1);
          const nextValue = options[nextIndex]?.value;

          if (nextValue && nextValue !== activeValue) {
            onChange(nextValue);
          }
        },
      }),
    [activeIndex, activeValue, onChange, options],
  );

  return (
    <View {...swipeResponder.panHandlers}>
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
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  paddingHorizontal: metrics.chipPaddingHorizontal + 4,
                  paddingVertical: metrics.chipPaddingVertical,
                },
                isActive && [styles.sectionTabActive, { backgroundColor: themeColors.navySurface }],
              ]}
            >
              <Text
                style={[
                  styles.sectionTabLabel,
                  { color: themeColors.subtleText, fontSize: scaleFont(13, metrics) },
                  isActive && [styles.sectionTabLabelActive, { color: themeColors.navyInk }],
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
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
  const { colors: themeColors } = useAppTheme();

  return (
    <View
      style={[
        styles.searchFieldWrap,
        {
          backgroundColor: themeColors.canvas,
          borderColor: themeColors.border,
          height: metrics.controlHeight,
          paddingHorizontal: metrics.chipPaddingHorizontal + 4,
        },
      ]}
    >
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.subtleText}
        style={[
          styles.searchFieldInput,
          { color: themeColors.ink, fontSize: scaleFont(14, metrics) },
        ]}
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
  const { colors: themeColors } = useAppTheme();

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
            backgroundColor: themeColors.canvas,
            borderColor: themeColors.border,
            paddingHorizontal: metrics.chipPaddingHorizontal,
            paddingVertical: metrics.chipPaddingVertical,
          },
          value === "all" && [
            styles.optionChipActive,
            { backgroundColor: themeColors.navySurface },
          ],
        ]}
      >
        <Text
          style={[
            styles.optionChipLabel,
            { color: themeColors.subtleText, fontSize: scaleFont(12, metrics) },
            value === "all" && [styles.optionChipLabelActive, { color: themeColors.navyInk }],
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
                backgroundColor: themeColors.canvas,
                borderColor: themeColors.border,
                paddingHorizontal: metrics.chipPaddingHorizontal,
                paddingVertical: metrics.chipPaddingVertical,
              },
              isActive && [
                styles.optionChipActive,
                { backgroundColor: themeColors.navySurface },
              ],
            ]}
          >
            <Text
              style={[
                styles.optionChipLabel,
                { color: themeColors.subtleText, fontSize: scaleFont(12, metrics) },
                isActive && [styles.optionChipLabelActive, { color: themeColors.navyInk }],
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
  const { colors: themeColors } = useAppTheme();
  const minChipWidth = metrics.isVeryCompact ? 92 : 104;

  return (
    <View style={styles.summaryRow}>
      {chips.map((chip) => (
        <View
          key={chip.label}
          style={[
            styles.summaryChip,
            {
              backgroundColor: themeColors.canvas,
              borderColor: themeColors.border,
              minWidth: minChipWidth,
              paddingVertical: metrics.isVeryCompact ? 7 : 8,
            },
          ]}
        >
          <Text
            style={[
              styles.summaryChipLabel,
              { color: themeColors.subtleText, fontSize: scaleFont(10, metrics) },
            ]}
          >
            {chip.label}
          </Text>
          <Text
            style={[
              styles.summaryChipValue,
              { color: themeColors.ink, fontSize: scaleFont(18, metrics) },
            ]}
          >
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

export function InteractionNote({ steps }: { steps: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const { colors: themeColors } = useAppTheme();
  const activeStep = steps[activeStepIndex] ?? steps[0] ?? "";
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex >= steps.length - 1;

  const showPreviousStep = () => {
    setActiveStepIndex((current) => Math.max(0, current - 1));
  };

  const showNextStep = () => {
    if (isLastStep) {
      setIsExpanded(false);
      setActiveStepIndex(0);
      return;
    }

    setActiveStepIndex((current) => Math.min(steps.length - 1, current + 1));
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
      onPress={() => setIsExpanded((current) => !current)}
      style={[
        styles.interactionNote,
        {
          backgroundColor: themeColors.navySurface,
          borderColor: themeColors.border,
        },
        isExpanded && styles.interactionNoteExpanded,
      ]}
    >
      <View style={styles.interactionNoteHeader}>
        <Text style={[styles.interactionNoteLabel, { color: themeColors.navyInk }]}>
          View guide
        </Text>
        <Text style={[styles.interactionNoteToggle, { color: themeColors.navyInk }]}>
          {isExpanded ? `${activeStepIndex + 1}/${steps.length}` : "Start"}
        </Text>
      </View>
      {isExpanded ? (
        <View style={styles.tutorialBody}>
          <Text style={[styles.interactionNoteText, { color: themeColors.subtleText }]}>
            {activeStep}
          </Text>

          <View style={styles.tutorialControls}>
            <Pressable
              disabled={isFirstStep}
              onPress={showPreviousStep}
              style={[
                styles.tutorialButton,
                {
                  backgroundColor: themeColors.canvas,
                  borderColor: themeColors.border,
                  opacity: isFirstStep ? 0.45 : 1,
                },
              ]}
            >
              <Text style={[styles.tutorialButtonLabel, { color: themeColors.navyInk }]}>
                Back
              </Text>
            </Pressable>

            <View style={styles.tutorialDots}>
              {steps.map((step, index) => {
                const isActive = index === activeStepIndex;

                return (
                  <View
                    key={step}
                    style={[
                      styles.tutorialDot,
                      {
                        backgroundColor: isActive
                          ? themeColors.blue
                          : themeColors.border,
                      },
                    ]}
                  />
                );
              })}
            </View>

            <Pressable
              onPress={showNextStep}
              style={[
                styles.tutorialButton,
                styles.tutorialButtonPrimary,
                { borderColor: themeColors.blue },
              ]}
            >
              <Text style={styles.tutorialButtonPrimaryLabel}>
                {isLastStep ? "Done" : "Next"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

export function EmptyState({ text }: { text: string }) {
  const { colors: themeColors } = useAppTheme();

  return (
    <View
      style={[
        styles.emptyStateWrap,
        { backgroundColor: themeColors.canvas, borderColor: themeColors.border },
      ]}
    >
      <Text style={[styles.emptyStateText, { color: themeColors.subtleText }]}>{text}</Text>
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
  const { colors: themeColors } = useAppTheme();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={[styles.modalScrim, isCompactLayout && styles.modalScrimCompact]}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            isCompactLayout && styles.modalCardCompact,
          ]}
        >
          <Text style={[styles.modalTitle, { color: themeColors.ink }]}>{title}</Text>
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
              style={[
                styles.modalCancelButton,
                { backgroundColor: themeColors.canvas, borderColor: themeColors.border },
                isCompactLayout && styles.modalActionButtonCompact,
              ]}
            >
              <Text style={[styles.modalCancelButtonLabel, { color: themeColors.subtleText }]}>Cancel</Text>
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
  const { colors: themeColors } = useAppTheme();

  return (
    <View style={styles.modalField}>
      <Text style={[styles.modalFieldLabel, { color: themeColors.subtleText }]}>{label}</Text>
      <TextInput
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
