import type { Task } from "../../types/domain";

export const DAY_WIDTH = 56;
export const VISIBLE_DAY_COUNT = 31;
export const CALENDAR_DAY_COUNT = 42;

export function parseDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysBetween(start: Date, end: Date) {
  return Math.round(
    (parseDate(toDateKey(end)).getTime() - parseDate(toDateKey(start)).getTime()) /
      86400000,
  );
}

export function getTaskStartDate(task: Task) {
  if (task.startDate) {
    return parseDate(task.startDate);
  }

  const estimatedDays = Math.max(1, Math.min(5, Math.ceil(task.estimatedHours / 4)));
  return addDays(parseDate(task.dueDate), -estimatedDays + 1);
}

export function getCalendarDays(anchor: Date) {
  const monthStart = startOfMonth(anchor);
  const calendarStart = addDays(monthStart, -monthStart.getDay());

  return Array.from({ length: CALENDAR_DAY_COUNT }, (_value, index) =>
    addDays(calendarStart, index),
  );
}

export function getNextDeadline<T extends { startDateTime: string }>(
  events: T[],
  anchor: Date,
) {
  return (
    [...events]
      .map((event) => parseDate(event.startDateTime))
      .filter((eventDate) => eventDate >= anchor)
      .sort((left, right) => left.getTime() - right.getTime())[0] ?? null
  );
}

export function taskOverlapsRange(task: Task, rangeStart: Date, rangeEnd: Date) {
  const taskStart = getTaskStartDate(task);
  const taskEnd = parseDate(task.dueDate);

  return taskStart <= rangeEnd && taskEnd >= rangeStart;
}

export function taskTouchesDay(task: Task, day: Date) {
  const taskStart = getTaskStartDate(task);
  const taskEnd = parseDate(task.dueDate);
  const dayKey = parseDate(toDateKey(day));

  return taskStart <= dayKey && taskEnd >= dayKey;
}

export function getLaneTaskRange(task: Task, rangeStart: Date, dayCount: number) {
  const startIndex = Math.max(
    0,
    Math.min(dayCount - 1, daysBetween(rangeStart, getTaskStartDate(task))),
  );
  const endIndex = Math.max(
    0,
    Math.min(dayCount - 1, daysBetween(rangeStart, parseDate(task.dueDate))),
  );
  const firstIndex = Math.min(startIndex, endIndex);
  const lastIndex = Math.max(startIndex, endIndex);

  return {
    left: firstIndex * DAY_WIDTH + 6,
    width: Math.max(DAY_WIDTH - 12, (lastIndex - firstIndex + 1) * DAY_WIDTH - 12),
  };
}

export function formatMonth(anchor: Date, locale: string) {
  return anchor.toLocaleDateString(locale, { month: "long", year: "numeric" });
}
