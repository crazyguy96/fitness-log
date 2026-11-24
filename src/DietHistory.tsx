import { useState } from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import { MacroText, nutrientValue } from './MealEditor';
import { dayKey, totalNutrition, type DietPlan, type Meal } from './nutrition';

const fullDate = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const chartDate = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

export function DietHistory({ meals, plans, calorieTarget, onCurrent }: {
  meals: Meal[]; plans: DietPlan[]; calorieTarget: number | null; onCurrent: () => void;
}) {
  const [filter, setFilter] = useState('');
  const today = dayKey();
  const visible = meals.filter(meal => meal.date <= today && (!filter || meal.planId === filter));
  const routineMeals = visible.filter(meal => meal.routineMealId);
  const followed = routineMeals.filter(meal => meal.status === 'eaten').length;
  const grouped = new Map<string, Meal[]>();
  for (const meal of visible) {
    const list = grouped.get(meal.date) ?? [];
    list.push(meal);
    grouped.set(meal.date, list);
  }
  const entries = [...grouped.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => {
    const eaten = items.filter(meal => meal.status === 'eaten');
    return { date, items, eaten, nutrition: totalNutrition(eaten.flatMap(meal => meal.ingredients)) };
  });
  const logged = entries.filter(entry => entry.eaten.length);
  const chart = logged.slice(0, 7).reverse();
  const targetScale = Math.ceil((calorieTarget ?? 0) * 1.05 / 250) * 250;
  const maxCalories = Math.max(1, targetScale, ...chart.map(entry => entry.nutrition.calories));
  const chartPercent = (calories: number) => calories / maxCalories * 100 + '%';
  const averages = {
    calories: logged.reduce((sum, entry) => sum + entry.nutrition.calories, 0) / (logged.length || 1),
    protein: logged.reduce((sum, entry) => sum + entry.nutrition.protein, 0) / (logged.length || 1),
  };

  return <div className="diet-view">
    <header className="page-heading workouts-heading">
      <div><h1>Diet history</h1><p>Review what you ate and how closely you followed your routines.</p></div>
      <label className="field-label history-diet-filter">Diet plan
        <select aria-label="Filter diet history by plan" value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="">All diet plans</option>
          {plans.map(plan => <option value={plan.id} key={plan.id}>{plan.name}</option>)}
        </select>
      </label>
    </header>
    {!entries.length ? <div className="panel empty-state">
      <span className="empty-icon"><ChartNoAxesCombined size={24} /></span>
      <h2>No diet history yet</h2><p>Mark a meal as eaten in Current to start tracking it here.</p>
      <button className="button primary" onClick={onCurrent}>Go to Diet</button>
    </div> : <>
      <div className="summary-grid diet-history-stats">
        <div className="panel stat"><span>Routine meals followed</span><strong>{routineMeals.length ? Math.round(followed / routineMeals.length * 100) + '%' : '—'}</strong>
          <span>{routineMeals.length ? followed + ' of ' + routineMeals.length + ' routine meals eaten' : 'Mark routine meals as eaten in Current'}</span></div>
        <div className="panel stat"><span>Average calories</span><strong>{logged.length ? nutrientValue(averages.calories) : '—'}</strong><span>kcal per logged day</span></div>
        <div className="panel stat"><span>Average protein</span><strong>{logged.length ? nutrientValue(averages.protein) : '—'}</strong><span>g per logged day</span></div>
      </div>
      {!!chart.length && <section className="panel diet-intake-chart" aria-label="Calories per day">
        <h2>Calories per day</h2><p className="muted">Last {chart.length} {chart.length === 1 ? 'logged day' : 'logged days'}</p>
        {calorieTarget !== null && <p className="diet-intake-legend">
          <span aria-hidden="true" /> Current daily target <strong>{nutrientValue(calorieTarget)} kcal</strong>
        </p>}
        <div className="diet-intake-rows">
          {chart.map(({ date, nutrition: { calories } }) => {
            const over = calorieTarget === null ? 0 : Math.max(0, Math.round((calories - calorieTarget) * 10) / 10);
            return <div className="diet-intake-row" key={date}>
              <span>{chartDate.format(new Date(date + 'T12:00:00'))}</span>
              <span className="diet-intake-track" aria-hidden="true">
                <span className="diet-intake-fill" style={{ width: chartPercent(calories) }} />
                {over > 0 && calorieTarget !== null && <span className="diet-intake-excess"
                  style={{ left: chartPercent(calorieTarget), width: chartPercent(calories - calorieTarget) }} />}
              </span>
              <div className="diet-intake-value"><strong>{nutrientValue(calories)} kcal</strong>
                {over > 0 && <span>+{nutrientValue(over)} kcal over</span>}
              </div>
            </div>;
          })}
          {calorieTarget !== null && <div className="diet-intake-guide" aria-hidden="true">
            <span style={{ left: chartPercent(calorieTarget) }} />
          </div>}
        </div>
      </section>}
      <section className="history-section">
        <h2>Daily records</h2>
        <div className="meal-list">{entries.map(entry => <details className="panel diet-history-day" key={entry.date}>
          <summary><strong>{fullDate.format(new Date(entry.date + 'T12:00:00'))}</strong>
            <span>{entry.eaten.length} of {entry.items.length} meals eaten</span>
            <MacroText nutrients={entry.nutrition} />
          </summary>
          {entry.items.map(meal => <div className="diet-history-meal" key={meal.id}>
            <div><strong>{meal.name}</strong><span>{plans.find(plan => plan.id === meal.planId)?.name}{meal.routineMealId ? ' · Routine meal'
              : meal.ingredients[0]?.reportedNutrition ? ' · Unplanned, self-entered' : meal.readyFood ? ' · Unplanned estimate' : ''}</span></div>
            <span className={'diet-tag' + (meal.status === 'planned' ? ' planned-tag' : '')}>{meal.status === 'eaten' ? 'Eaten' : meal.readyFood ? 'Not eaten' : 'Planned'}</span>
          </div>)}
        </details>)}</div>
      </section>
    </>}
  </div>;
}
