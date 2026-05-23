import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const app = source("App.tsx");
const reportsScreen = source("src/screens/ReportsScreen.tsx");
const taskQueueScreen = source("src/screens/TaskQueueScreen.tsx");
const tasksScreen = source("src/screens/TasksScreen.tsx");
const rosterScreen = source("src/screens/RosterScreen.tsx");
const attendanceScreen = source("src/screens/AttendanceScreen.tsx");
const screenTypes = source("src/screens/types.ts");

const functionBody = (name) => {
  const start = app.indexOf(`const ${name}`);

  assert.notEqual(start, -1, `${name} should exist`);

  const nextFunction = app.indexOf("\n  const ", start + 1);

  assert.notEqual(nextFunction, -1, `${name} should be followed by another local function`);

  return app.slice(start, nextFunction);
};

test("mentor privileges are the single source for mentor-only mobile permissions", () => {
  assert.match(app, /const canMentorApprove =[\s\S]*signedInRosterMember\?\.role === "mentor"/);
  assert.match(app, /const canMentorApprove =[\s\S]*sessionUser\?\.role === "mentor"/);
  assert.match(app, /const canManageTasks = canMentorApprove;/);
  assert.match(app, /const canManageMeetings = canMentorApprove;/);
  assert.match(app, /const canManageRoster = canMentorApprove;/);
});

test("students cannot open or save task management flows", () => {
  assert.match(functionBody("openCreateTaskEditor"), /if \(!canManageTasks\) {\s*return;\s*}/);
  assert.match(functionBody("openEditTaskEditor"), /if \(!canManageTasks\) {\s*return;\s*}/);
  assert.match(functionBody("openDuplicateTaskEditor"), /if \(!canManageTasks\) {\s*return;\s*}/);
  assert.match(functionBody("saveTaskDraft"), /if \(!canManageTasks\) {[\s\S]*Only mentors can create or edit tasks\./);
  assert.match(functionBody("deleteTaskDraft"), /if \(!activeTaskId \|\| !canManageTasks\) {\s*return;\s*}/);
  assert.match(tasksScreen, /canAddTask={canManageTasks}/);
  assert.match(tasksScreen, /onTaskPress={canManageTasks \? openEditTaskEditor : undefined}/);
  assert.match(taskQueueScreen, /canManageTasks \? \(/);
});

test("students cannot approve or fail QA, while mentors get both actions", () => {
  assert.match(functionBody("openCreateQaReportEditor"), /if \(!canMentorApprove\) {\s*return;\s*}/);
  assert.match(functionBody("saveQaReportDraft"), /if \(!canMentorApprove\) {[\s\S]*Only mentors can approve QA\./);
  assert.match(reportsScreen, /canMentorApprove && selectedQaReviewTaskId/);
  assert.match(reportsScreen, /openCreateQaReportEditor\(selectedQaReviewTaskId, undefined, "pass"\)/);
  assert.match(reportsScreen, /openCreateQaReportEditor\(selectedQaReviewTaskId, undefined, "minor-fix"\)/);
  assert.match(reportsScreen, />\s*Approve\s*<\/Text>/);
  assert.match(reportsScreen, />\s*Fail test\s*<\/Text>/);
  assert.match(taskQueueScreen, /canMentorApprove \? \(/);
});

test("failed QA requires prevention and fix notes, but passed QA notes stay optional", () => {
  const body = functionBody("saveQaReportDraft");

  assert.match(body, /const isFailReport = qaReportDraft\.result !== "pass";/);
  assert.match(body, /isFailReport && !trimmedFixNotes \? "what to fix" : null/);
  assert.match(body, /isFailReport && !trimmedVersionIssueNotes \? "what was wrong with this version" : null/);
  assert.match(body, /isFailReport && !trimmedPreventionNotes \? "how to prevent this in the future" : null/);
  assert.doesNotMatch(body, /!trimmedNotes \? "notes"/);
});

test("students cannot add meetings or invite and edit database people", () => {
  assert.match(functionBody("openCreateMeetingEditor"), /if \(!canManageMeetings\) {\s*return;\s*}/);
  assert.match(functionBody("saveMeetingDraft"), /if \(!canManageMeetings\) {[\s\S]*Only mentors can add meetings\./);
  assert.match(functionBody("openCreateMemberEditor"), /if \(!canManageRoster\) {\s*return;\s*}/);
  assert.match(functionBody("openEditMemberEditor"), /if \(!canManageRoster\) {\s*return;\s*}/);
  assert.match(functionBody("saveMemberDraft"), /if \(!canManageRoster\) {[\s\S]*Only mentors can invite or edit people\./);
  assert.match(functionBody("deleteMemberDraft"), /if \(!activeMemberId \|\| !canManageRoster\) {\s*return;\s*}/);
  assert.match(rosterScreen, /canManageRoster \? \(/);
  assert.match(attendanceScreen, /canManageMeetings \? \(/);
});

test("role gates are passed into every screen that renders mentor-only controls", () => {
  assert.match(screenTypes, /canManageMeetings: boolean;/);
  assert.match(screenTypes, /canManageRoster: boolean;/);
  assert.match(screenTypes, /canManageTasks: boolean;/);
  assert.match(screenTypes, /canMentorApprove: boolean;/);
  assert.match(app, /canManageMeetings,/);
  assert.match(app, /canManageRoster,/);
  assert.match(app, /canManageTasks,/);
  assert.match(app, /canMentorApprove,/);
});
