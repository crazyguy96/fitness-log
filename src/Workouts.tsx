import { useState } from 'react';
import { Check, Dumbbell, Pencil, Plus } from 'lucide-react';
import type { WorkoutPlan } from './workout';

export function Workouts({ plans, activePlanId, onAdd, onRename, onOpen }: {
  plans: WorkoutPlan[];
  activePlanId: string;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onOpen: (id: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const duplicate = plans.some(plan => plan.id !== editing && plan.name.toLowerCase() === trimmed.toLowerCase());

  function edit(id: string, initialName = '') {
    setName(initialName);
    setEditing(id);
  }

  return <>
    <header className="page-heading workouts-heading">
      <div><h1>Workouts</h1><p>Create and switch between your seven-day plans.</p></div>
      {editing === null && <button className="button primary" onClick={() => edit('new')}><Plus size={18} /> Add workout</button>}
    </header>
    {editing !== null && <form className="panel workout-form" onSubmit={event => {
      event.preventDefault();
      if (!trimmed || duplicate) return;
      if (editing === 'new') onAdd(trimmed);
      else onRename(editing, trimmed);
      setEditing(null);
    }}>
      <label className="field-label">Workout name
        <input value={name} maxLength={40} placeholder="e.g. Prep" autoFocus
          aria-invalid={duplicate} aria-describedby={duplicate ? 'workout-name-error' : undefined}
          onChange={event => setName(event.target.value)} />
      </label>
      {duplicate && <p className="field-error" id="workout-name-error">Choose a different name. This name is already in use.</p>}
      <div className="day-actions">
        <button className="button primary" disabled={!trimmed || duplicate}>{editing === 'new' ? 'Create workout' : 'Save name'}</button>
        <button className="button secondary" type="button" onClick={() => setEditing(null)}>Cancel</button>
      </div>
    </form>}
    <div className="workout-list">
      {plans.map(plan => {
        const active = plan.id === activePlanId;
        return <article className="panel workout-card" key={plan.id}>
          <div className="title-row">
            <span className="session-icon"><Dumbbell size={20} /></span>
            <div>
              <h2>{plan.name}</h2>
              {active && <p className="workout-status"><Check size={15} /> Active</p>}
              {plan.draft && <p className="muted">Session in progress</p>}
            </div>
          </div>
          <div className="day-actions">
            <button className="icon-button" aria-label={'Rename ' + plan.name} onClick={() => edit(plan.id, plan.name)}><Pencil size={16} /></button>
            <button className="button secondary" aria-label={(active ? 'Open ' : 'Use ') + plan.name}
              onClick={() => onOpen(plan.id)}>{active ? 'Open workout' : 'Use workout'}</button>
          </div>
        </article>;
      })}
    </div>
  </>;
}
