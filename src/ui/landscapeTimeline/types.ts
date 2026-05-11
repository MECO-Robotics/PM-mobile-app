import type { Member, Subsystem, Task } from "../../types/domain";

export type BoardViewMode = "timeline" | "calendar";
export type RangeMode = "month" | "deadline";

export type TimelineLane = {
  color: string;
  completedCount: number;
  id: string;
  projectLabel: string;
  subsystem: Subsystem | null;
  tasks: Task[];
  totalCount: number;
};

export type TimelineBoardProps = {
  colors: {
    border: string;
    blue: string;
    canvas: string;
    ink: string;
    navyInk: string;
    navySurface: string;
    orange: string;
    subtleText: string;
    surface: string;
  };
  lanes: TimelineLane[];
  locale: string;
  membersById: Record<string, Member>;
  onTaskPress: (task: Task) => void;
  timelineDays: Date[];
  timelineStart: Date;
  visibleEventIndexes: number[];
};
