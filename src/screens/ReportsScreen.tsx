import { useState } from "react";
import { Pressable, View } from "react-native";

import { Text } from "../i18n";
import { SUBVIEW_INTERACTION_GUIDANCE } from "../ui/constants";
import { formatDateTime } from "../ui/helpers";
import { styles } from "../ui/styles";
import {
  DropdownField,
  EmptyState,
  EditorModal,
  InteractionNote,
  ModalField,
  StatusPill,
  SummaryRow,
  WorkspacePanel,
} from "../ui/ui";

import type { AppScreenProps } from "./types";
import { QaDetailFields, type QaDetailRow } from "./reports/QaDetailFields";

const formatQaStatus = (value: string) =>
  value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export function ReportsScreen(props: AppScreenProps) {
  const {
    appResponsiveStyles,
    canMentorApprove,
    createQaRequest,
    eventReports,
    eventsById,
    membersById,
    openCreateQaReportEditor,
    qaRequests,
    qaReviews,
    reportSummary,
    rosterMentors,
    taskById,
    tasks,
  } = props;
  const [isQaRequestOpen, setIsQaRequestOpen] = useState(false);
  const [qaRequestDraft, setQaRequestDraft] = useState({
    taskId: "",
    subject: "",
    mentorId: rosterMentors[0]?.id ?? "",
  });
  const [selectedQaReviewId, setSelectedQaReviewId] = useState<string | null>(null);
  const mentorOptions = rosterMentors.map((mentor) => ({ id: mentor.id, name: mentor.name }));
  const taskOptions = tasks.map((task) => ({ id: task.id, name: task.title }));
  const canSubmitQaRequest = Boolean(
    (qaRequestDraft.subject.trim() || qaRequestDraft.taskId) && qaRequestDraft.mentorId,
  );
  const selectedQaReview = qaReviews.find((review) => review.id === selectedQaReviewId);
  const selectedQaReviewTaskId = selectedQaReview?.taskId ?? undefined;
  const selectedQaReviewPeople = selectedQaReview
    ? selectedQaReview.participantIds
        .map((participantId) => membersById[participantId]?.name)
        .filter((name): name is string => Boolean(name))
        .join(", ")
    : "";
  const selectedQaReviewRequester =
    selectedQaReview?.requestedById && membersById[selectedQaReview.requestedById]
      ? membersById[selectedQaReview.requestedById].name
      : selectedQaReviewPeople || "No participants";
  const selectedQaReviewMentor =
    selectedQaReview?.mentorId && membersById[selectedQaReview.mentorId]
      ? membersById[selectedQaReview.mentorId].name
      : selectedQaReview?.mentorApproved
        ? "Approved mentor"
        : "Pending mentor";
  const selectedQaReviewRows: QaDetailRow[] = selectedQaReview
    ? [
        { label: "QA item", value: selectedQaReview.subjectTitle },
        {
          label: "Student requested",
          value: selectedQaReviewRequester,
        },
        {
          label: "Mentor assigned",
          value: selectedQaReviewMentor,
        },
        { label: "QA status", value: formatQaStatus(selectedQaReview.result) },
        { label: "Notes", value: selectedQaReview.notes, multiline: true },
        selectedQaReview.evidenceNotes
          ? { label: "Evidence", value: selectedQaReview.evidenceNotes, multiline: true }
          : null,
      ].filter((row): row is QaDetailRow => Boolean(row))
    : [];

  const submitQaRequest = () => {
    if (!canSubmitQaRequest) {
      return;
    }

    createQaRequest(qaRequestDraft.subject, qaRequestDraft.mentorId, qaRequestDraft.taskId);
    setQaRequestDraft({ taskId: "", subject: "", mentorId: rosterMentors[0]?.id ?? "" });
    setIsQaRequestOpen(false);
  };

const renderScreen = () => {
  return (
    <WorkspacePanel
      title="QA and event reports"
      subtitle="Capture task QA outcomes, event findings, and iteration-worthy follow-up in one place."
      actions={
        <Pressable onPress={() => setIsQaRequestOpen(true)} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
          <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Request QA</Text>
        </Pressable>
      }
    >
      <SummaryRow chips={reportSummary} />

      <EditorModal
        onCancel={() => setIsQaRequestOpen(false)}
        onSave={submitQaRequest}
        saveLabel="Submit request"
        title="Request QA"
        visible={isQaRequestOpen}
      >
        <View style={styles.queueRowHeader}>
          <View style={styles.queueRowPrimaryText}>
            <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
              Add the item that needs review and choose the mentor reviewer.
            </Text>
          </View>
          <StatusPill label="Requested" value="requested" />
        </View>
        <DropdownField
          clearLabel="No linked task"
          label="Linked task"
          onChange={(value) => {
            const task = tasks.find((candidate) => candidate.id === value);

            setQaRequestDraft((current) => ({
              ...current,
              taskId: value,
              subject: task ? task.title : current.subject,
            }));
          }}
          options={taskOptions}
          placeholder="Select task"
          value={qaRequestDraft.taskId}
        />
        <ModalField
          label="What needs QA"
          multiline
          onChangeText={(value) =>
            setQaRequestDraft((current) => ({ ...current, subject: value }))
          }
          placeholder="Describe the task, part, code change, or evidence that needs QA"
          value={qaRequestDraft.subject}
        />
        <DropdownField
          clearLabel="No mentor"
          label="Mentor reviewer"
          onChange={(value) =>
            setQaRequestDraft((current) => ({ ...current, mentorId: value }))
          }
          options={mentorOptions}
          placeholder="Select mentor"
          value={qaRequestDraft.mentorId}
        />
      </EditorModal>

      <EditorModal
        onCancel={() => setSelectedQaReviewId(null)}
        onSave={() => setSelectedQaReviewId(null)}
        saveLabel="Done"
        title={selectedQaReview?.subjectTitle ?? "QA report"}
        visible={Boolean(selectedQaReview)}
      >
        {selectedQaReview ? (
          <>
            {canMentorApprove && selectedQaReviewTaskId ? (
              <View style={styles.quickActionRow}>
                <Pressable
                  onPress={() => {
                    openCreateQaReportEditor(selectedQaReviewTaskId, undefined, "pass");
                    setSelectedQaReviewId(null);
                  }}
                  style={[
                    styles.quickActionButton,
                    styles.quickActionButtonPrimary,
                    appResponsiveStyles.quickActionButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickActionButtonPrimaryLabel,
                      appResponsiveStyles.quickActionButtonLabel,
                    ]}
                  >
                    Approve
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    openCreateQaReportEditor(selectedQaReviewTaskId, undefined, "minor-fix");
                    setSelectedQaReviewId(null);
                  }}
                  style={[styles.quickActionButton, appResponsiveStyles.quickActionButton]}
                >
                  <Text style={[styles.quickActionButtonLabel, appResponsiveStyles.quickActionButtonLabel]}>
                    Fail test
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <QaDetailFields rows={selectedQaReviewRows} />
            {selectedQaReview.result === "iteration-worthy" ? (
              <View style={[styles.calloutBox, appResponsiveStyles.calloutBox]}>
                <Text style={[styles.calloutTitle, appResponsiveStyles.calloutTitle]}>
                  Iteration
                </Text>
                <Text style={[styles.calloutBody, appResponsiveStyles.calloutBody]}>
                  This finding should create or anchor a design iteration.
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </EditorModal>

      <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>QA requests</Text>
      <View style={styles.reportGrid}>
        {qaRequests.map((request) => {
          const mentor = membersById[request.mentorId]?.name ?? "Unassigned mentor";
          const requester = request.requestedById
            ? membersById[request.requestedById]?.name
            : null;
          const requesterLabel = requester ?? "Unknown student";
          const linkedTask = request.taskId ? taskById[request.taskId] : null;

          return (
            <View key={request.id} style={[styles.queueRowCard, appResponsiveStyles.rowCard]}>
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{request.subject}</Text>
                  <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                    Mentor assigned: {mentor}
                  </Text>
                </View>
                <StatusPill label={formatQaStatus(request.status)} value={request.status} />
              </View>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Student requested: {requesterLabel}
              </Text>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                QA status: {formatQaStatus(request.status)}
              </Text>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Task: {linkedTask?.title ?? "Not linked"}
              </Text>
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                Requested {formatDateTime(request.createdAt)}
              </Text>
              {canMentorApprove ? (
                <View style={styles.quickActionRow}>
                  <Pressable
                    disabled={!linkedTask}
                    onPress={() => {
                      if (linkedTask) {
                        openCreateQaReportEditor(linkedTask.id, request.id, "pass");
                      }
                    }}
                    style={[
                      styles.quickActionButton,
                      styles.quickActionButtonPrimary,
                      !linkedTask ? { opacity: 0.45 } : null,
                      appResponsiveStyles.quickActionButton,
                    ]}
                  >
                    <Text style={[styles.quickActionButtonPrimaryLabel, appResponsiveStyles.quickActionButtonLabel]}>
                      Approve
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={!linkedTask}
                    onPress={() => {
                      if (linkedTask) {
                        openCreateQaReportEditor(linkedTask.id, request.id, "minor-fix");
                      }
                    }}
                    style={[
                      styles.quickActionButton,
                      !linkedTask ? { opacity: 0.45 } : null,
                      appResponsiveStyles.quickActionButton,
                    ]}
                  >
                    <Text style={[styles.quickActionButtonLabel, appResponsiveStyles.quickActionButtonLabel]}>
                      Fail test
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      {qaRequests.length === 0 ? <EmptyState text="No QA requests are waiting yet." /> : null}

      <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>QA reports</Text>
      <View style={styles.reportGrid}>
        {qaReviews.map((review) => {
          const people = review.participantIds
            .map((participantId) => membersById[participantId]?.name)
            .filter((name): name is string => Boolean(name))
            .join(", ");
          const requester =
            review.requestedById && membersById[review.requestedById]
              ? membersById[review.requestedById].name
              : people || "No participants";
          return (
            <Pressable
              key={review.id}
              onPress={() => setSelectedQaReviewId(review.id)}
              style={[styles.queueRowCard, appResponsiveStyles.rowCard]}
            >
              <View style={styles.queueRowHeader}>
                <View style={styles.queueRowPrimaryText}>
                  <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{review.subjectTitle}</Text>
                  <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                    {requester} - mentor {review.mentorApproved ? "approved" : "pending"}
                  </Text>
                </View>
                <StatusPill label={formatQaStatus(review.result)} value={review.result} />
              </View>
              <Text style={[styles.queueRowBody, appResponsiveStyles.rowBody]}>{review.notes}</Text>
              {review.evidenceNotes ? (
                <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
                  Evidence: {review.evidenceNotes}
                </Text>
              ) : null}
              {review.result === "iteration-worthy" ? (
                <View style={[styles.calloutBox, appResponsiveStyles.calloutBox]}>
                  <Text style={[styles.calloutTitle, appResponsiveStyles.calloutTitle]}>Iteration</Text>
                  <Text style={[styles.calloutBody, appResponsiveStyles.calloutBody]}>
                    This finding should create or anchor a design iteration.
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>Event reports</Text>
      {eventReports.map((report, index) => {
        const event = eventsById[report.eventId];

        return (
          <View key={`${report.eventId}-${index}`} style={[styles.queueRowCard, appResponsiveStyles.rowCard]}>
            <View style={styles.queueRowHeader}>
              <View style={styles.queueRowPrimaryText}>
                <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{event?.title ?? "Event report"}</Text>
                <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                  Follow-up {report.followUpTaskTitle || "none"}
                </Text>
              </View>
              <StatusPill label="Report" value="info" />
            </View>
            <Text style={[styles.queueRowBody, appResponsiveStyles.rowBody]}>{report.summary}</Text>
            {report.findingText ? (
              <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>Finding {report.findingText}</Text>
            ) : null}
          </View>
        );
      })}

      {eventReports.length === 0 ? <EmptyState text="No event reports have been added yet." /> : null}
      <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.reports} />
    </WorkspacePanel>
  );
};

  return renderScreen();
}
