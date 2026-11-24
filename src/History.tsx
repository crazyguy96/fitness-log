import { useState } from 'react';
import { ChartNoAxesCombined, Check, ChevronDown, ClipboardList, Dumbbell } from 'lucide-react';
import { dateLabel, numberLabel, sessionStats, shortDate, type Session, type WorkoutPlan } from './workout';

type Metric = 'heaviest' | 'volume';

function Chart({ points, metric, title, unit }: {
  points: ReturnType<typeof sessionStats>; metric: Metric; title: string; unit: string;
}) {
  const [active, setActive] = useState<string>();
  const latest = points.at(-1)!;
  const selected = points.find(point => point.id === active) ?? latest;
  const maximum = Math.max(1, ...points.map(point => point[metric]));
  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? 50 : index / (points.length - 1) * 100,
    y: 100 - point[metric] / maximum * 86,
  }));
  return <section className="panel chart">
    <h3>{title}</h3>
    <p className="chart-value"><strong>{numberLabel(selected[metric])}</strong> <span>{unit}</span></p>
    <p className="chart-date">{dateLabel(selected.date)}</p>
    <div className="chart-plot">
      <div className="chart-axis" aria-hidden="true"><span>{numberLabel(maximum)}</span><span>0</span></div>
      <div className="chart-drawing">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="chart-grid" d="M0 14H100 M0 57H100 M0 100H100" vectorEffect="non-scaling-stroke" />
          {points.length > 1 && <polyline className="chart-line" points={coordinates.map(({ x, y }) => x + ',' + y).join(' ')} vectorEffect="non-scaling-stroke" />}
        </svg>
        {points.map((point, index) => <button key={point.id} className="chart-point" type="button"
          aria-pressed={selected.id === point.id}
          aria-label={dateLabel(point.date) + ', ' + numberLabel(point[metric]) + ' ' + unit}
          style={{ left: coordinates[index].x + '%', top: coordinates[index].y + '%' }}
          onFocus={() => setActive(point.id)} onClick={() => setActive(point.id)} />)}
        <div className="chart-labels">
          <span>{shortDate(points[0].date)}</span>
          {points.length > 1 && <span>{shortDate(latest.date)}</span>}
        </div>
      </div>
    </div>
  </section>;
}

function SessionDetails({ session, expanded, onToggle }: { session: Session; expanded: boolean; onToggle: () => void }) {
  const exercises = session.groups.flatMap(group => group.exercises);
  const sets = exercises.flatMap(exercise => exercise.sets);
  const completed = sets.filter(set => set.complete).length;
  const count = session.completedOnly ? completed + ' completed' : completed + '/' + sets.length + ' complete';
  return <article className="panel session">
    <button className="session-toggle" aria-expanded={expanded} aria-controls={'session-' + session.id} onClick={onToggle}>
      <span className="session-icon"><ClipboardList size={20} /></span>
      <span className="session-name"><strong>{session.name}</strong><span>{session.planName} · {dateLabel(session.date)}</span></span>
      <span className="session-count">{count}</span>
      <ChevronDown className="session-chevron" size={19} />
    </button>
    <div className="session-details" id={'session-' + session.id} hidden={!expanded}>
      {session.completedOnly && <p className="legacy-session-note">Earlier session · completed sets only.</p>}
      {session.groups.map(group => <section key={group.muscle}>
        <h3>{group.muscle}</h3>
        {group.exercises.map(exercise => <div key={exercise.id} className="logged-exercise">
          <h4>{exercise.name}</h4>
          <ol>
            {exercise.sets.map(set => <li key={set.id}>
              {set.complete ? <span className="logged-set">
                <span>{set.reps} {Number(set.reps) === 1 ? 'rep' : 'reps'}{set.weight.trim() && ' × ' + set.weight.trim() + ' kg'}</span>
                <span className="completed-label"><Check size={15} /> Completed</span>
              </span> : <span>Unchecked</span>}
            </li>)}
          </ol>
        </div>)}
      </section>)}
    </div>
  </article>;
}

export function History({ sessions: allSessions, plans, savedId, onCurrent }: {
  sessions: Session[]; plans: WorkoutPlan[]; savedId: string | null; onCurrent: () => void;
}) {
  const [activeSession, setActiveSession] = useState<string | null>(savedId);
  const [exerciseId, setExerciseId] = useState('');
  const [planId, setPlanId] = useState('');
  const sessions = planId ? allSessions.filter(session => session.planId === planId) : allSessions;
  const exercises = sessions.flatMap(session => session.groups.flatMap(group => group.exercises));
  const options = [...new Map(exercises.map(exercise => [exercise.id, exercise.name])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const selectedId = options.some(([id]) => id === exerciseId) ? exerciseId : options[0]?.[0];
  const points = selectedId ? sessionStats(sessions, selectedId) : [];
  const sets = exercises.flatMap(exercise => exercise.sets);
  const completed = sets.filter(set => set.complete).length;
  return <>
    <header className="page-heading"><h1>Workout history</h1><p>Review your sessions and see how each exercise is progressing.</p></header>
    {plans.length > 1 && <div className="history-filter">
      <label className="select-label"><span className="sr-only">Filter by workout</span>
        <select value={planId} onChange={event => setPlanId(event.target.value)}>
          <option value="">All workouts</option>
          {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
        </select><ChevronDown size={16} />
      </label>
    </div>}
    {!sessions.length ? <div className="panel empty-state history-empty">
      <div className="empty-icon"><ChartNoAxesCombined size={26} /></div>
      <h2>{planId ? 'No sessions for this workout yet' : 'No workouts logged yet'}</h2>
      <p>Your completed sessions and progress charts will appear here.</p>
      <button className="button primary" onClick={onCurrent}><Dumbbell size={17} /> Go to Current</button>
    </div> : <>
      <div className="summary-grid history-stats">
        <div className="panel stat"><span>Total sessions</span><strong>{sessions.length}</strong></div>
        <div className="panel stat"><span>Completed sets</span><strong>{completed}</strong></div>
        <div className="panel stat"><span>Unchecked sets</span><strong>{sets.length - completed}</strong></div>
      </div>
      <section className="history-section">
        <div className="section-heading">
          <h2>Exercise progress</h2>
          <label className="select-label"><span className="sr-only">Choose exercise</span>
            <select value={selectedId} onChange={event => setExerciseId(event.target.value)}>
              {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select><ChevronDown size={16} />
          </label>
        </div>
        {points.length ? <div className="summary-grid" key={planId + ':' + selectedId}>
          <Chart points={points} metric="heaviest" title="Heaviest set" unit="kg" />
          <Chart points={points} metric="volume" title="Training volume" unit="kg·reps" />
        </div> : <div className="panel chart-empty">No completed sets with a recorded weight for this exercise. You can review its sets in the session list.</div>}
      </section>
      <section className="history-section">
        <h2>Saved sessions</h2>
        {sessions.map(session => <SessionDetails key={session.id} session={session}
          expanded={activeSession === session.id} onToggle={() => setActiveSession(activeSession === session.id ? null : session.id)} />)}
      </section>
    </>}
  </>;
}
