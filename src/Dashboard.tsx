import { useEffect, useState } from 'react';
import { Activity, ArrowLeftRight, ArrowRight, Check, Pencil, Scale, Target, Utensils } from 'lucide-react';
import { datesOfWeek, nutritionWeek, plannedMenu, trainingWeek, type DashboardData } from './dashboardData';
import { Dialog } from './Dialog';
import { DietTargets } from './DietTargets';
import { nutrientValue } from './MealEditor';
import { dashboardCalorieTarget, dashboardGoalMode, dayKey, dietPlanTargets, goalModeLabels, moveDay, positiveNumber, totalNutrition, type DietData, type DietPlan } from './nutrition';
import type { AppData, WorkoutPlan } from './workout';

const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const weekdayDate = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const formatDay = (date: string, formatter = shortDate) => formatter.format(new Date(date + 'T12:00:00'));

function WeightChart({ weights, today, goal, maintain }: { weights: DashboardData['weights']; today: string; goal: number | null; maintain: boolean }) {
  const readings = Object.entries(weights).filter(([date]) => date <= today).sort(([a], [b]) => a.localeCompare(b));
  const weekMean = (offset: number) => {
    const values = datesOfWeek(today, offset).filter(date => date <= today && weights[date] !== undefined).map(date => weights[date]);
    return values.length ? values.reduce((sum, kg) => sum + kg, 0) / values.length : null;
  };
  const current = weekMean(0);
  const previous = weekMean(-1);
  const change = current !== null && previous !== null ? current - previous : null;
  const start = moveDay(today, -27);
  const window = Array.from({ length: 28 }, (_, index) => moveDay(start, index));
  const plotWeights = window.flatMap(date => weights[date] === undefined ? [] : [weights[date]]);
  const values = goal === null ? plotWeights : [...plotWeights, goal];
  const min = Math.floor(Math.min(...values)) - 1;
  const max = Math.ceil(Math.max(...values)) + 1;
  const y = (value: number) => 100 - (value - min) / (max - min) * 100;
  const points = window.map((date, index) => weights[date] === undefined ? null : { date, x: index / 27 * 100, y: y(weights[date]) });

  return <section className="panel dashboard-card weight-trend" aria-labelledby="weight-trend-title">
    <div className="title-row"><Scale size={19} /><h2 id="weight-trend-title">Weight trend</h2></div>
    <dl className="dashboard-metrics">
      <div><dt>Latest</dt><dd>{readings.length ? nutrientValue(readings.at(-1)![1]) + ' kg' : '—'}</dd></div>
      <div><dt>This week</dt><dd>{current === null ? 'No entries' : nutrientValue(current) + ' kg avg'}</dd></div>
      <div><dt>Last week</dt><dd>{previous === null ? 'No entries' : nutrientValue(previous) + ' kg avg'}</dd></div>
      <div><dt>Weekly change</dt><dd>{change === null ? '—' : (change > 0 ? '+' : '') + nutrientValue(change) + ' kg'}</dd></div>
    </dl>
    {plotWeights.length ? <>
      <div className="weight-plot">
        <div className="weight-axis" aria-hidden="true"><span>{max} kg</span><span>{min} kg</span></div>
        <div className="chart-drawing">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path className="chart-grid" d="M0 0H100 M0 50H100 M0 100H100" vectorEffect="non-scaling-stroke" />
            {goal !== null && <path className="chart-line weight-goal-line" d={'M0 ' + y(goal) + 'H100'} vectorEffect="non-scaling-stroke" />}
            {points.slice(1).map((point, index) => {
              const prior = points[index];
              return point && prior && <line key={point.date} className="chart-line" x1={prior.x} x2={point.x} y1={prior.y} y2={point.y} vectorEffect="non-scaling-stroke" />;
            })}
          </svg>
          {points.map(point => point && <span key={point.date} className="weight-dot" style={{ left: point.x + '%', top: point.y + '%' }}
            role="img" aria-label={formatDay(point.date) + ', ' + nutrientValue(weights[point.date]) + ' kg'}
            title={formatDay(point.date) + ' · ' + nutrientValue(weights[point.date]) + ' kg'} />)}
          <div className="chart-labels"><span>{formatDay(start)}</span><span>{formatDay(today)}</span></div>
        </div>
      </div>
      {goal !== null && <p className="muted weight-legend">Dashed line · {maintain ? 'Maintaining at' : 'Goal of'} {nutrientValue(goal)} kg</p>}
    </> : <p className="muted">Log a weight to see your trend over the last 28 days.</p>}
  </section>;
}

function WeighIn({ weights, today, onSave }: { weights: DashboardData['weights']; today: string; onSave: (date: string, weight: number) => boolean }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [input, setInput] = useState('');
  const [failed, setFailed] = useState(false);
  const weight = positiveNumber(input);
  const recorded = weights[today];
  const valid = !!date && date <= today && weight !== null;

  return <>
    <section className="panel dashboard-card weigh-in">
      <div><h2>{recorded === undefined ? 'Log today’s weight' : 'Today’s weigh-in'}</h2>
        <p className="muted">{recorded === undefined ? formatDay(today, weekdayDate) : nutrientValue(recorded) + ' kg · ' + formatDay(today, weekdayDate)}</p>
      </div>
      <button className={'button ' + (recorded === undefined ? 'primary' : 'secondary')} onClick={() => {
        setDate(today); setInput(recorded === undefined ? '' : String(recorded)); setFailed(false); setOpen(true);
      }}>{recorded === undefined ? 'Log weight' : 'Edit weigh-in'}</button>
    </section>
    {open && <Dialog title="Log weight" onClose={() => setOpen(false)}>
      <form onSubmit={event => {
        event.preventDefault();
        if (valid && onSave(date, weight)) setOpen(false);
        else if (valid) setFailed(true);
      }}>
        <label className="field-label">Weigh-in date<input type="date" max={today} value={date} onChange={event => {
          setDate(event.target.value);
          const existing = weights[event.target.value];
          setInput(existing === undefined ? '' : String(existing));
        }} /></label>
        <label className="field-label">Weight (kg)<input inputMode="decimal" value={input} maxLength={12}
          aria-invalid={!!input && weight === null} onChange={event => setInput(event.target.value)} /></label>
        {!!input && weight === null && <p className="field-error">Enter a weight greater than zero.</p>}
        {date > today && <p className="field-error">Choose today or an earlier date.</p>}
        {failed && <p role="alert" className="field-error">Couldn’t save the weigh-in. Try saving again.</p>}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="button primary" disabled={!valid}>Save weigh-in</button>
        </div>
      </form>
    </Dialog>}
  </>;
}

export function Dashboard({ data, workouts, workout, diet, dietPlan, save, onGymHistory, onDietHistory, onEditWorkout, onEditDiet, onChangeWorkout, onManageWorkouts, onChangeDiet, onManageDiets }: {
  data: DashboardData; workouts: AppData; workout: WorkoutPlan; diet: DietData; dietPlan: DietPlan;
  save: (data: DashboardData) => boolean; onGymHistory: () => void; onDietHistory: () => void;
  onEditWorkout: () => void; onEditDiet: () => void;
  onChangeWorkout: (id: string) => boolean; onManageWorkouts: () => void;
  onChangeDiet: (id: string) => boolean; onManageDiets: () => void;
}) {
  const [today, setToday] = useState(dayKey);
  const [choosingPlan, setChoosingPlan] = useState<'workout' | 'diet' | null>(null);
  const [planError, setPlanError] = useState(false);
  const [planNotice, setPlanNotice] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalError, setGoalError] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(dayKey()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const legacy = data.goal === null && dietPlan.targets.cut;
  const latest = Object.entries(data.weights).filter(([date]) => date <= today).sort(([a], [b]) => b.localeCompare(a))[0]?.[1];
  const goal = data.goal;
  const draft = goal ?? (legacy ? dietPlan.targets : {
    ...dietPlan.targets, cut: true, calories: '', weight: latest === undefined ? dietPlan.targets.weight : String(latest),
    goalMonths: '4',
  });
  const mode = goal ? dashboardGoalMode(goal) : 'off';
  const goalWeight = goal && mode !== 'off' ? positiveNumber(mode === 'maintain' ? goal.weight : goal.goalWeight) : null;
  const startWeight = goal ? positiveNumber(goal.weight) : null;
  const lost = latest !== undefined && startWeight !== null ? startWeight - latest : null;
  const target = dashboardCalorieTarget(goal);
  const targets = dietPlanTargets(dietPlan, target);
  const training = trainingWeek(workout, workouts.sessions, today);
  const days = nutritionWeek(dietPlan, diet.meals, today);
  const menu = plannedMenu(dietPlan);
  function openGoal() { setGoalError(false); setEditingGoal(true); }
  function openPlanPicker(kind: 'workout' | 'diet') { setPlanError(false); setChoosingPlan(kind); }

  const choosingDiet = choosingPlan === 'diet';
  const choices = choosingDiet
    ? diet.plans.map(plan => ({ id: plan.id, name: plan.name, active: plan.id === dietPlan.id,
      draft: plan.libraryDraft || diet.draft?.planId === plan.id ? 'Meal draft in progress' : '' }))
    : workouts.plans.map(plan => ({ id: plan.id, name: plan.name, active: plan.id === workout.id,
      draft: plan.draft ? 'Session in progress' : '' }));
  const selectPlan = choosingDiet ? onChangeDiet : onChangeWorkout;
  const eaten = totalNutrition(diet.meals.filter(meal => meal.planId === dietPlan.id && meal.date === today && meal.status === 'eaten').flatMap(meal => meal.ingredients));

  return <div className="dashboard">
    <header className="page-heading"><h1>Dashboard</h1><p>Weight, nutrition, and training progress.</p></header>
    <WeighIn today={today} weights={data.weights} onSave={(date, weight) => save({ ...data, weights: { ...data.weights, [date]: weight } })} />
    <div className="dashboard-grid">
      <div className="dashboard-stack">
        <WeightChart weights={data.weights} today={today} goal={goalWeight} maintain={mode === 'maintain'} />
        <section className="panel dashboard-card" aria-labelledby="goal-title">
          <div className="section-heading"><div className="title-row"><Target size={19} /><h2 id="goal-title">Weight goal</h2></div>
            <button className="button secondary small" onClick={openGoal}>
              {goal ? 'Edit weight goal' : legacy ? 'Review existing goal' : 'Set weight goal'}
            </button>
          </div>
          {legacy && <p className="muted">Review the Cut mode settings from {dietPlan.name} to apply them here.</p>}
          {goal ? <>
            <dl className="dashboard-metrics">
              <div><dt>Starting weight</dt><dd>{startWeight === null ? '—' : nutrientValue(startWeight) + ' kg'}</dd></div>
              {(mode === 'cut' || mode === 'bulk') && <div><dt>Goal weight</dt><dd>{goalWeight === null ? '—' : nutrientValue(goalWeight) + ' kg'}</dd></div>}
              {mode === 'cut' ? <div><dt>Timeframe</dt><dd>{goal.goalMonths ? goal.goalMonths + (Number(goal.goalMonths) === 1 ? ' month' : ' months') : 'Gradual'}</dd></div>
                : <div><dt>Goal mode</dt><dd>{goalModeLabels[mode]}</dd></div>}
              <div><dt>Weight change</dt><dd>{lost === null ? '—' : nutrientValue(Math.abs(lost)) + ' kg ' + (lost < 0 ? 'gained' : 'lost')}</dd></div>
            </dl>
            <p className="muted">{target !== null ? goalModeLabels[mode] + ' mode · ' + nutrientValue(target) + ' kcal/day applied to ' + dietPlan.name : mode === 'off' ? 'Automatic goal target is off.' : 'Edit your goal to complete the details needed for a calorie target.'}</p>
          </> : !legacy && <p className="muted">Set a goal and review your calorie target for the active diet plan.</p>}
          <ul className="dashboard-plan-links">
            <li><span className="dashboard-plan-name">Workout <strong title={workout.name}>{workout.name}</strong></span>
              <div className="dashboard-plan-actions">
                <button className="button secondary small" aria-label="Edit workout" onClick={onEditWorkout}>
                  <Pencil size={15} /> <span>Edit</span>
                </button>
                <button className="button secondary small" aria-label="Change workout" onClick={() => openPlanPicker('workout')}>
                  <ArrowLeftRight size={15} /> <span>Change</span>
                </button>
              </div>
            </li>
            <li><span className="dashboard-plan-name">Diet <strong title={dietPlan.name}>{dietPlan.name}</strong></span>
              <div className="dashboard-plan-actions">
                <button className="button secondary small" aria-label="Edit diet" onClick={onEditDiet}>
                  <Pencil size={15} /> <span>Edit</span>
                </button>
                <button className="button secondary small" aria-label="Change diet" onClick={() => openPlanPicker('diet')}>
                  <ArrowLeftRight size={15} /> <span>Change</span>
                </button>
              </div>
            </li>
          </ul>
          {planNotice && <p className="dashboard-note" role="status">{planNotice}</p>}
        </section>
      </div>
      <div className="dashboard-stack">
        <section className="panel dashboard-card" aria-labelledby="dashboard-training-title">
          <div className="title-row"><Activity size={19} /><h2 id="dashboard-training-title">Training this week</h2></div>
          <p className="dashboard-count">{training.scheduled > 0
            ? <><strong>{training.logged} of {training.scheduled}</strong> training days logged</> : 'No training days scheduled'}</p>
          <p className="muted">{workout.name}</p>
          <button className="text-button" onClick={onGymHistory}>View gym history <ArrowRight size={15} /></button>
        </section>
        <section className="panel dashboard-card" aria-labelledby="dashboard-nutrition-title">
          <div className="title-row"><Utensils size={19} /><h2 id="dashboard-nutrition-title">Nutrition this week</h2></div>
          <p className="muted">{dietPlan.name} · Daily target {targets.calories === null ? '—' : nutrientValue(targets.calories) + ' kcal'}{targets.protein !== null && ' · ' + nutrientValue(targets.protein) + ' g protein'}</p>
          {menu.calories !== null && menu.protein !== null && <p className="weekly-planned-average">
            Planned average <strong>{nutrientValue(menu.calories)} kcal · {nutrientValue(menu.protein)} g protein</strong> per planned day
          </p>}
          <table className="nutrition-week">
            <thead><tr><th scope="col">Day</th><th scope="col">Planned</th><th scope="col">Eaten</th></tr></thead>
            <tbody>{days.map(day => <tr key={day.date}>
              <th scope="row">{formatDay(day.date, weekdayDate)}<small>{day.status}</small></th>
              <td>{day.planned ? <>{nutrientValue(day.planned.calories)} kcal<small>{nutrientValue(day.planned.protein)} g protein</small>
                {targets.calories !== null && day.planned.calories < targets.calories && <small>{nutrientValue(targets.calories - day.planned.calories)} kcal below target</small>}</> : '—'}</td>
              <td>{day.eaten ? <>{nutrientValue(day.eaten.calories)} kcal<small>{nutrientValue(day.eaten.protein)} g protein</small></> : '—'}</td>
            </tr>)}</tbody>
          </table>
          <button className="text-button" onClick={onDietHistory}>View diet history <ArrowRight size={15} /></button>
        </section>
      </div>
    </div>
    {choosingPlan && <Dialog title={'Change ' + choosingPlan} onClose={() => setChoosingPlan(null)}>
      {choices.length === 1 && <p className="muted picker-description">{choosingDiet
        ? 'Add another diet plan to switch between menus.' : 'Add another workout plan to switch between routines.'}</p>}
      <ul className="picker-list dashboard-plan-picker">
        {choices.map(plan => <li key={plan.id}>
          <button className="picker-option" disabled={plan.active}
            aria-label={(plan.active ? 'Active ' + choosingPlan + ' ' : 'Use ') + plan.name}
            onClick={() => {
              if (selectPlan(plan.id)) {
                setPlanNotice(plan.name + ' is now active.');
                setChoosingPlan(null);
              } else setPlanError(true);
            }}>
            <span><strong>{plan.name}</strong>{plan.draft && <small className="muted">{plan.draft}</small>}</span>
            {plan.active ? <span className="diet-tag"><Check size={14} /> Active</span> : <ArrowRight size={17} />}
          </button>
        </li>)}
      </ul>
      {planError && <p className="field-error" role="alert">Couldn’t save the change. Select the {choosingPlan} again to retry.</p>}
      <div className="dialog-actions">
        <button className="button secondary small" onClick={choosingDiet ? onManageDiets : onManageWorkouts}>
          {choosingDiet ? 'Manage diet plans' : 'Manage workouts'}
        </button>
      </div>
    </Dialog>}
    {editingGoal && <DietTargets overall planName={dietPlan.name} saved={draft} intakeLabel="Today" eatenCalories={eaten.calories}
      saveError={goalError} onClose={() => setEditingGoal(false)} onSave={next => {
        if (save({ ...data, goal: next })) setEditingGoal(false);
        else setGoalError(true);
      }} />}
  </div>;
}
