import type { ReactNode } from "react";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";

import { Text } from "../i18n";
import { styles } from "./styles";
import { useAppTheme } from "./themeContext";

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
                        backgroundColor: isActive ? themeColors.blue : themeColors.border,
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

export function AdvancedOptions({
  title = "Advanced options",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { colors: themeColors } = useAppTheme();

  return (
    <View
      style={[
        styles.advancedOptions,
        { backgroundColor: themeColors.canvas, borderColor: themeColors.border },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        onPress={() => setIsExpanded((current) => !current)}
        style={styles.advancedOptionsHeader}
      >
        <Text style={[styles.advancedOptionsTitle, { color: themeColors.ink }]}>{title}</Text>
        <Text style={[styles.advancedOptionsToggle, { color: themeColors.navyInk }]}>
          {isExpanded ? "Hide" : "Show"}
        </Text>
      </Pressable>
      {isExpanded ? <View style={styles.advancedOptionsBody}>{children}</View> : null}
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
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.modalScrim, isCompactLayout && styles.modalScrimCompact]}
      >
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
              <Text style={[styles.modalCancelButtonLabel, { color: themeColors.subtleText }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              style={[styles.modalSaveButton, isCompactLayout && styles.modalActionButtonCompact]}
            >
              <Text style={styles.modalSaveButtonLabel}>{saveLabel}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
