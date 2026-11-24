import { useState } from 'react';
import { Dialog } from './Dialog';
import { Check, Dumbbell, Layers3, Moon, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { MuscleIcon } from './MuscleIcon';
import { exerciseNameKey, exerciseOptions, errorsFor, muscles, newSet, uid, type AppData, type Day, type Exercise, type Group, type Muscle, type SetEntry, type WorkoutPlan } from './workout';

type Picker = { kind: 'group' | 'rename' } | { kind: 'exercise'; muscle: Muscle } | { kind: 'remove'; label: string; remove: () => void };

function ExercisePicker({ muscle, data, added, onChoose }: {
  muscle: Muscle; data: AppData; added: Exercise[]; onChoose: (exercise: Exercise, custom: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [customName, setCustomName] = useState<string | null>(null);
  if (customName !== null) {
    const name = customName.trim().replace(/\s+/g, ' ');
    const key = exerciseNameKey(name);
    const duplicate = Boolean(key) && exerciseOptions(muscle, data.custom, name).some(exercise => exerciseNameKey(exercise.name) === key);
    return <form className="custom-exercise-form" onSubmit={event => {
      event.preventDefault();
      if (key && !duplicate) onChoose({ id: uid(), name }, true);
    }}>
      <p className="muted picker-description">Save your own exercise to the {muscle.toLowerCase()} library.</p>
      <label className="field-label">Exercise name
        <input autoFocus value={customName} maxLength={80} placeholder="Enter an exercise name"
          aria-invalid={duplicate} aria-describedby={duplicate ? 'custom-exercise-error' : undefined}
          onChange={event => setCustomName(event.target.value)} />
      </label>
      {duplicate && <p className="field-error" id="custom-exercise-error">This exercise already exists in this muscle group. Use search to add it.</p>}
      <div className="dialog-actions">
        <button className="button secondary" type="button" onClick={() => setCustomName(null)}>Back to search</button>
        <button className="button primary" disabled={!key || duplicate}>Save and add</button>
      </div>
    </form>;
  }
  const matches = exerciseOptions(muscle, data.custom, query);
  return <>
    <p className="muted picker-description">Choose an exercise for {muscle.toLowerCase()}.</p>
    <label className="search">
      <Search size={18} />
      <input aria-label="Search exercises" placeholder="Search exercises" value={query} maxLength={80} onChange={event => setQuery(event.target.value)} />
    </label>
    <button className="button secondary full custom-button" onClick={() => setCustomName(query.trim())}>
      <Plus size={17} /> Add custom exercise
    </button>
    <ul className="picker-list">
      {matches.map(exercise => {
        const inPlan = added.some(item => item.id === exercise.id);
        return <li key={exercise.id}>
          <button className="picker-option" aria-label={exercise.name} disabled={inPlan} onClick={() => onChoose(exercise, false)}>
            {exercise.name}{inPlan ? <span className="muted">Added</span> : <Plus size={17} />}
          </button>
        </li>;
      })}
      {!matches.length && <li className="muted picker-empty">No matching exercises.</li>}
    </ul>
  </>;
}

export function SetGrid({ sets, name, logging = false, validate = false, locked = false, onChange }: {
  sets: SetEntry[]; name: string; logging?: boolean; validate?: boolean; locked?: boolean; onChange: (sets: SetEntry[]) => void;
}) {
  return <>
    <div className="set-grid set-columns" aria-hidden="true">
      <span>Set</span><span>Reps</span><span>Weight (kg)</span><span>{logging ? 'Done' : ''}</span>
    </div>
    {sets.map((set, index) => {
      const label = name + ' set ' + (index + 1);
      const errors = errorsFor(set, validate && !!set.complete);
      const update = (changes: Partial<SetEntry>) => onChange(sets.map(entry => entry.id === set.id ? { ...entry, ...changes } : entry));
      return <div className="set-grid set-row" key={set.id}>
        <span className={'set-number' + (set.complete ? ' done' : '')}>{index + 1}</span>
        <div>
          <input inputMode="numeric" aria-label={label + ' reps'} value={set.reps} maxLength={10} placeholder="–" disabled={locked}
            aria-invalid={!!errors.reps} aria-describedby={errors.reps ? set.id + '-reps' : undefined} onChange={event => update({ reps: event.target.value })} />
          {errors.reps && <p className="field-error" id={set.id + '-reps'}>{errors.reps}</p>}
        </div>
        <div>
          <input inputMode="decimal" aria-label={label + ' weight in kilograms'} value={set.weight} maxLength={12} placeholder="–" disabled={locked}
            aria-invalid={!!errors.weight} aria-describedby={errors.weight ? set.id + '-weight' : undefined} onChange={event => update({ weight: event.target.value })} />
          {errors.weight && <p className="field-error" id={set.id + '-weight'}>{errors.weight}</p>}
        </div>
        {logging ? <label className="check-control">
          <input type="checkbox" aria-label={'Complete ' + label} checked={!!set.complete} disabled={locked} onChange={event => update({ complete: event.target.checked })} />
          <span><Check size={16} strokeWidth={3} /></span>
        </label> : <button className="icon-button" aria-label={'Remove ' + label} disabled={sets.length === 1}
          onClick={() => onChange(sets.filter(entry => entry.id !== set.id))}><X size={16} /></button>}
      </div>;
    })}
    {!logging && <button className="text-button" onClick={() => onChange([...sets, newSet()])}><Plus size={16} /> Add set</button>}
  </>;
}

export function Current({ data, plan, dayIndex, todayIndex, setDayIndex, onChange, onStart, saved, onHistory, training, onDashboard }: {
  data: AppData; plan: WorkoutPlan; dayIndex: number; todayIndex: number; setDayIndex: (index: number) => void; onChange: (data: AppData) => void;
  onStart: () => void; saved: boolean; onHistory: () => void;
  training: { scheduled: number; logged: number }; onDashboard: () => void;
}) {
  const [picker, setPicker] = useState<Picker | null>(null);
  const day = plan.days[dayIndex];
  const [name, setName] = useState(day.name);
  const exercises = day.groups.flatMap(group => group.exercises);
  const setCount = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const exerciseGroup = picker?.kind === 'exercise' && day.groups.find(group => group.muscle === picker.muscle);

  function updateDay(nextDay: Day, custom = data.custom) {
    const days = plan.days.map((item, index) => index === dayIndex ? nextDay : item);
    onChange({ ...data, custom, plans: data.plans.map(item => item.id === plan.id ? { ...item, days } : item) });
  }

  function updateGroup(nextGroup: Group, custom = data.custom) {
    updateDay({ ...day, groups: day.groups.map(group => group.muscle === nextGroup.muscle ? nextGroup : group) }, custom);
  }

  function addExercise(group: Group, exercise: Exercise, custom: boolean) {
    if (!group.exercises.some(item => item.id === exercise.id)) {
      updateGroup({ ...group, exercises: [...group.exercises, { ...exercise, sets: [newSet()] }] },
        custom ? { ...data.custom, [group.muscle]: [...(data.custom[group.muscle] ?? []), exercise] } : data.custom);
    }
    setPicker(null);
  }

  return <>
    <header className="page-heading">
      <h1>Workout plan</h1>
      <p>Active workout <strong className="active-plan-name">{plan.name}</strong></p>
    </header>
    {saved && <div className="notice" role="status"><Check size={18} /><span>Workout saved.</span><button className="text-button" onClick={onHistory}>View in History</button></div>}
    <div className="panel training-week">
      <span>{training.scheduled > 0 ? <><strong>{training.logged} of {training.scheduled}</strong> training days logged this week</> : 'No training days scheduled'}</span>
      <button className="text-button" onClick={onDashboard}>View Dashboard</button>
    </div>
    {plan.draft && <div className="notice"><span>Workout in progress · {plan.draft.name}</span>
      <button className="text-button" onClick={onStart}>Resume workout</button></div>}
    <section className="week" aria-label="Weekly routine">
      <h2>Your week</h2>
      <div className="week-grid">
        {plan.days.map((item, index) => {
          const count = item.groups.reduce((sum, group) => sum + group.exercises.length, 0);
          return <button key={index} className="day-card" aria-pressed={dayIndex === index} aria-current={todayIndex === index ? 'date' : undefined} onClick={() => setDayIndex(index)}>
            <span className="day-marker" aria-hidden="true" />
            <span className="day-card-name">{item.name}</span>
            <span className="day-card-detail">{item.rest ? 'Rest day' : count ? count + (count === 1 ? ' exercise' : ' exercises') : 'Empty'}</span>
          </button>;
        })}
      </div>
    </section>
    <div className={'current-grid' + (day.rest ? ' rest-layout' : '')}>
      <section className="day-plan" aria-labelledby="day-title">
        <div className="section-heading">
          <div className="title-row">
            <h2 id="day-title">{day.name}</h2>
            <button className="icon-button" aria-label="Rename day" onClick={() => { setName(day.name); setPicker({ kind: 'rename' }); }}><Pencil size={16} /></button>
          </div>
          {!day.rest && !!day.groups.length && <div className="day-actions">
            <button className="button secondary small" onClick={() => setPicker({ kind: 'group' })}><Plus size={17} /> Add muscle group</button>
            {!plan.draft && !!setCount && dayIndex === todayIndex && <button className="button primary small" onClick={onStart}><Dumbbell size={17} /> Start workout</button>}
          </div>}
        </div>
        {dayIndex !== todayIndex && !day.rest && <p className="muted picker-description">Workout sets can be logged only for today.</p>}
        {day.rest ? <div className="panel empty-state">
          <div className="empty-icon"><Moon size={25} /></div>
          <h3>Rest day</h3>
          <p>{day.groups.length ? 'Your planned exercises are saved for when you switch back.' : 'This day is set aside for rest.'}</p>
          <button className="button secondary" onClick={() => updateDay({ ...day, rest: false })}><Dumbbell size={17} /> Switch to workout day</button>
        </div> : !day.groups.length && <div className="panel empty-state">
          <div className="empty-icon"><Layers3 size={25} /></div>
          <h3>No muscle groups yet</h3>
          <p>Set this day up for training or mark it as a rest day.</p>
          <div className="day-actions">
            <button className="button primary" onClick={() => setPicker({ kind: 'group' })}><Plus size={18} /> Add muscle group</button>
            <button className="button secondary" onClick={() => updateDay({ ...day, rest: true })}><Moon size={17} /> Mark as rest day</button>
          </div>
        </div>}
        {!day.rest && day.groups.map(group => <section className="panel group" key={group.muscle} aria-label={group.muscle}>
          <div className="group-heading">
            <div className="title-row"><MuscleIcon muscle={group.muscle} /><h3>{group.muscle}</h3></div>
            <button className="icon-button" aria-label={'Remove ' + group.muscle + ' group'} onClick={() => {
              const remove = () => updateDay({ ...day, groups: day.groups.filter(item => item.muscle !== group.muscle) });
              if (group.exercises.length) setPicker({ kind: 'remove', label: group.muscle + ' and its planned exercises', remove });
              else remove();
            }}><Trash2 size={16} /></button>
          </div>
          {!group.exercises.length && <p className="muted">No exercises in this group yet.</p>}
          {group.exercises.map(exercise => <div className="exercise" key={exercise.id}>
            <div className="exercise-heading">
              <h4>{exercise.name}</h4>
              <button className="icon-button" aria-label={'Remove ' + exercise.name} onClick={() => setPicker({
                kind: 'remove', label: exercise.name,
                remove: () => updateGroup({ ...group, exercises: group.exercises.filter(item => item.id !== exercise.id) }),
              })}><Trash2 size={15} /></button>
            </div>
            <SetGrid sets={exercise.sets} name={exercise.name} onChange={sets => updateGroup({
              ...group, exercises: group.exercises.map(item => item.id === exercise.id ? { ...item, sets } : item),
            })} />
          </div>)}
          <button className="button secondary group-add" aria-label={'Add exercise to ' + group.muscle}
            onClick={() => setPicker({ kind: 'exercise', muscle: group.muscle })}><Plus size={17} /> Add exercise</button>
        </section>)}
      </section>
      {!day.rest && <aside className="panel overview" aria-labelledby="overview-title">
        <h2 id="overview-title">Day overview</h2>
        <dl>
          <div><dt>Muscle groups</dt><dd>{day.groups.length}</dd></div>
          <div><dt>Exercises</dt><dd>{exercises.length}</dd></div>
          <div><dt>Planned sets</dt><dd>{setCount}</dd></div>
        </dl>
        {day.groups.length ? <button className="button secondary full" onClick={() => updateDay({ ...day, rest: true })}><Moon size={17} /> Mark as rest day</button>
          : <p className="muted overview-hint">Add an exercise to start logging.</p>}
      </aside>}
    </div>
    {picker?.kind === 'group' && <Dialog title="Add muscle group" onClose={() => setPicker(null)}>
      <ul className="picker-list muscle-picker">
        {muscles.filter(muscle => !day.groups.some(group => group.muscle === muscle)).map(muscle => <li key={muscle}>
          <button className="picker-option" onClick={() => { updateDay({ ...day, groups: [...day.groups, { muscle, exercises: [] }] }); setPicker(null); }}>
            <span className="title-row"><MuscleIcon muscle={muscle} />{muscle}</span><Plus size={17} />
          </button>
        </li>)}
      </ul>
      {day.groups.length === muscles.length && <p className="muted">All muscle groups are on this day.</p>}
    </Dialog>}
    {exerciseGroup && <Dialog title="Add exercise" onClose={() => setPicker(null)}>
      <ExercisePicker muscle={exerciseGroup.muscle} data={data} added={exerciseGroup.exercises}
        onChoose={(exercise, custom) => addExercise(exerciseGroup, exercise, custom)} />
    </Dialog>}
    {picker?.kind === 'rename' && <Dialog title="Rename day" onClose={() => setPicker(null)}>
      <form onSubmit={event => { event.preventDefault(); if (name.trim()) { updateDay({ ...day, name: name.trim() }); setPicker(null); } }}>
        <label className="field-label">Day name<input value={name} maxLength={40} onChange={event => setName(event.target.value)} /></label>
        <button className="button primary full" disabled={!name.trim()}>Save name</button>
      </form>
    </Dialog>}
    {picker?.kind === 'remove' && <Dialog title="Remove from plan?" onClose={() => setPicker(null)}>
      <p className="muted">Remove {picker.label} from {day.name}?</p>
      <div className="dialog-actions">
        <button className="button secondary" onClick={() => setPicker(null)}>Cancel</button>
        <button className="button primary" onClick={() => { picker.remove(); setPicker(null); }}>Remove</button>
      </div>
    </Dialog>}
  </>;
}

export function Logging({ draft, planName, locked, onEditPlan, onChange, onSave, onDiscard }: {
  draft: Day; planName: string; locked: boolean; onEditPlan: () => void; onChange: (draft: Day) => void; onSave: () => void; onDiscard: () => void;
}) {
  const [validate, setValidate] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const sets = draft.groups.flatMap(group => group.exercises.flatMap(exercise => exercise.sets));
  const completed = sets.filter(set => set.complete);
  const invalid = completed.some(set => Object.values(errorsFor(set, true)).some(Boolean));
  return <>
    <header className="page-heading">
      <h1>{draft.name}</h1>
      <p className="active-plan-name">{planName}</p>
      {locked ? <p>This draft isn’t dated today. Discard it to start today’s workout.</p>
        : <p>Tick the box in the <strong>Done</strong> column as you finish each set. Tap it again to undo.</p>}
      <p role="status" className="logging-count"><strong>{completed.length} of {sets.length}</strong> sets complete</p>
    </header>
    <div className="current-grid">
      <div>
        {draft.groups.filter(group => group.exercises.length).map(group => <section className="panel group" key={group.muscle}>
          <div className="group-heading"><div className="title-row"><MuscleIcon muscle={group.muscle} /><h2>{group.muscle}</h2></div></div>
          {group.exercises.map(exercise => <div className="exercise" key={exercise.id}>
            <div className="exercise-heading"><h3>{exercise.name}</h3></div>
            <SetGrid key={exercise.id} sets={exercise.sets} name={exercise.name} logging validate={validate} locked={locked} onChange={nextSets => onChange({
              ...draft, groups: draft.groups.map(item => item.muscle === group.muscle ? {
                ...item, exercises: item.exercises.map(entry => entry.id === exercise.id ? { ...entry, sets: nextSets } : entry),
              } : item),
            })} />
          </div>)}
        </section>)}
      </div>
      <aside className="panel overview">
        <h2>Workout progress</h2>
        <progress value={completed.length} max={sets.length} aria-label="Sets completed" />
        <button className="button primary full" disabled={locked || !completed.length} onClick={() => {
          setValidate(true);
          if (!invalid) onSave();
        }}><Check size={18} /> Save workout</button>
        {!locked && !completed.length && <p className="muted overview-hint">Tick a completed set to save your workout.</p>}
        {locked && <button className="text-button" onClick={onEditPlan}>Edit workout plan</button>}
        {validate && invalid && <p role="alert" className="field-error">Check the reps and weight for your completed sets.</p>}
        <button className="text-button discard" onClick={() => setConfirmDiscard(true)}>Discard workout</button>
      </aside>
    </div>
    {confirmDiscard && <Dialog title="Discard this workout?" onClose={() => setConfirmDiscard(false)}>
      <p className="muted">The sets from this workout will be removed from your draft.</p>
      <div className="dialog-actions">
        <button className="button secondary" onClick={() => setConfirmDiscard(false)}>Keep logging</button>
        <button className="button primary" onClick={onDiscard}>Discard workout</button>
      </div>
    </Dialog>}
  </>;
}
