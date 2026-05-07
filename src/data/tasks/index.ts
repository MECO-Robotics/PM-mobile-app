import { electricalTasks } from "./electricalTasks";
import { mechanicalTasks } from "./mechanicalTasks";
import { programmingTasks } from "./programmingTasks";

export const tasks = [
  ...programmingTasks,
  ...mechanicalTasks,
  ...electricalTasks,
];
