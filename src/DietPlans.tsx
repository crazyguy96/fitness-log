import { useState } from 'react';
import { Check, BookOpen, Pencil, Plus, Settings2, Utensils } from 'lucide-react';
import { Dialog } from './Dialog';
import { nutrientLabels } from './foods';
import { nutrientValue } from './MealEditor';
import { dietPlanTargets, nutrientKeys, type DietPlan } from './nutrition';

export function DietPlans({ plans, active, goalCalories, onName, onUse, onTargets, onLibrary }: {
  plans: DietPlan[]; active: string; goalCalories: number | null;
  onName: (name: string, id?: string) => void; onUse: (id: string) => void; onTargets: (id: string) => void; onLibrary: (id: string) => void;
}) {
  const [naming, setNaming] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const duplicate = plans.some(plan => plan.id !== naming && plan.name.toLowerCase() === trimmed.toLowerCase());

  function openName(plan?: DietPlan) {
    setName(plan?.name ?? '');
    setNaming(plan?.id ?? '');
  }

  return <div className="diet-view">
    <header className="page-heading workouts-heading">
      <div><h1>Diet plans</h1><p>{plans.length} {plans.length === 1 ? 'plan' : 'plans'} · Choose a plan to follow.</p></div>
      {naming === undefined && <button className="button primary" onClick={() => openName()}><Plus size={18} /> Add diet plan</button>}
    </header>
    <div className="workout-list">
      {plans.map(plan => {
        const selected = plan.id === active;
        const targets = dietPlanTargets(plan, selected ? goalCalories : null);
        const configured = nutrientKeys.filter(metric => targets[metric] !== null);
        return <article className="panel workout-card" key={plan.id}>
          <div className="title-row">
            <span className="session-icon"><Utensils size={20} /></span>
            <div>
              <h2>{plan.name}</h2>
              {selected && <p className="workout-status"><Check size={15} /> Active</p>}
              {configured.length > 0 && <p className="macro-text diet-plan-targets">{configured.map(metric =>
                <span key={metric}>{nutrientValue(targets[metric]!)} {metric === 'calories' ? 'kcal' : 'g ' + nutrientLabels[metric].toLowerCase()}</span>)}</p>}
            </div>
          </div>
          <div className="day-actions">
            <button className="icon-button" aria-label={'Rename ' + plan.name} onClick={() => openName(plan)}><Pencil size={16} /></button>
            <button className="button secondary" aria-label={'Meal library for ' + plan.name} onClick={() => onLibrary(plan.id)}>
              <BookOpen size={17} /> Meal library ({plan.library.length})
            </button>
            <button className="button secondary" aria-label={'Nutrition targets for ' + plan.name} onClick={() => onTargets(plan.id)}><Settings2 size={17} /> Targets</button>
            <button className="button secondary" aria-label={(selected ? 'Open ' : 'Use ') + plan.name}
              onClick={() => onUse(plan.id)}>{selected ? 'Open plan' : 'Use plan'}</button>
          </div>
        </article>;
      })}
    </div>

    {naming !== undefined && <Dialog title={naming ? 'Rename diet plan' : 'Add diet plan'} onClose={() => setNaming(undefined)}>
      <form onSubmit={event => {
        event.preventDefault();
        if (!trimmed || duplicate) return;
        onName(trimmed, naming || undefined);
        setNaming(undefined);
      }}>
        <label className="field-label">Diet plan name<input autoFocus value={name} maxLength={40} onChange={event => setName(event.target.value)} /></label>
        {duplicate && <p className="field-error">This name is already in use.</p>}
        <div className="dialog-actions">
          <button className="button secondary" type="button" onClick={() => setNaming(undefined)}>Cancel</button>
          <button className="button primary" disabled={!trimmed || duplicate}>{naming ? 'Save name' : 'Create plan'}</button>
        </div>
      </form>
    </Dialog>}
  </div>;
}
