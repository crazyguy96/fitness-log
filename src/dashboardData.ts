import { dayKey, moveDay, weekdayOf } from './nutrition';
import type { Session, WorkoutPlan } from './workout';

export function datesOfWeek(date: string, offset = 0) {
  const monday = moveDay(date, -weekdayOf(date) + offset * 7);
  return Array.from({ length: 7 }, (_, index) => moveDay(monday, index));
}

export function trainingWeek(plan: WorkoutPlan, sessions: Session[], today: string) {
  const dates = datesOfWeek(today);
  const scheduled = plan.days.flatMap((day, index) => !day.rest &&
    day.groups.some(group => group.exercises.some(exercise => exercise.sets.length)) ? [index] : []);
  const logged = new Set<number>();
  for (const session of sessions) {
    if (session.planId !== plan.id) continue;
    const date = dayKey(new Date(session.date));
    if (date < dates[0] || date > today) continue;
    const candidates = plan.days.flatMap((day, index) => day.name === session.name ? [index] : []);
    const index = session.dayIndex ?? (candidates.length === 1 ? candidates[0] : -1);
    if (scheduled.includes(index)) logged.add(index);
  }
  return { scheduled: scheduled.length, logged: logged.size };
}
