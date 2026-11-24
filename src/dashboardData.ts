import { dayKey, mealsForDay, moveDay, totalNutrition, weekdayOf, type DietPlan, type Meal, type Nutrition, type Targets } from './nutrition';
import type { Session, WorkoutPlan } from './workout';

export type DashboardData = { goal: Targets | null; weights: Record<string, number> };
export const dashboardStorageKey = 'fitness-log-dashboard-v1';

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

export function nutritionWeek(plan: DietPlan, meals: Meal[], today: string) {
  return datesOfWeek(today).map((date, index) => {
    const routine = plan.week[index];
    const items = mealsForDay(plan, meals, date).filter(meal => !meal.readyFood || meal.status === 'eaten');
    const eaten = items.filter(meal => meal.status === 'eaten');
    return {
      date,
      planned: routine.length ? totalNutrition(routine.flatMap(meal => meal.ingredients)) : null,
      eaten: date <= today && eaten.length ? totalNutrition(eaten.flatMap(meal => meal.ingredients)) : null,
      status: date > today ? 'Upcoming' : !items.length ? 'No meals' : eaten.length === items.length
        ? 'Logged' : eaten.length ? 'Incomplete log' : 'No meals logged',
    };
  });
}

export function plannedMenu(plan: DietPlan) {
  const days = plan.week.map(meals => meals.length ? totalNutrition(meals.flatMap(meal => meal.ingredients)) : null);
  const planned = days.filter(day => day !== null);
  const average = (metric: keyof Nutrition) => planned.reduce((sum, day) => sum + day[metric], 0) / planned.length;
  return { calories: planned.length ? average('calories') : null,
    protein: planned.length ? average('protein') : null };
}
