import { useState } from 'react';
import { Apple, ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, Flame, Plus, Sparkles, Trash2, Utensils, Wheat } from 'lucide-react';
import { Dialog } from './Dialog';
import { DietMealPicker } from './DietMealPicker';
import { DietPlans } from './DietPlans';
import { ReadyFoodLog } from './ReadyFoodLog';
import { DietTargets } from './DietTargets';
import { foodCatalog, nutrientLabels } from './foods';
import { MacroText, MealEditor, nutrientValue } from './MealEditor';
import {
  dayKey, dietPlanTargets, ingredientDraft, mealsForDay, moveDay, newDietPlan, nutrientKeys, portionLabel, positiveNumber,
  rememberMeal, shiftRecipe, totalNutrition, weekdayOf, weekdays,
  type DietData, type DietPlan, type Food, type Ingredient, type Meal, type MealDraft, type Nutrient, type Recipe, type RoutineMeal,
} from './nutrition';
import { uid } from './workout';

const metricIcons = { calories: Flame, protein: Sparkles, carbs: Wheat, fat: Apple };
const dietDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

function NutritionCard({ metric, value, target }: { metric: Nutrient; value: number; target: number | null }) {
  const Icon = metricIcons[metric];
  const calories = metric === 'calories';
  const unit = calories ? 'kcal' : 'g';
  const remaining = target === null ? null : target - value;
  const ratio = target ? Math.min(100, value / target * 100) : 0;
  return <article className={'panel nutrient-card nutrient-' + metric}>
    <div className="nutrient-label"><Icon size={17} /> {calories ? 'Calories eaten' : nutrientLabels[metric]}</div>
    <div className="nutrient-value"><strong>{nutrientValue(value)}</strong><span>{!calories && target !== null ? '/ ' + nutrientValue(target) + ' ' : ''}{unit}</span></div>
    {calories && <p className="nutrient-caption">{target === null ? 'Daily target not set' : 'Daily target ' + nutrientValue(target) + ' kcal'}</p>}
    {target !== null && <div aria-label={nutrientLabels[metric] + ' progress'} className="nutrient-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio)}>
      <span style={{ width: ratio + '%' }} />
    </div>}
    {(!calories || remaining !== null) && <p className="nutrient-caption">{remaining === null ? 'Logged' : remaining < 0
      ? nutrientValue(-remaining) + ' ' + unit + ' above target'
      : nutrientValue(remaining) + ' ' + unit + ' remaining'}</p>}
  </article>;
}

function RecipePortion({ recipes, onUse, onClose }: {
  recipes: Recipe[]; onUse: (recipe: Recipe, grams: number) => void; onClose: () => void;
}) {
  const [id, setId] = useState(recipes[0]?.id ?? '');
  const recipe = recipes.find(item => item.id === id);
  const [amount, setAmount] = useState('');
  const grams = positiveNumber(amount);
  return <Dialog title="Use a saved recipe" onClose={onClose}>
    <form onSubmit={event => {
      event.preventDefault();
      if (recipe && grams !== null) onUse(recipe, grams);
    }}>
      <label className="field-label">Recipe
        <select aria-label="Recipe" value={id} onChange={event => { setId(event.target.value); setAmount(''); }}>
          {recipes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {recipe && <p className="muted picker-description">Finished recipe weight {nutrientValue(recipe.finishedGrams)} g</p>}
      <label className="field-label">Portion (g)<input inputMode="decimal" maxLength={9} value={amount} onChange={event => setAmount(event.target.value)} /></label>
      {recipe && grams !== null && <MacroText nutrients={totalNutrition(shiftRecipe(recipe, grams))} />}
      <div className="dialog-actions">
        <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
        <button className="button primary" disabled={!recipe || grams === null}>Review portion</button>
      </div>
    </form>
  </Dialog>;
}

function SaveRecipe({ meal, onSave, onClose }: { meal: RoutineMeal; onSave: (recipe: Recipe) => void; onClose: () => void }) {
  const [name, setName] = useState(meal.name);
  const [finished, setFinished] = useState('');
  const grams = positiveNumber(finished);
  return <Dialog title="Save as a recipe" onClose={onClose}>
    <form onSubmit={event => {
      event.preventDefault();
      if (name.trim() && grams !== null) onSave({ id: uid(), name: name.trim(), ingredients: meal.ingredients, finishedGrams: grams });
    }}>
      <label className="field-label">Recipe name<input value={name} maxLength={80} onChange={event => setName(event.target.value)} /></label>
      <label className="field-label">Finished recipe weight (g)
        <input inputMode="decimal" maxLength={9} placeholder="Weight of the full prepared recipe" value={finished} onChange={event => setFinished(event.target.value)} />
      </label>
      <p className="muted">Use the weight of the finished dish so future portions are scaled correctly.</p>
      <div className="dialog-actions">
        <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
        <button className="button primary" disabled={!name.trim() || grams === null}>Save recipe</button>
      </div>
    </form>
  </Dialog>;
}

export type DietTab = 'current' | 'plans';

export function Diet({ tab, onTab, data, today, persist, pending, onRetry, goalCalories, onDashboard }: {
  tab: DietTab; onTab: (tab: DietTab) => void; data: DietData; today: string; persist: (data: DietData) => void;
  pending: boolean; onRetry: () => void; goalCalories: number | null; onDashboard: () => void;
}) {
  const [selectedDate, setDate] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [libraryPlanId, setLibraryPlanId] = useState<string | null>(null);
  const [libraryEditing, setLibraryEditing] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Meal | null>(null);
  const [dialog, setDialog] = useState<'picker' | 'ready' | 'recipes' | 'discard' | null>(null);
  const [readyLog, setReadyLog] = useState<{ date: string; planId: string; meal: Meal | null } | null>(null);
  const [recipeMeal, setRecipeMeal] = useState<RoutineMeal | null>(null);
  const [notice, setNotice] = useState('');

  const date = selectedDate ?? today;
  const canLog = date === today;
  const plan = data.plans.find(item => item.id === data.activePlanId) ?? data.plans[0];
  const libraryPlan = data.plans.find(item => item.id === libraryPlanId);
  const targetPlan = data.plans.find(item => item.id === targetPlanId);
  const scheduledDay = weekdayOf(date);
  const routineMeals = plan.week[scheduledDay];
  const templateOf = (meal: Meal) => routineMeals.find(item => item.id === meal.routineMealId);
  const removeFromRoutine = removing ? !!templateOf(removing) : false;
  const items = mealsForDay(plan, data.meals, date);
  const eaten = items.filter(meal => meal.status === 'eaten');
  const planned = items.filter(meal => meal.status === 'planned' && !meal.readyFood);
  const totals = totalNutrition(eaten.flatMap(meal => meal.ingredients));
  const readyCalories = totalNutrition(eaten.filter(meal => meal.readyFood).flatMap(meal => meal.ingredients)).calories;
  const projection = totalNutrition([...eaten, ...planned].flatMap(meal => meal.ingredients));
  const targets = dietPlanTargets(plan, goalCalories);
  const draft = data.draft;
  const visibleDraft = draft && draft.planId === plan.id && (draft.routineDay ?? weekdayOf(draft.date)) === scheduledDay
    && (draft.routineDay !== undefined || draft.date === date) ? draft : null;

  function openReadyFood(meal: Meal | null = null) {
    setReadyLog({ date, planId: plan.id, meal });
    setDialog('ready');
  }

  function selectDay(value: string) {
    if (value) {
      setDate(value === dayKey() ? null : value);
      setNotice('');
      setEditing(false);
    }
  }

  function resumeDraft() {
    if (!data?.draft) return;
    const saved = data.draft;
    setEditing(true);
    setDate(saved.routineDay === undefined ? saved.date : moveDay(saved.date, saved.routineDay - weekdayOf(saved.date)));
    if (data.activePlanId !== saved.planId) persist({ ...data, activePlanId: saved.planId });
  }

  function startLibraryDraft(plan: DietPlan, meal?: RoutineMeal) {
    if (!plan.libraryDraft) {
      setLibraryDraft(plan, {
        id: meal?.id, planId: plan.id, date, name: meal?.name ?? '', description: '', status: 'planned',
        ingredients: meal?.ingredients.map(item => ingredientDraft(item.food, Number(item.grams.toFixed(4)), item.measure)) ?? [],
      });
    }
    setNotice('');
    setLibraryEditing(true);
  }

  function setLibraryDraft(plan: DietPlan, draft?: MealDraft, food?: Food) {
    const plans = data.plans.map(item => item.id === plan.id ? { ...item, libraryDraft: draft } : item);
    persist({ ...data, plans, foods: food ? [...data.foods, food] : data.foods });
  }

  function startDraft(name = '', ingredients: Ingredient[] = [], meal?: Meal, editLog = false) {
    if (data.draft) {
      resumeDraft();
      return;
    }
    const template = !editLog && meal ? templateOf(meal) : undefined;
    const routine = !meal || !!template;
    const draft: MealDraft = {
      id: routine ? meal?.routineMealId : meal.id, date, description: '', name: template?.name ?? name, status: meal?.status ?? 'planned',
      planId: plan.id, routineDay: routine ? scheduledDay : undefined,
      ingredients: (template?.ingredients ?? ingredients).map(item => ingredientDraft(item.food, Number(item.grams.toFixed(4)), item.measure)),
    };
    persist({ ...data, draft });
    setEditing(true);
    setNotice('');
  }

  function saveRoutineMeal(entry: RoutineMeal, planId: string, weekday: number, date: string, editingId?: string, clearDraft = false) {
    const plans = data.plans.map(item => item.id === planId ? {
      ...item,
      library: rememberMeal(item.library, { ...entry, id: uid() }),
      week: item.week.map((meals, index) => index !== weekday ? meals : editingId
        ? meals.map(meal => meal.id === editingId ? entry : meal) : [...meals, entry]),
    } : item);
    const isUpcoming = date >= dayKey();
    const sameDay = (meal: Meal) => meal.planId === planId && meal.date === date;
    const meals = data.meals.map(meal => isUpcoming && meal.status === 'planned' && sameDay(meal) && meal.routineMealId === entry.id
      ? { ...meal, name: entry.name, ingredients: entry.ingredients } : meal);
    if (isUpcoming && !editingId && meals.some(meal => sameDay(meal) && meal.routineMealId)) {
      meals.push({ ...entry, routineMealId: entry.id, date, planId, status: 'planned' });
    }
    persist({ ...data, plans, meals, draft: clearDraft ? null : data.draft });
    setNotice(entry.name + ' saved to the ' + weekdays[weekday] + ' routine.');
  }

  function saveMeal(draft: MealDraft, ingredients: Ingredient[], library?: DietPlan) {
    const entry: RoutineMeal = { id: draft.id ?? uid(), name: draft.name.trim(), ingredients };
    if (library) {
      const plans = data.plans.map(item => item.id === library.id ? {
        ...item, libraryDraft: undefined,
        library: draft.id ? item.library.map(meal => meal.id === draft.id ? entry : meal) : rememberMeal(item.library, entry),
      } : item);
      persist({ ...data, plans });
      setLibraryEditing(false);
      setNotice(entry.name + ' saved to the meal library.');
    } else if (draft.routineDay !== undefined) {
      saveRoutineMeal(entry, draft.planId, draft.routineDay, draft.date, draft.id, true);
    } else {
      if (draft.date !== dayKey()) {
        setNotice('Only today’s dated meals can be changed. Discard this draft to continue.');
        return;
      }
      const meal: Meal = { ...entry, date: draft.date, planId: draft.planId, status: draft.status };
      const meals = draft.id ? data.meals.map(item => item.id === draft.id ? { ...item, ...meal } : item) : [...data.meals, meal];
      persist({ ...data, meals, draft: null });
      setNotice(meal.name + ' saved.');
    }
    setEditing(false);
  }

  function mealEditor(draft: MealDraft, library?: DietPlan) {
    return <>
      <MealEditor key={draft.planId + ':' + (draft.routineDay ?? draft.date)} draft={draft} foods={[...foodCatalog, ...data.foods]}
        title={library ? (draft.id ? 'Edit library meal' : 'New library meal') : undefined}
        onChange={next => library ? setLibraryDraft(library, next) : persist({ ...data, draft: next })}
        onCustomFood={(food, next) => library ? setLibraryDraft(library, next, food) : persist({ ...data, foods: [...data.foods, food], draft: next })}
        onSave={ingredients => saveMeal(draft, ingredients, library)}
        onClose={() => library ? setLibraryEditing(false) : setEditing(false)} />
      <button className="text-button discard-meal" onClick={() => setDialog('discard')}>Discard meal draft</button>
    </>;
  }

  const error = pending && <div className="notice" role="alert"><span>Couldn’t save Diet to this browser. Your edits are still open.</span>
    <button className="text-button" onClick={onRetry}>Retry</button></div>;
  const discard = dialog === 'discard' && <Dialog title="Discard this meal draft?" onClose={() => setDialog(null)}>
    <p className="muted">Your draft details will be cleared.</p>
    <div className="dialog-actions">
      <button className="button secondary" onClick={() => setDialog(null)}>Keep draft</button>
      <button className="button primary" onClick={() => {
        if (tab === 'plans' && libraryPlan) {
          setLibraryDraft(libraryPlan);
          setLibraryEditing(false);
        } else {
          persist({ ...data, draft: null });
          setEditing(false);
        }
        setDialog(null); setNotice('');
      }}>Discard draft</button>
    </div>
  </Dialog>;

  const targetDate = tab === 'current' ? date : today;
  const targetEditor = targetPlan && <DietTargets key={targetPlan.id}
    planName={targetPlan.name} saved={targetPlan.targets}
    dashboardCalories={targetPlan.id === plan.id ? goalCalories : null}
    onDashboard={() => { setTargetPlanId(null); onDashboard(); }}
    intakeLabel={targetDate === today ? 'Today' : dietDate.format(new Date(targetDate + 'T12:00:00'))}
    eatenCalories={totalNutrition(data.meals.filter(meal =>
      meal.planId === targetPlan.id && meal.date === targetDate && meal.status === 'eaten').flatMap(meal => meal.ingredients)).calories}
    onClose={() => setTargetPlanId(null)} onSave={targets => {
      persist({ ...data, plans: data.plans.map(item => item.id === targetPlan.id ? { ...item, targets } : item) });
      setTargetPlanId(null);
    }} />;

  if (tab === 'plans' && libraryPlan) return <div className="diet-view">
    <button className="text-button" onClick={() => {
      setLibraryPlanId(null); setLibraryEditing(false); setNotice('');
    }}><ArrowLeft size={16} /> All diet plans</button>
    <header className="page-heading workouts-heading">
      <div><h1>Meal library</h1><p>{libraryPlan.name} · {libraryPlan.library.length} saved {libraryPlan.library.length === 1 ? 'meal' : 'meals'}</p></div>
      <button className="button primary" onClick={() => startLibraryDraft(libraryPlan)}>
        <Plus size={18} /> {libraryPlan.libraryDraft ? 'Resume meal draft' : 'New meal'}
      </button>
    </header>
    {error}
    {notice && <p className="notice diet-notice" role="status">{notice}</p>}
    {libraryEditing && libraryPlan.libraryDraft && mealEditor(libraryPlan.libraryDraft, libraryPlan)}
    {!libraryPlan.library.length && !libraryEditing && <div className="panel empty-state">
      <span className="empty-icon"><Utensils size={24} /></span>
      <h2>No saved meals yet</h2><p>Add meals here to pick them later in Current.</p>
    </div>}
    <div className="workout-list">
      {libraryPlan.library.map(meal => <article className="panel workout-card" key={meal.id}>
        <div className="title-row">
          <span className="meal-icon"><Utensils size={18} /></span>
          <div className="meal-title"><h2>{meal.name}</h2><MacroText nutrients={totalNutrition(meal.ingredients)} /></div>
        </div>
        <button className="button secondary" disabled={!!libraryPlan.libraryDraft} aria-label={'Edit library meal ' + meal.name}
          onClick={() => startLibraryDraft(libraryPlan, meal)}>Edit</button>
      </article>)}
    </div>
    {discard}
  </div>;
  if (tab === 'plans') return <>
    {error}
    <DietPlans plans={data.plans} active={plan.id} goalCalories={goalCalories}
      onName={(name, id) => {
        if (id) persist({ ...data, plans: data.plans.map(item => item.id === id ? { ...item, name } : item) });
        else persist({ ...data, plans: [...data.plans, newDietPlan(name)] });
      }}
      onUse={id => {
        if (id !== plan.id) { persist({ ...data, activePlanId: id }); setDate(today); }
        setEditing(false); setNotice(''); onTab('current');
      }}
      onTargets={setTargetPlanId}
      onLibrary={id => { setLibraryPlanId(id); setLibraryEditing(false); setNotice(''); }} />
    {targetEditor}
  </>;

  return <div className="diet-view">
    <header className="diet-heading">
      <div>
        <h1>Diet plan</h1>
        <p className="muted">Active diet <strong className="active-plan-name">{plan.name}</strong></p>
      </div>
      <div className="diet-date-tools">
        <div className="date-control">
          <button className="icon-button" aria-label="Previous day" onClick={() => selectDay(moveDay(date, -1))}><ChevronLeft size={19} /></button>
          <span className="diet-date">{canLog ? 'Today' : dietDate.format(new Date(date + 'T12:00:00'))}</span>
          <button className="icon-button" aria-label="Next day" onClick={() => selectDay(moveDay(date, 1))}><ChevronRight size={19} /></button>
        </div>
      </div>
    </header>

    {error}
    {notice && <p className="notice diet-notice" role="status">{notice}</p>}
    <section className="week diet-week" aria-label="Diet week">
      <h2>Your week</h2>
      <div className="week-grid">
        {weekdays.map((weekday, index) => {
          const count = plan.week[index].length;
          return <button key={weekday} className="day-card" aria-label={weekday} aria-pressed={index === scheduledDay}
            onClick={() => selectDay(moveDay(date, index - scheduledDay))}>
            <span className="day-marker" aria-hidden="true" />
            <span className="day-card-name">{weekday.slice(0, 3)}</span>
            <span className="day-card-detail">{count ? count + (count === 1 ? ' meal' : ' meals') : 'Empty'}</span>
          </button>;
        })}
      </div>
    </section>
    <div className="diet-columns">
      <div>
        <section className="diet-routine" aria-labelledby="diet-routine-title">
          <div className="section-heading diet-routine-day">
            <h2 id="diet-routine-title">{weekdays[scheduledDay]} meals</h2>
            <div className="day-actions">
              {data.recipes.length > 0 && <button className="button secondary small" onClick={() => setDialog('recipes')}>Saved recipes</button>}
              {canLog && <button className="button secondary small" onClick={() => openReadyFood()}><Plus size={17} /> Ate something else</button>}
              <button className="button primary small" onClick={() => setDialog('picker')}><Plus size={17} /> Add meal</button>
            </div>
          </div>
          {!canLog && <p className="muted picker-description">Meals can be marked eaten only for today.</p>}
          {editing && visibleDraft && mealEditor(visibleDraft)}
          {!items.length && !(editing && visibleDraft) && <div className="panel empty-state routine-empty">
            <span className="empty-icon"><Utensils size={23} /></span>
            <h3>No meals for {weekdays[scheduledDay]}</h3>
            <p>Add meals to this weekday’s routine.</p>
          </div>}
          <div className="meal-list">
            {items.map(meal => <article key={meal.id} className="panel meal-card">
              <div className="meal-card-heading">
                <span className="meal-icon"><Utensils size={19} /></span>
                <div className="meal-title"><h3>{meal.name}</h3>{meal.readyFood && <span className="diet-tag ready-food-tag">
                  {meal.ingredients[0]?.reportedNutrition ? 'Unplanned · Self-entered' : 'Unplanned · Estimate'}</span>}
                  <MacroText nutrients={totalNutrition(meal.ingredients)} /></div>
                <label className="meal-eaten">
                  <span>{meal.status === 'eaten' ? 'Eaten' : canLog ? 'Mark eaten' : 'Planned'}</span>
                  <span className="check-control">
                    <input type="checkbox" aria-label={meal.name + ' eaten'} checked={meal.status === 'eaten'} disabled={!canLog} onChange={event => {
                      if (date !== dayKey()) return;
                      const status: Meal['status'] = event.target.checked ? 'eaten' : 'planned';
                      const template = templateOf(meal);
                      const meals = [
                        ...data.meals.filter(item => item.date !== date || item.planId !== plan.id),
                        ...items.map(item => item.id === meal.id ? {
                          ...item, status, ...(template && status === 'planned' ? { name: template.name, ingredients: template.ingredients } : {}),
                        } : item),
                      ];
                      persist({ ...data, meals });
                    }} />
                    <span aria-hidden="true"><Check size={16} /></span>
                  </span>
                </label>
              </div>
              <details className="meal-details">
                <summary>{meal.readyFood ? 'Portion and source' : 'Ingredients (' + meal.ingredients.length + ')'}</summary>
                <ul>{meal.ingredients.map((ingredient, index) => <li key={index}>
                  <div><strong>{ingredient.food.name}</strong><span>{ingredient.measure
                    ? portionLabel(ingredient.measure.amount, ingredient.measure.unit, nutrientValue) : nutrientValue(ingredient.grams) + ' g'}</span></div>
                  <MacroText nutrients={totalNutrition([ingredient])} />
                  {meal.readyFood && ingredient.food.sourceUrl && <a className="diet-source" href={ingredient.food.sourceUrl}
                    target="_blank" rel="noreferrer">{ingredient.food.source}</a>}
                  {ingredient.reportedNutrition && <span className="muted">{ingredient.food.source}</span>}
                </li>)}</ul>
              </details>
              <div className="meal-card-actions">
                {(canLog || templateOf(meal)) && <button className="text-button" onClick={() => meal.readyFood ? openReadyFood(meal) : startDraft(meal.name, meal.ingredients, meal)}>
                  {meal.readyFood ? 'Edit logged food' : meal.status === 'eaten' && templateOf(meal) ? 'Edit routine' : 'Edit meal'}
                </button>}
                {canLog && meal.status === 'eaten' && templateOf(meal) && <button className="text-button"
                  onClick={() => startDraft(meal.name, meal.ingredients, meal, true)}>Edit today’s log</button>}
                {!meal.readyFood && <button className="text-button" onClick={() => setRecipeMeal(meal)}>Save recipe</button>}
                {(canLog || templateOf(meal)) && <button className="icon-button" aria-label={'Remove ' + meal.name} onClick={() => setRemoving(meal)}><Trash2 size={16} /></button>}
              </div>
            </article>)}
          </div>
        </section>
      </div>
      <div>
        <section className="panel diet-overview" aria-label="Daily nutrition">
          <div className="section-heading">
            <h2>Day overview</h2>
            <div className="day-actions">
              {goalCalories !== null && <button className="text-button" onClick={onDashboard}>Dashboard calorie target</button>}
              <button className="button secondary small" onClick={() => setTargetPlanId(plan.id)}>Targets</button>
            </div>
          </div>
          <div className="nutrient-grid">
            {nutrientKeys.map(metric => <NutritionCard key={metric} metric={metric} value={totals[metric]} target={targets[metric]} />)}
          </div>
          {readyCalories > 0 && <div className="projection"><Utensils size={17} /><strong>Unplanned foods</strong>
            <span className="macro-text">+{nutrientValue(readyCalories)} kcal included in calories eaten</span></div>}
          {!!planned.length && <div className="projection">
            <CalendarDays size={18} /><strong>With planned meals</strong><MacroText nutrients={projection} />
          </div>}
        </section>
        <aside className="panel diet-suggestions" aria-labelledby="diet-suggestions-title">
          <div className="title-row"><span className="meal-icon"><Sparkles size={19} /></span><h2 id="diet-suggestions-title">What to eat next</h2></div>
          {!planned.length && <p className="muted">{items.length ? 'You’ve marked every meal as eaten.' : 'Add meals to this day to see them here.'}</p>}
          {planned.map(meal => <div className="pending-meal" key={meal.id}>
            <h3>{meal.name}</h3>
            <MacroText nutrients={totalNutrition(meal.ingredients)} />
          </div>)}
        </aside>
      </div>
    </div>

    {targetEditor}
    {dialog === 'ready' && readyLog?.date === date && readyLog.planId === plan.id && canLog && <ReadyFoodLog meal={readyLog.meal} onClose={() => setDialog(null)} onSave={(name, ingredient) => {
      if (readyLog.date !== dayKey()) return;
      const readyMeal = readyLog.meal;
      const entry: Meal = readyMeal ? { ...readyMeal, name, ingredients: [ingredient] }
        : { id: uid(), date, planId: plan.id, name, ingredients: [ingredient], status: 'eaten', readyFood: true };
      const meals = readyMeal ? data.meals.map(meal => meal.id === entry.id ? entry : meal) : [...data.meals, entry];
      persist({ ...data, meals });
      setDialog(null);
      setNotice(name + (readyMeal ? ' updated.' : ' logged as eaten.'));
    }} />}
    {dialog === 'picker' && <DietMealPicker plan={plan} hasDraft={!!draft}
      onClose={() => setDialog(null)} onNew={() => { setDialog(null); startDraft(); }}
      onChoose={meal => {
        setDialog(null);
        saveRoutineMeal({ ...meal, id: uid() }, plan.id, scheduledDay, date);
      }} />}
    {dialog === 'recipes' && <RecipePortion recipes={data.recipes} onClose={() => setDialog(null)} onUse={(recipe, grams) => {
      setDialog(null); startDraft(recipe.name, shiftRecipe(recipe, grams));
    }} />}
    {discard}
    {removing && <Dialog title="Remove meal?" onClose={() => setRemoving(null)}>
      <p className="muted">{removing.name} will be removed from {removeFromRoutine
        ? 'the ' + weekdays[scheduledDay] + ' routine.' : 'the selected date.'}
        {removeFromRoutine && removing.status === 'eaten' && ' The eaten entry stays in your log.'}</p>
      <div className="dialog-actions">
        <button className="button secondary" onClick={() => setRemoving(null)}>Cancel</button>
        <button className="button primary" onClick={() => {
          if (removing.date !== date || removing.planId !== plan.id || (!removeFromRoutine && date !== dayKey())) {
            setRemoving(null);
            return;
          }
          const plans = data.plans.map(item => item.id === plan.id ? {
            ...item, week: item.week.map((meals, index) => index === scheduledDay
              ? meals.filter(meal => meal.id !== removing.routineMealId) : meals),
          } : item);
          const keepDated = removeFromRoutine && (removing.status === 'eaten' || date < dayKey());
          const meals = keepDated ? data.meals
            : data.meals.filter(meal => meal.id !== removing.id || meal.date !== date || meal.planId !== plan.id);
          const draftRemoved = draft?.planId === plan.id && (draft.routineDay === undefined
            ? draft.date === date && draft.id === removing.id : draft.id === removing.routineMealId);
          persist({ ...data, plans, meals, draft: draftRemoved ? null : draft });
          setRemoving(null);
          setNotice(removing.name + ' removed.');
        }}>Remove meal</button>
      </div>
    </Dialog>}
    {recipeMeal && <SaveRecipe meal={recipeMeal} onClose={() => setRecipeMeal(null)} onSave={recipe => {
      persist({ ...data, recipes: [...data.recipes, recipe] }); setRecipeMeal(null); setNotice(recipe.name + ' saved as a recipe.');
    }} />}
  </div>;
}
