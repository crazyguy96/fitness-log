import { catalog } from './catalog';

export type Muscle = keyof typeof catalog;
export const muscles = Object.keys(catalog) as Muscle[];

export type Exercise = { id: string; name: string };
export type SetEntry = { id: string; reps: string; weight: string; complete?: boolean };
export type PlannedExercise = Exercise & { sets: SetEntry[] };
export type Group = { muscle: Muscle; exercises: PlannedExercise[] };
export type Day = { name: string; groups: Group[]; rest?: boolean };
export type WorkoutPlan = { id: string; name: string; days: Day[]; draft: Day | null; draftDayIndex?: number; draftDate?: string };
export type Session = Day & { id: string; date: string; planId: string; planName: string; completedOnly?: true; dayIndex?: number };
export type AppData = {
  plans: WorkoutPlan[];
  activePlanId: string;
  custom: Partial<Record<Muscle, Exercise[]>>;
  sessions: Session[];
};

export const storageKey = 'gym-log-v1';
export const uid = () => Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(36)).join('-');
export const newSet = (): SetEntry => ({ id: uid(), reps: '', weight: '' });
export const newPlan = (id: string, name: string): WorkoutPlan => ({
  id, name, draft: null,
  days: Array.from({ length: 7 }, (_, index) => ({ name: 'Day ' + (index + 1), groups: [] })),
});

export const exerciseNameKey = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();

export function exerciseOptions(muscle: Muscle, custom: AppData['custom'], query: string) {
  const terms = exerciseNameKey(query).split(' ');
  const builtIn = catalog[muscle].map(name => ({ id: exerciseNameKey(name), name }));
  return [...builtIn, ...(custom[muscle] ?? [])].filter(exercise =>
    terms.every(term => exerciseNameKey(exercise.name).includes(term))
  );
}

export function readData(key = storageKey, seed?: () => AppData): AppData {
  const saved = localStorage.getItem(key);
  const defaultId = 'original-workout';
  const defaultName = 'My workout';
  if (!saved) {
    if (seed) return seed();
    return { plans: [newPlan(defaultId, defaultName)], activePlanId: defaultId, custom: {}, sessions: [] };
  }
  const data = JSON.parse(saved) as AppData & { days?: Day[]; draft?: Day | null };
  if (Array.isArray(data.sessions) && data.custom) {
    if (Array.isArray(data.plans) && data.plans.some(plan => plan.id === data.activePlanId)) return data;
    if (Array.isArray(data.days) && data.days.length === 7) {
      return {
        plans: [{ id: defaultId, name: defaultName, days: data.days, draft: data.draft ?? null }],
        activePlanId: defaultId,
        custom: data.custom,
        sessions: data.sessions.map(session => ({ ...session, planId: defaultId, planName: defaultName, completedOnly: true })),
      };
    }
  }
  throw new Error('Invalid saved workout data');
}

export function errorsFor(set: SetEntry, requireReps: boolean) {
  const reps = set.reps.trim();
  const weight = set.weight.trim();
  return {
    reps: (reps || requireReps) && (!/^\d+$/.test(reps) || !Number.isSafeInteger(Number(reps)) || Number(reps) < 1)
      ? 'Enter a whole number above 0.' : '',
    weight: weight && (!/^\d*[.,]?\d+$/.test(weight) || !Number.isFinite(parseWeight(weight)) || !Number.isFinite(parseWeight(weight) * Number(reps)))
      ? 'Enter a valid weight of 0 or more.' : '',
  };
}

const parseWeight = (value: string) => Number(value.replace(',', '.'));

export function sessionStats(sessions: Session[], exerciseId: string) {
  return [...sessions].reverse().flatMap(session => {
    const sets = session.groups.flatMap(group => group.exercises)
      .filter(exercise => exercise.id === exerciseId)
      .flatMap(exercise => exercise.sets)
      .filter(set => set.complete && set.weight.trim() !== '');
    if (!sets.length) return [];
    return [{
      id: session.id,
      date: session.date,
      heaviest: sets.reduce((max, set) => Math.max(max, parseWeight(set.weight)), 0),
      volume: sets.reduce((total, set) => total + Number(set.reps) * parseWeight(set.weight), 0),
    }];
  });
}

export const dateLabel = (date: string) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
export const shortDate = (date: string) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(date));
export const numberLabel = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value);
