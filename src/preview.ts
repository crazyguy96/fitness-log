import type { DashboardData } from './dashboardData';
import { foodCatalog } from './foods';
import { dayKey, moveDay, newDietPlan, weekdayOf, type DietData, type Ingredient } from './nutrition';
import { exerciseNameKey, type AppData, type Day, type Group, type Muscle, type Session, type WorkoutPlan } from './workout';

export const previewMode = new URLSearchParams(window.location.search).get('preview') === '1';

type ExerciseSample = [muscle: Muscle, name: string, reps: number, weight: number];

function trainingDay(name: string, exercises: ExerciseSample[]): Day {
  const groups = new Map<Muscle, Group>();
  for (const [muscle, exercise, reps, weight] of exercises) {
    const group = groups.get(muscle) ?? { muscle, exercises: [] };
    const id = exerciseNameKey(exercise);
    group.exercises.push({
      id, name: exercise,
      sets: [0, 1, 2].map(index => ({ id: id + '-' + index, reps: String(reps), weight: String(weight) })),
    });
    groups.set(muscle, group);
  }
  return { name, groups: [...groups.values()] };
}

export function previewWorkouts(): AppData {
  const push = trainingDay('Push A', [
    ['Chest', 'Bench Press', 8, 60], ['Chest', 'Incline Dumbbell Press', 10, 22.5],
    ['Shoulders', 'Cable Lateral Raise', 12, 7.5], ['Triceps', 'Rope Pushdown', 12, 20],
  ]);
  const wristCurl = 'Slow Wrist Curl';
  const pull = trainingDay('Pull A', [
    ['Back', 'Lat Pulldown', 10, 50], ['Back', 'Seated Cable Row', 10, 45],
    ['Biceps', 'Hammer Curl', 12, 12.5], ['Forearms', wristCurl, 15, 7.5],
  ]);
  const legs = trainingDay('Legs A', [
    ['Quadriceps', 'Barbell Back Squat', 8, 75], ['Hamstrings', 'Romanian Deadlift', 8, 65],
    ['Calves', 'Standing Calf Raise', 12, 45], ['Core', 'Cable Crunch', 12, 25],
  ]);
  const rest: Day = { name: 'Sunday', groups: [], rest: true };
  const plans: WorkoutPlan[] = [
    { id: 'demo-ppl', name: 'Push Pull Legs', draft: null, days: [push, pull, legs,
      trainingDay('Push B', [
        ['Chest', 'Bench Press', 10, 55], ['Shoulders', 'Seated Dumbbell Shoulder Press', 10, 20],
        ['Triceps', 'Overhead Cable Triceps Extension', 12, 15],
      ]),
      trainingDay('Pull B', [
        ['Back', 'Chest-Supported Row', 10, 40], ['Biceps', 'Cable Curl', 12, 15],
        ['Shoulders', 'Reverse Pec Deck', 15, 25],
      ]),
      trainingDay('Legs B', [
        ['Quadriceps', 'Leg Press', 12, 120], ['Hamstrings', 'Seated Leg Curl', 12, 35],
        ['Glutes', 'Barbell Hip Thrust', 10, 70], ['Calves', 'Seated Calf Raise', 15, 25],
      ]), rest] },
    { id: 'demo-upper-lower', name: 'Upper / Lower', draft: null, days: [
      { ...push, name: 'Upper A' }, { ...legs, name: 'Lower A' }, { ...rest, name: 'Wednesday' },
      { ...pull, name: 'Upper B' }, trainingDay('Lower B', [
        ['Quadriceps', 'Hack Squat', 10, 65], ['Glutes', 'Barbell Hip Thrust', 10, 60],
        ['Hamstrings', 'Lying Leg Curl', 12, 30],
      ]), { ...rest, name: 'Saturday' }, rest,
    ] },
  ];
  const today = dayKey();
  const monday = moveDay(today, -weekdayOf(today));
  const sessions: Session[] = plans.flatMap((plan, planIndex) =>
    [0, 1, 2].flatMap(week => plan.days.flatMap((day, weekday) => {
      if (day.rest) return [];
      const date = moveDay(monday, weekday - (3 - week + planIndex * 3) * 7);
      return [{
        ...day, dayIndex: weekday, id: plan.id + '-' + date, date: new Date(date + 'T17:30:00').toISOString(), planId: plan.id, planName: plan.name,
        groups: day.groups.map((group, groupIndex) => ({
          ...group, exercises: group.exercises.map((exercise, exerciseIndex) => ({
            ...exercise, sets: exercise.sets.map((set, index) => ({
              ...set, weight: String(Number(set.weight) - (2 - week) * (Number(set.weight) >= 40 ? 2.5 : 1)),
              complete: index !== 2 || (weekday + week + groupIndex + exerciseIndex) % 5 !== 0,
            })),
          })),
        })),
      }];
    })),
  ).sort((a, b) => b.date.localeCompare(a.date));
  const lastPush = sessions.find(session => session.planId === plans[0].id && session.dayIndex === 0)!;
  sessions.unshift({ ...lastPush, id: plans[0].id + '-' + monday, date: new Date(monday + 'T07:00:00').toISOString() });
  return {
    plans, activePlanId: plans[0].id, sessions,
    custom: { Forearms: [{ id: exerciseNameKey(wristCurl), name: wristCurl }] },
  };
}

const bread = '172688';
const yogurt = '170886';
const greekYogurt = '170903';
const rice = '168878';
const paneer = 'amul-paneer';
const tofu = '172475';
const chicken = '171477';
const lentils = '172421';
const moong = '174257';
const banana = 'E012';
const apple = 'E001';
const cucumber = 'D043';
const oats = '173904';

type Portion = [food: string, grams: number, measure?: Ingredient['measure']];
const meals: [name: string, ...ingredients: Portion[]][] = [
  ['Paneer toast', [paneer, 80], [bread, 64, { amount: 2, unit: 'slice' }]],
  ['Yogurt and banana oats', [yogurt, 122.5, { amount: 120, unit: 'ml' }], [banana, 110], [oats, 60]],
  ['Boiled eggs on toast', ['173424', 100, { amount: 2, unit: 'piece' }], [bread, 64, { amount: 2, unit: 'slice' }]],
  ['Greek yogurt apple oats', [greekYogurt, 210], [apple, 150], [oats, 55]],
  ['Chicken and rice bowl', [chicken, 180], [rice, 240], [cucumber, 80]],
  ['Tofu and lentil rice bowl', [tofu, 180], [lentils, 125], [rice, 180]],
  ['Paneer and moong bowl', [paneer, 115], [moong, 180], [rice, 130]],
  ['Chicken lentil plate', [chicken, 170], [lentils, 160], [rice, 145]],
  ['Tomato paneer rice', [paneer, 140], ['D076', 120], [rice, 205]],
  ['Tofu spinach rice', [tofu, 200], ['C033', 100], [rice, 190]],
  ['Lentil rice with yogurt', [lentils, 215], [rice, 180], [yogurt, 150]],
  ['Greek yogurt and banana', [greekYogurt, 200], [banana, 110]],
  ['Apple and plain yogurt', [apple, 150], [yogurt, 183.75, { amount: 180, unit: 'ml' }]],
  ['Moong and cucumber', [moong, 180], [cucumber, 110]],
  ['Banana and milk oats', [banana, 110], ['L002', 200], [oats, 45]],
  ['Spinach and lentil toast', ['C033', 100], [lentils, 115], [bread, 64, { amount: 2, unit: 'slice' }]],
];

const week = [[0, 4, 11, 8], [1, 5, 12, 7], [2, 6, 14, 9], [3, 7, 11, 10], [0, 9, 13, 4], [2, 8, 12, 5], [1, 10, 14, 6]];
const plantWeek = [[0, 5, 12, 10], [1, 6, 11, 9], [3, 8, 13, 15], [0, 9, 14, 5], [1, 10, 12, 6], [3, 15, 13, 8], [0, 5, 11, 10]];

export function previewDiet(): DietData {
  const plans = [
    newDietPlan('Training Day Menu', 'demo-training-menu'),
    newDietPlan('Vegetarian Cut', 'demo-vegetarian-menu'),
  ];
  plans[0].targets = { ...plans[0].targets, weight: '78', calories: '2300', protein: '130', carbs: '275', fat: '70' };
  plans[1].targets = {
    ...plans[1].targets, weight: '78', height: '175', age: '30', sex: 'male', goalWeight: '73', goalMonths: '4', activity: '1.55',
    cut: true, protein: '115', carbs: '220', fat: '65',
  };

  for (const [index, plan] of plans.entries()) {
    const library = meals.map(([name, ...portions], mealIndex) => ({
      id: plan.id + '-meal-' + mealIndex, name,
      ingredients: portions.map(([id, grams, measure]) => ({ food: foodCatalog.find(food => food.id === id)!, grams, measure })),
    }));
    plan.week = (index === 0 ? week : plantWeek).map((day, weekday) => day.map((mealIndex, slot) => ({
      ...library[mealIndex], id: plan.id + '-' + weekday + '-' + slot,
    })));
    plan.library = index === 0 ? library : library.filter((_, mealIndex) => ![2, 4, 7].includes(mealIndex));
  }

  const today = dayKey();
  const datedMeals = Array.from({ length: 28 }, (_, offset) => {
    const date = moveDay(today, -offset);
    const plan = plans[offset < 14 ? 0 : 1];
    return plan.week[weekdayOf(date)].map((meal, index) => ({
      ...meal, id: date + '-' + meal.id, date, planId: plan.id, routineMealId: meal.id,
      status: (offset === 0 ? index < 2 : index !== 3 || offset % 5 !== 0) ? 'eaten' as const : 'planned' as const,
    }));
  }).flat();
  const tofuBowl = plans[0].library[5];
  return {
    plans, activePlanId: plans[0].id, meals: datedMeals, foods: [], draft: null,
    recipes: [{ ...tofuBowl, finishedGrams: 485 }],
  };
}

export function previewDashboard(): DashboardData {
  const today = dayKey();
  const weights = Object.fromEntries([1, 2, 4, 5, 7, 8, 9, 11, 12, 14, 15, 16, 18, 20, 21, 23, 25].map((offset, index) =>
    [moveDay(today, -offset), Math.round((76.8 + offset * 0.08 + (index % 3 - 1) * 0.15) * 10) / 10]));
  return { goal: previewDiet().plans[1].targets, weights };
}
