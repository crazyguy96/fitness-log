import { useState } from 'react';
import { Dialog } from './Dialog';
import { nutrientValue } from './MealEditor';
import { dashboardGoalMode, dailyTargets, goalEstimate, goalModeLabels, positiveNumber, type GoalMode, type Targets } from './nutrition';
import { numberLabel } from './workout';

function NumberField({ label, value, onChange, placeholder, issue }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; issue?: boolean;
}) {
  return <label className="field-label">{label}
    <input inputMode="decimal" maxLength={12} value={value} placeholder={placeholder}
      aria-invalid={issue || (!!value.trim() && positiveNumber(value) === null)}
      aria-describedby={issue ? 'cut-estimate-status' : undefined}
      onChange={event => onChange(event.target.value)} />
  </label>;
}

export function DietTargets({ planName, saved, intakeLabel, eatenCalories, onSave, onClose, overall = false, dashboardCalories = null, onDashboard, saveError }: {
  planName: string; saved: Targets; intakeLabel: string; eatenCalories: number;
  onSave: (targets: Targets) => void; onClose: () => void; overall?: boolean;
  dashboardCalories?: number | null; onDashboard?: () => void; saveError?: boolean;
}) {
  const [draft, setDraft] = useState(saved);
  const change = <Key extends keyof Targets>(key: Key, value: Targets[Key]) => setDraft({ ...draft, [key]: value });
  const mode = overall ? dashboardGoalMode(draft) : 'off';
  const activeGoal = mode !== 'off';
  const targets = dailyTargets({ ...draft, cut: false });
  const estimate = activeGoal ? goalEstimate(draft, mode) : null;
  const calorieTarget = overall ? estimate?.calories ?? null : dashboardCalories ?? targets.calories;
  const showGoalWeight = mode === 'cut' || mode === 'bulk';
  const editPlanCalories = !overall && dashboardCalories === null;
  const invalid = !overall && [
    draft.weight, draft.protein, draft.carbs, draft.fat,
    ...(editPlanCalories ? [draft.calories] : []),
    ...(draft.mode === 'custom' ? [draft.multiplier] : []),
  ].some(value => value.trim() && positiveNumber(value) === null);
  const timeframeTooShort = !!estimate?.timeframe && estimate.calories === null;
  const underweight = estimate?.reason === 'underweightGoal';
  const invalidGoal = underweight || estimate?.reason === 'goalNotLower' || estimate?.reason === 'goalNotHigher' || estimate?.reason === 'invalidGoalWeight';
  const goalIncomplete = activeGoal && estimate?.calories == null;
  const remaining = calorieTarget === null ? null : calorieTarget - eatenCalories;

  const estimateIssue = {
    missingProfile: 'Complete the weight and profile fields to calculate your calorie target.',
    underage: 'Weight goal estimates are available from age 18.',
    invalidAge: 'Enter your age in whole years, from 18 to 125.',
    invalidHeight: 'Enter height in centimetres, from 50 to 275. For example, enter 175 for 1.75 m.',
    invalidWeight: 'Enter a starting weight from 20 to 650 kg.',
    invalidGoalWeight: 'Enter a goal weight from 20 to 650 kg.',
    goalNotLower: 'Cut requires a goal weight below your starting weight.',
    goalNotHigher: 'Bulk requires a goal weight above your starting weight.',
    underweightGoal: mode === 'maintain'
      ? 'The starting weight is below the calculator’s BMI minimum of 18.5 for this height.'
      : 'At your height, this goal would put your BMI below 18.5, the calculator’s minimum. Choose a different goal weight.',
    calorieFloor: 'An automatic calorie target for these details would be below the app’s minimum daily intake.',
    invalidTimeframe: 'Enter a timeframe greater than zero, or clear the field.',
  };
  const issue = estimate?.reason ? estimateIssue[estimate.reason] : '';

  const calculatedLabel = mode === 'cut' ? 'Calculated cut target' : mode === 'bulk' ? 'Calculated bulk target' : 'Calculated maintenance target';

  return <Dialog title={overall ? 'Weight goal' : 'Targets for ' + planName} onClose={onClose}>
    <form className="diet-targets-form" onSubmit={event => {
      event.preventDefault();
      if (!invalid && !goalIncomplete) onSave(overall ? { ...draft, calories: '' } : draft);
    }}>
      {overall && <>
        <p className="muted picker-description">Active diet plan · {planName}</p>
        <label className="field-label diet-goal-mode">Goal mode
          <select aria-label="Goal mode" value={mode} onChange={event => {
            const next = event.target.value as GoalMode;
            setDraft({ ...draft, goalMode: next, cut: next === 'cut',
              goalMonths: next === 'cut' ? draft.goalMonths.trim() || '4' : draft.goalMonths });
          }}>
            <option value="cut">{goalModeLabels.cut}</option>
            <option value="bulk">{goalModeLabels.bulk}</option>
            <option value="maintain">{goalModeLabels.maintain}</option>
            <option value="off">{goalModeLabels.off}</option>
          </select>
        </label>
      </>}
      <section className="target-calorie-summary" aria-label="Calorie summary">
        <h3>{intakeLabel}</h3>
        <div className="diet-estimate">
          <span>{dashboardCalories !== null ? 'Dashboard calorie target' : activeGoal ? calculatedLabel : 'Daily calorie target'}</span>
          <strong>{calorieTarget === null ? 'Not set' : nutrientValue(calorieTarget) + ' kcal/day'}</strong>
          <span>Calories eaten</span><strong>{nutrientValue(eatenCalories)} kcal</strong>
          {estimate?.timeframe && <><span>Requested weekly loss</span><strong>{numberLabel(estimate.timeframe.weeklyLoss)} kg</strong></>}
          {remaining !== null && <><span>{remaining < 0 ? 'Above target' : 'Calories remaining'}</span>
            <strong>{nutrientValue(Math.abs(remaining))} kcal</strong></>}
        </div>
        <p className="muted">Includes meals marked eaten for this plan.</p>
        {dashboardCalories !== null && <button type="button" className="text-button" onClick={onDashboard}>Review in Dashboard</button>}
        {timeframeTooShort && estimate?.timeframe ? <div className="field-error" id="cut-estimate-status" role="status">
          <p>This timeframe needs a larger calorie deficit than the app supports. Try {numberLabel(estimate.timeframe.minimumMonths)} {estimate.timeframe.minimumMonths === 1 ? 'month' : 'months'} or longer.</p>
          <p>Rapid weight loss can increase the risk of gallstones. <a className="diet-source" href="https://www.niddk.nih.gov/health-information/digestive-diseases/gallstones/dieting" target="_blank" rel="noreferrer">NIH guidance</a></p>
        </div> : issue && <p className="field-error" id="cut-estimate-status" role="status">{issue}</p>}
      </section>
      <h3>Daily targets</h3>
      <div className="diet-fields">
        <NumberField label={overall ? "Starting weight (kg)" : "Body weight (kg)"} issue={estimate?.reason === 'invalidWeight' || (mode === 'maintain' && underweight)} value={draft.weight} onChange={value => change('weight', value)} />
        {showGoalWeight && <NumberField label="Goal weight (kg)" issue={invalidGoal} value={draft.goalWeight} onChange={value => change('goalWeight', value)} />}
        {!overall && <><label className="field-label">Protein preset
          <select aria-label="Protein preset" value={draft.mode} onChange={event => change('mode', event.target.value as Targets['mode'])}>
            <option value="light">Light activity · 1.2 g/kg</option>
            <option value="lifting">Regular lifting · 1.5 g/kg</option>
            <option value="prep">Competition prep · 1.8 g/kg</option>
            <option value="custom">Custom multiplier</option>
          </select>
        </label>
        {draft.mode === 'custom' && <NumberField label="Protein multiplier (g/kg)" value={draft.multiplier} onChange={value => change('multiplier', value)} />}
        <NumberField label="Protein override (g)" value={draft.protein} onChange={value => change('protein', value)}
          placeholder={targets.protein === null ? 'Optional' : String(targets.protein)} /></>}
        {editPlanCalories && <NumberField label="Calorie target (kcal)" value={draft.calories} onChange={value => change('calories', value)}
          placeholder="Optional" />}
        {!overall && <><NumberField label="Carbs target (g)" value={draft.carbs} onChange={value => change('carbs', value)} placeholder="Optional" />
        <NumberField label="Fat target (g)" value={draft.fat} onChange={value => change('fat', value)} placeholder="Optional" /></>}
      </div>
      {activeGoal && <section className="cut-fields" aria-label="Goal settings">
        <p className="muted">Calorie estimates are for adults who aren’t pregnant or breastfeeding.</p>
        <div className="diet-fields">
          <NumberField label="Age" issue={estimate?.reason === 'underage' || estimate?.reason === 'invalidAge'} value={draft.age} onChange={value => change('age', value)} />
          <NumberField label="Height (cm)" issue={estimate?.reason === 'invalidHeight'} value={draft.height} onChange={value => change('height', value)} />
          <label className="field-label">Sex used in estimate
            <select aria-label="Sex used in estimate" value={draft.sex} onChange={event => change('sex', event.target.value as Targets['sex'])}>
              <option value="">Select</option><option value="female">Female</option><option value="male">Male</option>
            </select>
          </label>
          <label className="field-label">Activity
            <select aria-label="Activity" value={draft.activity} onChange={event => change('activity', event.target.value)}>
              <option value="1.4">Mostly seated</option><option value="1.55">Lightly active</option>
              <option value="1.7">Moderately active</option><option value="1.85">Very active</option>
            </select>
          </label>
          {mode === 'cut' && <NumberField label="Timeframe (months)" issue={timeframeTooShort || estimate?.reason === 'invalidTimeframe'} value={draft.goalMonths} onChange={value => change('goalMonths', value)} placeholder="Optional" />}
        </div>
        {estimate?.maintenance != null && <div className="diet-estimate">
          <span>Estimated maintenance</span><strong>{numberLabel(estimate.maintenance)} kcal/day</strong>
        </div>}
        {estimate?.timeframe && !timeframeTooShort && <p className="muted">This is a starting calorie estimate. Your progress may differ from the requested pace.</p>}
        {mode === 'bulk' && estimate?.calories != null && <p className="muted">Bulk starts with a small calorie surplus. Use your weigh-ins to review progress.</p>}
        <a className="diet-source" href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noreferrer">Calorie estimate method</a>
      </section>}
      {invalid && <p className="field-error">Enter positive numbers in the highlighted fields.</p>}
      {saveError && <p className="field-error" role="alert">Couldn’t save the goal. Try saving again.</p>}
      <div className="dialog-actions">
        <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
        <button className="button primary" disabled={invalid || goalIncomplete}>{overall ? 'Save goal' : 'Save targets'}</button>
      </div>
    </form>
  </Dialog>;
}
