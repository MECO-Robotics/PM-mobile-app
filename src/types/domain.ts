export type MemberRole = "student" | "lead" | "mentor" | "admin";
export type EventType =
  | "drive-practice"
  | "competition"
  | "deadline"
  | "internal-review"
  | "demo";
export type DisciplineCode =
  | "mechanical"
  | "electrical"
  | "software"
  | "integration"
  | "qa-test";
export type TaskStatus =
  | "not-started"
  | "in-progress"
  | "waiting-for-qa"
  | "complete";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type MoscowPriority = "must" | "should" | "could" | "wont";
export type RequirementStatus = "planned" | "in-progress" | "complete";
export type ManufacturingStatus =
  | "requested"
  | "approved"
  | "in-progress"
  | "qa"
  | "complete";
export type ManufacturingProcess = "3d-print" | "cnc" | "fabrication";
export type PurchaseStatus =
  | "requested"
  | "approved"
  | "purchased"
  | "shipped"
  | "delivered";
export type PartInstanceStatus =
  | "planned"
  | "needed"
  | "available"
  | "installed"
  | "retired";
export type QaResult = "pass" | "minor-fix" | "iteration-worthy";

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  email?: string;
  elevated?: boolean;
  seasonId?: string;
}

export interface Subsystem {
  id: string;
  projectId?: string;
  name: string;
  description: string;
  isCore: boolean;
  parentSubsystemId: string | null;
  responsibleEngineerId: string | null;
  mentorIds: string[];
  risks: string[];
}

export interface Discipline {
  id: string;
  code: DisciplineCode;
  name: string;
}

export interface Mechanism {
  id: string;
  subsystemId: string;
  name: string;
  description: string;
}

export interface Requirement {
  id: string;
  subsystemId: string;
  title: string;
  description: string;
  moscowPriority: MoscowPriority;
  status: RequirementStatus;
}

export interface PartDefinition {
  id: string;
  name: string;
  partNumber: string;
  revision: string;
  type: string;
  source: string;
  materialId?: string | null;
  description?: string;
}

export interface PartInstance {
  id: string;
  subsystemId: string;
  mechanismId: string | null;
  partDefinitionId: string;
  name: string;
  quantity: number;
  trackIndividually: boolean;
  status?: PartInstanceStatus;
}

export interface Task {
  id: string;
  projectId?: string;
  workstreamId?: string | null;
  title: string;
  summary: string;
  subsystemId: string;
  disciplineId: string;
  requirementId?: string | null;
  mechanismId: string | null;
  partInstanceId: string | null;
  targetEventId: string | null;
  artifactId?: string | null;
  artifactIds?: string[];
  ownerId: string | null;
  mentorId: string | null;
  startDate?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  dependencyIds: string[];
  blockers: string[];
  linkedManufacturingIds: string[];
  linkedPurchaseIds: string[];
  estimatedHours: number;
  actualHours: number;
  requiresDocumentation?: boolean;
  documentationLinked?: boolean;
}

export interface Event {
  id: string;
  title: string;
  type: EventType;
  startDateTime: string;
  endDateTime: string | null;
  isExternal: boolean;
  description: string;
  relatedSubsystemIds: string[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  rsvpsYes: number;
  rsvpsMaybe: number;
  openSignIns: number;
}

export interface WorkLog {
  id: string;
  taskId: string;
  date: string;
  hours: number;
  participantIds: string[];
  notes: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string;
  totalHours: number;
}

export interface ManufacturingItem {
  id: string;
  title: string;
  subsystemId: string;
  requestedById: string | null;
  process: ManufacturingProcess;
  dueDate: string;
  material: string;
  partDefinitionId?: string | null;
  quantity: number;
  status: ManufacturingStatus;
  mentorReviewed: boolean;
  batchLabel?: string;
  qaReviewCount: number;
}

export interface PurchaseItem {
  id: string;
  title: string;
  subsystemId: string;
  requestedById: string | null;
  partDefinitionId?: string | null;
  quantity: number;
  vendor: string;
  linkLabel: string;
  estimatedCost: number;
  finalCost?: number;
  approvedByMentor: boolean;
  status: PurchaseStatus;
}

export interface QaReview {
  id: string;
  subjectTitle: string;
  participantIds: string[];
  result: QaResult;
  mentorApproved: boolean;
  notes: string;
}

export interface QAFinding {
  id: string;
  taskId?: string | null;
  artifactId?: string | null;
  artifactIds?: string[];
  [key: string]: unknown;
}

export interface TestFinding {
  id: string;
  taskId?: string | null;
  artifactId?: string | null;
  artifactIds?: string[];
  [key: string]: unknown;
}

export interface DesignIteration {
  id: string;
  taskId?: string | null;
  artifactId?: string | null;
  artifactIds?: string[];
  [key: string]: unknown;
}

export interface Escalation {
  title: string;
  detail: string;
  severity: "high" | "medium";
}

export type SlackChannelKey =
  | "build"
  | "meetingPlansRecaps"
  | "programming"
  | "scoutingStrategy"
  | "transportationAttendance";

export interface SlackHomeChannel {
  key: SlackChannelKey;
  name: string;
  slackChannelId: string | null;
  visible: boolean;
}

export interface SlackHomeAlert {
  id: string;
  channelKey: SlackChannelKey;
  channelName: string;
  slackMessageTs: string;
  authorName: string;
  text: string;
  mentionedHandles: string[];
  postedAt: string;
  read: boolean;
}

export interface SlackHomeTodo {
  id: string;
  text: string;
  assigneeLabel: string | null;
  complete: boolean;
}

export interface SlackHomeMeetingRecap {
  id: string;
  channelKey: SlackChannelKey;
  channelName: string;
  slackMessageTs: string;
  authorName: string;
  text: string;
  postedAt: string;
  todos: SlackHomeTodo[];
}

export interface SlackHomeSummary {
  id: string;
  channelKey: SlackChannelKey;
  channelName: string;
  title: string;
  summary: string;
  messageCount: number;
  updatedAt: string;
}

export interface SlackHomeResponse {
  slackEnabled: boolean;
  slackConnected: boolean;
  slackError: string | null;
  userEmail: string | null;
  alertUsergroupHandles: string[];
  channels: SlackHomeChannel[];
  unreadAlerts: SlackHomeAlert[];
  meetingRecap: SlackHomeMeetingRecap | null;
  summaries: SlackHomeSummary[];
}

export interface PlatformBootstrapPayload {
  members: Member[];
  subsystems: Subsystem[];
  disciplines: Discipline[];
  mechanisms: Mechanism[];
  partDefinitions: PartDefinition[];
  partInstances: PartInstance[];
  tasks: Task[];
  events: Event[];
  workLogs: WorkLog[];
  manufacturingItems: ManufacturingItem[];
  purchaseItems: PurchaseItem[];
  qaFindings?: QAFinding[];
  testFindings?: TestFinding[];
  designIterations?: DesignIteration[];
}

export interface PublicAuthConfig {
  enabled: boolean;
  googleClientId: string | null;
  hostedDomain: string;
  emailEnabled: boolean;
  devBypassAvailable?: boolean;
}

export interface SessionUser {
  accountId: string;
  authProvider: "google" | "email";
  email: string;
  name: string;
  picture: string | null;
  hostedDomain: string;
}

export interface SessionResponse {
  token: string;
  user: SessionUser;
}
