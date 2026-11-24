import { uid } from './workout';

export const nutrientKeys = ['calories', 'protein', 'carbs', 'fat'] as const;
export type Nutrient = typeof nutrientKeys[number];
export type Nutrition = Record<Nutrient, number>;
export const portionUnits = ['g', 'ml', 'slice', 'piece', 'serving'] as const;
export type PortionUnit = typeof portionUnits[number];
export type Food = {
  id: string;
  name: string;
  per100: Nutrition;
  source: string;
  sourceUrl?: string;
  aliases?: string[];
  portion?: { unit: 'slice' | 'piece' | 'serving'; grams: number };
  volume?: { ml: number; grams: number };
};
export type Ingredient = { food: Food; grams: number; measure?: { amount: number; unit: PortionUnit }; reportedNutrition?: Nutrition };
export type RoutineMeal = { id: string; name: string; ingredients: Ingredient[] };
export type Meal = RoutineMeal & {
  date: string;
  planId: string;
  routineMealId?: string;
  readyFood?: true;
  status: 'planned' | 'eaten';
};
export type DietPlan = {
  id: string; name: string; week: RoutineMeal[][]; targets: Targets;
  library: RoutineMeal[]; libraryDraft?: MealDraft;
};
export type Recipe = { id: string; name: string; ingredients: Ingredient[]; finishedGrams: number };
export type IngredientDraft = { id: string; query: string; food?: Food; amount: string; unit: PortionUnit; equivalentGrams?: string };
export type MealDraft = {
  id?: string;
  date: string;
  planId: string;
  routineDay?: number;
  description: string;
  name: string;
  status: Meal['status'];
  ingredients: IngredientDraft[];
};
export type GoalMode = 'off' | 'cut' | 'bulk' | 'maintain';
export const goalModeLabels: Record<GoalMode, string> = { off: 'Off', cut: 'Cut', bulk: 'Bulk', maintain: 'Maintain' };

export type Targets = {
  goalMode?: GoalMode;
  weight: string;
  mode: 'light' | 'lifting' | 'prep' | 'custom';
  multiplier: string;
  protein: string;
  calories: string;
  carbs: string;
  fat: string;
  cut: boolean;
  age: string;
  height: string;
  sex: '' | 'female' | 'male';
  activity: string;
  goalWeight: string;
  goalMonths: string;
};
export type DietData = { meals: Meal[]; recipes: Recipe[]; foods: Food[]; draft: MealDraft | null; plans: DietPlan[]; activePlanId: string };
export const dietStorageKey = 'fitness-log-diet-v1';
export const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const originalDiet = 'original-diet';

export function newDietPlan(name: string, id = uid()): DietPlan {
  return { id, name, week: weekdays.map(() => []), targets: { ...defaultTargets }, library: [] };
}

export function weekdayOf(date: string) {
  return (new Date(date + 'T12:00:00').getDay() + 6) % 7;
}

export const proteinModes = { light: 1.2, lifting: 1.5, prep: 1.8 };

const defaultTargets: Targets = {
  weight: '', mode: 'lifting', multiplier: '', protein: '', calories: '', carbs: '', fat: '',
  cut: false, age: '', height: '', sex: '', activity: '1.4', goalWeight: '', goalMonths: '',
};

export function readDiet(key = dietStorageKey, seed?: () => DietData): DietData {
  const saved = localStorage.getItem(key);
  if (!saved) return seed?.() ?? { meals: [], recipes: [], foods: [], draft: null, plans: [newDietPlan('My diet', originalDiet)], activePlanId: originalDiet };
  const { targets: legacyTargets, ...data } = JSON.parse(saved) as Omit<DietData, 'draft' | 'plans'> & {
    targets?: Partial<Targets>;
    plans?: (Omit<DietPlan, 'targets' | 'library'> & { targets?: Partial<Targets>; library?: RoutineMeal[] })[];
    draft: (Omit<MealDraft, 'ingredients'> & { ingredients: (IngredientDraft & { grams?: string })[] }) | null;
  };
  if (!Array.isArray(data.meals) || !Array.isArray(data.recipes) || !Array.isArray(data.foods)) {
    throw new Error('Invalid nutrition data');
  }
  const storedPlans = data.plans?.length ? data.plans : [{
    ...newDietPlan('My diet', originalDiet), targets: legacyTargets,
  }];
  const plans = storedPlans.map(plan => ({
    ...plan,
    targets: { ...defaultTargets, ...(plan.targets ?? legacyTargets) },
    library: plan.library ?? plan.week.flat().reduce(rememberMeal, [] as RoutineMeal[]),
  }));
  const activePlanId = plans.find(plan => plan.id === data.activePlanId)?.id ?? plans[0].id;
  const draft = data.draft ? {
    ...data.draft, planId: data.draft.planId ?? activePlanId,
    ingredients: data.draft.ingredients.map(({ grams, ...row }) => ({ ...row, amount: row.amount ?? grams ?? '', unit: row.unit ?? 'g' })),
  } : null;
  return { ...data, plans, activePlanId, draft, meals: data.meals.map(meal => ({ ...meal, planId: meal.planId ?? activePlanId })) };
}

export function mealsForDay(plan: DietPlan, meals: Meal[], date: string): Meal[] {
  const routine = plan.week[weekdayOf(date)];
  const dated = meals.filter(meal => meal.date === date && meal.planId === plan.id);
  return [
    ...routine.map(meal => dated.find(item => item.routineMealId === meal.id) ?? {
      ...meal, routineMealId: meal.id, date, planId: plan.id, status: 'planned' as const,
    }),
    ...dated.filter(meal => !routine.some(item => item.id === meal.routineMealId)),
  ];
}

export function dietPlanTargets(plan: DietPlan, goalCalories?: number | null) {
  const manual = dailyTargets({ ...plan.targets, cut: false });
  return { ...manual, calories: goalCalories ?? manual.calories };
}

export function dayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return year + '-' + month + '-' + String(date.getDate()).padStart(2, '0');
}

export function moveDay(day: string, delta: number) {
  const date = new Date(day + 'T12:00:00');
  date.setDate(date.getDate() + delta);
  return dayKey(date);
}

export function positiveNumber(value: string) {
  if (!/^\d+(?:[.,]\d+)?$/.test(value.trim())) return null;
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function totalNutrition(ingredients: Ingredient[]): Nutrition {
  return ingredients.reduce((total, { food, grams, reportedNutrition }) => {
    for (const key of nutrientKeys) total[key] += reportedNutrition?.[key] ?? food.per100[key] * (grams / 100);
    return total;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

export function resolveIngredients(rows: IngredientDraft[]): Ingredient[] | null {
  if (!rows.length) return null;
  const ingredients: Ingredient[] = [];
  for (const row of rows) {
    const ingredient = resolveIngredient(row);
    if (!ingredient) return null;
    ingredients.push(ingredient);
  }
  return ingredients;
}

export function conversionFor(food: Food, unit: PortionUnit) {
  if (unit === 'ml' && food.volume) return { amount: food.volume.ml, grams: food.volume.grams };
  if (food.portion?.unit === unit) return { amount: 1, grams: food.portion.grams };
  return null;
}

export function resolveIngredient(row: IngredientDraft): Ingredient | null {
  const amount = positiveNumber(row.amount);
  if (!row.food || amount === null) return null;
  if (row.unit === 'g') return { food: row.food, grams: amount };
  const conversion = conversionFor(row.food, row.unit);
  const grams = positiveNumber(row.equivalentGrams ?? '') ?? (conversion && amount * conversion.grams / conversion.amount);
  if (grams === null || !Number.isFinite(grams)) return null;
  return { food: row.food, grams, measure: { amount, unit: row.unit } };
}

export function ingredientDraft(food?: Food, grams?: number, measure?: Ingredient['measure']): IngredientDraft {
  const unit = measure?.unit ?? 'g';
  const amount = measure?.amount ?? grams;
  return { id: uid(), query: food?.name ?? '', food, amount: amount === undefined ? '' : String(amount), unit,
    equivalentGrams: measure && grams !== undefined ? String(grams) : undefined };
}

export const foodKey = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();

export function rememberMeal(library: RoutineMeal[], meal: RoutineMeal) {
  const key = (item: RoutineMeal) => JSON.stringify([
    foodKey(item.name),
    item.ingredients.map(({ food, grams, measure }) =>
      JSON.stringify([food.id, Number(grams.toFixed(4)), measure?.unit, measure?.amount])).sort(),
  ]);
  const mealKey = key(meal);
  return library.some(item => key(item) === mealKey) ? library : [...library, meal];
}

export function searchFoods<T extends Food>(foods: T[], query: string) {
  const terms = foodKey(query).split(' ');
  return foods.filter(food => [food.name, ...(food.aliases ?? [])].some(name =>
    terms.every(term => foodKey(name).includes(term))
  ));
}

const spelledPortions: Record<string, string> = { a: '1', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10' };
const portionText = '(kg|grams?|g|ml|millilit(?:re|er)s?|slices?|pieces?|servings?)';
const amountText = '(\\d+(?:[.,]\\d+)?|a|one|two|three|four|five|six|seven|eight|nine|ten)';
const portionLeading = new RegExp('^' + amountText + '\\s*' + portionText + '\\b\\s*(?:of\\s+)?(.+)$', 'i');
const portionTrailing = new RegExp('^(.+?)\\s+' + amountText + '\\s*' + portionText + '$', 'i');
const quantityLeading = new RegExp('^' + amountText + '\\s+(?:of\\s+)?(.+)$', 'i');

export function portionLabel(amount: number, unit: PortionUnit, format: (number: number) => string = String) {
  const units = unit === 'ml' ? 'mL' : unit === 'g' || amount === 1 ? unit : unit + 's';
  return format(amount) + ' ' + units;
}

export function parseMeal(description: string, foods: Food[], singleFood = false): { name: string; ingredients: IngredientDraft[] } {
  const trimmed = description.trim();
  const named = singleFood ? null : trimmed.match(/^(.+?)(?:\s+with\s+|:\s*)(.+)$/i);
  const paneerToast = !singleFood && /^(?:(?:one|two|\d+(?:[.,]\d+)?(?:\s*g(?:rams?)?)?)\s+(?:of\s+)?)?paneer toast(?:\s+\d+(?:[.,]\d+)?\s*g(?:rams?)?)?$/i.test(named?.[1] ?? trimmed);
  const parts = singleFood ? [trimmed] : paneerToast && !named ? [] : (named?.[2] ?? trimmed)
    .split(/\s*(?:\n|;|,(?!\d)|\s+and\s+|\s*\+\s*)\s*/i).filter(Boolean);
  const ingredients = parts.map(part => {
    const leading = part.match(portionLeading);
    const trailing = part.match(portionTrailing);
    const counted = !leading && !trailing ? part.match(quantityLeading) : null;
    const query = leading?.[3] ?? trailing?.[1] ?? counted?.[2] ?? part;
    const quantity = (leading?.[1] ?? trailing?.[2] ?? counted?.[1] ?? '').toLowerCase();
    const amount = spelledPortions[quantity] ?? quantity;
    const statedUnit = (leading?.[2] ?? trailing?.[3] ?? '').toLowerCase().replace(/s$/, '');
    const food = foods.find(entry => [entry.name, ...(entry.aliases ?? [])].some(alias => foodKey(alias) === foodKey(query)));
    const unit: PortionUnit = statedUnit === 'ml' || statedUnit.startsWith('millilit') ? 'ml'
      : statedUnit === 'slice' || statedUnit === 'piece' || statedUnit === 'serving' ? statedUnit
      : counted ? food?.portion?.unit ?? 'piece' : 'g';
    return { ...ingredientDraft(food), query: food?.name ?? query.trim(), unit,
      amount: statedUnit === 'kg' ? String((positiveNumber(amount) ?? 0) * 1000) : amount };
  });
  if (paneerToast) {
    if (!ingredients.some(row => /\bpaneer\b/i.test(row.query))) ingredients.push(ingredientDraft(foods.find(food => food.id === 'L003')));
    if (!ingredients.some(row => /\b(toast|bread)\b/i.test(row.query))) ingredients.push(ingredientDraft(foods.find(food => food.id === 'whole-wheat-toast')));
  }
  const title = named?.[1] ?? (paneerToast ? 'Paneer toast' : ingredients.slice(0, 2).map(row => row.query).join(' + '));
  return { name: title?.replace(/^./, first => first.toUpperCase()) ?? '', ingredients };
}

export function shiftRecipe(recipe: Recipe, grams: number): Ingredient[] {
  return recipe.ingredients.map(ingredient => ({ food: ingredient.food, grams: ingredient.grams * grams / recipe.finishedGrams }));
}

type GoalEstimate = {
  calories: number | null;
  maintenance: number | null;
  timeframe: { weeklyLoss: number; minimumMonths: number } | null;
  reason?: 'missingProfile' | 'underage' | 'invalidAge' | 'invalidHeight' | 'invalidWeight' | 'invalidGoalWeight'
    | 'goalNotLower' | 'goalNotHigher' | 'underweightGoal' | 'calorieFloor' | 'invalidTimeframe';
};

function unavailableGoalEstimate(reason: NonNullable<GoalEstimate['reason']>): GoalEstimate {
  return { reason, calories: null, maintenance: null, timeframe: null };
}

export function dashboardGoalMode(targets: Targets): GoalMode {
  return targets.goalMode ?? (targets.cut ? 'cut' : 'off');
}

export function dashboardCalorieTarget(targets: Targets | null | undefined) {
  if (!targets) return null;
  const mode = dashboardGoalMode(targets);
  return mode === 'off' ? null : goalEstimate(targets, mode).calories;
}

export function goalEstimate(targets: Targets, mode: Exclude<GoalMode, 'off'>): GoalEstimate {
  const age = positiveNumber(targets.age);
  const height = positiveNumber(targets.height);
  const weight = positiveNumber(targets.weight);
  const goal = mode === 'maintain' ? weight : positiveNumber(targets.goalWeight);
  const activity = positiveNumber(targets.activity);
  if (age !== null && age < 18) return unavailableGoalEstimate('underage');
  // Calculator input bounds catch unit and typing errors before computing a target.
  if (age !== null && (!Number.isInteger(age) || age > 125)) return unavailableGoalEstimate('invalidAge');
  if (height !== null && (height < 50 || height > 275)) return unavailableGoalEstimate('invalidHeight');
  if (weight !== null && (weight < 20 || weight > 650)) return unavailableGoalEstimate('invalidWeight');
  if (mode !== 'maintain' && goal !== null && (goal < 20 || goal > 650)) return unavailableGoalEstimate('invalidGoalWeight');
  if (goal !== null && weight !== null) {
    if (mode === 'cut' && goal >= weight) return unavailableGoalEstimate('goalNotLower');
    if (mode === 'bulk' && goal <= weight) return unavailableGoalEstimate('goalNotHigher');
  }
  if (goal !== null && height !== null && goal / (height / 100) ** 2 < 18.5) return unavailableGoalEstimate('underweightGoal');
  if (!age || !height || !weight || !goal || !targets.sex || !activity) return unavailableGoalEstimate('missingProfile');

  const resting = 10 * weight + 6.25 * height - 5 * age + (targets.sex === 'male' ? 5 : -161);
  const maintenance = resting * activity;
  const minimumIntake = targets.sex === 'male' ? 1500 : 1200;
  if (!Number.isFinite(maintenance) || maintenance <= minimumIntake) return unavailableGoalEstimate('calorieFloor');

  if (mode !== 'cut') {
    const surplus = mode === 'bulk' ? Math.min(250, maintenance * 0.05) : 0;
    return { maintenance: Math.round(maintenance), calories: Math.round((maintenance + surplus) / 10) * 10, timeframe: null };
  }

  if (targets.goalMonths.trim()) {
    const months = positiveNumber(targets.goalMonths);
    if (months === null) return unavailableGoalEstimate('invalidTimeframe');
    const averageDaysPerMonth = 365.25 / 12;
    const days = months * averageDaysPerMonth;
    const loss = weight - goal;
    // Use a static energy estimate to set an initial budget, not to forecast body weight.
    const energy = loss * 7700;
    const deficit = energy / days;
    const maxDeficit = Math.min(750, maintenance - minimumIntake);
    const timeframe = {
      weeklyLoss: loss * 7 / days,
      minimumMonths: Math.ceil(energy / (averageDaysPerMonth * maxDeficit)),
    };
    return {
      maintenance: Math.round(maintenance),
      calories: deficit <= maxDeficit ? Math.round((maintenance - deficit) / 10) * 10 : null,
      timeframe,
    };
  }

  const calories = Math.round((maintenance - Math.min(300, maintenance * 0.1)) / 10) * 10;
  return calories < minimumIntake ? unavailableGoalEstimate('calorieFloor')
    : { maintenance: Math.round(maintenance), calories, timeframe: null };
}

export function dailyTargets(targets: Targets) {
  const multiplier = targets.mode === 'custom' ? positiveNumber(targets.multiplier) : proteinModes[targets.mode];
  const weight = positiveNumber(targets.weight);
  return {
    calories: positiveNumber(targets.calories) ?? (targets.cut ? goalEstimate(targets, 'cut').calories : null),
    protein: positiveNumber(targets.protein) ?? (weight && multiplier ? Math.round(weight * multiplier) : null),
    carbs: positiveNumber(targets.carbs),
    fat: positiveNumber(targets.fat),
  };
}
